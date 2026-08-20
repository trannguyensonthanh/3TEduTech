# src/api/routes/agent.py
"""Unified AI Agent endpoint — Intent Routing + Hybrid Search + Conversational Commerce."""

import json
import re
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from src.models.schemas import (
    AgentRequest,
    AgentResponse,
    UIWidget,
    SourceInfo,
)
from src.core.intent_router import classify_intent, UserIntent
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
    generate_response_stream as generate_chat_response_stream,
    generate_suggestions as generate_suggested_questions,
)
from src.rag.chain import query_master, get_master_context
from src.rag.hybrid_search import hybrid_course_search
from src.rag.prompts import MASTER_SYSTEM_PROMPT, COURSE_SEARCH_PROMPT
from src.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Agent"])


def _resolve_course_reference(query: str, keywords: list[str], chat_history: list[dict] | None) -> str:
    """Resolve ordinal references ('số 1', 'khóa 1', etc.) or extract course name from chat history context."""
    # 1. Direct explicit extraction if colon ':' exists in query (e.g. from UI widget clicks)
    if ":" in query and not query.strip().startswith("http"):
        extracted = query.split(":", 1)[1].strip().rstrip(".")
        if extracted and len(extracted) > 2:
            return extracted

    course_name = keywords[0] if keywords else "Unknown Course"
    if ":" in course_name:
        return course_name.split(":", 1)[1].strip()
    
    lower_query = query.lower()
    lower_kw = course_name.lower()
    
    ordinal_index = None
    if any(k in lower_query or k in lower_kw for k in ["số 1", "khóa 1", "thứ nhất", "đầu tiên", "thứ 1", "#1", "số một"]):
        ordinal_index = 0
    elif any(k in lower_query or k in lower_kw for k in ["số 2", "khóa 2", "thứ hai", "thứ 2", "#2", "số hai"]):
        ordinal_index = 1
    elif any(k in lower_query or k in lower_kw for k in ["số 3", "khóa 3", "thứ ba", "thứ 3", "#3", "số ba"]):
        ordinal_index = 2
    elif "khóa này" in lower_query or "khóa học này" in lower_query or "khóa đó" in lower_query or course_name in ["Unknown Course", "khóa học số 1", "khóa học số 2", "khóa học số 3", "khóa này"]:
        ordinal_index = 0  # Default to first/latest course mentioned
        
    if ordinal_index is not None and chat_history and len(chat_history) > 0:
        last_item = chat_history[-1]
        # Inspect ui_widget data from previous turn if available
        widget = last_item.get("ui_widget") or last_item.get("uiWidget")
        if isinstance(widget, dict):
            w_type = widget.get("type")
            w_data = widget.get("data", {})
            if w_type == "COURSE_CAROUSEL" and "courses" in w_data:
                courses_list = w_data.get("courses", [])
                if len(courses_list) > ordinal_index and isinstance(courses_list[ordinal_index], dict):
                    return courses_list[ordinal_index].get("courseName", "Khóa học đã chọn")
            elif w_type in ["PAYMENT_SELECTOR", "CHECKOUT_REDIRECT"] and "courseName" in w_data:
                return w_data.get("courseName", "Khóa học đã chọn")

        # Inspect last bot response in history for course names
        last_bot_msg = last_item.get("answer") or last_item.get("text", "")
        bold_matches = re.findall(r"\*\*([^*]{3,60})\*\*", last_bot_msg)
        ignored = {"enroll now", "add to cart", "3tedutech", "vnpay", "momo", "paypal", "stripe", "crypto", "chi phí", "học phí", "ưu đãi", "place order & pay", "backend", "frontend", "fullstack", "lập trình", "web", "mobile", "database", "ai", "data science", "devops"}
        candidates = [m.strip() for m in bold_matches if m.strip().lower() not in ignored and len(m.strip()) > 3]
        
        if candidates and len(candidates) > ordinal_index:
            return candidates[ordinal_index]
        elif candidates:
            return candidates[0]
            
    return course_name if course_name != "Unknown Course" and not "số " in course_name else (course_name if ordinal_index is None else "Khóa Học Đề Xuất từ AI")


async def _handle_search_course(query: str, keywords: list[str], chat_history: list[dict] | None) -> dict:
    """Handle SEARCH_COURSE intent using Hybrid Search."""
    settings = get_settings()

    # Use hybrid search (BM25 + Dense Vector + RRF)
    search_results = await hybrid_course_search(
        query=query,
        top_k=5,
        where={"type": "course_overview"},
    )

    if not search_results:
        return {
            "answer": "Xin lỗi, tôi không tìm thấy khóa học nào phù hợp với yêu cầu của bạn. Hãy thử mô tả mục tiêu học tập của bạn theo cách khác nhé!",
            "sources": [],
            "ui_widget": None,
        }

    # Build context from search results for AI recommendation
    context = "\n\n".join([r["content"] for r in search_results])
    prompt = COURSE_SEARCH_PROMPT.format(query=query, context=context)
    answer = await generate_chat_response(query=prompt, chat_history=chat_history)

    sources = [
        {
            "file_name": r["metadata"].get("course_name", r["metadata"].get("source", "Unknown Course")),
            "content": r["content"][:200],
        }
        for r in search_results
    ]

    # Build course carousel widget for frontend
    courses_for_widget = []
    for r in search_results:
        meta = r.get("metadata", {})
        courses_for_widget.append({
            "courseName": meta.get("course_name", meta.get("source", "Unknown")),
            "description": r["content"][:150],
            "rrf_score": round(r.get("rrf_score", 0), 4),
            "price": meta.get("price", 0),
            "courseId": meta.get("course_id", None),
            "slug": meta.get("slug", None),
        })

    return {
        "answer": answer,
        "sources": sources,
        "ui_widget": {
            "type": "COURSE_CAROUSEL",
            "data": {"courses": courses_for_widget},
        },
    }


async def _handle_faq_query(query: str, chat_history: list[dict] | None) -> dict:
    """Handle FAQ_QUERY intent using RAG knowledge base."""
    result = await query_master(
        query=query,
        chat_history=chat_history,
        use_general_knowledge=False,
    )
    return {
        "answer": result["answer"],
        "sources": result.get("sources", []),
        "ui_widget": None,
    }


async def _handle_buy_course(query: str, keywords: list[str], chat_history: list[dict] | None = None) -> dict:
    """Handle BUY_COURSE intent — verifies course authenticity against database before showing checkout widget."""
    course_name = _resolve_course_reference(query, keywords, chat_history)

    # [SỬA 20/08/2026] BỎ nhánh "tin tưởng dấu hai chấm".
    #
    # Bản cũ có:
    #     is_explicit_selection = ":" in query and not query.startswith("http")
    # và bước 3 dùng `if is_explicit_selection or exact_matched_course`. Nghĩa là
    # chỉ cần câu hỏi chứa một dấu hai chấm là toàn bộ cơ chế chống ảo giác ở
    # bước 2 bị bỏ qua: `verified_name` lấy nguyên văn phần sau dấu ':' mà KHÔNG
    # đối chiếu với dữ liệu thật, rồi mở thẻ thanh toán cho cái tên đó.
    #
    # Người dùng gõ "tôi muốn mua khóa: abc" sẽ thấy thẻ thanh toán cho một khóa
    # không tồn tại. Bấm nút đặt hàng, giao diện không tìm thấy tên khớp và
    # (trước khi vá widgets/index.tsx) rơi vào khóa đầu tiên trong danh mục —
    # tạo đơn rồi chuyển thẳng sang cổng thanh toán cho một khóa học khác hẳn.
    #
    # Ý định ban đầu của nhánh này là nhận diện cú bấm nút từ thẻ carousel, vì
    # nút đó gửi chuỗi dạng "Tôi muốn mua khóa học số 1: <Tên thật>". Nhưng tên
    # trong chuỗi ấy vốn lấy từ chính kết quả tra kho tri thức nên nó LUÔN khớp
    # ở bước 2. Bỏ nhánh tắt không làm hỏng luồng bấm nút, chỉ chặn đúng phần
    # người dùng tự gõ dấu hai chấm.

    # 2. Truy vấn Database RAG để rà soát khóa học có thực trong hệ thống
    search_query = course_name if course_name != "Unknown Course" else query
    search_results = await hybrid_course_search(
        query=search_query,
        top_k=5,
        where={"type": "course_overview"},
    )

    exact_matched_course = None
    real_courses = []
    generic_topics = {
        "backend", "frontend", "fullstack", "lập trình", "web", "mobile",
        "python", "java", "react", "node", "javascript", "c++", "c#", "devops",
        "data science", "ai", "cloud", "database", "sql", "ui", "ux", "khóa backend", "1 khóa backend"
    }

    for r in search_results:
        meta = r.get("metadata", {})
        title = meta.get("course_name", meta.get("source", "")).strip()
        if title:
            real_courses.append({
                "courseName": title,
                "description": r["content"][:150],
                "rrf_score": round(r.get("rrf_score", 0), 4),
                "price": meta.get("price", 0),
                "courseId": meta.get("course_id", None),
                "slug": meta.get("slug", None),
            })

            # Làm sạch các từ chung chung để kiểm tra khớp tên thật
            clean_cn = re.sub(
                r'\b(khóa|học|số|thứ|một|hai|ba|bản|về|chi|tiết|1|2|3|4|5|muốn|mua|đăng|ký|tôi)\b',
                '',
                course_name,
                flags=re.IGNORECASE,
            ).strip()

            if title.lower() == course_name.lower():
                exact_matched_course = title
            elif (
                len(clean_cn) >= 4
                and clean_cn.lower() in title.lower()
                and clean_cn.lower() not in generic_topics
            ):
                exact_matched_course = title

    # 3. CHỈ mở thẻ thanh toán khi tên khóa học đã được đối chiếu với dữ liệu
    #    thật trong hệ thống. Không khớp thì đi xuống nhánh 4 và hiển thị danh
    #    sách khóa học có thật để người dùng tự chọn.
    if exact_matched_course:
        verified_name = exact_matched_course
        answer = (
            f"Tuyệt vời! Bạn muốn đăng ký khóa học **{verified_name}**! 🎉\n\n"
            f"Bạn có thể lựa chọn một trong 5 phương thức thanh toán an toàn bên dưới và nhấn nút **'🔒 Place Order & Pay'** ngay trong khung chat để tự động tạo đơn và thanh toán siêu nhanh:\n\n"
            f"🇻🇳 **VNPAY Gateway** | 📱 **Ví MoMo** | 💳 **Stripe (Thẻ Quốc Tế)** | 💙 **PayPal** | 🪙 **Crypto**\n\n"
            f"Nếu bạn cần thêm thông tin hỗ trợ nào về khóa học trước khi thanh toán, cứ thoải mái hỏi tôi nhé!"
        )

        return {
            "answer": answer,
            "sources": [],
            "ui_widget": {
                "type": "PAYMENT_SELECTOR",
                "data": {
                    "courseName": verified_name,
                    "action": "inline_mini_checkout",
                },
            },
        }
    else:
        # 4. Chống ảo giác (Anti-hallucination): Nếu người dùng nói chung chung như "tôi muốn mua 1 khóa backend", không được tự chế tên khóa! Hãy hiển thị danh sách khóa học thực tế!
        topic_display = course_name if course_name != "Unknown Course" else query
        if not real_courses:
            return {
                "answer": f"Xin lỗi, hiện tại 3TEduTech chưa tìm thấy khóa học cụ thể nào khớp với từ khóa **{topic_display}**. Bạn có thể mô tả chi tiết hơn mục tiêu học tập để tôi hỗ trợ nhé!",
                "sources": [],
                "ui_widget": None,
            }

        answer = (
            f"Chào bạn! Hệ thống nhận thấy bạn đang quan tâm đăng ký/mua khóa học thuộc chủ đề **{topic_display}**.\n\n"
            f"Để đảm bảo bạn tham gia đúng lộ trình phù hợp và chất lượng nhất, 3TEduTech xin trân trọng đề xuất các khóa học hàng đầu của chúng tôi thuộc lĩnh vực này dưới đây:\n\n"
            f"👉 Bạn chỉ cần chọn khóa học ưng ý và nhấn nút **'💳 Mua khóa #1'** (hoặc nút Mua bên dưới khóa học đó) để hệ thống lập tức mở cổng thanh toán tự động đúng cho khóa học bạn chọn nhé!"
        )
        return {
            "answer": answer,
            "sources": [],
            "ui_widget": {
                "type": "COURSE_CAROUSEL",
                "data": {"courses": real_courses},
            },
        }


async def _handle_confirm_payment(query: str, keywords: list[str], chat_history: list[dict] | None = None) -> dict:
    """Handle CONFIRM_PAYMENT intent — returns checkout redirect or inline execution."""
    payment_method = "VNPAY"  # default
    course_name_raw = []

    for kw in keywords:
        kw_upper = kw.upper()
        if kw_upper in ["VNPAY", "MOMO", "STRIPE", "PAYPAL", "CRYPTO"]:
            payment_method = kw_upper
        elif kw_upper == "VIETQR":
            payment_method = "VNPAY" # Fallback away from VietQR
        else:
            course_name_raw.append(kw)
            
    course_name = _resolve_course_reference(query, course_name_raw, chat_history)

    answer = (
        f"Bạn đã chọn thanh toán bằng **{payment_method}** cho khóa học **{course_name}**.\n\n"
        f"Hệ thống đang sẵn sàng chuyển hướng bạn tới cổng thanh toán bảo mật..."
    )

    return {
        "answer": answer,
        "sources": [],
        "ui_widget": {
            "type": "CHECKOUT_REDIRECT",
            "data": {
                "courseName": course_name,
                "paymentMethod": payment_method,
                "redirectUrl": "/checkout",
            },
        },
    }


async def _handle_general_chat(query: str, chat_history: list[dict] | None) -> dict:
    """Handle GENERAL_CHAT intent — friendly conversation."""
    answer = await generate_chat_response(
        query=query,
        system_prompt=MASTER_SYSTEM_PROMPT,
        chat_history=chat_history,
    )
    return {
        "answer": answer,
        "sources": [],
        "ui_widget": None,
    }


@router.post("/agent-action", response_model=AgentResponse)
async def agent_action(request: AgentRequest):
    """
    Unified AI Agent endpoint.
    """
    try:
        # [SỬA 20/08/2026] Chuyển tiếp cả `ui_widget` của từng lượt.
        #
        # `_resolve_course_reference` có sẵn một nhánh đọc `ui_widget` của lượt trước để
        # ánh xạ "khóa số 1 / số 2 / số 3" về đúng thẻ trong danh sách đã hiển thị.
        # Nhưng nhánh đó CHƯA BAO GIỜ CHẠY: schema ChatHistoryPair chỉ có question và
        # answer, và chính dòng dựng history còn tạo lại dict mới với đúng hai khóa đó.
        # Việc ánh xạ vì thế rơi xuống nhánh dự phòng — bốc chuỗi in đậm thứ N trong câu
        # trả lời trước — mà thứ tự chữ in đậm do mô hình tự viết, không liên quan gì
        # tới thứ tự thẻ (thẻ xếp theo điểm RRF).
        #
        # Hệ quả: gợi ý có sẵn ngay trên màn hình ("Tôi muốn mua khóa học số 1 trong
        # danh sách của bạn") thường mở thẻ thanh toán cho một khóa KHÁC với khóa số 1
        # người dùng nhìn thấy.
        history = [
            {"question": h.question, "answer": h.answer, "ui_widget": h.ui_widget}
            for h in request.chat_history
        ]

        # Step 1: Classify intent
        classification = await classify_intent(request.query)
        intent = classification["intent"]
        keywords = classification["extracted_keywords"]

        logger.info(f"Agent: Intent={intent.value}, Keywords={keywords}, Query='{request.query[:80]}'")

        # Step 2: Route to handler
        if intent == UserIntent.SEARCH_COURSE:
            result = await _handle_search_course(request.query, keywords, history)
        elif intent == UserIntent.FAQ_QUERY:
            result = await _handle_faq_query(request.query, history)
        elif intent == UserIntent.BUY_COURSE:
            result = await _handle_buy_course(request.query, keywords, history)
        elif intent == UserIntent.CONFIRM_PAYMENT:
            result = await _handle_confirm_payment(request.query, keywords, history)
        elif intent == UserIntent.COURSE_LEARN:
            result = await _handle_faq_query(request.query, history)
        else:
            result = await _handle_general_chat(request.query, history)

        # Step 3: Generate suggestions
        suggestions = await generate_suggested_questions(
            previous_response=result["answer"],
            original_query=request.query,
        )

        return AgentResponse(
            answer=result["answer"],
            intent=intent.value,
            sources=[SourceInfo(**s) for s in result.get("sources", [])],
            suggested_questions=suggestions,
            ui_widget=UIWidget(**result["ui_widget"]) if result.get("ui_widget") else None,
        )

    except Exception as e:
        logger.error(f"Agent action error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Agent action failed: {str(e)}")


@router.post("/agent-action-stream")
async def agent_action_stream(request: AgentRequest):
    """
    Unified AI Agent endpoint with Server-Sent Events (SSE) real-time token streaming.
    """
    # [SỬA 20/08/2026] Chuyển tiếp cả `ui_widget` của từng lượt.
    #
    # `_resolve_course_reference` có sẵn một nhánh đọc `ui_widget` của lượt trước để
    # ánh xạ "khóa số 1 / số 2 / số 3" về đúng thẻ trong danh sách đã hiển thị.
    # Nhưng nhánh đó CHƯA BAO GIỜ CHẠY: schema ChatHistoryPair chỉ có question và
    # answer, và chính dòng dựng history còn tạo lại dict mới với đúng hai khóa đó.
    # Việc ánh xạ vì thế rơi xuống nhánh dự phòng — bốc chuỗi in đậm thứ N trong câu
    # trả lời trước — mà thứ tự chữ in đậm do mô hình tự viết, không liên quan gì
    # tới thứ tự thẻ (thẻ xếp theo điểm RRF).
    #
    # Hệ quả: gợi ý có sẵn ngay trên màn hình ("Tôi muốn mua khóa học số 1 trong
    # danh sách của bạn") thường mở thẻ thanh toán cho một khóa KHÁC với khóa số 1
    # người dùng nhìn thấy.
    history = [
        {"question": h.question, "answer": h.answer, "ui_widget": h.ui_widget}
        for h in request.chat_history
    ]

    classification = await classify_intent(request.query)
    intent = classification["intent"]
    keywords = classification["extracted_keywords"]
    logger.info(f"Stream Agent: Intent={intent.value}, Keywords={keywords}, Query='{request.query[:80]}'")

    async def event_generator():
        # [THÊM 20/08/2026] Tích lũy phần chữ đã nhả ra, để sinh câu hỏi gợi ý
        # từ chính câu trả lời vừa nói. Bản cũ truyền một chuỗi cố định làm
        # `previous_response` nên gợi ý luôn được sinh từ một câu mô tả chung
        # chung và thường lạc đề. Đường không streaming vốn đã làm đúng.
        streamed_parts: list[str] = []

        def _token_event(text: str) -> str:
            streamed_parts.append(text)
            return f"event: token\ndata: {json.dumps({'text': text}, ensure_ascii=False)}\n\n"

        try:
            if intent == UserIntent.BUY_COURSE:
                result = await _handle_buy_course(request.query, keywords, history)
                yield f"event: metadata\ndata: {json.dumps({'intent': intent.value, 'ui_widget': result['ui_widget'], 'sources': result['sources']}, ensure_ascii=False)}\n\n"
                yield _token_event(result['answer'])
            elif intent == UserIntent.CONFIRM_PAYMENT:
                result = await _handle_confirm_payment(request.query, keywords, history)
                yield f"event: metadata\ndata: {json.dumps({'intent': intent.value, 'ui_widget': result['ui_widget'], 'sources': result['sources']}, ensure_ascii=False)}\n\n"
                yield _token_event(result['answer'])
            elif intent == UserIntent.SEARCH_COURSE:
                search_results = await hybrid_course_search(request.query, top_k=5, where={"type": "course_overview"})
                courses_for_widget = []
                sources = []
                context = ""
                for r in search_results:
                    meta = r.get("metadata", {})
                    courses_for_widget.append({
                        "courseName": meta.get("course_name", meta.get("source", "Unknown")),
                        "description": r["content"][:150],
                        "rrf_score": round(r.get("rrf_score", 0), 4),
                        "price": meta.get("price", 0),
                        "courseId": meta.get("course_id", None),
                        "slug": meta.get("slug", None),
                    })
                    sources.append({
                        "file_name": meta.get("course_name", meta.get("source", "Unknown Course")),
                        "content": r["content"][:200]
                    })
                    context += f"\n---\n{r['content']}\n"
                ui_widget = {"type": "COURSE_CAROUSEL", "data": {"courses": courses_for_widget}} if search_results else None
                yield f"event: metadata\ndata: {json.dumps({'intent': intent.value, 'ui_widget': ui_widget, 'sources': sources}, ensure_ascii=False)}\n\n"
                if not search_results:
                    yield _token_event('Xin lỗi, tôi không tìm thấy khóa học nào phù hợp với yêu cầu của bạn. Hãy thử mô tả mục tiêu học tập của bạn theo cách khác nhé!')
                else:
                    prompt = COURSE_SEARCH_PROMPT.format(query=request.query, context=context)
                    async for token in generate_chat_response_stream(query=prompt, chat_history=history):
                        yield _token_event(token)
            elif intent in [UserIntent.FAQ_QUERY, UserIntent.COURSE_LEARN]:
                context, sources = await get_master_context(request.query)
                yield f"event: metadata\ndata: {json.dumps({'intent': intent.value, 'ui_widget': None, 'sources': sources}, ensure_ascii=False)}\n\n"
                if not context:
                    ans = "Xin lỗi bạn, tôi không tìm thấy thông tin phù hợp trong cơ sở tri thức của hệ thống **3TEduTech** để giải đáp cho câu hỏi này.\n\nNhằm đảm bảo tính chính xác tuyệt đối và uy tín của nền tảng, tôi chỉ phản hồi dựa trên dữ liệu chính thức đã được xác thực từ 3TEduTech. Bạn vui lòng liên hệ bộ phận Tư vấn & CSKH để được hỗ trợ chi tiết nhất nhé!"
                    yield _token_event(ans)
                else:
                    async for token in generate_chat_response_stream(query=request.query, context=context, system_prompt=MASTER_SYSTEM_PROMPT, chat_history=history):
                        yield _token_event(token)
            else:
                yield f"event: metadata\ndata: {json.dumps({'intent': intent.value, 'ui_widget': None, 'sources': []}, ensure_ascii=False)}\n\n"
                async for token in generate_chat_response_stream(query=request.query, chat_history=history):
                    yield _token_event(token)

            # Step 2: Yield done event with suggestions
            suggestions = await generate_suggested_questions(
                previous_response="".join(streamed_parts).strip()
                or "Hỏi đáp thông tin về khóa học tại 3TEduTech",
                original_query=request.query,
            )
            yield f"event: done\ndata: {json.dumps({'suggested_questions': suggestions}, ensure_ascii=False)}\n\n"
        except Exception as e:
            logger.error(f"Stream error: {e}", exc_info=True)
            yield _token_event('\n\n[Xin lỗi, đã xảy ra gián đoạn trong kết nối AI Streaming]')
            yield f"event: done\ndata: {json.dumps({'suggested_questions': []}, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
