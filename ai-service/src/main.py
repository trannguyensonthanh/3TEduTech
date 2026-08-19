# src/main.py
"""FastAPI application entry point for the 3TEduTech AI Service."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from src.config import get_settings
from src.api.routes import chat, ingest, search, agent, extract, generate
from src.core.security import require_internal_key
from src.vectorstore.chroma import get_chroma_client


def setup_logging():
    """Configure application logging."""
    settings = get_settings()
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    # Reduce noise from third-party libraries
    logging.getLogger("chromadb").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger = logging.getLogger(__name__)

    # Startup
    settings = get_settings()
    logger.info("=" * 60)
    logger.info("🚀 3TEduTech AI Service starting up...")
    logger.info(f"   Router Model : {settings.gemini_routing_model}")
    logger.info(f"   Chat Model   : {settings.gemini_chat_model}")
    logger.info(f"   Embedding    : {settings.gemini_embedding_model}")
    logger.info(f"   ChromaDB     : {settings.chroma_persist_dir}")
    logger.info(f"   LLM Provider : {settings.llm_provider}")
    if settings.llm_provider in ("qwen", "auto"):
        logger.info(f"   vLLM URL     : {settings.vllm_base_url}")
    from src.core.transcription import is_transcription_available

    if is_transcription_available():
        logger.info(
            f"   Whisper      : {settings.whisper_model_size} on "
            f"{settings.whisper_device} ({settings.whisper_compute_type})"
        )
    else:
        logger.info(
            "   Whisper      : TẮT (bản build không kèm faster-whisper) — "
            "phiên âm video sẽ bị bỏ qua"
        )
    logger.info(
        f"   Auth         : "
        + ("BẬT (yêu cầu X-Internal-Api-Key)" if settings.internal_api_key
           else "TẮT — ⚠️ chưa đặt INTERNAL_API_KEY")
    )
    logger.info("=" * 60)

    # Initialize ChromaDB on startup
    get_chroma_client()
    logger.info("✅ ChromaDB initialized")

    # Verify Gemini API keys
    if not settings.get_chat_api_key():
        logger.warning("⚠️  No Gemini API key configured! AI features will fail.")
    else:
        logger.info("✅ Gemini API keys configured (Router + Chat + Embedding)")

    yield

    # Shutdown
    logger.info("🛑 AI Service shutting down...")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    setup_logging()
    settings = get_settings()

    app = FastAPI(
        title="3TEduTech AI Service",
        description=(
            "AI-powered microservice for the 3TEduTech online learning platform. "
            "Provides RAG-based Q&A, course-specific AI tutoring, "
            "document ingestion, intelligent course search, "
            "and a unified AI Agent with Hybrid Search & Conversational Commerce."
        ),
        version="2.0.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health check
    @app.get("/", tags=["Health"])
    async def health_check():
        return {
            "status": "healthy",
            "service": "3TEduTech AI Service",
            "version": "2.0.0",
            "models": {
                "router": settings.gemini_routing_model,
                "chat": settings.gemini_chat_model,
                "embedding": settings.gemini_embedding_model,
            },
        }

    @app.get("/health", tags=["Health"])
    async def detailed_health():
        """Deep healthcheck — áp dụng "Degraded Status Pattern":

        AI Service KHÔNG được coi mình là hỏng (không trả 5xx) chỉ vì vLLM
        (GPU EC2 #1) đang tắt để tiết kiệm chi phí — nếu không, Docker sẽ liên
        tục restart container AI Service một cách vô ích. Thay vào đó, khi
        vLLM offline mà LLM_PROVIDER cần dùng nó, endpoint vẫn trả 200 OK
        nhưng "status": "degraded" kèm thông tin đang fallback sang Gemini.
        """
        from src.vectorstore.chroma import get_collection_stats
        from src.core.llm_provider import _check_vllm_health
        from src.core.transcription import is_transcription_available

        overall_status = "healthy"
        vllm_info = {"enabled": settings.llm_provider in ("qwen", "auto")}

        if vllm_info["enabled"]:
            vllm_online = await _check_vllm_health()
            vllm_info["engine"] = "online" if vllm_online else "offline"
            vllm_info["base_url"] = settings.vllm_base_url
            if not vllm_online:
                overall_status = "degraded"
                vllm_info["notice"] = (
                    "vLLM (GPU EC2 #1) không phản hồi — đang dùng Gemini fallback."
                    if settings.llm_provider == "auto"
                    else "vLLM (GPU EC2 #1) không phản hồi."
                )
        else:
            vllm_info["engine"] = "not_used"

        return {
            "status": overall_status,
            "llm_provider": settings.llm_provider,
            "vllm": vllm_info,
            # [SỬA 18/08/2026] Thêm `available`.
            #
            # `faster-whisper` nay là phụ thuộc tùy chọn, nên hai dòng cấu hình
            # dưới đây có thể mô tả một tính năng KHÔNG TỒN TẠI trong bản build
            # này. Không có cờ `available`, giao diện quản trị sẽ hiển thị
            # "Whisper: small on cpu" và người dùng tin rằng phiên âm đang chạy.
            #
            # ⚠️ KHÔNG đặt "degraded" khi thiếu whisper: bản build EC2 CPU tạm
            #    thời CỐ Ý không có nó, đánh dấu degraded sẽ biến trạng thái bất
            #    thường thành trạng thái mặc định và làm nó mất hết ý nghĩa.
            "whisper": {
                "available": is_transcription_available(),
                "model_size": settings.whisper_model_size,
                "device": settings.whisper_device,
            },
            "models": {
                "router": settings.gemini_routing_model,
                "chat": settings.gemini_chat_model,
                "embedding": settings.gemini_embedding_model,
            },
            "collections": {
                "master": get_collection_stats(settings.chroma_collection_master),
                "courses": get_collection_stats(settings.chroma_collection_courses),
            },
        }

    # ========================================================================
    # [THÊM 17/08/2026 — LEVEL 3] BẮT BUỘC XÁC THỰC NỘI BỘ CHO MỌI ROUTE /api
    #
    # Đặt dependency ở CẤP include_router thay vì gắn tay vào từng endpoint.
    # Lý do: gắn tay thì chỉ cần thêm một endpoint mới mà quên là thủng, và lỗi
    # đó không hề gây triệu chứng lúc phát triển. Đặt ở đây thì mọi route hiện
    # có VÀ mọi route thêm sau này đều tự động được bảo vệ.
    #
    # Hai endpoint "/" và "/health" nằm NGOÀI prefix /api nên vẫn công khai —
    # đúng như mong muốn, vì Docker healthcheck và Nginx cần gọi được chúng mà
    # không có khóa.
    # ========================================================================
    internal_auth = [Depends(require_internal_key)]

    # Register API routes
    api_prefix = "/api"
    app.include_router(chat.router, prefix=api_prefix, dependencies=internal_auth)
    app.include_router(ingest.router, prefix=api_prefix, dependencies=internal_auth)
    app.include_router(search.router, prefix=api_prefix, dependencies=internal_auth)
    app.include_router(agent.router, prefix=api_prefix, dependencies=internal_auth)
    # [THÊM 18/08/2026 — COURSE IMPORT] Bóc text PDF/DOCX/PPTX cho luồng nhập
    # khóa học từ ZIP. Cũng nằm dưới /api nên tự động thừa hưởng `internal_auth`
    # — điều này BẮT BUỘC: endpoint nhận nội dung tệp tùy ý, tuyệt đối không
    # được để công khai.
    app.include_router(extract.router, prefix=api_prefix, dependencies=internal_auth)
    # [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn B] Sinh mô tả khóa học bằng
    # LLM. Cũng nằm dưới /api nên thừa hưởng `internal_auth` — BẮT BUỘC, vì đây
    # là endpoint đốt token: để công khai là mời người lạ tiêu hết hạn mức.
    app.include_router(generate.router, prefix=api_prefix, dependencies=internal_auth)

    return app


# Application instance
app = create_app()
