# -*- coding: utf-8 -*-
import io, sys, ast
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)

# ---------------- schemas.py ----------------
p = '/ai-service/src/models/schemas.py'
s = read(p)
OLD = '''class SearchResponse(BaseModel):
    answer: str
    sources: list[SourceInfo] = []'''
NEW = '''class SearchResponse(BaseModel):
    answer: str
    sources: list[SourceInfo] = []
    # [THÊM 20/08/2026] Ba trường dưới đây phục vụ trợ lý tìm khóa học ở trang
    # /courses:
    #   matched_courses — tên khóa học lấy từ kho vector, giữ đúng thứ hạng.
    #     Backend đối chiếu tên này với bảng Courses rồi dựng thẻ khóa học thật.
    #     Kho vector KHÔNG giữ giá / ảnh bìa / trạng thái xuất bản vì những thứ
    #     đó đổi liên tục; nguồn sự thật vẫn là SQL Server.
    #   out_of_scope — câu hỏi bị hàng rào ý định chặn. Giao diện hiện thông báo
    #     nhắc nhở thay vì vẽ một ô kết quả rỗng trông như hệ thống hỏng.
    #   intent — ghi lại để thống kê, không bắt buộc.
    matched_courses: list[str] = []
    out_of_scope: bool = False
    intent: str | None = None'''
assert s.count(OLD) == 1, 'khong tim thay SearchResponse'
write(p, s.replace(OLD, NEW))
ast.parse(read(p)); print('schemas.py OK')

# ---------------- search.py ----------------
p = '/ai-service/src/api/routes/search.py'
NEW_SEARCH = '''# src/api/routes/search.py
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
'''
write(p, NEW_SEARCH)
ast.parse(read(p)); print('search.py OK')
