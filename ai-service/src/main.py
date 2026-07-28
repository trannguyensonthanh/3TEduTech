# src/main.py
"""FastAPI application entry point for the 3TEduTech AI Service."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config import get_settings
from src.api.routes import chat, ingest, search, agent
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
        from src.vectorstore.chroma import get_collection_stats
        return {
            "status": "healthy",
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

    # Register API routes
    api_prefix = "/api"
    app.include_router(chat.router, prefix=api_prefix)
    app.include_router(ingest.router, prefix=api_prefix)
    app.include_router(search.router, prefix=api_prefix)
    app.include_router(agent.router, prefix=api_prefix)  # NEW: AI Agent endpoint

    return app


# Application instance
app = create_app()
