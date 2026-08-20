# src/models/schemas.py
"""Pydantic request/response models for the API."""

from pydantic import BaseModel, Field


# --- Chat History ---
class ChatHistoryPair(BaseModel):
    question: str
    answer: str
    # [THÊM 20/08/2026] Thẻ giao diện mà lượt trả lời đó đã hiển thị.
    #
    # `_resolve_course_reference` trong agent.py cần trường này để ánh xạ "khóa
    # số 1 / số 2 / số 3" về đúng thẻ trong danh sách đã hiện ra. Thiếu nó, nhánh
    # ánh xạ chính xác là mã chết và hệ thống phải đoán bằng cách bốc chuỗi in
    # đậm thứ N trong câu trả lời trước — một phép đoán sai thường xuyên, và cái
    # sai đó dẫn thẳng tới thẻ thanh toán cho khóa học khác.
    #
    # Backend Node.js đã lưu sẵn cột UiWidgetJson cho từng tin nhắn nên chỉ cần
    # đọc lên và gửi kèm, không phát sinh truy vấn mới.
    ui_widget: dict | None = None


# --- Chat Request/Response ---
class QueryRequest(BaseModel):
    """Request body for master AI chat."""
    query: str = Field(..., min_length=1, description="The user's question")
    chat_history: list[ChatHistoryPair] = Field(default=[], description="Previous Q&A pairs")
    top_k: int = Field(default=10, ge=1, le=50, description="Number of documents to retrieve")
    use_general_knowledge: bool = Field(default=False, description="Bypass RAG if no context found")


class CourseQueryRequest(BaseModel):
    """Request body for course-specific AI chat."""
    query: str = Field(..., min_length=1, description="The user's question")
    course_name: str = Field(..., min_length=1, description="Name of the course")
    chat_history: list[ChatHistoryPair] = Field(default=[], description="Previous Q&A pairs")
    top_k: int = Field(default=10, ge=1, le=50)
    use_general_knowledge: bool = Field(default=False, description="Bypass RAG if no context found")


class SourceInfo(BaseModel):
    file_name: str
    content: str


class QueryResponse(BaseModel):
    """Response from AI chat."""
    answer: str
    sources: list[SourceInfo] = []
    suggested_questions: list[str] = []
    is_fallback_prompt: bool = Field(default=False, description="True if no context was found and user needs to confirm fallback")


# --- Suggestion Request/Response ---
class SuggestionRequest(BaseModel):
    """Request body for generating follow-up questions."""
    previous_response: str = Field(..., description="The AI's last response")
    query: str = Field(default="", description="The user's original question")
    context: str = Field(default="", description="Additional context")


class SuggestionResponse(BaseModel):
    suggested_questions: list[str] = []


# --- Document Ingestion ---
class IngestTextRequest(BaseModel):
    """Request body for ingesting text content."""
    text: str = Field(..., min_length=1, description="Text content to ingest")
    source_name: str = Field(..., description="Name/identifier for this content")
    collection: str = Field(default="master_knowledge", description="Target collection")
    metadata: dict = Field(default={}, description="Additional metadata")


class TranscriptionRequest(BaseModel):
    """Request body for background transcription task."""
    video_url: str = Field(..., description="URL of the video to transcribe")
    course_name: str = Field(..., description="Name of the course")
    lesson_name: str = Field(default="Unknown Lesson", description="Name of the lesson")
    lesson_id: int | None = Field(default=None, description="Optional ID of the lesson for subtitle auto-sync")
    webhook_url: str | None = Field(default=None, description="Optional callback URL to deliver generated SRT subtitle")


class IngestCourseRequest(BaseModel):
    """Request body for ingesting course content."""
    course_name: str = Field(..., description="Course name")
    course_description: str = Field(default="", description="Course description/overview")
    lessons: list[dict] = Field(default=[], description="List of lessons with 'name' and 'content'")
    # [THÊM 20/08/2026] Bốn trường định danh dưới đây backend VỐN ĐÃ GỬI LÊN
    # (xem aiSync.service.js) nhưng Pydantic lược bỏ im lặng vì schema không
    # khai báo. Hệ quả dây chuyền:
    #   - metadata trong ChromaDB chỉ có `type` và `course_name`;
    #   - agent.py đọc `meta.get("price", 0)` nên thẻ khóa học trong khung chat
    #     KHÔNG BAO GIỜ hiện giá (luôn rơi về nhãn "Học liệu đề xuất");
    #   - `courseId`/`slug` luôn null nên nút "Xem chi tiết" luôn rơi về trang
    #     tìm kiếm thay vì mở thẳng khóa học, và việc bỏ trùng phải so khớp
    #     bằng tên;
    #   - tính năng lọc theo phiên bản khóa học mà chú thích aiSync hứa hẹn
    #     thực tế chưa hề tồn tại.
    course_id: int | None = Field(default=None, description="CourseID trong SQL Server")
    slug: str | None = Field(default=None, description="Slug dùng để mở trang khóa học")
    price: float | None = Field(default=None, description="Giá hiển thị (tiền cơ sở)")
    version_number: int | None = Field(default=None, description="Số hiệu phiên bản khóa học")


class IngestResponse(BaseModel):
    """Response from ingestion."""
    message: str
    chunks_added: int
    collection: str


# --- Search ---
class SearchRequest(BaseModel):
    """Request body for AI-powered search."""
    query: str = Field(..., min_length=1)
    top_k: int = Field(default=5, ge=1, le=20)


class SearchResponse(BaseModel):
    answer: str
    sources: list[SourceInfo] = []
    # [THÊM 20/08/2026] Ba trường dưới đây phục vụ trợ lý tìm khóa học ở trang
    # /courses:
    #   matched_courses — tên khóa học lấy từ kho vector, giữ đúng thứ hạng.
    #     Backend đối chiếu tên này với bảng Courses rồi dựng thẻ khóa học thật.
    #     Kho vector KHÔNG giữ giá / ảnh bìa / trạng thái xuất bản vì những thứ
    #     đó đổi liên tục; nguồn sự thật vẫn là SQL Server.
    #   out_of_scope — câu hỏi bị hàng rào ý định chặn. Giao diện hiện thông báo
    #     nhắc nhở thay vì vẽ một ô kết quả rỗng trông như hệ thống hỏng.
    #   intent — ghi lại để thống kê, không bắt buộc.
    matched_courses: list[str] = []
    out_of_scope: bool = False
    intent: str | None = None


# --- AI Agent (Conversational Commerce & Hybrid Search) ---
class AgentRequest(BaseModel):
    """Request body for the unified AI Agent endpoint."""
    query: str = Field(..., min_length=1, description="The user's message")
    chat_history: list[ChatHistoryPair] = Field(default=[], description="Previous Q&A pairs")
    top_k: int = Field(default=10, ge=1, le=50)
    course_context: str | None = Field(default=None, description="Optional course name for context")


class UIWidget(BaseModel):
    """UI widget data to render in the chatbot frontend."""
    type: str = Field(..., description="Widget type: COURSE_CAROUSEL, PAYMENT_SELECTOR, QR_CHECKOUT_VIEW, ENROLLMENT_SUCCESS, CHECKOUT_REDIRECT")
    data: dict = Field(default={}, description="Widget-specific data payload")


class AgentResponse(BaseModel):
    """Response from the AI Agent with optional UI widget."""
    answer: str
    intent: str = Field(default="GENERAL_CHAT", description="Detected user intent")
    sources: list[SourceInfo] = []
    suggested_questions: list[str] = []
    ui_widget: UIWidget | None = Field(default=None, description="Optional rich UI widget for the frontend")


# --- Collection Stats ---
class CollectionStatsResponse(BaseModel):
    collections: list[dict]
