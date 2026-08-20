# src/api/routes/search.py
"""Tuyến tìm kiếm khóa học bằng AI."""

import logging
from fastapi import APIRouter, HTTPException
from src.models.schemas import SearchRequest, SearchResponse
from src.rag.chain import search_courses_with_ai

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/search", tags=["Search"])


@router.post("/courses", response_model=SearchResponse)
async def ai_course_search(request: SearchRequest):
    """
    Trợ lý TÌM KHÓA HỌC của trang danh sách khóa học.

    [SỬA 20/08/2026] Endpoint này CHỈ phục vụ một nhiệm vụ: tìm khóa học. Hàng
    rào ý định nằm trong `search_courses_with_ai` — câu hỏi ngoài phạm vi trả về
    `out_of_scope=True` kèm thông điệp nhắc nhở và KHÔNG gọi tới mô hình sinh
    văn bản.

    Ngoài ra endpoint trả về `matched_courses` (tên khóa học theo đúng thứ hạng)
    để backend đối chiếu với CSDL rồi dựng thẻ khóa học thật.
    """
    try:
        result = await search_courses_with_ai(
            query=request.query,
            top_k=request.top_k,
        )
        return SearchResponse(
            answer=result["answer"],
            sources=[
                {"file_name": s["file_name"], "content": s["content"]}
                for s in result.get("sources", [])
            ],
            matched_courses=result.get("matched_courses", []),
            out_of_scope=bool(result.get("out_of_scope", False)),
            intent=result.get("intent"),
        )
    except Exception as e:
        logger.error(f"Course search error: {e}", exc_info=True)
        # Không đưa nguyên văn `str(e)` ra ngoài: thông báo lỗi của thư viện có
        # thể lộ tên collection, đường dẫn tệp, hoặc một phần câu lệnh.
        raise HTTPException(
            status_code=500,
            detail="Dịch vụ tìm kiếm khóa học gặp sự cố. Vui lòng thử lại sau.",
        )
