# src/config.py
"""Application configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """AI Service configuration loaded from environment variables."""

    # --- LLM Provider Selection ---
    # "gemini" = Always use Gemini API (cloud, uses tokens)
    # "qwen"  = Always use Qwen local via vLLM (free, needs GPU EC2 #1)
    # "auto"  = Prefer Qwen, auto-fallback to Gemini if vLLM is down
    llm_provider: str = "gemini"

    # --- vLLM / Qwen Configuration (GPU EC2 #1) ---
    vllm_base_url: str = "http://127.0.0.1:8000/v1"
    vllm_model_name: str = "Qwen/Qwen3.6-27B-AWQ"
    vllm_api_key: str = "not-needed"

    # --- Gemini AI: Router Model (Intent Classification & Tool Calling) ---
    # Fast, cheap model for classifying user intent (~10-30 tokens/call)
    gemini_routing_api_key: str = ""
    gemini_routing_model: str = "gemini-2.5-flash-lite"

    # --- Gemini AI: Chat Model (Conversational Tutor & Advisory) ---
    # Deeper reasoning model for long-form answers and tutoring
    gemini_chat_api_key: str = ""
    gemini_chat_model: str = "gemini-3.5-flash-lite"

    # --- Gemini AI: Embedding Model (Vector Indexing & Search) ---
    gemini_embedding_api_key: str = ""
    gemini_embedding_model: str = "gemini-embedding-2"

    # --- Legacy single key (backwards compatibility fallback) ---
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.1-flash-lite"

    # ChromaDB
    chroma_persist_dir: str = "./data/chroma_db"
    chroma_collection_master: str = "master_knowledge"
    chroma_collection_courses: str = "course_knowledge"

    # Server
    ai_service_host: str = "0.0.0.0"
    ai_service_port: int = 2111
    cors_origins: str = "*"

    # [THÊM 18/08/2026] Số tiến trình uvicorn ở chế độ production.
    #
    # ★ MẶC ĐỊNH 1 — CỐ Ý, và đây là một bản sửa lỗi chứ không phải chỉnh cho gọn.
    #
    # run.py trước đây ghi cứng `workers=2`. Mỗi worker là một TIẾN TRÌNH RIÊNG,
    # nghĩa là hai bản ChromaDB cùng mở một thư mục SQLite trên đĩa. ChromaDB
    # bản nhúng không được thiết kế cho nhiều tiến trình ghi song song — ghi
    # đồng thời sinh ra "database is locked" một cách ngẫu nhiên, và lỗi kiểu
    # này chỉ xuất hiện lúc có tải thật.
    #
    # Cộng thêm: mỗi worker ngốn ~300–400MB. Trên EC2 CPU t3.medium (4GB, đang
    # phải chia cho backend + redis + frontend + nginx) thì hai worker là quá
    # sát trần — và khi chạm trần, thứ bị OOM-killer giết không nhất thiết là
    # tiến trình có lỗi.
    #
    # Tăng lên chỉ khi ĐÃ tách ChromaDB ra chạy ở chế độ máy chủ riêng
    # (chromadb server) thay vì nhúng trong tiến trình.
    ai_service_workers: int = 1

    # RAG
    rag_top_k: int = 10
    rag_chunk_size: int = 1000
    rag_chunk_overlap: int = 200

    # --- Whisper (Speech-to-Text / SRT Generation, GPU EC2 #2) ---
    # Mặc định an toàn cho local/dev (không có GPU): model nhỏ, chạy CPU.
    # Trên GPU EC2 #2 (production), .env.production override thành
    # WHISPER_MODEL_SIZE=medium / WHISPER_DEVICE=cuda / WHISPER_COMPUTE_TYPE=float16
    # để tận dụng card NVIDIA T4 (xem ai-service/src/core/transcription.py).
    whisper_model_size: str = "small"  # "small" | "medium" | "large-v3"
    whisper_device: str = "cpu"  # "cuda" trên GPU EC2 #2, "cpu" khi không có GPU
    whisper_compute_type: str = "int8"  # "float16" khi dùng cuda, "int8" khi dùng cpu

    # --- Xác thực nội bộ (THÊM 17/08/2026 — LEVEL 3) ---
    # Khóa chia sẻ giữa backend Node.js và AI Service. Chỉ backend được phép
    # gọi các endpoint /api/*; frontend KHÔNG bao giờ gọi thẳng nữa.
    #
    # Để TRỐNG thì AI Service chạy ở chế độ không xác thực (giữ nguyên hành vi
    # cũ, tránh làm chết hệ thống khi ai đó quên đặt biến môi trường). Chỉ khi
    # đặt giá trị ở CẢ HAI phía thì lớp bảo vệ mới bật — xem src/core/security.py.
    internal_api_key: str = ""

    # Logging
    log_level: str = "INFO"

    def get_routing_api_key(self) -> str:
        """Get the API key for the routing model, falling back to the main key."""
        return self.gemini_routing_api_key or self.gemini_api_key

    def get_chat_api_key(self) -> str:
        """Get the API key for the chat model, falling back to the main key."""
        return self.gemini_chat_api_key or self.gemini_api_key

    def get_embedding_api_key(self) -> str:
        """Get the API key for the embedding model, falling back to the main key."""
        return self.gemini_embedding_api_key or self.gemini_api_key

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
