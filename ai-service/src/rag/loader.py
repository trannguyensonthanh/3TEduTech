# src/rag/loader.py
"""Document loading, chunking, and ingestion into vector store."""

import logging
import os
import hashlib
from pathlib import Path

from src.config import get_settings
from src.vectorstore.chroma import add_documents, get_or_create_collection

logger = logging.getLogger(__name__)


def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list[str]:
    """
    Split text into overlapping chunks for better retrieval.

    Args:
        text: Full text to chunk.
        chunk_size: Maximum characters per chunk.
        chunk_overlap: Overlapping characters between chunks.

    Returns:
        List of text chunks.
    """
    if not text or not text.strip():
        return []

    chunks = []
    # Split by paragraphs first, then merge into chunks
    paragraphs = text.split("\n\n")
    current_chunk = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        if len(current_chunk) + len(para) + 2 <= chunk_size:
            current_chunk = f"{current_chunk}\n\n{para}" if current_chunk else para
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
                # Keep overlap from the end of previous chunk
                overlap_text = current_chunk[-chunk_overlap:] if len(current_chunk) > chunk_overlap else current_chunk
                current_chunk = f"{overlap_text}\n\n{para}"
            else:
                # Single paragraph is bigger than chunk_size — split by sentences
                sentences = para.replace(". ", ".\n").split("\n")
                for sentence in sentences:
                    if len(current_chunk) + len(sentence) + 1 <= chunk_size:
                        current_chunk = f"{current_chunk} {sentence}" if current_chunk else sentence
                    else:
                        if current_chunk:
                            chunks.append(current_chunk.strip())
                        current_chunk = sentence

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks


def generate_chunk_id(text: str, source: str, index: int) -> str:
    """Generate a deterministic ID based on exact full-text hash to enable smart deduplication."""
    content = f"{source}:{index}:{text.strip()}"
    return hashlib.md5(content.encode('utf-8')).hexdigest()


async def ingest_text(
    text: str,
    source_name: str,
    collection_name: str,
    metadata: dict | None = None,
) -> int:
    """
    Ingest a text document into the vector store.

    Args:
        text: Full text content.
        source_name: Name/identifier of the source document.
        collection_name: Target ChromaDB collection.
        metadata: Additional metadata to attach to each chunk.

    Returns:
        Number of chunks ingested.
    """
    settings = get_settings()
    chunks = chunk_text(text, settings.rag_chunk_size, settings.rag_chunk_overlap)

    if not chunks:
        logger.warning(f"No chunks generated from source: {source_name}")
        return 0

    # Prepare metadata for each chunk
    metadatas = []
    ids = []
    for i, chunk in enumerate(chunks):
        chunk_metadata = {
            "source": source_name,
            "chunk_index": i,
            "total_chunks": len(chunks),
            **(metadata or {}),
        }
        metadatas.append(chunk_metadata)
        ids.append(generate_chunk_id(chunk, source_name, i))

    count = await add_documents(
        collection_name=collection_name,
        documents=chunks,
        metadatas=metadatas,
        ids=ids,
    )

    logger.info(f"Ingested {count} chunks from '{source_name}' into '{collection_name}'")
    return count


async def ingest_file(
    file_path: str,
    collection_name: str,
    metadata: dict | None = None,
) -> int:
    """
    Ingest a file into the vector store.

    [MỞ RỘNG 18/08/2026 — COURSE IMPORT]
    Trước đây hàm này chỉ chấp nhận .txt/.md/.csv, nên mọi tài liệu bài giảng
    thật (PDF, DOCX, PPTX) đều bị từ chối. Nay tài liệu phức hợp được chuyển
    sang `rag/document_parser.py` — CÙNG bộ đọc mà endpoint
    `POST /api/extract/document` dùng, nên hai đường đi cho ra kết quả giống
    hệt nhau thay vì mỗi nơi một kiểu.

    Args:
        file_path: Path to the file.
        collection_name: Target ChromaDB collection.
        metadata: Additional metadata.

    Returns:
        Number of chunks ingested.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    suffix = path.suffix.lower()
    plain_extensions = {".txt", ".md", ".markdown", ".csv", ".rst", ".json"}

    if suffix in plain_extensions:
        # `errors="replace"` thay vì để ném lỗi: một tệp .txt lưu bằng bảng mã
        # cũ (rất hay gặp với tài liệu tiếng Việt) sẽ làm hỏng cả lượt nạp nếu
        # đọc ở chế độ nghiêm ngặt. Thà mất vài ký tự còn hơn mất cả tệp.
        text = path.read_text(encoding="utf-8", errors="replace")
    else:
        # Import tại chỗ: giữ cho `loader` nạp được ngay cả khi chưa cài pypdf
        # — các luồng chỉ dùng .txt/.md vẫn chạy bình thường.
        from src.rag.document_parser import SUPPORTED_EXTENSIONS, parse_document

        if suffix.lstrip(".") not in SUPPORTED_EXTENSIONS:
            supported = sorted(plain_extensions) + [
                f".{ext}" for ext in SUPPORTED_EXTENSIONS
            ]
            raise ValueError(
                f"Unsupported file type: {path.suffix}. Supported: {supported}"
            )

        # `max_chars=0` = không cắt. Ở đây khác với luồng nhập khóa học: mục
        # tiêu là nạp TRỌN tài liệu vào kho vector để tra cứu, chứ không phải
        # gói gọn nội dung cho vừa một prompt.
        result = parse_document(path.name, path.read_bytes(), max_chars=0)
        text = result["text"]
        for warning in result.get("warnings", []):
            logger.warning(f"{path.name}: {warning}")

    if not text.strip():
        logger.warning(f"Không bóc được nội dung nào từ {path.name} — bỏ qua.")
        return 0

    file_metadata = {"file_name": path.name, "file_type": path.suffix, **(metadata or {})}

    return await ingest_text(text, path.name, collection_name, file_metadata)


async def ingest_course_content(
    course_name: str,
    course_description: str,
    lessons: list[dict],
    collection_name: str | None = None,
    course_id: int | None = None,
    slug: str | None = None,
    price: float | None = None,
    version_number: int | None = None,
) -> int:
    """
    Ingest course content (description + lessons) for course-specific AI.

    Args:
        course_name: Name of the course.
        course_description: Full course description.
        lessons: List of lesson dicts with 'name' and 'content' keys.
        collection_name: Override collection name (default: course_knowledge).

    Returns:
        Total number of chunks ingested.
    """
    settings = get_settings()
    target_collection = collection_name or settings.chroma_collection_courses

    total_chunks = 0

    # [THÊM 20/08/2026] Siêu dữ liệu định danh, gắn vào MỌI đoạn của khóa học.
    #
    # ChromaDB chỉ nhận giá trị vô hướng trong metadata, nên phải loại bỏ các
    # trường None thay vì gửi lên rồi để thư viện ném lỗi giữa chừng và làm hỏng
    # cả lượt nạp. Bỏ hẳn một trường an toàn hơn: nơi đọc đều dùng `.get()` kèm
    # giá trị mặc định.
    identity = {
        k: v
        for k, v in {
            "course_id": course_id,
            "slug": slug,
            "price": price,
            "version_number": version_number,
        }.items()
        if v is not None
    }

    # Ingest course overview
    if course_description:
        overview = f"Course: {course_name}\n\n{course_description}"
        count = await ingest_text(
            overview,
            f"course_overview_{course_name}",
            target_collection,
            {"type": "course_overview", "course_name": course_name, **identity},
        )
        total_chunks += count

    # Ingest each lesson
    for lesson in lessons:
        lesson_name = lesson.get("name", "Untitled Lesson")
        lesson_content = lesson.get("content", "")
        if not lesson_content:
            continue

        lesson_text = f"Course: {course_name} | Lesson: {lesson_name}\n\n{lesson_content}"
        count = await ingest_text(
            lesson_text,
            f"lesson_{lesson_name}",
            target_collection,
            {
                "type": "lesson",
                "course_name": course_name,
                "lesson_name": lesson_name,
                **identity,
            },
        )
        total_chunks += count

    logger.info(f"Course '{course_name}': Ingested {total_chunks} total chunks")
    return total_chunks
