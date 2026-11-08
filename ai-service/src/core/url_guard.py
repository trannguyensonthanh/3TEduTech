"""Chặn SSRF cho các URL do bên gọi cung cấp.

Vì sao cần: `POST /api/ingest/transcribe` nhận `video_url` và `webhook_url` dưới
dạng chuỗi trần — không kiểm tra giao thức, không danh sách cho phép. Dịch vụ
trả 200 ngay rồi tác vụ nền tự đi GET `video_url` và POST kết quả tới
`webhook_url`. Chạy trên EC2, điều đó nghĩa là ai qua được khóa nội bộ (hoặc bất
kỳ ai, khi khóa để trống) đều khiến dịch vụ GET được
`http://169.254.169.254/latest/meta-data/iam/...` TỪ BÊN TRONG VPC rồi gửi kết
quả ra ngoài. Trên máy GPU cổng 2111 còn bind 0.0.0.0.

Bên gọi hợp lệ duy nhất là backend, và nó luôn truyền URL đã ký sẵn của
Cloudinary (xem subtitle.service.js), nên siết lại là khả thi.
"""

from __future__ import annotations

import asyncio
import ipaddress
import logging
import socket
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

ALLOWED_SCHEMES = {"http", "https"}


class UnsafeUrlError(ValueError):
    """URL không vượt qua được kiểm tra chống SSRF."""


def check_url_shape(url: str) -> str:
    """Kiểm tra nhanh, không tra DNS. Dùng được trong validator của Pydantic."""
    if not url or len(url) > 2048:
        raise UnsafeUrlError("URL rỗng hoặc quá dài.")

    parsed = urlparse(url)
    if parsed.scheme not in ALLOWED_SCHEMES:
        raise UnsafeUrlError(
            f"Giao thức '{parsed.scheme}' không được phép; chỉ chấp nhận http/https."
        )
    if not parsed.hostname:
        raise UnsafeUrlError("URL không có tên máy chủ.")

    # Trường hợp địa chỉ IP viết thẳng trong URL thì chặn được ngay, khỏi tra DNS.
    try:
        ip = ipaddress.ip_address(parsed.hostname)
    except ValueError:
        pass
    else:
        _reject_if_internal(ip, parsed.hostname)

    return url


def _reject_if_internal(ip: ipaddress._BaseAddress, host: str) -> None:
    if (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local      # gồm 169.254.0.0/16 — endpoint metadata của EC2
        or ip.is_reserved
        or ip.is_multicast
        or ip.is_unspecified
    ):
        raise UnsafeUrlError(
            f"Máy chủ '{host}' trỏ tới địa chỉ nội bộ ({ip}); từ chối để tránh SSRF."
        )


async def assert_url_is_public(url: str) -> None:
    """Kiểm tra đầy đủ: hình dạng URL + phân giải DNS.

    Gọi ngay trước khi thực sự truy cập mạng. Tra DNS qua loop.getaddrinfo nên
    không chặn vòng lặp sự kiện.
    """
    check_url_shape(url)
    host = urlparse(url).hostname

    try:
        infos = await asyncio.get_running_loop().getaddrinfo(
            host, None, proto=socket.IPPROTO_TCP
        )
    except socket.gaierror as exc:
        raise UnsafeUrlError(f"Không phân giải được tên máy chủ '{host}'.") from exc

    for info in infos:
        _reject_if_internal(ipaddress.ip_address(info[4][0]), host)


_warned_open_webhook = False


def assert_webhook_allowed(url: str) -> None:
    """Kiểm tra URL webhook theo danh sách gốc được phép.

    KHÔNG dùng luật chống SSRF ở trên cho webhook: webhook là lời gọi ngược về
    backend của chính hệ thống, và địa chỉ của nó gần như luôn nội bộ
    (`http://127.0.0.1:5000` khi chạy local, tên service Docker khi chạy
    compose — xem subtitle.service.js). Áp luật "phải là IP công cộng" vào đây
    sẽ chặn đúng luồng hợp lệ duy nhất.

    Danh sách gốc chặt hơn: chỉ đúng những máy chủ đã khai báo mới nhận được dữ
    liệu, bất kể nội bộ hay không.
    """
    global _warned_open_webhook

    check_url_shape_for_webhook(url)

    from src.config import get_settings  # import muộn để tránh vòng phụ thuộc

    allowed = get_settings().webhook_allowed_origins_list
    if not allowed:
        if not _warned_open_webhook:
            _warned_open_webhook = True
            logger.warning(
                "WEBHOOK_ALLOWED_ORIGINS chưa được đặt — mọi URL webhook đều được "
                "chấp nhận. Hãy đặt biến này (ví dụ http://backend:5000) trước khi "
                "mở dịch vụ ra mạng ngoài."
            )
        return

    parsed = urlparse(url)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    if origin.rstrip("/") not in allowed:
        raise UnsafeUrlError(
            f"Gốc webhook '{origin}' không nằm trong WEBHOOK_ALLOWED_ORIGINS."
        )


def check_url_shape_for_webhook(url: str) -> str:
    """Như check_url_shape nhưng KHÔNG chặn địa chỉ nội bộ."""
    if not url or len(url) > 2048:
        raise UnsafeUrlError("URL rỗng hoặc quá dài.")
    parsed = urlparse(url)
    if parsed.scheme not in ALLOWED_SCHEMES:
        raise UnsafeUrlError(
            f"Giao thức '{parsed.scheme}' không được phép; chỉ chấp nhận http/https."
        )
    if not parsed.hostname:
        raise UnsafeUrlError("URL không có tên máy chủ.")
    return url
