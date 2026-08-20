"""Phiên âm video bằng Whisper — TÍNH NĂNG TÙY CHỌN.

[SỬA 18/08/2026] KHÔNG CÒN `import faster_whisper` Ở ĐẦU TỆP

`faster-whisper` và `static-ffmpeg` đã được tách khỏi nhóm phụ thuộc bắt buộc
(xem `pyproject.toml`, nhóm `[project.optional-dependencies] whisper`) vì chúng
kéo theo ~400–600MB cho một tính năng không dùng tới ở giai đoạn EC2 CPU tạm
thời.

★ NẾU GIỮ `from faster_whisper import WhisperModel` Ở DÒNG 3 THÌ SAO?

Chuỗi nạp module là:

    src/main.py → routes → src/api/tasks.py → src/core/transcription.py

nghĩa là TOÀN BỘ AI Service sẽ chết ngay lúc khởi động với `ModuleNotFoundError`
— không phải chỉ tính năng phiên âm hỏng, mà chatbot, RAG, sinh câu hỏi, bóc
text tài liệu cũng chết theo. Một tính năng phụ không được phép kéo sập cả dịch
vụ.

Vì vậy cả hai import nằm TRONG hàm `get_whisper_model()`. Máy nào không cài kèm
`--extra whisper` thì dịch vụ vẫn chạy bình thường, chỉ riêng lời gọi phiên âm
mới báo lỗi, và báo bằng câu người đọc hiểu được thay vì một stack trace về
module thiếu.
"""

import os
import logging

from src.config import get_settings

logger = logging.getLogger(__name__)

# Singleton pattern: chỉ load model 1 lần duy nhất, dùng lại cho các lần gọi sau
_whisper_model = None

# Chỉ chạy `static_ffmpeg.add_paths()` một lần cho cả vòng đời tiến trình. Hàm
# này sửa biến PATH của tiến trình; gọi lại nhiều lần chỉ tốn thời gian.
_ffmpeg_ready = False


class TranscriptionUnavailableError(RuntimeError):
    """Ném ra khi thư viện phiên âm chưa được cài trong bản build này.

    Tách thành lớp riêng để tầng gọi (`src/api/tasks.py`) phân biệt được
    "chưa bật tính năng" với "phiên âm thất bại" — cái đầu không đáng thử lại,
    cái sau thì có.
    """


def is_transcription_available() -> bool:
    """Kiểm tra `faster_whisper` có sẵn không mà KHÔNG nạp model.

    Dùng cho endpoint /health để giao diện quản trị biết bản build này có phiên
    âm được hay không, trước khi người dùng bấm nút rồi mới nhận lỗi.

    `find_spec` chỉ dò xem module có tồn tại trên đường dẫn tìm kiếm hay không,
    không thực thi mã trong module — nên rẻ và an toàn để gọi ở healthcheck.
    """
    from importlib.util import find_spec

    try:
        return find_spec("faster_whisper") is not None
    except (ImportError, ValueError):
        # ValueError xảy ra khi tên module nằm trong sys.modules nhưng __spec__
        # là None (trường hợp hiếm, gặp ở vài kiểu đóng gói). Coi như không có.
        return False


def _load_dependencies():
    """Nạp `faster_whisper` + `static_ffmpeg`, đổi lỗi thiếu module thành lỗi rõ nghĩa."""
    global _ffmpeg_ready

    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise TranscriptionUnavailableError(
            "Bản build này CHƯA BẬT tính năng phiên âm video (thiếu thư viện "
            "`faster-whisper`). Đây là lựa chọn có chủ ý: gói này nặng ~500MB và "
            "không dùng tới trên máy chủ CPU tạm thời.\n"
            "Cách bật: cài lại phụ thuộc với `uv sync --extra whisper`, hoặc dựng "
            "lại image Docker với `--build-arg INSTALL_EXTRAS=whisper` "
            "(thêm `,gpu` nếu máy có card NVIDIA)."
        ) from exc

    if not _ffmpeg_ready:
        try:
            import static_ffmpeg

            static_ffmpeg.add_paths()
            _ffmpeg_ready = True
        except ImportError:
            # Không chặn ở đây: nhiều image đã có sẵn ffmpeg trong PATH hệ thống,
            # lúc đó thiếu `static-ffmpeg` hoàn toàn vô hại. Nếu thật sự không có
            # ffmpeg nào cả thì lỗi sẽ nổi lên lúc giải mã audio, kèm thông báo
            # của chính ffmpeg — cụ thể hơn bất cứ dự đoán nào ở đây.
            logger.warning(
                "Không có `static-ffmpeg`; sẽ dùng ffmpeg của hệ thống nếu có."
            )

    return WhisperModel


def get_whisper_model():
    """Load (hoặc trả về model đã cache) Whisper model.

    Cấu hình qua biến môi trường (xem src/config.py):
      - WHISPER_MODEL_SIZE   mặc định "small" (local/dev), khuyến nghị "medium"
        trên GPU EC2 #2 (đủ VRAM T4 16GB, chất lượng SRT tốt hơn rõ rệt).
      - WHISPER_DEVICE       "cpu" mặc định (an toàn cho máy không có GPU),
        đặt "cuda" trên GPU EC2 #2 để tận dụng card NVIDIA T4 đã trả tiền.
      - WHISPER_COMPUTE_TYPE "int8" khi chạy cpu, "float16" khi chạy cuda
        (tận dụng Tensor Cores của T4, nhanh hơn và tốn ít VRAM hơn FP32).

    Nếu WHISPER_DEVICE=cuda nhưng load thất bại (thiếu driver, container chưa
    được cấp GPU, thư viện cuBLAS/cuDNN không tìm thấy...), tự động fallback
    về CPU thay vì làm crash toàn bộ AI Service.

    Ném `TranscriptionUnavailableError` nếu bản build không kèm `faster-whisper`.
    """
    global _whisper_model
    if _whisper_model is None:
        WhisperModel = _load_dependencies()
        settings = get_settings()
        device = settings.whisper_device
        compute_type = settings.whisper_compute_type
        model_size = settings.whisper_model_size

        cpu_threads = getattr(settings, "whisper_cpu_threads", 0) or 0

        logger.info(
            f"Đang nạp Whisper: {model_size} (device={device}, "
            f"compute_type={compute_type})..."
        )
        try:
            _whisper_model = WhisperModel(
                model_size,
                device=device,
                compute_type=compute_type,
                cpu_threads=cpu_threads,
            )
            logger.info("Đã nạp Whisper %s trên %s.", model_size, device)
        except Exception as e:
            logger.error(f"Nạp Whisper thất bại trên device={device}: {e}")
            if device != "cuda":
                raise

            """[SỬA 19/08/2026] Khi GPU hỏng, KHÔNG giữ nguyên kích thước mô hình.

            Bản cũ rơi từ (large-v3, cuda) xuống (large-v3, cpu). Nghe thì hợp
            lý — "vẫn chạy được" — nhưng large-v3 trên CPU chậm hơn thời gian
            thực nhiều lần: một video 20 phút ngốn cả tiếng đồng hồ, hàng đợi
            tắc, và không có gì báo cho ai biết vì sao.

            Rơi xuống mô hình nhỏ hơn là lựa chọn trung thực hơn: phụ đề kém
            chính xác hơn nhưng có trong vài phút, và dòng log nói thẳng ra
            điều đó để người vận hành đi sửa GPU."""
            du_phong = "small" if model_size in ("large-v3", "large-v2", "medium") else model_size
            logger.warning(
                "Whisper không chạy được trên GPU. Chuyển sang CPU và HẠ mô hình "
                "%s -> %s (int8). Phụ đề sẽ kém chính xác hơn cho tới khi GPU "
                "hoạt động trở lại.",
                model_size,
                du_phong,
            )
            _whisper_model = WhisperModel(
                du_phong,
                device="cpu",
                compute_type="int8",
                cpu_threads=cpu_threads,
            )
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
