# src/config.py
"""Application configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """AI Service configuration loaded from environment variables."""

    # Gemini AI
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "text-embedding-004"

    # ChromaDB
    chroma_persist_dir: str = "./data/chroma_db"
    chroma_collection_master: str = "master_knowledge"
    chroma_collection_courses: str = "course_knowledge"

    # Server
    ai_service_host: str = "0.0.0.0"
    ai_service_port: int = 2111
    cors_origins: str = "http://localhost:8080,http://localhost:5000,https://localhost:8080"

    # RAG
    rag_top_k: int = 10
    rag_chunk_size: int = 1000
    rag_chunk_overlap: int = 200

    # Logging
    log_level: str = "INFO"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
