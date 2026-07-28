# src/rag/hybrid_search.py
"""Hybrid Search Engine: BM25 Lexical + ChromaDB Dense Vector + RRF Fusion."""

import logging
import math
from rank_bm25 import BM25Okapi
from src.config import get_settings
from src.vectorstore.chroma import search_documents, get_or_create_collection

logger = logging.getLogger(__name__)


def _tokenize(text: str) -> list[str]:
    """Simple whitespace + lowercasing tokenizer for BM25."""
    return text.lower().split()


def _reciprocal_rank_fusion(
    rankings: list[list[dict]],
    k: int = 60,
) -> list[dict]:
    """
    Reciprocal Rank Fusion (RRF) to merge multiple ranking lists.
    
    RRF Score = sum(1 / (k + rank_i)) for each ranking list.
    Higher score = more relevant across both search methods.

    Args:
        rankings: List of ranked result lists (each item must have 'id').
        k: RRF constant (default 60, per the original paper).

    Returns:
        Merged and re-ranked list of results with 'rrf_score' field.
    """
    scores: dict[str, float] = {}
    doc_map: dict[str, dict] = {}

    for ranking in rankings:
        for rank, doc in enumerate(ranking):
            doc_id = doc["id"]
            scores[doc_id] = scores.get(doc_id, 0.0) + (1.0 / (k + rank + 1))
            if doc_id not in doc_map:
                doc_map[doc_id] = doc

    # Sort by RRF score descending
    sorted_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)

    results = []
    for doc_id in sorted_ids:
        doc = doc_map[doc_id].copy()
        doc["rrf_score"] = scores[doc_id]
        results.append(doc)

    return results


async def hybrid_course_search(
    query: str,
    top_k: int = 5,
    collection_name: str | None = None,
    where: dict | None = None,
) -> list[dict]:
    """
    Hybrid search combining BM25 (lexical) and Dense Vector (semantic) retrieval.

    Strategy:
    1. Dense Vector Search via ChromaDB (semantic understanding)
    2. BM25 Lexical Search over the same collection (keyword matching)
    3. RRF Fusion to combine both rankings

    Args:
        query: User's search query.
        top_k: Number of final results to return.
        collection_name: ChromaDB collection to search. Defaults to course collection.
        where: Optional metadata filter for ChromaDB.

    Returns:
        List of top-k results after RRF fusion.
    """
    settings = get_settings()
    target_collection = collection_name or settings.chroma_collection_courses

    # --- 1. Dense Vector Search (Semantic) ---
    dense_results = await search_documents(
        collection_name=target_collection,
        query=query,
        top_k=top_k * 3,  # Retrieve more candidates for fusion
        where=where,
    )
    logger.info(f"Dense search returned {len(dense_results)} results")

    if not dense_results:
        return []

    # --- 2. BM25 Lexical Search ---
    # Build BM25 corpus from ChromaDB collection documents
    # We use the dense_results as our candidate pool for BM25 re-ranking
    # This is more efficient than loading the entire collection
    collection = get_or_create_collection(target_collection)
    
    # Get a broader set of documents for BM25
    try:
        all_docs = collection.get(
            limit=min(collection.count(), 500),  # Cap at 500 for performance
            include=["documents", "metadatas"],
        )
    except Exception as e:
        logger.warning(f"BM25 corpus fetch failed, falling back to dense only: {e}")
        return dense_results[:top_k]

    if not all_docs or not all_docs["documents"]:
        return dense_results[:top_k]

    # Build BM25 index
    corpus_texts = all_docs["documents"]
    corpus_ids = all_docs["ids"]
    corpus_metadatas = all_docs["metadatas"] or [{}] * len(corpus_texts)

    tokenized_corpus = [_tokenize(doc) for doc in corpus_texts]
    bm25 = BM25Okapi(tokenized_corpus)

    # Score query against corpus
    tokenized_query = _tokenize(query)
    bm25_scores = bm25.get_scores(tokenized_query)

    # Build BM25 results ranked by score
    bm25_ranked = []
    for idx in sorted(range(len(bm25_scores)), key=lambda i: bm25_scores[i], reverse=True):
        if bm25_scores[idx] > 0:  # Only include docs with non-zero BM25 score
            bm25_ranked.append({
                "id": corpus_ids[idx],
                "content": corpus_texts[idx],
                "metadata": corpus_metadatas[idx] if idx < len(corpus_metadatas) else {},
                "bm25_score": float(bm25_scores[idx]),
            })
    
    bm25_ranked = bm25_ranked[:top_k * 3]  # Cap candidates
    logger.info(f"BM25 search returned {len(bm25_ranked)} results")

    # --- 3. RRF Fusion ---
    fused = _reciprocal_rank_fusion([dense_results, bm25_ranked])
    final_results = fused[:top_k]

    logger.info(
        f"Hybrid search: {len(dense_results)} dense + {len(bm25_ranked)} BM25 "
        f"=> {len(final_results)} final results after RRF fusion"
    )

    return final_results
