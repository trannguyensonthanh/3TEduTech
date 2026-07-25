# src/rag/chain.py
"""RAG (Retrieval-Augmented Generation) chain — the core Q&A pipeline."""

import logging
from src.config import get_settings
from src.core.gemini import generate_chat_response, generate_suggested_questions
from src.vectorstore.chroma import search_documents
from src.rag.prompts import (
    MASTER_SYSTEM_PROMPT,
    COURSE_SYSTEM_PROMPT,
    COURSE_SEARCH_PROMPT,
)

logger = logging.getLogger(__name__)


async def query_master(
    query: str,
    chat_history: list[dict] | None = None,
    top_k: int | None = None,
    use_general_knowledge: bool = False,
) -> dict:
    """
    Master AI query — searches all collections and answers general questions.
    
    Args:
        query: The user's question.
        chat_history: List of previous Q&A dicts.
        top_k: Number of documents to retrieve.
        use_general_knowledge: If True, bypass context checks.

    Returns:
        Dict with 'answer', 'sources', 'suggested_questions', and 'is_fallback_prompt'.
    """
    settings = get_settings()
    k = top_k or settings.rag_top_k

    # 1. Retrieve relevant documents
    results = await search_documents(
        collection_name=settings.chroma_collection_master,
        query=query,
        top_k=k,
    )

    if not results and not use_general_knowledge:
        return {
            "answer": "Xin lỗi, hiện tại tôi chưa được cung cấp tài liệu nội bộ liên quan đến vấn đề này. Bạn có muốn tôi sử dụng kiến thức chung (General Knowledge) để giải đáp không? Lưu ý rằng kiến thức chung có thể không bám sát 100% với hệ thống.",
            "sources": [],
            "suggested_questions": [],
            "is_fallback_prompt": True,
        }

    # 2. Build context from retrieved documents
    context = ""
    sources = []
    for r in results:
        context += f"\n---\n{r['content']}\n"
        source_info = {
            "file_name": r["metadata"].get("source", r["metadata"].get("file_name", "Unknown")),
            "content": r["content"][:200] + "..." if len(r["content"]) > 200 else r["content"],
        }
        # Avoid duplicate sources
        if source_info["file_name"] not in [s["file_name"] for s in sources]:
            sources.append(source_info)

    # 3. Generate response with Gemini
    answer = await generate_chat_response(
        query=query,
        context=context,
        system_prompt=MASTER_SYSTEM_PROMPT,
        chat_history=chat_history,
    )

    # 4. Generate suggested follow-up questions
    suggestions = await generate_suggested_questions(
        previous_response=answer,
        original_query=query,
    )

    return {
        "answer": answer,
        "sources": sources,
        "suggested_questions": suggestions,
    }


async def query_course(
    query: str,
    course_name: str,
    chat_history: list[dict] | None = None,
    top_k: int | None = None,
    use_general_knowledge: bool = False,
) -> dict:
    """
    Course-specific AI query — searches course content and answers.

    Args:
        query: User's question.
        course_name: Course name for filtering.
        chat_history: Previous Q&A pairs.
        top_k: Number of documents to retrieve.
        use_general_knowledge: If True, bypass context checks.

    Returns:
        Dict with 'answer', 'sources', 'suggested_questions', and 'is_fallback_prompt'.
    """
    settings = get_settings()
    k = top_k or settings.rag_top_k

    # 1. Retrieve course-specific documents
    results = await search_documents(
        collection_name=settings.chroma_collection_courses,
        query=query,
        top_k=k,
        where={"course_name": course_name} if course_name else None,
    )

    # If no course-specific results, also search master knowledge
    if len(results) < 3:
        master_results = await search_documents(
            collection_name=settings.chroma_collection_master,
            query=query,
            top_k=max(3, k - len(results)),
        )
        results.extend(master_results)
        
    if not results and not use_general_knowledge:
        return {
            "answer": "Xin lỗi, hiện tại tôi chưa tìm thấy tài liệu liên quan đến phần này trong giáo trình. Bạn có muốn tôi sử dụng kiến thức bên ngoài (General Knowledge) để giải đáp không? Lưu ý rằng kiến thức này có thể không bám sát 100% nội dung khóa học.",
            "sources": [],
            "suggested_questions": [],
            "is_fallback_prompt": True,
        }

    # 2. Build context
    context = ""
    sources = []
    for r in results:
        context += f"\n---\n{r['content']}\n"
        source_info = {
            "file_name": r["metadata"].get("source", r["metadata"].get("file_name", "Unknown")),
            "content": r["content"][:200] + "..." if len(r["content"]) > 200 else r["content"],
        }
        if source_info["file_name"] not in [s["file_name"] for s in sources]:
            sources.append(source_info)

    # 3. Generate response with course-specific prompt
    system_prompt = COURSE_SYSTEM_PROMPT.format(course_name=course_name)
    answer = await generate_chat_response(
        query=query,
        context=context,
        system_prompt=system_prompt,
        chat_history=chat_history,
    )

    # 4. Suggestions
    suggestions = await generate_suggested_questions(
        previous_response=answer,
        original_query=query,
    )

    return {
        "answer": answer,
        "sources": sources,
        "suggested_questions": suggestions,
    }


async def search_courses_with_ai(query: str, top_k: int = 5) -> dict:
    """
    AI-powered course search — retrieves and recommends courses.

    Args:
        query: User's learning goal / search query.
        top_k: Number of courses to consider.

    Returns:
        Dict with 'answer' (recommendation) and 'sources'.
    """
    settings = get_settings()

    # Search course content
    results = await search_documents(
        collection_name=settings.chroma_collection_courses,
        query=query,
        top_k=top_k,
        where={"type": "course_overview"},
    )

    if not results:
        return {
            "answer": "I couldn't find any courses matching your query. Try different keywords!",
            "sources": [],
        }

    context = "\n\n".join([r["content"] for r in results])
    prompt = COURSE_SEARCH_PROMPT.format(query=query, context=context)

    answer = await generate_chat_response(query=prompt)

    sources = [
        {
            "file_name": r["metadata"].get("course_name", "Unknown Course"),
            "content": r["content"][:200],
        }
        for r in results
    ]

    return {"answer": answer, "sources": sources}
