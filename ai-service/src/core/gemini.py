# src/core/gemini.py
"""Gemini AI client initialization and management."""

import logging
from google import genai
from google.genai import types
from src.config import get_settings

logger = logging.getLogger(__name__)

_client: genai.Client | None = None


def get_gemini_client() -> genai.Client:
    """Get or create the Gemini client singleton."""
    global _client
    if _client is None:
        settings = get_settings()
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is not configured. Please set it in your .env file.")
        _client = genai.Client(api_key=settings.gemini_api_key)
        logger.info(f"Gemini client initialized with model: {settings.gemini_model}")
    return _client


async def generate_chat_response(
    query: str,
    context: str = "",
    system_prompt: str = "",
    chat_history: list[dict] | None = None,
) -> str:
    """
    Generate a chat response using Gemini 2.5 Flash.
    
    Args:
        query: The user's question.
        context: Retrieved context from RAG (documents).
        system_prompt: System instructions for the model.
        chat_history: Previous Q&A pairs for multi-turn conversation.
    
    Returns:
        The model's text response.
    """
    settings = get_settings()
    client = get_gemini_client()

    # Build the conversation contents
    contents = []

    # Add chat history if provided
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

    # Build the final user message with context
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

    # Configure generation
    config = types.GenerateContentConfig(
        system_instruction=system_prompt if system_prompt else None,
        temperature=0.7,
        max_output_tokens=2048,
    )

    try:
        response = await client.aio.models.generate_content(
            model=settings.gemini_model,
            contents=contents,
            config=config,
        )
        return response.text or "I'm sorry, I couldn't generate a response."
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise


async def generate_suggested_questions(
    previous_response: str,
    original_query: str = "",
    num_suggestions: int = 3,
) -> list[str]:
    """
    Generate follow-up question suggestions based on the previous response.
    
    Args:
        previous_response: The AI's last response.
        original_query: The user's original question.
        num_suggestions: Number of suggestions to generate.
    
    Returns:
        A list of suggested follow-up questions.
    """
    settings = get_settings()
    client = get_gemini_client()

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
            model=settings.gemini_model,
            contents=prompt,
            config=config,
        )
        text = response.text or ""
        questions = [q.strip() for q in text.strip().split("\n") if q.strip()]
        return questions[:num_suggestions]
    except Exception as e:
        logger.error(f"Error generating suggestions: {e}")
        return []
