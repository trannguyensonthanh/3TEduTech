# src/api/routes/chat.py
"""Chat API routes — Master AI and Course AI endpoints."""

import logging
from fastapi import APIRouter, HTTPException
from src.models.schemas import (
    QueryRequest,
    CourseQueryRequest,
    QueryResponse,
    SuggestionRequest,
    SuggestionResponse,
)
from src.rag.chain import query_master, query_course
from src.core.gemini import generate_suggested_questions

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/query", response_model=QueryResponse)
async def master_query(request: QueryRequest):
    """
    Master AI chatbot — answers general questions using the full knowledge base.
    This replaces the old /api/typesense/query_ver_thai endpoint.
    """
    try:
        # Convert chat history to list of dicts
        history = [{"question": h.question, "answer": h.answer} for h in request.chat_history]

        result = await query_master(
            query=request.query,
            chat_history=history if history else None,
            top_k=request.top_k,
        )

        return QueryResponse(
            answer=result["answer"],
            sources=[{"file_name": s["file_name"], "content": s["content"]} for s in result.get("sources", [])],
            suggested_questions=result.get("suggested_questions", []),
        )
    except Exception as e:
        logger.error(f"Master query error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI query failed: {str(e)}")


@router.post("/course-query", response_model=QueryResponse)
async def course_query(request: CourseQueryRequest):
    """
    Course-specific AI chatbot — answers questions about a specific course.
    Uses course content as primary context.
    """
    try:
        history = [{"question": h.question, "answer": h.answer} for h in request.chat_history]

        result = await query_course(
            query=request.query,
            course_name=request.course_name,
            chat_history=history if history else None,
            top_k=request.top_k,
        )

        return QueryResponse(
            answer=result["answer"],
            sources=[{"file_name": s["file_name"], "content": s["content"]} for s in result.get("sources", [])],
            suggested_questions=result.get("suggested_questions", []),
        )
    except Exception as e:
        logger.error(f"Course query error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI query failed: {str(e)}")


@router.post("/suggest", response_model=SuggestionResponse)
async def suggest_questions(request: SuggestionRequest):
    """
    Generate follow-up question suggestions.
    This replaces the old /api/typesense/suggest_questions endpoint.
    """
    try:
        questions = await generate_suggested_questions(
            previous_response=request.previous_response,
            original_query=request.query,
        )
        return SuggestionResponse(suggested_questions=questions)
    except Exception as e:
        logger.error(f"Suggestion error: {e}")
        raise HTTPException(status_code=500, detail=f"Suggestion failed: {str(e)}")
