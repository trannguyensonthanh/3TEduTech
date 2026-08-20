# src/api/routes/search.py
"""AI-powered search routes."""

import logging
from fastapi import APIRouter, HTTPException
from src.models.schemas import SearchRequest, SearchResponse
from src.rag.chain import search_courses_with_ai

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/search", tags=["Search"])


@router.post("/courses", response_model=SearchResponse)
async def ai_course_search(request: SearchRequest):
    """
    AI-powered course search — recommends courses based on learning goals.
    Uses RAG to find relevant courses and Gemini to generate personalized recommendations.
    """
    try:
        result = await search_courses_with_ai(
            query=request.query,
            top_k=request.top_k,
        )
        return SearchResponse(
            answer=result["answer"],
            sources=[{"file_name": s["file_name"], "content": s["content"]} for s in result.get("sources", [])],
        )
    except Exception as e:
        logger.error(f"Course search error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
