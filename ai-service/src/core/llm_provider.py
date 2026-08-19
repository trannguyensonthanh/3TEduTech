# src/core/llm_provider.py
"""
Hybrid LLM Provider — Switch giữa Gemini API và local Qwen (vLLM) linh hoạt.

Chiến lược:
- "gemini": Luôn dùng Gemini API (cloud, dùng token)
- "qwen":   Luôn dùng Qwen local qua vLLM (miễn phí, cần GPU EC2 #1)
- "auto":   Ưu tiên Qwen, tự động fallback Gemini nếu vLLM không phản hồi

vLLM exposes OpenAI-compatible API nên ta dùng httpx để gọi trực tiếp,
không cần thư viện openai.
"""

import logging
import httpx
from src.config import get_settings

logger = logging.getLogger(__name__)

# Cache trạng thái health của vLLM để tránh check liên tục
_vllm_healthy: bool | None = None
_vllm_check_count: int = 0
_VLLM_RECHECK_INTERVAL = 10  # Re-check health sau mỗi 10 lần gọi


async def _check_vllm_health() -> bool:
    """Kiểm tra vLLM server có sẵn sàng không."""
    global _vllm_healthy, _vllm_check_count
    settings = get_settings()

    # Cache: chỉ re-check sau mỗi N lần gọi
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
        logger.warning("⚠️ vLLM server không phản hồi, sẽ fallback sang Gemini.")
    return _vllm_healthy


async def _call_vllm(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 2048,
) -> str:
    """Gọi vLLM qua OpenAI-compatible API (chat/completions)."""
    settings = get_settings()

    payload = {
        "model": settings.vllm_model_name,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.vllm_api_key}",
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            f"{settings.vllm_base_url}/chat/completions",
            json=payload,
            headers=headers,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def _call_vllm_stream(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 2048,
):
    """Gọi vLLM streaming qua OpenAI-compatible API (SSE)."""
    settings = get_settings()

    payload = {
        "model": settings.vllm_model_name,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True,
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.vllm_api_key}",
    }

    import json

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            f"{settings.vllm_base_url}/chat/completions",
            json=payload,
            headers=headers,
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
    """Chuyển đổi từ format nội bộ sang OpenAI messages format."""
    messages = []

    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})

    if chat_history:
        for pair in chat_history:
            messages.append({"role": "user", "content": pair.get("question", "")})
            messages.append({"role": "assistant", "content": pair.get("answer", "")})

    user_message = query
    if context:
        user_message = (
            f"Based on the following context, answer the user's question.\n\n"
            f"--- CONTEXT ---\n{context}\n--- END CONTEXT ---\n\n"
            f"User Question: {query}"
        )

    messages.append({"role": "user", "content": user_message})
    return messages


def _should_use_qwen() -> str:
    """Trả về provider nên dùng: 'qwen' hoặc 'gemini'."""
    settings = get_settings()
    return settings.llm_provider  # "gemini", "qwen", or "auto"


async def generate_response(
    query: str,
    context: str = "",
    system_prompt: str = "",
    chat_history: list[dict] | None = None,
    temperature: float = 0.7,
    max_tokens: int = 2048,
) -> str:
    """
    Generate chat response — tự động chọn Gemini hoặc Qwen dựa trên config.

    - LLM_PROVIDER=gemini → Gemini API
    - LLM_PROVIDER=qwen → vLLM (Qwen)
    - LLM_PROVIDER=auto → Qwen nếu vLLM healthy, fallback Gemini
    """
    provider = _should_use_qwen()

    use_qwen = False
    if provider == "qwen":
        use_qwen = True
    elif provider == "auto":
        use_qwen = await _check_vllm_health()

    if use_qwen:
        try:
            messages = _build_messages(query, context, system_prompt, chat_history)
            result = await _call_vllm(messages, temperature, max_tokens)
            logger.debug("✅ Response from Qwen (vLLM)")
            return result
        except Exception as e:
            logger.warning(f"⚠️ vLLM call failed ({e}), falling back to Gemini...")
            # Fallback to Gemini
            global _vllm_healthy
            _vllm_healthy = False

    # Gemini fallback
    from src.core.gemini import generate_chat_response
    result = await generate_chat_response(query, context, system_prompt, chat_history)
    logger.debug("✅ Response from Gemini API")
    return result


async def generate_response_stream(
    query: str,
    context: str = "",
    system_prompt: str = "",
    chat_history: list[dict] | None = None,
    temperature: float = 0.7,
    max_tokens: int = 2048,
):
    """
    Generate streaming chat response — tự động chọn Gemini hoặc Qwen.
    Yields token chunks as they are generated.
    """
    provider = _should_use_qwen()

    use_qwen = False
    if provider == "qwen":
        use_qwen = True
    elif provider == "auto":
        use_qwen = await _check_vllm_health()

    if use_qwen:
        try:
            messages = _build_messages(query, context, system_prompt, chat_history)
            async for chunk in _call_vllm_stream(messages, temperature, max_tokens):
                yield chunk
            logger.debug("✅ Streamed response from Qwen (vLLM)")
            return
        except Exception as e:
            logger.warning(f"⚠️ vLLM stream failed ({e}), falling back to Gemini...")
            global _vllm_healthy
            _vllm_healthy = False

    # Gemini fallback
    from src.core.gemini import generate_chat_response_stream
    async for chunk in generate_chat_response_stream(query, context, system_prompt, chat_history):
        yield chunk
    logger.debug("✅ Streamed response from Gemini API")
