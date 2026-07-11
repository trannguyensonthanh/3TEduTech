# src/core/embeddings.py
"""Gemini Embedding service for vectorizing text."""

import logging
from google import genai
from google.genai import types
from src.config import get_settings
from src.core.gemini import get_gemini_client

logger = logging.getLogger(__name__)


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of texts using Gemini's embedding model.

    Args:
        texts: List of text strings to embed.

    Returns:
        List of embedding vectors.
    """
    settings = get_settings()
    client = get_gemini_client()

    try:
        # Process in batches of 100 (API limit)
        all_embeddings = []
        batch_size = 100

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            result = await client.aio.models.embed_content(
                model=settings.gemini_embedding_model,
                contents=batch,
                config=types.EmbedContentConfig(
                    task_type="RETRIEVAL_DOCUMENT",
                ),
            )
            all_embeddings.extend([e.values for e in result.embeddings])

        logger.debug(f"Generated {len(all_embeddings)} embeddings")
        return all_embeddings
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        raise


async def embed_query(text: str) -> list[float]:
    """
    Generate embedding for a single query text.
    Uses RETRIEVAL_QUERY task type for better search accuracy.

    Args:
        text: Query string to embed.

    Returns:
        Embedding vector.
    """
    settings = get_settings()
    client = get_gemini_client()

    try:
        result = await client.aio.models.embed_content(
            model=settings.gemini_embedding_model,
            contents=text,
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_QUERY",
            ),
        )
        return result.embeddings[0].values
    except Exception as e:
        logger.error(f"Query embedding error: {e}")
        raise
