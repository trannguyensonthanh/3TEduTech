# src/core/embeddings.py
"""Gemini Embedding service for vectorizing text — uses dedicated Embedding client."""

import asyncio
import logging
from google.genai import types
from src.config import get_settings
from src.core.gemini import get_embedding_client

logger = logging.getLogger(__name__)


async def _embed_single_doc(client, model: str, text: str) -> list[float]:
    result = await client.aio.models.embed_content(
        model=model,
        contents=text,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_DOCUMENT",
        ),
    )
    return result.embeddings[0].values


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of texts using the dedicated Embedding model concurrently.
    """
    settings = get_settings()
    client = get_embedding_client()

    try:
        tasks = [_embed_single_doc(client, settings.gemini_embedding_model, text) for text in texts]
        all_embeddings = await asyncio.gather(*tasks)
        logger.debug(f"Generated {len(all_embeddings)} embeddings")
        return list(all_embeddings)
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        raise


async def embed_query(text: str) -> list[float]:
    """
    Generate embedding for a single query text.
    Uses RETRIEVAL_QUERY task type for better search accuracy.
    """
    settings = get_settings()
    client = get_embedding_client()

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
