import os
import logging
from faster_whisper import WhisperModel
import static_ffmpeg

# Initialize static_ffmpeg to make 'ffmpeg' available in PATH
static_ffmpeg.add_paths()

logger = logging.getLogger(__name__)

# Cấu hình model
MODEL_SIZE = "small" # có thể là 'base' hoặc 'small'

# Chúng ta sẽ sử dụng biến toàn cục để load model 1 lần duy nhất (Singleton pattern)
_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        logger.info(f"Loading Whisper model: {MODEL_SIZE}...")
        try:
            # Chạy trên CPU để tiết kiệm VRAM, vì GPU có thể đang được chia sẻ với các service khác
            # Nếu có GPU riêng có thể đổi thành device="cuda", compute_type="float16"
            _whisper_model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
            logger.info("Whisper model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise e
    return _whisper_model


def format_timestamp(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def transcribe_video(video_path: str) -> dict:
    """
    Extracts audio from video and transcribes it to text and subtitle format.
    Returns a dict with 'full_text', 'srt_content', and 'language'.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")
        
    model = get_whisper_model()
    logger.info(f"Start transcribing: {video_path}")
    
    segments, info = model.transcribe(video_path, beam_size=5)
    
    logger.info(f"Detected language '{info.language}' with probability {info.language_probability}")
    
    transcript = []
    srt_lines = []
    for idx, segment in enumerate(segments, 1):
        text_clean = segment.text.strip()
        transcript.append(text_clean)
        
        start_str = format_timestamp(segment.start)
        end_str = format_timestamp(segment.end)
        srt_lines.append(f"{idx}\n{start_str} --> {end_str}\n{text_clean}\n")
        
    full_text = " ".join(transcript)
    srt_content = "\n".join(srt_lines)
    logger.info(f"Transcription completed. Length: {len(full_text)} chars, {len(srt_lines)} subtitle segments.")
    
    return {
        "full_text": full_text,
        "srt_content": srt_content,
        "language": getattr(info, "language", "vi") or "vi"
    }
