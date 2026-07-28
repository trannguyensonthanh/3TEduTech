# src/core/gemini.py
"""Gemini AI client initialization and management — Multi-Model Architecture."""

import logging
from google import genai
from google.genai import types
from src.config import get_settings

logger = logging.getLogger(__name__)

# --- Multi-Client Singletons ---
_routing_client: genai.Client | None = None
_chat_client: genai.Client | None = None
_embedding_client: genai.Client | None = None


def get_routing_client() -> genai.Client:
    """Get or create the Gemini client for intent routing (fast, cheap)."""
    global _routing_client
    if _routing_client is None:
        settings = get_settings()
        api_key = settings.get_routing_api_key()
        if not api_key:
            raise ValueError("No API key configured for routing model.")
        _routing_client = genai.Client(api_key=api_key)
        logger.info(f"Routing Gemini client initialized: {settings.gemini_routing_model}")
    return _routing_client


def get_chat_client() -> genai.Client:
    """Get or create the Gemini client for conversational chat (deep reasoning)."""
    global _chat_client
    if _chat_client is None:
        settings = get_settings()
        api_key = settings.get_chat_api_key()
        if not api_key:
            raise ValueError("No API key configured for chat model.")
        _chat_client = genai.Client(api_key=api_key)
        logger.info(f"Chat Gemini client initialized: {settings.gemini_chat_model}")
    return _chat_client


def get_embedding_client() -> genai.Client:
    """Get or create the Gemini client for embeddings."""
    global _embedding_client
    if _embedding_client is None:
        settings = get_settings()
        api_key = settings.get_embedding_api_key()
        if not api_key:
            raise ValueError("No API key configured for embedding model.")
        _embedding_client = genai.Client(api_key=api_key)
        logger.info(f"Embedding Gemini client initialized: {settings.gemini_embedding_model}")
    return _embedding_client


# --- Backwards compatibility ---
def get_gemini_client() -> genai.Client:
    """Legacy: Get the chat client (backwards compatible)."""
    return get_chat_client()


async def generate_chat_response(
    query: str,
    context: str = "",
    system_prompt: str = "",
    chat_history: list[dict] | None = None,
) -> str:
    """
    Generate a chat response using the Chat model (deep reasoning).
    """
    settings = get_settings()
    client = get_chat_client()

    contents = []

    if chat_history:
        for pair in chat_history:
            contents.append(types.Content(
                role="user",
                parts=[types.Part.from_text(text=pair.get("question", ""))]
            ))
            contents.append(types.Content(
                role="model",
                parts=[types.Part.from_text(text=pair.get("answer", ""))]
            ))

    user_message = query
    if context:
        user_message = (
            f"Based on the following context, answer the user's question.\n\n"
            f"--- CONTEXT ---\n{context}\n--- END CONTEXT ---\n\n"
            f"User Question: {query}"
        )

    contents.append(types.Content(
        role="user",
        parts=[types.Part.from_text(text=user_message)]
    ))

    config = types.GenerateContentConfig(
        system_instruction=system_prompt if system_prompt else None,
        temperature=0.7,
        max_output_tokens=2048,
    )

    try:
        response = await client.aio.models.generate_content(
            model=settings.gemini_chat_model,
            contents=contents,
            config=config,
        )
        return response.text or "I'm sorry, I couldn't generate a response."
    except Exception as e:
        logger.error(f"Gemini Chat API error: {e}")
        raise


async def generate_chat_response_stream(
    query: str,
    context: str = "",
    system_prompt: str = "",
    chat_history: list[dict] | None = None,
):
    """
    Generate a real-time streaming chat response yielding token chunks as they are generated.
    """
    settings = get_settings()
    client = get_chat_client()

    contents = []

    if chat_history:
        for pair in chat_history:
            contents.append(types.Content(
                role="user",
                parts=[types.Part.from_text(text=pair.get("question", ""))]
            ))
            contents.append(types.Content(
                role="model",
                parts=[types.Part.from_text(text=pair.get("answer", ""))]
            ))

    user_message = query
    if context:
        user_message = (
            f"Based on the following context, answer the user's question.\n\n"
            f"--- CONTEXT ---\n{context}\n--- END CONTEXT ---\n\n"
            f"User Question: {query}"
        )

    contents.append(types.Content(
        role="user",
        parts=[types.Part.from_text(text=user_message)]
    ))

    config = types.GenerateContentConfig(
        system_instruction=system_prompt if system_prompt else None,
        temperature=0.7,
        max_output_tokens=2048,
    )

    try:
        response_stream = await client.aio.models.generate_content_stream(
            model=settings.gemini_chat_model,
            contents=contents,
            config=config,
        )
        async for chunk in response_stream:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        logger.error(f"Gemini Chat Streaming API error: {e}")
        yield "\n[Xin lỗi, xảy ra gián đoạn trong kết nối luồng AI.]"


async def generate_routing_response(
    query: str,
    system_prompt: str = "",
) -> str:
    """
    Generate a fast response using the Router model (intent classification).
    Optimized for speed with low token output.
    """
    settings = get_settings()
    client = get_routing_client()

    config = types.GenerateContentConfig(
        system_instruction=system_prompt if system_prompt else None,
        temperature=0.1,
        max_output_tokens=256,
    )

    try:
        response = await client.aio.models.generate_content(
            model=settings.gemini_routing_model,
            contents=query,
            config=config,
        )
        return response.text or ""
    except Exception as e:
        logger.error(f"Gemini Routing API error: {e}")
        raise


async def generate_suggested_questions(
    previous_response: str,
    original_query: str = "",
    num_suggestions: int = 3,
) -> list[str]:
    """
    Generate follow-up question suggestions using the Chat model.
    """
    settings = get_settings()
    client = get_chat_client()

    prompt = (
        f"Based on this Q&A exchange, suggest {num_suggestions} natural follow-up questions "
        f"that a student might ask next. Return ONLY the questions, one per line, no numbering.\n\n"
        f"Original Question: {original_query}\n"
        f"Answer: {previous_response}\n\n"
        f"Suggested follow-up questions:"
    )

    config = types.GenerateContentConfig(
        temperature=0.8,
        max_output_tokens=300,
    )

    try:
        response = await client.aio.models.generate_content(
            model=settings.gemini_chat_model,
            contents=prompt,
            config=config,
        )
        text = response.text or ""
        questions = [q.strip() for q in text.strip().split("\n") if q.strip()]
        return questions[:num_suggestions]
    except Exception as e:
        logger.error(f"Error generating suggestions: {e}")
        return []
