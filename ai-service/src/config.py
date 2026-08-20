# src/config.py
"""Application configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """AI Service configuration loaded from environment variables."""

    # --- Chọn mô hình ngôn ngữ ---------------------------------------------
    # [SỬA 19/08/2026] Mặc định đổi "gemini" -> "auto", VÀ ngữ nghĩa của "auto"
    # cũng đổi. Giải thích đầy đủ nằm ở đầu src/core/llm_provider.py.
    #
    #   "auto"       Gemini trước; chuyển Qwen khi không có khóa Gemini hoặc
    #                khi Gemini báo hết hạn mức. <-- dùng cho cả dev và prod
    #   "gemini"     Chỉ Gemini, không dự phòng.
    #   "qwen"       Chỉ Qwen (vLLM trên GPU EC2 #1).
    #   "qwen-first" Qwen trước, Gemini vớt. Đây là hành vi CŨ của "auto".
    #
    # Vì sao "auto" là mặc định: máy dev không cắm khóa Gemini vẫn chạy được
    # (rơi thẳng sang Qwen), còn production thì tiêu hạn mức miễn phí của
    # Gemini trước rồi mới nhờ tới GPU tính tiền theo giờ.
    llm_provider: str = "auto"

    # Sau khi Gemini báo hết hạn mức, ngưng gọi nó trong bao lâu (giây).
    # 15 phút: hạn mức đôi khi chỉ là giới hạn theo phút chứ không cạn cả ngày,
    # nên ta muốn quay lại Gemini sớm; nhưng cũng đủ dài để không gọi lại liên
    # tục vào một cánh cửa đang đóng.
    llm_gemini_cooldown_seconds: int = 900

    # --- vLLM / Qwen (GPU EC2 #1) ------------------------------------------
    vllm_base_url: str = "http://127.0.0.1:8000/v1"
    vllm_model_name: str = "Qwen/Qwen3.6-27B-AWQ"
    vllm_api_key: str = "not-needed"
    # Mô hình lớn chạy trên GPU chia sẻ có thể mất hơn một phút cho câu dài.
    vllm_timeout_seconds: float = 180.0

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

    # --- Whisper (chuyển giọng nói thành phụ đề, GPU EC2 #2) ---------------
    # Mặc định ở đây là mặc định cho MÁY DEV: mô hình nhỏ, chạy CPU, không đòi
    # GPU. Đừng đổi ba dòng này để "chạy tốt hơn trên server" — server có tệp
    # .env.production riêng, đổi ở đây là bắt máy dev tải về mô hình 3GB.
    #
    # Trên GPU EC2 #2 (g4dn.xlarge, card T4 16GB) đặt trong .env.production:
    #     WHISPER_MODEL_SIZE=large-v3
    #     WHISPER_DEVICE=cuda
    #     WHISPER_COMPUTE_TYPE=float16
    #
    # Vì sao large-v3 vừa với T4: ở float16 nó chiếm khoảng 3.1GB VRAM, còn dư
    # rất nhiều trong 16GB. Máy này chỉ chạy AI Service (không có mô hình thị
    # giác nào), nên không phải chia VRAM với ai. Chênh lệch chất lượng với
    # tiếng Việt giữa "small" và "large-v3" là rất lớn — đây đúng chỗ đáng tiêu
    # tài nguyên.
    whisper_model_size: str = "small"  # "small" | "medium" | "large-v3"
    whisper_device: str = "cpu"  # "cuda" trên GPU EC2 #2
    whisper_compute_type: str = "int8"  # "float16" khi dùng cuda

    # Số luồng CPU cho whisper khi KHÔNG có GPU. 0 = để thư viện tự quyết.
    whisper_cpu_threads: int = 0

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
