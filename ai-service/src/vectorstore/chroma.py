# src/vectorstore/chroma.py
"""ChromaDB vector store management."""

import logging
import chromadb
from chromadb.config import Settings as ChromaSettings
from src.config import get_settings
from src.core.embeddings import embed_texts, embed_query

logger = logging.getLogger(__name__)

_chroma_client: chromadb.ClientAPI | None = None


def get_chroma_client() -> chromadb.ClientAPI:
    """Get or create the ChromaDB client with persistent storage."""
    global _chroma_client
    if _chroma_client is None:
        settings = get_settings()
        _chroma_client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        logger.info(f"ChromaDB initialized at: {settings.chroma_persist_dir}")
    return _chroma_client


def get_or_create_collection(collection_name: str) -> chromadb.Collection:
    """Get or create a ChromaDB collection."""
    client = get_chroma_client()
    collection = client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},  # Use cosine similarity
    )
    logger.debug(f"Collection '{collection_name}' ready. Count: {collection.count()}")
    return collection


async def add_documents(
    collection_name: str,
    documents: list[str],
    metadatas: list[dict] | None = None,
    ids: list[str] | None = None,
) -> int:
    """
    Add documents to a ChromaDB collection with Gemini embeddings.

    Args:
        collection_name: Target collection name.
        documents: List of text chunks to store.
        metadatas: Optional metadata for each document.
        ids: Optional custom IDs (auto-generated if not provided).

    Returns:
        Number of documents added.
    """
    if not documents:
        return 0

    collection = get_or_create_collection(collection_name)

    # Generate IDs if not provided
    if ids is None:
        existing_count = collection.count()
        ids = [f"doc_{existing_count + i}" for i in range(len(documents))]

    # Generate embeddings using Gemini
    embeddings = await embed_texts(documents)

    # Add to ChromaDB
    collection.add(
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas or [{}] * len(documents),
        ids=ids,
    )

    logger.info(f"Added {len(documents)} documents to collection '{collection_name}'")
    return len(documents)


async def search_documents(
    collection_name: str,
    query: str,
    top_k: int = 10,
    where: dict | None = None,
) -> list[dict]:
    """
    Search for relevant documents using semantic similarity.

    Args:
        collection_name: Collection to search in.
        query: Search query text.
        top_k: Number of results to return.
        where: Optional metadata filter.

    Returns:
        List of results with document, metadata, and distance.
    """
    collection = get_or_create_collection(collection_name)

    if collection.count() == 0:
        logger.warning(f"Collection '{collection_name}' is empty")
        return []

    # Generate query embedding
    query_embedding = await embed_query(query)

    # Search ChromaDB
    search_kwargs = {
        "query_embeddings": [query_embedding],
        "n_results": min(top_k, collection.count()),
    }
    if where:
        search_kwargs["where"] = where

    results = collection.query(**search_kwargs)

    # Format results
    formatted = []
    if results and results["documents"]:
        for i, doc in enumerate(results["documents"][0]):
            formatted.append({
                "content": doc,
                "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                "distance": results["distances"][0][i] if results["distances"] else 0,
                "id": results["ids"][0][i] if results["ids"] else "",
            })

    logger.debug(f"Found {len(formatted)} results for query in '{collection_name}'")
    return formatted


def delete_collection(collection_name: str) -> None:
    """Delete an entire collection."""
    client = get_chroma_client()
    try:
        client.delete_collection(collection_name)
        logger.info(f"Deleted collection '{collection_name}'")
    except Exception as e:
        logger.error(f"Error deleting collection '{collection_name}': {e}")
        raise


def get_collection_stats(collection_name: str) -> dict:
    """Get statistics for a collection."""
    try:
        collection = get_or_create_collection(collection_name)
        return {
            "name": collection_name,
            "count": collection.count(),
        }
    except Exception:
        return {"name": collection_name, "count": 0}
