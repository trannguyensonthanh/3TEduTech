# src/api/routes/ingest.py
"""Document ingestion routes — upload content to the vector store."""

import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from src.models.schemas import (
    IngestTextRequest,
    IngestCourseRequest,
    IngestResponse,
)
from src.rag.loader import ingest_text, ingest_course_content
from src.vectorstore.chroma import (
    get_collection_stats,
    delete_collection,
    get_or_create_collection,
)
from src.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ingest", tags=["Ingestion"])


@router.post("/text", response_model=IngestResponse)
async def ingest_text_content(request: IngestTextRequest):
    """
    Ingest raw text content into the vector store.
    Used for uploading platform knowledge, FAQs, documentation, etc.
    """
    try:
        chunks = await ingest_text(
            text=request.text,
            source_name=request.source_name,
            collection_name=request.collection,
            metadata=request.metadata,
        )
        return IngestResponse(
            message=f"Successfully ingested '{request.source_name}'",
            chunks_added=chunks,
            collection=request.collection,
        )
    except Exception as e:
        logger.error(f"Text ingestion error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/course", response_model=IngestResponse)
async def ingest_course(request: IngestCourseRequest):
    """
    Ingest course content (overview + lessons) for course-specific AI.
    Called when a course is published or updated.
    """
    settings = get_settings()
    try:
        chunks = await ingest_course_content(
            course_name=request.course_name,
            course_description=request.course_description,
            lessons=request.lessons,
        )
        return IngestResponse(
            message=f"Successfully ingested course '{request.course_name}'",
            chunks_added=chunks,
            collection=settings.chroma_collection_courses,
        )
    except Exception as e:
        logger.error(f"Course ingestion error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/file", response_model=IngestResponse)
async def ingest_file_upload(
    file: UploadFile = File(...),
    collection: str = Form(default="master_knowledge"),
    source_name: str = Form(default=""),
):
    """
    Upload and ingest a text file (.txt, .md) into the vector store.
    """
    allowed_types = {".txt", ".md", ".csv"}
    file_ext = ""
    if file.filename:
        file_ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""

    if file_ext not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Allowed: {allowed_types}",
        )

    try:
        content = await file.read()
        text = content.decode("utf-8")
        name = source_name or file.filename or "uploaded_file"

        chunks = await ingest_text(
            text=text,
            source_name=name,
            collection_name=collection,
            metadata={"file_name": file.filename, "file_type": file_ext},
        )

        return IngestResponse(
            message=f"Successfully ingested file '{name}'",
            chunks_added=chunks,
            collection=collection,
        )
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File is not valid UTF-8 text")
    except Exception as e:
        logger.error(f"File ingestion error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def collection_stats():
    """Get statistics for all vector store collections."""
    settings = get_settings()
    collections = [
        get_collection_stats(settings.chroma_collection_master),
        get_collection_stats(settings.chroma_collection_courses),
    ]
    return {"collections": collections}


@router.delete("/collection/{collection_name}")
async def delete_collection_endpoint(collection_name: str):
    """Delete an entire collection. Use with caution!"""
    try:
        delete_collection(collection_name)
        return {"message": f"Collection '{collection_name}' deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
