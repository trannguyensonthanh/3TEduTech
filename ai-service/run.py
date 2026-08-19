import uvicorn
from src.config import get_settings


def start():
    """Start the AI Service. Hot-reload only in development."""
    settings = get_settings()
    is_production = settings.log_level.upper() in ("WARNING", "ERROR")
    print(f"Starting server at http://{settings.ai_service_host}:{settings.ai_service_port}")
    print(f"Mode: {'PRODUCTION' if is_production else 'DEVELOPMENT'}")
    print(f"LLM Provider: {settings.llm_provider}")

    # =========================================================================
    # [SỬA 18/08/2026] CHỈ THEO DÕI THƯ MỤC `src`
    #
    # ★ Lỗi thật đã gặp:
    #     _rust_notify.WatchfilesRustInternalError:
    #         error in underlying watcher: Cannot allocate memory (os error 12)
    #
    # "Cannot allocate memory" ở đây KHÔNG PHẢI hết RAM — đó là chạm trần
    # `fs.inotify.max_user_watches` của nhân Linux. Mỗi thư mục được theo dõi
    # tốn một watch, và hạn mức mặc định trong WSL2 chỉ khoảng 8192.
    #
    # Vì sao vượt trần: uvicorn --reload mặc định theo dõi THƯ MỤC LÀM VIỆC,
    # tức toàn bộ /app. Mà /app chứa `.venv` với 131 gói đã cài — hàng chục
    # nghìn thư mục con. Trần bị đốt sạch chỉ bởi thư viện, trong khi thứ ta
    # thật sự cần theo dõi là vài chục tệp trong `src/`.
    #
    # Giới hạn vào `src` đưa số watch từ hàng chục nghìn xuống vài chục, và
    # hot-reload vẫn hoạt động đúng như mong đợi — sửa mã nguồn vẫn nạp lại.
    # =========================================================================
    reload_options = {}
    if not is_production:
        reload_options = {
            "reload": True,
            "reload_dirs": ["src"],
            # Chặn thêm một lớp nữa, phòng khi có ai đó chạy từ thư mục khác.
            "reload_excludes": ["*.pyc", "__pycache__/*", ".venv/*", "data/*"],
        }

    # =========================================================================
    # [SỬA 18/08/2026] `workers=2` ghi cứng → lấy từ cấu hình, mặc định 1.
    #
    # Lý do đầy đủ nằm ở `ai_service_workers` trong src/config.py. Tóm tắt: hai
    # tiến trình cùng mở một ChromaDB nhúng sinh lỗi "database is locked" ngẫu
    # nhiên, và trên t3.medium thì hai worker vượt quá ngân sách RAM.
    #
    # Chế độ dev luôn là 1: uvicorn KHÔNG cho phép `reload` đi cùng `workers>1`
    # — nếu đặt cả hai, hot-reload bị bỏ qua trong im lặng.
    # =========================================================================
    workers = max(1, settings.ai_service_workers) if is_production else 1
    print(f"Workers: {workers}")

    uvicorn.run(
        "src.main:app",
        host=settings.ai_service_host,
        port=settings.ai_service_port,
        workers=workers,
        **reload_options,
    )


if __name__ == "__main__":
    start()
