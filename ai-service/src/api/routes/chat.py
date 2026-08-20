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
# [SỬA 19/08/2026] Chuyển từ src.core.gemini sang src.core.llm_provider.
#
# Trước đây tệp này gọi THẲNG Gemini, nên lớp chọn mô hình (llm_provider)
# chỉ được đúng MỘT endpoint dùng tới — nghĩa là Qwen/vLLM trên GPU EC2 #1
# thực tế chưa bao giờ phục vụ chatbot. Hạn mức Gemini cạn là cả hệ thống
# hỏng, dù GPU vẫn đang chạy và tính tiền.
#
# Đặt bí danh trùng tên hàm cũ để mọi lời gọi bên dưới không phải sửa —
# chữ ký hai bên đã được đối chiếu là khớp nhau.
from src.core.llm_provider import (
    generate_suggestions as generate_suggested_questions,
)

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
            use_general_knowledge=request.use_general_knowledge,
        )

        return QueryResponse(
            answer=result["answer"],
            sources=[{"file_name": s["file_name"], "content": s["content"]} for s in result.get("sources", [])],
            suggested_questions=result.get("suggested_questions", []),
            is_fallback_prompt=result.get("is_fallback_prompt", False),
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
            use_general_knowledge=request.use_general_knowledge,
        )

        return QueryResponse(
            answer=result["answer"],
            sources=[{"file_name": s["file_name"], "content": s["content"]} for s in result.get("sources", [])],
            suggested_questions=result.get("suggested_questions", []),
            is_fallback_prompt=result.get("is_fallback_prompt", False),
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
