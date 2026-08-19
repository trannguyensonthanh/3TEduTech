import asyncio
import os
import aiohttp
import tempfile
import logging
from src.core.transcription import transcribe_video, is_transcription_available
from src.rag.loader import ingest_text
from src.config import get_settings

logger = logging.getLogger(__name__)

async def download_and_transcribe_task(
    video_url: str,
    course_name: str,
    lesson_name: str,
    lesson_id: int | None = None,
    webhook_url: str | None = None,
):
    """
    Background task to download video, transcribe, ingest into RAG, and deliver SRT subtitles.
    """
    settings = get_settings()
    collection_name = settings.chroma_collection_courses

    # [THÊM 18/08/2026] Kiểm tra TRƯỚC KHI TẢI, không phải sau.
    #
    # `faster-whisper` nay là phụ thuộc tùy chọn. Nếu bản build không có nó,
    # `transcribe_video()` sẽ ném lỗi — nhưng lúc đó ta ĐÃ tải xong một tệp mp4
    # vài trăm MB về đĩa. Trên EC2 dùng EBS thì đó vừa là băng thông vừa là dung
    # lượng đĩa vứt đi, cho một kết quả biết chắc là thất bại.
    #
    # Đây là tác vụ nền, không có ai để trả HTTP 4xx về, nên chỉ ghi log rồi
    # thoát. Backend không chờ kết quả tác vụ này (xem webhook phía dưới).
    if not is_transcription_available():
        logger.warning(
            "Bỏ qua phiên âm cho bài '%s': bản build này không kèm "
            "`faster-whisper`. Dựng lại image với "
            "`--build-arg INSTALL_EXTRAS=whisper` nếu cần tính năng phiên âm.",
            lesson_name,
        )
        return

    # [SỬA 18/08/2026] Khởi tạo TRƯỚC khối `try`.
    # Trước đây `temp_path` chỉ được gán bên trong `try`, nhưng khối `except`
    # cuối hàm lại đọc nó. Nếu `tempfile.mkstemp()` là thứ ném lỗi (đĩa đầy —
    # đúng tình huống đang phải đề phòng), khối `except` sẽ ném tiếp NameError,
    # che mất lỗi gốc và làm mất luôn dòng log giải thích nguyên nhân.
    temp_path = None

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

        # ====================================================================
        # [SỬA 18/08/2026 — COURSE IMPORT] LỖI CHẶN VÒNG LẶP SỰ KIỆN
        #
        # Trước đây dòng này là `result = transcribe_video(temp_path)` — gọi
        # THẲNG một hàm ĐỒNG BỘ bên trong một hàm `async`.
        #
        # Hậu quả (đã âm thầm xảy ra suốt thời gian qua):
        #   1. faster-whisper chạy CPU liên tục vài phút, KHÔNG hề nhả điều
        #      khiển. Trong suốt thời gian đó vòng lặp sự kiện của FastAPI bị
        #      đóng băng — không request nào được phục vụ.
        #   2. `/health` vì thế hết hạn chờ.
        #   3. Docker healthcheck thất bại đủ số lần → khởi động lại container
        #      → chính bản phiên âm đang chạy bị giết giữa chừng.
        #   4. Vòng lặp lặp lại ở lần thử sau. Nhìn từ ngoài chỉ thấy "phụ đề
        #      tự động thỉnh thoảng không chạy", rất khó lần ra nguyên nhân.
        #
        # `run_in_executor(None, ...)` đẩy việc nặng sang luồng nền của
        # ThreadPoolExecutor mặc định. Vòng lặp sự kiện rảnh trở lại ngay,
        # `/health` phản hồi bình thường, container không bị khởi động lại.
        #
        # Dùng được `None` (executor mặc định) vì phiên âm phần lớn thời gian
        # nằm trong mã C của ctranslate2 — đoạn đó ĐÃ nhả GIL, nên luồng nền
        # thật sự chạy song song chứ không bị GIL trói.
        # ====================================================================
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, transcribe_video, temp_path)
        transcript = result["full_text"]
        srt_content = result["srt_content"]
        lang_code = result["language"]
        
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
            
            # Send generated SRT subtitle back to Backend via webhook if configured
            if webhook_url and srt_content:
                logger.info(f"Delivering SRT subtitle to webhook: {webhook_url}")
                try:
                    async with aiohttp.ClientSession() as session:
                        async with session.post(webhook_url, json={
                            "srtContent": srt_content,
                            "languageCode": lang_code or "vi"
                        }, timeout=15) as wh_res:
                            if wh_res.status in (200, 201):
                                logger.info("✅ Successfully synced auto-generated SRT subtitle with Backend!")
                            else:
                                logger.warning(f"⚠️ Webhook responded with status: {wh_res.status}")
                except Exception as wh_err:
                    logger.error(f"Failed to deliver SRT via webhook: {wh_err}")
        else:
            logger.warning("Transcript is empty.")
            
    except Exception as e:
        logger.error(f"Transcription task failed: {e}", exc_info=True)
    finally:
        # Dọn tệp tạm ở `finally` chứ không ở `except`: đường đi thành công
        # cũng có thể thoát sớm (ví dụ tải video thất bại thì hàm `return`
        # ngay), và khi đó tệp .mp4 vài trăm MB sẽ nằm lại vĩnh viễn trong
        # /tmp. Với ổ đĩa đang gần đầy thì chỉ vài lần là hết chỗ.
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError as cleanup_err:
                logger.warning(f"Không xóa được tệp tạm {temp_path}: {cleanup_err}")
