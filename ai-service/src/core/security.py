# src/core/security.py
"""Xác thực nội bộ cho AI Service.

[THÊM 17/08/2026 — LEVEL 3]

================================================================================
VẤN ĐỀ TRƯỚC LEVEL 3
================================================================================
AI Service KHÔNG kiểm tra xác thực gì cả. Frontend có gửi header ``api-key``
nhưng không một dependency nào đọc tới nó — hai khóa hardcode trong
``ai.service.ts`` vừa lộ thiên trong file JS gửi xuống trình duyệt, vừa hoàn
toàn vô tác dụng.

Cộng với việc Nginx mở công khai ``/ai-api/``, bất kỳ ai trên Internet cũng gọi
thẳng được ``/api/chat/agent-action`` và đốt sạch hạn mức token Gemini. Đây là
lỗ hổng nghiêm trọng nhất còn lại của hệ thống.

================================================================================
CÁCH SỬA
================================================================================
Chỉ backend Node.js được phép gọi AI Service, và phải kèm header
``X-Internal-Api-Key`` khớp với ``INTERNAL_API_KEY`` trong .env.

Vì sao dùng khóa chia sẻ (shared secret) chứ không phải JWT: hai dịch vụ đều do
ta vận hành và nằm trong cùng VPC. JWT sẽ buộc AI Service phải biết
``JWT_SECRET`` của backend và tự xác thực người dùng — nhân đôi trách nhiệm bảo
mật một cách không cần thiết. Danh tính người dùng đã được backend kiểm tra
xong trước khi gọi tới đây rồi.

⚠️ LỚP BẢO VỆ THỰC SỰ VẪN LÀ MẠNG.
Khóa này là lớp thứ hai. Lớp thứ nhất phải là Security Group của AWS: cổng 2111
trên GPU EC2 #2 chỉ nên mở cho Security Group của CPU EC2, không mở ra Internet.
Nếu ai đó không tới được cổng 2111 thì họ không có gì để mà đoán khóa cả.
"""

import hmac
import logging
from fastapi import Header, HTTPException, status

from src.config import get_settings

logger = logging.getLogger(__name__)

INTERNAL_KEY_HEADER = "X-Internal-Api-Key"

_warned_no_key = False


async def require_internal_key(
    x_internal_api_key: str | None = Header(default=None),
) -> None:
    """Dependency của FastAPI: chặn mọi request không mang khóa nội bộ hợp lệ.

    FastAPI tự ánh xạ tham số ``x_internal_api_key`` sang header
    ``X-Internal-Api-Key`` (gạch dưới ↔ gạch nối, không phân biệt hoa thường).

    CHƯA CẤU HÌNH KHÓA → CHO QUA, kèm cảnh báo.

    Đây là lựa chọn có cân nhắc, không phải sơ suất: nếu bắt buộc phải có khóa
    ngay, thì chỉ cần quên đặt biến môi trường ở một bên là toàn bộ tính năng AI
    chết cứng với lỗi 401 khó hiểu. Backend cũng theo đúng nguyên tắc này (xem
    ``services/aiClient.js``) — hai bên cùng bỏ trống thì hệ thống chạy như
    trước, chỉ khi CẢ HAI cùng đặt khóa thì lớp bảo vệ mới bật.
    """
    global _warned_no_key
    settings = get_settings()
    expected = settings.internal_api_key

    if not expected:
        if not _warned_no_key:
            _warned_no_key = True
            logger.warning(
                "⚠️  Chưa cấu hình INTERNAL_API_KEY — AI Service đang chạy KHÔNG XÁC THỰC. "
                "Bất kỳ ai truy cập được tới cổng này đều gọi được và đốt hạn mức token. "
                "Hãy đặt cùng một giá trị cho INTERNAL_API_KEY (ai-service/.env) "
                "và AI_SERVICE_INTERNAL_KEY (backend/.env)."
            )
        return

    # hmac.compare_digest thay cho `!=`: so sánh chuỗi thông thường thoát ra
    # ngay tại ký tự đầu tiên khác nhau, nên thời gian thực thi tiết lộ "đoán
    # đúng được bao nhiêu ký tự" — dò từng ký tự một là ra khóa (timing attack).
    # compare_digest luôn chạy hết độ dài.
    if not x_internal_api_key or not hmac.compare_digest(
        str(x_internal_api_key), str(expected)
    ):
        logger.warning("🚫 Từ chối request không có khóa nội bộ hợp lệ.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            # Thông điệp cố tình mơ hồ: không tiết lộ tên header hay định dạng
            # khóa cho người gọi trái phép.
            detail="Unauthorized.",
        )
