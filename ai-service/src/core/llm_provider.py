# src/core/llm_provider.py
"""
Bộ chọn mô hình ngôn ngữ — Gemini (đám mây) và Qwen local qua vLLM.

═══════════════════════════════════════════════════════════════════════════
CHÍNH SÁCH (đổi ngày 19/08/2026 — ĐỌC KỸ, ngữ nghĩa của "auto" ĐÃ THAY ĐỔI)
═══════════════════════════════════════════════════════════════════════════

    LLM_PROVIDER=auto        ← MẶC ĐỊNH, dùng cho cả dev lẫn production
        Gemini đi trước. Chuyển sang Qwen khi:
          • không cấu hình khóa Gemini nào  → máy dev không có khóa vẫn chạy
          • Gemini trả lỗi hết hạn mức (429 / RESOURCE_EXHAUSTED / quota)
        Sau một lần hết hạn mức, KHÔNG gọi lại Gemini trong
        LLM_GEMINI_COOLDOWN_SECONDS giây — xem phần "vì sao có cooldown".

    LLM_PROVIDER=gemini      Chỉ Gemini. Hỏng là hỏng, không dự phòng.
    LLM_PROVIDER=qwen        Chỉ Qwen. Dùng khi muốn thử riêng GPU EC2 #1.
    LLM_PROVIDER=qwen-first  Qwen trước, Gemini dự phòng.
                             ĐÂY LÀ HÀNH VI CŨ của "auto". Nếu ai đó đang
                             dựa vào nó, đổi cấu hình sang tên này.

--- VÌ SAO GEMINI ĐI TRƯỚC CHỨ KHÔNG PHẢI QWEN ---------------------------

Qwen chạy trên GPU EC2 #1 (g6.xlarge) — tính tiền theo giờ và là máy đắt nhất
trong ba máy. Gemini có hạn mức miễn phí hàng ngày. Dùng hết phần miễn phí
trước, chỉ nhờ tới GPU khi thật sự cần, là rẻ hơn hẳn. Chất lượng trả lời của
Gemini với tiếng Việt hiện cũng nhỉnh hơn.

--- VÌ SAO CÓ COOLDOWN ---------------------------------------------------

Hạn mức Gemini reset theo NGÀY, không theo phút. Khi đã hết, mọi lời gọi tiếp
theo đều trả 429 — mà mỗi lời gọi hỏng vẫn tốn một vòng đi-về mạng và làm
người dùng chờ thêm vài giây trước khi rơi về Qwen. Ghi nhớ "Gemini đang hết"
trong một khoảng thời gian giúp mọi câu hỏi sau đó đi thẳng tới Qwen.

Cooldown mặc định 15 phút chứ không phải tới nửa đêm: hạn mức đôi khi được nới
theo phút (per-minute rate limit) chứ không phải cạn cả ngày, và ta muốn quay
lại Gemini sớm nhất có thể.

--- ĐIỀU KHÔNG THỂ DỰ PHÒNG ----------------------------------------------

⚠️ EMBEDDING KHÔNG CÓ ĐƯỜNG LÙI. Toàn bộ RAG (nạp tài liệu, tìm kiếm ngữ
nghĩa) dùng `gemini-embedding` qua src/core/embeddings.py. vLLM ở đây chỉ phục
vụ mô hình sinh văn bản, KHÔNG phục vụ embedding. Nếu hạn mức embedding cạn
thì chatbot vẫn trả lời được (nhờ Qwen) nhưng KHÔNG tìm được tài liệu để trích
dẫn. Muốn dự phòng cả phần này thì phải triển khai thêm một mô hình embedding
trên GPU EC2 #2 — nằm ngoài phạm vi hiện tại, và đã ghi vào tài liệu triển khai.
"""

import json
import logging
import time

import httpx

from src.config import get_settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Trạng thái tiến trình
# ---------------------------------------------------------------------------

# Kết quả kiểm tra sức khỏe vLLM gần nhất (None = chưa kiểm bao giờ)
_vllm_healthy: bool | None = None
_vllm_check_count: int = 0
_VLLM_RECHECK_INTERVAL = 10  # kiểm lại sau mỗi N lần gọi

# Thời điểm (epoch giây) mà trước đó KHÔNG gọi Gemini nữa vì đã hết hạn mức
_gemini_cooldown_until: float = 0.0
# Lý do gần nhất khiến Gemini bị cho nghỉ — hiện ở /health để người vận hành
# biết chuyện gì đang xảy ra mà không phải lục log.
_gemini_last_error: str = ""


def _now() -> float:
    return time.monotonic()


# ---------------------------------------------------------------------------
# Nhận diện lỗi hết hạn mức
# ---------------------------------------------------------------------------

_DAU_HIEU_HET_HAN_MUC = (
    "429",
    "resource_exhausted",
    "resource exhausted",
    "quota",
    "rate limit",
    "ratelimit",
    "too many requests",
    "exceeded your current quota",
)

_DAU_HIEU_SAI_KHOA = (
    "api key not valid",
    "api_key_invalid",
    "permission_denied",
    "401",
    "403",
    "unauthenticated",
)


def _phan_loai_loi_gemini(exc: Exception) -> str:
    """Trả về 'het-han-muc' | 'sai-khoa' | 'khac'."""
    text = f"{type(exc).__name__}: {exc}".lower()
    if any(d in text for d in _DAU_HIEU_HET_HAN_MUC):
        return "het-han-muc"
    if any(d in text for d in _DAU_HIEU_SAI_KHOA):
        return "sai-khoa"
    return "khac"


def _cho_gemini_nghi(ly_do: str, exc: Exception) -> None:
    """Đánh dấu Gemini tạm không dùng được."""
    global _gemini_cooldown_until, _gemini_last_error
    settings = get_settings()
    _gemini_cooldown_until = _now() + settings.llm_gemini_cooldown_seconds
    _gemini_last_error = f"{ly_do}: {exc}"
    logger.warning(
        "Gemini tạm ngưng %ss (%s). Chuyển sang Qwen/vLLM.",
        settings.llm_gemini_cooldown_seconds,
        ly_do,
    )


def _gemini_dang_nghi() -> bool:
    return _now() < _gemini_cooldown_until


def _co_khoa_gemini() -> bool:
    """Có cấu hình bất kỳ khóa Gemini nào không?"""
    s = get_settings()
    return bool(s.get_chat_api_key() or s.get_routing_api_key())


# ---------------------------------------------------------------------------
# vLLM (Qwen)
# ---------------------------------------------------------------------------


async def _check_vllm_health() -> bool:
    """Kiểm tra vLLM có sẵn sàng không. Kết quả được nhớ tạm để đỡ tốn thời gian."""
    global _vllm_healthy, _vllm_check_count
    settings = get_settings()

    _vllm_check_count += 1
    if _vllm_healthy is not None and _vllm_check_count % _VLLM_RECHECK_INTERVAL != 0:
        return _vllm_healthy

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.vllm_base_url}/models")
            _vllm_healthy = resp.status_code == 200
    except Exception:
        _vllm_healthy = False

    if not _vllm_healthy:
        logger.warning("vLLM không phản hồi tại %s", settings.vllm_base_url)
    return _vllm_healthy


def _headers_vllm() -> dict:
    settings = get_settings()
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.vllm_api_key}",
    }


async def _call_vllm(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 2048,
) -> str:
    """Gọi vLLM qua API tương thích OpenAI (chat/completions)."""
    settings = get_settings()
    payload = {
        "model": settings.vllm_model_name,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }
    async with httpx.AsyncClient(timeout=settings.vllm_timeout_seconds) as client:
        resp = await client.post(
            f"{settings.vllm_base_url}/chat/completions",
            json=payload,
            headers=_headers_vllm(),
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def _call_vllm_stream(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 2048,
):
    """Gọi vLLM ở chế độ streaming (SSE)."""
    settings = get_settings()
    payload = {
        "model": settings.vllm_model_name,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True,
    }
    async with httpx.AsyncClient(timeout=settings.vllm_timeout_seconds) as client:
        async with client.stream(
            "POST",
            f"{settings.vllm_base_url}/chat/completions",
            json=payload,
            headers=_headers_vllm(),
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                data_str = line[6:]
                if data_str.strip() == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                    delta = chunk["choices"][0].get("delta", {})
                    content = delta.get("content", "")
                    if content:
                        yield content
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue


def _build_messages(
    query: str,
    context: str = "",
    system_prompt: str = "",
    chat_history: list[dict] | None = None,
) -> list[dict]:
    """Chuyển từ định dạng nội bộ sang messages kiểu OpenAI."""
    messages: list[dict] = []

    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})

    if chat_history:
        for pair in chat_history:
            messages.append({"role": "user", "content": pair.get("question", "")})
            messages.append({"role": "assistant", "content": pair.get("answer", "")})

    user_message = query
    if context:
        user_message = (
            "Dựa vào phần ngữ cảnh dưới đây, hãy trả lời câu hỏi của người dùng.\n\n"
            f"--- NGỮ CẢNH ---\n{context}\n--- HẾT NGỮ CẢNH ---\n\n"
            f"Câu hỏi: {query}"
        )

    messages.append({"role": "user", "content": user_message})
    return messages


# ---------------------------------------------------------------------------
# Quyết định dùng bên nào
# ---------------------------------------------------------------------------


async def _chon_ben() -> str:
    """
    Trả về 'gemini' hoặc 'qwen' cho lời gọi SẮP thực hiện.

    Đây là một hàm async vì trong chế độ 'auto' nó có thể phải hỏi thăm sức
    khỏe vLLM — không nên giấu một lời gọi mạng sau một hàm trông như đồng bộ.
    """
    che_do = (get_settings().llm_provider or "auto").strip().lower()

    if che_do == "gemini":
        return "gemini"
    if che_do == "qwen":
        return "qwen"

    if che_do == "qwen-first":
        # Hành vi cũ của "auto": Qwen trước, Gemini vớt.
        if await _check_vllm_health():
            return "qwen"
        return "gemini"

    # --- "auto" (mặc định): Gemini trước ---------------------------------
    if not _co_khoa_gemini():
        # Máy dev chưa cắm khóa Gemini. Không báo lỗi, không bắt người ta phải
        # đi xin khóa mới chạy được — cứ dùng Qwen.
        return "qwen"

    if _gemini_dang_nghi():
        return "qwen"

    return "gemini"


async def _qwen_kha_dung() -> bool:
    return await _check_vllm_health()


def trang_thai_provider() -> dict:
    """Ảnh chụp trạng thái để /health hiển thị. Không gọi mạng."""
    settings = get_settings()
    con_nghi = max(0.0, _gemini_cooldown_until - _now())
    return {
        "mode": settings.llm_provider,
        "gemini_configured": _co_khoa_gemini(),
        "gemini_cooling_down": con_nghi > 0,
        "gemini_cooldown_remaining_seconds": round(con_nghi),
        "gemini_last_error": _gemini_last_error or None,
        "vllm_last_known_healthy": _vllm_healthy,
    }


# ---------------------------------------------------------------------------
# API công khai
# ---------------------------------------------------------------------------


async def generate_response(
    query: str,
    context: str = "",
    system_prompt: str = "",
    chat_history: list[dict] | None = None,
    temperature: float = 0.7,
    max_tokens: int = 2048,
) -> str:
    """Sinh câu trả lời hội thoại. Tự chọn Gemini hay Qwen theo chính sách."""
    ben = await _chon_ben()

    if ben == "gemini":
        try:
            from src.core.gemini import generate_chat_response

            return await generate_chat_response(
                query, context, system_prompt, chat_history
            )
        except Exception as exc:
            loai = _phan_loai_loi_gemini(exc)
            if loai == "khac" or get_settings().llm_provider == "gemini":
                # Lỗi không phải hết hạn mức (prompt sai, mạng chập chờn...) thì
                # ném ra để lộ nguyên nhân thật, đừng che bằng cách đổi mô hình.
                raise
            _cho_gemini_nghi(loai, exc)
            ben = "qwen"

    # --- Qwen ---
    if not await _qwen_kha_dung():
        from src.core.gemini import generate_chat_response

        # Cả hai đều không dùng được → vẫn thử Gemini lần cuối để lỗi ném ra
        # là lỗi THẬT của Gemini, chứ không phải "vLLM offline" gây hiểu nhầm.
        logger.error("Cả Gemini lẫn vLLM đều không dùng được.")
        return await generate_chat_response(query, context, system_prompt, chat_history)

    messages = _build_messages(query, context, system_prompt, chat_history)
    return await _call_vllm(messages, temperature, max_tokens)


async def generate_response_stream(
    query: str,
    context: str = "",
    system_prompt: str = "",
    chat_history: list[dict] | None = None,
    temperature: float = 0.7,
    max_tokens: int = 2048,
):
    """Sinh câu trả lời theo luồng token."""
    ben = await _chon_ben()

    if ben == "gemini":
        try:
            from src.core.gemini import generate_chat_response_stream

            async for chunk in generate_chat_response_stream(
                query, context, system_prompt, chat_history
            ):
                yield chunk
            return
        except Exception as exc:
            loai = _phan_loai_loi_gemini(exc)
            if loai == "khac" or get_settings().llm_provider == "gemini":
                raise
            _cho_gemini_nghi(loai, exc)
            ben = "qwen"

    if not await _qwen_kha_dung():
        from src.core.gemini import generate_chat_response_stream

        logger.error("Cả Gemini lẫn vLLM đều không dùng được (streaming).")
        async for chunk in generate_chat_response_stream(
            query, context, system_prompt, chat_history
        ):
            yield chunk
        return

    messages = _build_messages(query, context, system_prompt, chat_history)
    async for chunk in _call_vllm_stream(messages, temperature, max_tokens):
        yield chunk


async def generate_routing(query: str, system_prompt: str = "") -> str:
    """
    Phân loại ý định — câu ngắn, nhiệt độ thấp, cần NHANH.

    [THÊM 19/08/2026] Trước đây intent_router.py gọi thẳng Gemini, nên khi hạn
    mức Gemini cạn thì phần định tuyến chết trước cả phần trả lời — chatbot
    hỏng hoàn toàn dù Qwen vẫn đang chạy khỏe. Nay nó đi qua đây.
    """
    ben = await _chon_ben()

    if ben == "gemini":
        try:
            from src.core.gemini import generate_routing_response

            return await generate_routing_response(query, system_prompt)
        except Exception as exc:
            loai = _phan_loai_loi_gemini(exc)
            if loai == "khac" or get_settings().llm_provider == "gemini":
                raise
            _cho_gemini_nghi(loai, exc)
            ben = "qwen"

    if not await _qwen_kha_dung():
        from src.core.gemini import generate_routing_response

        return await generate_routing_response(query, system_prompt)

    messages = _build_messages(query, system_prompt=system_prompt)
    return await _call_vllm(messages, temperature=0.1, max_tokens=256)


async def generate_suggestions(
    previous_response: str,
    original_query: str = "",
    num_suggestions: int = 3,
) -> list[str]:
    """Gợi ý câu hỏi tiếp theo. Hỏng thì trả danh sách rỗng, không làm hỏng câu trả lời chính."""
    ben = await _chon_ben()

    if ben == "gemini":
        try:
            from src.core.gemini import generate_suggested_questions

            return await generate_suggested_questions(
                previous_response, original_query, num_suggestions
            )
        except Exception as exc:
            loai = _phan_loai_loi_gemini(exc)
            if loai != "khac":
                _cho_gemini_nghi(loai, exc)
            ben = "qwen"

    if not await _qwen_kha_dung():
        return []

    prompt = (
        f"Dựa trên đoạn hỏi đáp sau, hãy gợi ý {num_suggestions} câu hỏi tiếp theo "
        "mà một học viên có thể muốn hỏi. CHỈ trả về các câu hỏi, mỗi câu một dòng, "
        "không đánh số.\n\n"
        f"Câu hỏi ban đầu: {original_query}\n"
        f"Câu trả lời: {previous_response}\n\n"
        "Các câu hỏi gợi ý:"
    )
    try:
        text = await _call_vllm(
            [{"role": "user", "content": prompt}],
            temperature=0.8,
            max_tokens=300,
        )
    except Exception as exc:
        logger.warning("Không sinh được gợi ý câu hỏi bằng Qwen: %s", exc)
        return []

    questions = [q.strip() for q in (text or "").strip().split("\n") if q.strip()]
    return questions[:num_suggestions]
