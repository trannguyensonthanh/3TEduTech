# =============================================================================
# AI Service — MỘT Dockerfile DÙNG CHUNG CHO CẢ HAI GIAI ĐOẠN TRIỂN KHAI
# =============================================================================
# [VIẾT LẠI 18/08/2026]
#
# Trước đây tệp này ghi cứng `--extra gpu` và trong chú thích nói thẳng: "Image
# này CHỈ build để chạy trên GPU EC2 #2; nếu cần bản CPU-only thì bỏ --extra gpu"
# — tức là phải SỬA MÃ NGUỒN mỗi lần đổi máy đích. Sửa mã để đổi cấu hình triển
# khai là cách chắc chắn nhất để một ngày nào đó đẩy nhầm bản GPU lên máy CPU
# (hoặc ngược lại) mà không ai nhận ra cho tới lúc container không khởi động.
#
# Nay chỉ còn MỘT tệp, khác nhau ở tham số lúc build:
#
#   # Giai đoạn 1 — EC2 CPU tạm thời (đang dùng), Gemini-only:
#   docker build -t <user>/3t-edu-tech-ai-service:cpu ./ai-service
#
#   # Giai đoạn 2 — GPU EC2 #2 sau khi xin được quota vCPU:
#   docker build --build-arg INSTALL_EXTRAS="whisper,gpu" \
#                -t <user>/3t-edu-tech-ai-service:gpu ./ai-service
#
# ★ MẶC ĐỊNH LÀ RỖNG (CPU) CÓ CHỦ Ý
#
# Quên tham số khi build cho máy CPU → được đúng thứ cần. Quên tham số khi build
# cho máy GPU → phiên âm báo lỗi rõ ràng "chưa bật tính năng phiên âm" (xem
# src/core/transcription.py) chứ dịch vụ vẫn chạy. Chiều hỏng nhẹ hơn được chọn
# làm mặc định.
#
# Chênh lệch dung lượng không nhỏ: ~500MB (bản CPU) so với ~1.6GB (bản GPU, do
# faster-whisper kéo theo ctranslate2/av/tokenizers và cuBLAS/cuDNN).
# =============================================================================

FROM python:3.12-slim

# Nhóm phụ thuộc tùy chọn cần cài, phân tách bằng dấu phẩy. Xem pyproject.toml:
#   ""             → chỉ nhóm bắt buộc (EC2 CPU, LLM_PROVIDER=gemini)
#   "whisper"      → thêm phiên âm chạy CPU (chậm, chỉ hợp để thử)
#   "whisper,gpu"  → phiên âm chạy CUDA trên card T4 của GPU EC2 #2
#
# ⚠️ "gpu" mà không có "whisper" là vô nghĩa: nhóm gpu chỉ là thư viện runtime
#    cuBLAS/cuDNN cho ctranslate2, mà ctranslate2 đến từ faster-whisper. Có kiểm
#    tra chặn ở bước cài bên dưới.
ARG INSTALL_EXTRAS=""

# Cài phụ thuộc hệ thống.
#
# `curl` được giữ lại ở image cuối CHỨ KHÔNG dọn đi: healthcheck trong cả
# docker-compose.cpu-ec2.yml lẫn docker-compose.gpu-ec2-ai.yml đều gọi
# `curl -f http://localhost:2111/health`. Gỡ curl đi thì healthcheck luôn thất
# bại và Docker sẽ khởi động lại container vô hạn — đúng lỗi đã từng xảy ra với
# image nginx:alpine của frontend.
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast Python package management
RUN curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR="/usr/local/bin" sh

WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Dựng danh sách `--extra` từ ARG rồi cài một lần duy nhất.
#
# Phải tách bằng vòng lặp vì `uv pip install` nhận `--extra <tên>` một lần cho
# mỗi nhóm; truyền "whisper,gpu" như một chuỗi thì uv đi tìm một nhóm tên là
# "whisper,gpu" và báo không tồn tại.
#
# `set -e` để lệnh cài thất bại thì build DỪNG. Không có nó, shell trả mã 0 của
# lệnh cuối và ta sẽ có một image thiếu thư viện nhưng build "thành công" —
# lỗi chỉ lộ ra lúc container chạy trên máy chủ.
RUN set -e; \
    EXTRA_ARGS=""; \
    case ",${INSTALL_EXTRAS}," in \
      *,gpu,*) \
        case ",${INSTALL_EXTRAS}," in \
          *,whisper,*) ;; \
          *) echo "❌ INSTALL_EXTRAS có 'gpu' nhưng thiếu 'whisper'." >&2; \
             echo "   Nhóm gpu chỉ là thư viện runtime cho ctranslate2, mà" >&2; \
             echo "   ctranslate2 đến từ faster-whisper. Dùng: whisper,gpu" >&2; \
             exit 1 ;; \
        esac ;; \
    esac; \
    for extra in $(echo "${INSTALL_EXTRAS}" | tr ',' ' '); do \
      [ -n "$extra" ] && EXTRA_ARGS="$EXTRA_ARGS --extra $extra"; \
    done; \
    echo "📦 Cài phụ thuộc với:${EXTRA_ARGS:- (chỉ nhóm bắt buộc)}"; \
    uv pip install --system -r pyproject.toml $EXTRA_ARGS

# Copy application code
COPY . .

# GPU: faster-whisper (ctranslate2) cần thư viện runtime cuBLAS + cuDNN.
# Thay vì đổi hẳn sang base image CUDA (nặng thêm vài GB), ta trỏ
# LD_LIBRARY_PATH tới các thư viện .so đã được cài qua pip ở trên.
#
# Đặt vô điều kiện là AN TOÀN: ở bản CPU hai thư mục này không tồn tại, và trình
# nạp động của Linux chỉ đơn giản bỏ qua đường dẫn không có thật — không cảnh
# báo, không chậm đi. Viết ENV có điều kiện trong Dockerfile thì phải dùng thêm
# một tầng shell, phức tạp hơn nhiều so với thứ nó tiết kiệm được.
#
# Host (GPU EC2 #2) vẫn cần NVIDIA driver + nvidia-container-toolkit (đã có
# sẵn nếu dùng AWS Deep Learning AMI) + `deploy.resources.reservations.devices`
# trong docker-compose.gpu-ec2-ai.yml để container "nhìn thấy" GPU.
ENV LD_LIBRARY_PATH="/usr/local/lib/python3.12/site-packages/nvidia/cublas/lib:/usr/local/lib/python3.12/site-packages/nvidia/cudnn/lib:${LD_LIBRARY_PATH}"

# Ghi lại lựa chọn lúc build vào chính image, để về sau `docker inspect` trả lời
# được câu hỏi "bản này có phiên âm không" mà không phải đoán theo tên tag.
# Endpoint /health cũng báo cờ `whisper.available` theo thư viện thật sự có mặt.
ENV AI_SERVICE_BUILD_EXTRAS="${INSTALL_EXTRAS}"
LABEL org.opencontainers.image.title="3TEduTech AI Service"
LABEL com.3tedutech.build-extras="${INSTALL_EXTRAS}"

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=2111

EXPOSE 2111

# =============================================================================
# [SỬA 18/08/2026] `python run.py` THAY CHO `uv run run.py`
#
# ★ Vì sao đổi — đây là lỗi thật, không phải dọn dẹp cho đẹp.
#
# `uv run` KHÔNG chạy bằng các gói đã cài ở trên. Thấy pyproject.toml + uv.lock
# trong thư mục làm việc, nó tự tạo một `.venv` MỚI rồi đồng bộ lại toàn bộ phụ
# thuộc vào đó ngay lúc container khởi động. Hậu quả:
#
#   1. Bước `uv pip install --system` ở trên thành công cốc — image mang sẵn
#      500MB–1.6GB thư viện không bao giờ được dùng tới.
#   2. `uv sync` mặc định KHÔNG cài nhóm optional, nên bản GPU build với
#      `--extra whisper,gpu` sẽ khởi động mà KHÔNG có faster-whisper. Đúng thứ
#      vừa trả tiền dung lượng để có.
#   3. Container cần mạng ra PyPI mỗi lần khởi động lại. Máy chủ mất mạng ra
#      ngoài, hoặc PyPI chậm, là dịch vụ không lên nổi.
#   4. Thời gian khởi động từ vài giây thành vài phút, đủ để healthcheck của
#      Docker báo thất bại và giết container ngay trong lúc nó đang cài.
#
# `python run.py` dùng thẳng site-packages hệ thống — đúng nơi bước cài đã ghi
# vào, khởi động tức thì, không cần mạng.
# =============================================================================
CMD ["python", "run.py"]
