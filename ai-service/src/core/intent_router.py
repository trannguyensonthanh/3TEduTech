# src/core/intent_router.py
"""Intent Router — Classifies user messages and routes to appropriate AI tools."""

import json
import logging
from enum import Enum
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
    generate_routing as generate_routing_response,
)

logger = logging.getLogger(__name__)


class UserIntent(str, Enum):
    """Possible user intents detected by the Router."""
    SEARCH_COURSE = "SEARCH_COURSE"  # User wants to find/explore courses
    FAQ_QUERY = "FAQ_QUERY"  # User asks about platform, policies, general knowledge
    BUY_COURSE = "BUY_COURSE"  # User wants to purchase a specific course
    COURSE_LEARN = "COURSE_LEARN"  # User asks about specific course content
    GENERAL_CHAT = "GENERAL_CHAT"  # Casual conversation, greetings, etc.
    CONFIRM_PAYMENT = "CONFIRM_PAYMENT"  # User selects a specific payment method


INTENT_ROUTER_PROMPT = """You are an intent classification system for the 3TEduTech online learning platform.
Your job is to classify the user's message into exactly ONE of these intents:

- SEARCH_COURSE: User wants to find, explore, get recommendations for courses, OR expresses intent to buy/learn within a general topic/domain without naming a specific course (e.g., "tôi muốn mua 1 khóa backend", "mua khóa python"). Keywords: "tìm khóa học", "đề xuất", "recommend", "lộ trình", "muốn học", "khóa nào", "course about", "learn", "mua 1 khóa backend", "mua khóa frontend"
- FAQ_QUERY: User asks about platform policies, features, how things work, FAQs. Keywords: "cách sử dụng", "chính sách", "policy", "how to", "hướng dẫn", "bao lâu", "chi phí chung"
- BUY_COURSE: User explicitly wants to purchase, pay, or enroll in a specific named course or by ordinal reference (like "khóa số 1", "khóa 2", "khóa Learn Node.js"). Keywords: "mua khóa học số 1", "khóa số 1", "khóa thứ 1", "Tôi muốn mua khóa học số 1:"
- COURSE_LEARN: User asks about specific course content, lessons, concepts they're studying. Keywords: "bài học", "giải thích", "concept", "lesson", "chương"
- GENERAL_CHAT: Casual conversation, greetings, thanks, or anything that doesn't fit above. Keywords: "xin chào", "cảm ơn", "hello", "hi", small talk
- CONFIRM_PAYMENT: User selects a specific payment method to proceed with checkout. Keywords: "tôi chọn thanh toán", "vnpay", "momo", "stripe", "paypal", "crypto", "chọn momo", "chọn paypal"

IMPORTANT RULES:
1. Return ONLY a valid JSON object, nothing else.
2. The JSON must have exactly these fields: "intent" and "extracted_keywords"
3. "extracted_keywords" should contain relevant course names, ordinal numbers ("số 1", "khóa 1"), topics, or payment methods from the message.
4. If user mentions wanting to buy AND specifies an exact course title or an ordinal ("khóa học số 1", "số 2"), intent is BUY_COURSE.
5. If user mentions wanting to buy, find, or study a GENERAL topic or category (e.g. "tôi muốn mua 1 khóa backend", "mua khóa python", "học web"), intent MUST BE SEARCH_COURSE so the system can present suitable course recommendations first!
6. If user mentions a specific payment method (VNPAY, MOMO, STRIPE, PAYPAL, CRYPTO) they want to use for checkout, intent is CONFIRM_PAYMENT.

Examples:
User: "Tôi muốn học lập trình web" → {"intent": "SEARCH_COURSE", "extracted_keywords": ["lập trình web", "web development"]}
User: "tôi muốn mua 1 khóa backend" → {"intent": "SEARCH_COURSE", "extracted_keywords": ["backend"]}
User: "cho tôi mua khóa frontend" → {"intent": "SEARCH_COURSE", "extracted_keywords": ["frontend"]}
User: "Tôi muốn mua khóa học số 1" → {"intent": "BUY_COURSE", "extracted_keywords": ["khóa học số 1"]}
User: "Tôi muốn mua khóa học số 1: Learn Node.js the Hard Way" → {"intent": "BUY_COURSE", "extracted_keywords": ["Learn Node.js the Hard Way"]}
User: "Tôi chọn thanh toán bằng MOMO cho khóa học: Learn Node.js" → {"intent": "CONFIRM_PAYMENT", "extracted_keywords": ["MOMO", "Learn Node.js"]}
User: "Chính sách hoàn tiền như thế nào?" → {"intent": "FAQ_QUERY", "extracted_keywords": ["hoàn tiền", "refund policy"]}
User: "Giải thích cho tôi về hooks trong React" → {"intent": "COURSE_LEARN", "extracted_keywords": ["hooks", "React"]}
User: "Xin chào" → {"intent": "GENERAL_CHAT", "extracted_keywords": []}
"""


async def classify_intent(user_message: str) -> dict:
    """
    Classify the user's message intent using the fast Router model.

    Args:
        user_message: The user's chat message.

    Returns:
        Dict with 'intent' (UserIntent enum value) and 'extracted_keywords' (list of strings).
    """
    try:
        prompt = f"User message: \"{user_message}\"\n\nClassify this message:"
        raw = await generate_routing_response(
            query=prompt,
            system_prompt=INTENT_ROUTER_PROMPT,
        )

        # Parse JSON from model output
        raw = raw.strip()
        # Handle markdown code blocks
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

        result = json.loads(raw)
        intent_str = result.get("intent", "GENERAL_CHAT").upper()

        # Validate intent
        try:
            intent = UserIntent(intent_str)
        except ValueError:
            logger.warning(f"Unknown intent '{intent_str}', defaulting to GENERAL_CHAT")
            intent = UserIntent.GENERAL_CHAT

        return {
            "intent": intent,
            "extracted_keywords": result.get("extracted_keywords", []),
        }

    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse router JSON: {e}. Raw output: {raw}")
        return {
            "intent": UserIntent.GENERAL_CHAT,
            "extracted_keywords": [],
        }
    except Exception as e:
        logger.error(f"Intent classification error: {e}")
        return {
            "intent": UserIntent.GENERAL_CHAT,
            "extracted_keywords": [],
        }
