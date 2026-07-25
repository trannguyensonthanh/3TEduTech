import os
import aiohttp
import tempfile
import logging
from src.core.transcription import transcribe_video
from src.rag.loader import ingest_text
from src.config import get_settings

logger = logging.getLogger(__name__)

async def download_and_transcribe_task(video_url: str, course_name: str, lesson_name: str):
    """
    Background task to download video, transcribe, and ingest.
    """
    settings = get_settings()
    collection_name = settings.chroma_collection_courses
    
    try:
        # Create a temporary file
        fd, temp_path = tempfile.mkstemp(suffix=".mp4")
        os.close(fd)
        
        logger.info(f"Downloading video from {video_url} to {temp_path}")
        async with aiohttp.ClientSession() as session:
            async with session.get(video_url) as response:
                if response.status != 200:
                    logger.error(f"Failed to download video: {response.status}")
                    return
                with open(temp_path, "wb") as f:
                    while True:
                        chunk = await response.content.read(1024 * 1024)
                        if not chunk:
                            break
                        f.write(chunk)
                        
        logger.info(f"Download complete. Start transcription.")
        
        # Transcribe
        transcript = transcribe_video(temp_path)
        
        # Remove temp file
        os.remove(temp_path)
        
        if transcript.strip():
            logger.info("Transcription success. Ingesting into vector store...")
            source_name = f"{course_name} - {lesson_name} (Auto-Transcript)"
            
            await ingest_text(
                text=transcript,
                source_name=source_name,
                collection_name=collection_name,
                metadata={
                    "course_name": course_name,
                    "lesson_name": lesson_name,
                    "type": "transcript"
                }
            )
            logger.info(f"Ingested transcript for {lesson_name}")
        else:
            logger.warning("Transcript is empty.")
            
    except Exception as e:
        logger.error(f"Transcription task failed: {e}", exc_info=True)
        if os.path.exists(temp_path):
            os.remove(temp_path)
