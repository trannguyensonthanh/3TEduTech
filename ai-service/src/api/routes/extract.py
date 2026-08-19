# src/api/routes/extract.py
"""
Bóc text từ tài liệu — phục vụ tính năng Nhập khóa học từ ZIP.

[THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]

==============================================================================
AI ĐÂU MÀ ĐẶT Ở AI SERVICE?
==============================================================================

Endpoint này KHÔNG gọi một mô hình nào cả — nó chỉ đọc PDF/DOCX/PPTX. Nó nằm ở
đây vì hệ sinh thái đọc tài liệu của Python vượt trội hẳn so với Node, chứ
không phải vì nó "thông minh". Tách bạch như vậy giúp về sau nhìn vào không
tưởng nhầm là chỗ này tốn token.

Backend Node gọi qua `src/services/import/textExtractor.js`.

==============================================================================
⚠️ NHẬN NỘI DUNG, KHÔNG NHẬN ĐƯỜNG DẪN
==============================================================================

Hợp đồng cố ý nhận `content_base64` chứ KHÔNG nhận đường dẫn tệp. Nếu nhận
đường dẫn thì endpoint này trở thành công cụ đọc trộm tệp bất kỳ trên máy chủ
(`/etc/passwd`, `.env`, khóa riêng...) cho bất cứ ai chạm được tới cổng 2111.
`filename` chỉ dùng để lấy phần mở rộng và ghi log, không bao giờ để mở tệp.

==============================================================================
⚠️ BẢO VỆ RAM — ĐÂY LÀ RÀNG BUỘC THẬT CỦA DỰ ÁN
==============================================================================

Container AI Service bị giới hạn bộ nhớ, và bóc PDF là việc ngốn RAM. Hai lớp:

  1. `_PARSE_SLOTS` — nhiều nhất 2 tài liệu được bóc cùng lúc. Request thứ 3
     xếp hàng chờ chứ không tranh RAM.
  2. `run_in_executor` — việc bóc là CPU thuần và có thể mất vài giây. Chạy
     thẳng trong hàm `async` sẽ CHẶN vòng lặp sự kiện: `/health` hết hạn chờ,
     Docker tưởng container chết và khởi động lại giữa chừng. Đây đúng là lỗi
     đã tồn tại sẵn ở `api/tasks.py` với Whisper (đã vá cùng đợt này).
"""

from __future__ import annotations

import asyncio
import base64
import binascii
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.rag.document_parser import (
    DEFAULT_MAX_CHARS,
    MAX_INPUT_BYTES,
    SUPPORTED_EXTENSIONS,
    MalformedDocument,
    UnsupportedDocument,
    parse_document,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/extract", tags=["Extraction"])


#: Số tài liệu được bóc đồng thời. Cố tình đặt thấp — xem phần đầu tệp.
_PARSE_SLOTS = asyncio.Semaphore(2)

#: Thời gian chờ tối đa cho một lần bóc.
_PARSE_TIMEOUT_SECONDS = 90

#: Trần độ dài chuỗi base64. Base64 làm phồng dữ liệu ~4/3, cộng thêm khoảng
#: đệm cho ký tự xuống dòng. Kiểm tra TRƯỚC khi giải mã: nếu để giải mã rồi
#: mới kiểm tra thì bản thân việc giải mã đã nuốt trọn RAM.
_MAX_B64_CHARS = (MAX_INPUT_BYTES * 4) // 3 + 4096


class ExtractDocumentRequest(BaseModel):
    """Thân request cho POST /api/extract/document."""

    filename: str = Field(
        ...,
        min_length=1,
        max_length=512,
        description="Tên tệp gốc. CHỈ dùng để lấy phần mở rộng và ghi log.",
    )
    content_base64: str = Field(
        ...,
        min_length=4,
        description="Nội dung tệp, mã hóa base64.",
    )
    max_chars: int = Field(
        default=DEFAULT_MAX_CHARS,
        ge=100,
        le=200_000,
        description="Số ký tự tối đa trả về.",
    )


class ExtractDocumentResponse(BaseModel):
    """Kết quả bóc text."""

    text: str = Field(description="Nội dung đã bóc và làm sạch.")
    chars: int = Field(description="Số ký tự của `text`.")
    truncated: bool = Field(description="Nội dung có bị cắt bớt không.")
    kind: str = Field(description="Phần mở rộng đã nhận diện (pdf, docx...).")
    meta: dict = Field(default_factory=dict, description="Số trang/slide, engine...")
    warnings: list[str] = Field(
        default_factory=list,
        description=(
            "Cảnh báo cho giảng viên — ví dụ PDF quét từ ảnh nên không có chữ. "
            "KHÔNG phải lỗi: request vẫn thành công."
        ),
    )


@router.get("/formats", summary="Danh sách định dạng tài liệu hỗ trợ")
async def list_supported_formats():
    """Cho frontend hiển thị đúng danh sách, khỏi phải chép cứng ở hai nơi."""
    return {
        "extensions": [f".{ext}" for ext in SUPPORTED_EXTENSIONS],
        "max_input_bytes": MAX_INPUT_BYTES,
        "notes": (
            "Định dạng nhị phân đời cũ (.doc, .ppt, .xls) không được hỗ trợ — "
            "hãy lưu lại thành .docx/.pptx hoặc .pdf. PDF quét từ ảnh cần OCR, "
            "hiện chưa hỗ trợ."
        ),
    }


@router.post(
    "/document",
    response_model=ExtractDocumentResponse,
    summary="Bóc text từ PDF / DOCX / PPTX / ODT / ODP",
)
async def extract_document(request: ExtractDocumentRequest):
    if len(request.content_base64) > _MAX_B64_CHARS:
        raise HTTPException(
            status_code=413,
            detail=f"Tệp vượt giới hạn {MAX_INPUT_BYTES // (1024 * 1024)}MB.",
        )

    try:
        # `validate=True` để chuỗi rác bị từ chối ngay thay vì âm thầm cho ra
        # vài byte vô nghĩa rồi báo "tệp hỏng" ở tận bên trong bộ đọc.
        data = base64.b64decode(request.content_base64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(
            status_code=400, detail=f"content_base64 không hợp lệ: {exc}"
        ) from exc

    if len(data) > MAX_INPUT_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Tệp vượt giới hạn {MAX_INPUT_BYTES // (1024 * 1024)}MB.",
        )

    loop = asyncio.get_running_loop()

    async with _PARSE_SLOTS:
        try:
            result = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    parse_document,
                    request.filename,
                    data,
                    request.max_chars,
                ),
                timeout=_PARSE_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError as exc:
            # Lưu ý thành thật: hết hạn chờ chỉ giải phóng coroutine này, KHÔNG
            # dừng được luồng đang chạy (Python không cho giết luồng). Giới hạn
            # kích thước đầu vào ở trên mới là thứ thật sự chặn được trường hợp
            # tệ nhất; mốc thời gian này chỉ để không treo phía gọi.
            logger.warning(
                "Bóc text quá hạn %ss cho '%s'", _PARSE_TIMEOUT_SECONDS, request.filename
            )
            raise HTTPException(
                status_code=504,
                detail="Xử lý tài liệu quá lâu — tệp có thể quá phức tạp.",
            ) from exc
        except UnsupportedDocument as exc:
            # 415: hiểu được yêu cầu, nhưng định dạng này không phục vụ được.
            raise HTTPException(status_code=415, detail=str(exc)) from exc
        except MalformedDocument as exc:
            # 422: đúng định dạng khai báo nhưng nội dung hỏng/đáng ngờ.
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        except Exception as exc:  # noqa: BLE001
            logger.error(
                "Bóc text thất bại cho '%s': %s", request.filename, exc, exc_info=True
            )
            raise HTTPException(
                status_code=500, detail="Lỗi nội bộ khi đọc tài liệu."
            ) from exc

    logger.info(
        "[Extract] %s → %d ký tự (%s)",
        request.filename,
        result["chars"],
        result["meta"],
    )
    return ExtractDocumentResponse(**result)
