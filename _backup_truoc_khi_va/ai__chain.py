# src/rag/chain.py
"""RAG (Retrieval-Augmented Generation) chain — the core Q&A pipeline."""

import logging
from src.config import get_settings
# [SỬA 19/08/2026] Chuyển từ src.core.gemini sang src.core.llm_provider.
#
# Trước đây tệp này gọi THẲNG Gemini, nên lớp chọn mô hình (llm_provider)
# chỉ được đúng MỘT endpoint dùng tới — nghĩa là Qwen/vLLM trên GPU EC2 #1
# thực tế chưa bao giờ phục vụ chatbot. Hạn mức Gemini cạn là cả hệ thống
# hỏng, dù GPU vẫn đang chạy và tính tiền.
#
# Đặt bí danh trùng tên hàm cũ để mọi lời gọi bên dưới không phải sửa —
# chữ ký hai bên đã được đối chiếu là khớp nhau.
from src.core.llm_provider import (
    generate_response as generate_chat_response,
    generate_suggestions as generate_suggested_questions,
)
from src.vectorstore.chroma import search_documents
from src.rag.prompts import (
    MASTER_SYSTEM_PROMPT,
    COURSE_SYSTEM_PROMPT,
    COURSE_SEARCH_PROMPT,
)

logger = logging.getLogger(__name__)


async def get_master_context(
    query: str,
    top_k: int | None = None,
) -> tuple[str, list[dict]]:
    """Retrieve relevant documents and build context & sources for SSE streaming."""
    settings = get_settings()
    k = top_k or settings.rag_top_k
    master_results = await search_documents(
        collection_name=settings.chroma_collection_master,
        query=query,
        top_k=k,
    )
    course_results = await search_documents(
        collection_name=settings.chroma_collection_courses,
        query=query,
        top_k=k,
        where={"type": "course_overview"},
    )
    results = sorted(master_results + course_results, key=lambda x: x.get("distance", 1.0))[:k]
    if not results:
        return "", []
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
    return context, sources


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

    # 1. Retrieve relevant documents from both master and course collections
    master_results = await search_documents(
        collection_name=settings.chroma_collection_master,
        query=query,
        top_k=k,
    )
    course_results = await search_documents(
        collection_name=settings.chroma_collection_courses,
        query=query,
        top_k=k,
        where={"type": "course_overview"},
    )
    results = sorted(master_results + course_results, key=lambda x: x.get("distance", 1.0))[:k]

    if not results:
        return {
            "answer": "Xin lỗi bạn, tôi không tìm thấy thông tin phù hợp trong cơ sở tri thức (FAQ, chính sách, giới thiệu khóa học) của hệ thống **3TEduTech** để giải đáp cho câu hỏi này.\n\nNhằm đảm bảo tính chính xác tuyệt đối và uy tín của nền tảng, tôi chỉ phản hồi dựa trên dữ liệu chính thức đã được xác thực từ 3TEduTech. Bạn vui lòng liên hệ bộ phận Tư vấn & CSKH hoặc tham gia cộng đồng giải đáp để được hỗ trợ chi tiết nhất nhé!",
            "sources": [],
            "suggested_questions": [
                "Bên mình có những khóa học lập trình nào?",
                "Chính sách bảo vệ tiến độ học tập hoạt động thế nào?",
                "Tôi có thể thanh toán khóa học bằng những phương thức nào?"
            ],
            "is_fallback_prompt": False,
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
        
    if not results:
        return {
            "answer": f"Xin lỗi bạn, tôi không tìm thấy nội dung hoặc bài giảng phù hợp với câu hỏi này trong giáo trình khóa học **{course_name or 'này'}**.\n\nNhằm bảo vệ tính kiên định và chuẩn xác về kiến thức chuyên môn, tôi chỉ trả lời dựa trên tài liệu bài giảng chính thức. Bạn vui lòng đặt câu hỏi sát với nội dung bài học hoặc vào mục **Thảo luận** để trao đổi trực tiếp với Giảng viên nhé!",
            "sources": [],
            "suggested_questions": [],
            "is_fallback_prompt": False,
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
