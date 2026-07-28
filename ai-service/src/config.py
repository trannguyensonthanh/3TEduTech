# src/config.py
"""Application configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """AI Service configuration loaded from environment variables."""

    # --- Gemini AI: Router Model (Intent Classification & Tool Calling) ---
    # Fast, cheap model for classifying user intent (~10-30 tokens/call)
    gemini_routing_api_key: str = ""
    gemini_routing_model: str = "gemini-2.5-flash-lite"

    # --- Gemini AI: Chat Model (Conversational Tutor & Advisory) ---
    # Deeper reasoning model for long-form answers and tutoring
    gemini_chat_api_key: str = ""
    gemini_chat_model: str = "gemini-3.1-flash-lite"

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

    # RAG
    rag_top_k: int = 10
    rag_chunk_size: int = 1000
    rag_chunk_overlap: int = 200

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
