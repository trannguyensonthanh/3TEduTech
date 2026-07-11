# src/models/schemas.py
"""Pydantic request/response models for the API."""

from pydantic import BaseModel, Field


# --- Chat History ---
class ChatHistoryPair(BaseModel):
    question: str
    answer: str


# --- Chat Request/Response ---
class QueryRequest(BaseModel):
    """Request body for master AI chat."""
    query: str = Field(..., min_length=1, description="The user's question")
    chat_history: list[ChatHistoryPair] = Field(default=[], description="Previous Q&A pairs")
    top_k: int = Field(default=10, ge=1, le=50, description="Number of documents to retrieve")


class CourseQueryRequest(BaseModel):
    """Request body for course-specific AI chat."""
    query: str = Field(..., min_length=1, description="The user's question")
    course_name: str = Field(..., min_length=1, description="Name of the course")
    chat_history: list[ChatHistoryPair] = Field(default=[], description="Previous Q&A pairs")
    top_k: int = Field(default=10, ge=1, le=50)


class SourceInfo(BaseModel):
    file_name: str
    content: str


class QueryResponse(BaseModel):
    """Response from AI chat."""
    answer: str
    sources: list[SourceInfo] = []
    suggested_questions: list[str] = []


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


class IngestCourseRequest(BaseModel):
    """Request body for ingesting course content."""
    course_name: str = Field(..., description="Course name")
    course_description: str = Field(default="", description="Course description/overview")
    lessons: list[dict] = Field(default=[], description="List of lessons with 'name' and 'content'")


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


# --- Collection Stats ---
class CollectionStatsResponse(BaseModel):
    collections: list[dict]
