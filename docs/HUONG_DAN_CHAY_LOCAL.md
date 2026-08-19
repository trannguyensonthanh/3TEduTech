# Hướng dẫn chạy dự án trên máy local (chế độ Gemini)

Cập nhật 18/08/2026 — sau khi hoàn thành tính năng Nhập khóa học từ ZIP
(Giai đoạn A → D).

Tài liệu này viết cho tình huống: **chưa có server, dùng Gemini cho toàn bộ
phần AI.** Cấu hình đã được chỉnh theo máy Acer Nitro 5 (i5 gen 12, RTX 3050,
16GB RAM).

---

## ⚡ Chạy nhanh — chỉ một lệnh

Hai tệp `.env` đã được điền sẵn đầy đủ. Bạn chỉ cần:

```
Nháy đúp vào  start.bat
```

hoặc trong PowerShell:

```powershell
cd D:\Lap_Trinh_ST\web\Dự_án_CNPM
.\start.bat
```

Script sẽ tự: kiểm tra Docker → kiểm tra `.env` → khởi động → **chờ** từng
dịch vụ sẵn sàng → chạy **13 phép kiểm tra** → mở trình duyệt.

| Lệnh                  | Tác dụng |
|-----------------------|----------|
| `start.bat`           | Khởi động + kiểm tra (dùng hằng ngày) |
| `start.bat -Rebuild`  | Build lại image — sau khi đổi `Dockerfile` / `pyproject.toml` / `package.json` |
| `start.bat -Reset`    | **Xóa sạch dữ liệu**, chạy lại migration từ đầu (có hỏi xác nhận) |
| `stop.bat`            | Dừng, giữ nguyên dữ liệu |
| `logs.bat`            | Xem log backend + ai-service theo thời gian thực |

**Lần đầu** dùng `start.bat -Rebuild` (phải build image ai-service với `pypdf`
mới thêm). Những lần sau chỉ cần `start.bat`.

Các mục bên dưới giải thích script làm gì và cách xử lý khi có trục trặc.

---

## 0. Một lỗi chặn đã được sửa sẵn — bạn không phải làm gì

Trước bản này, `docker-compose.dev.yml` chỉ đặt `AI_SERVICE_PORT=2111` cho
backend. Khi đó `config/index.js` dựng ra `http://127.0.0.1:2111` — nhưng bên
trong container backend, `127.0.0.1` **chính là container backend**, không phải
AI Service. Mọi lượt gọi sang AI đều nhận `ECONNREFUSED`.

Lỗi này không lộ ra trước đây vì trước Level 3 frontend gọi thẳng cổng 2111 đã
publish. Từ Level 3, mọi thứ đi qua backend — nên đường này giờ mới thật sự
được dùng.

Đã thêm `AI_SERVICE_URL=http://ai-service:2111`. Nếu không có dòng đó thì
**toàn bộ** phần bóc PDF/DOCX, viết mô tả và soạn trắc nghiệm đều chết.

---

## 1. Chuẩn bị máy

### Docker Desktop + WSL2

Cần Docker Desktop đang chạy với backend WSL2.

### RAM

Tổng `mem_limit` khai báo trong compose là ~6.1GB, **nhưng đó là TRẦN chứ không
phải mức chiếm chỗ**. Thực tế lúc chạy không tải:

| Dịch vụ    | Trần   | Thực tế (ước tính) |
|------------|--------|--------------------|
| database   | 2048m  | ~1.3GB (đã ghim `MSSQL_MEMORY_LIMIT_MB=1200`) |
| ai-service | 2048m  | ~600MB (Whisper chỉ nạp model khi dùng tới) |
| frontend   | 1024m  | ~300MB (Vite dev) |
| backend    | 768m   | ~150MB |
| redis      | 256m   | ~20MB  |
| **Tổng**   |        | **~2.4GB** |

Cộng thêm overhead WSL2, cần khoảng **4GB RAM trống** cho Docker.

**Máy bạn có 16GB — dư sức chạy.** Nhưng mặc định WSL2 lấy tới 50% RAM (8GB)
và **không trả lại cho Windows** sau khi dùng xong, nên Windows dễ bị ì. Đặt
trần tường minh sẽ dễ chịu hơn nhiều.

Tạo tệp `C:\Users\<tên đăng nhập Windows của bạn>\.wslconfig`:

```ini
[wsl2]
memory=8GB
processors=6
swap=4GB
# Trả RAM đã cấp phát về cho Windows khi container giải phóng.
# Thiếu dòng này thì WSL2 giữ chặt RAM cho tới khi tắt máy.
autoMemoryReclaim=gradual
```

`processors=6` phù hợp với i5 gen 12 (6 nhân hiệu năng + nhân tiết kiệm điện) —
để 6 cho Docker, phần còn lại dành cho VS Code và trình duyệt.

Áp dụng bằng cách chạy trong PowerShell:

```powershell
wsl --shutdown
```

rồi mở lại Docker Desktop.

### Dung lượng đĩa

Cần khoảng **8–10GB** cho image (SQL Server ~1.5GB, ai-service ~2.5GB, còn lại
nhỏ hơn). Nếu ổ đang chật, dọn trước bằng:

```powershell
docker system prune -a --volumes
```

⚠️ Lệnh trên xóa **mọi** image và volume không dùng, kể cả dữ liệu SQL Server
của các dự án khác. Chỉ chạy nếu bạn chắc chắn.

---

## 2. Biến môi trường — ĐÃ ĐIỀN SẴN, không phải làm gì

Hai tệp `.env` trước đây **thiếu vài biến mà Level 2/3 và tính năng nhập khóa
học cần**. Tôi đã ghi bổ sung vào cuối mỗi tệp (giữ nguyên toàn bộ nội dung cũ).
Mục này chỉ để bạn biết chúng làm gì.

### 2.1. `ai-service/.env` — thêm vào cuối tệp

```dotenv
# ── Chọn nhà cung cấp LLM ───────────────────────────────────────────────
# "gemini" = luôn dùng Gemini API (đúng tình huống hiện tại: chưa có GPU).
#
# ⚠️ ĐỪNG để "auto" khi chưa có vLLM: mỗi lượt gọi sẽ mất 3 giây chờ dò
# xem vLLM có sống không, rồi mới rơi xuống Gemini. Chậm mà chẳng được gì.
LLM_PROVIDER=gemini

# ── Khóa nội bộ (Level 3) ───────────────────────────────────────────────
# PHẢI TRÙNG với AI_SERVICE_INTERNAL_KEY trong 3t-edu-tech-backend/.env.
# Để trống ở cả hai phía thì AI Service chạy KHÔNG XÁC THỰC — ai chạm được
# tới cổng 2111 cũng gọi được và đốt sạch hạn mức Gemini của bạn.
INTERNAL_API_KEY=WLBCDkZLaIrdhdFiliKt0p8FDcZahFJm

# ── Whisper (phiên âm video) ────────────────────────────────────────────
# Máy bạn CÓ RTX 3050, nhưng để chạy CUDA trong Docker trên Windows còn cần
# GPU passthrough qua WSL2 — thêm khá nhiều điểm có thể hỏng. Giữ CPU cho
# chắc trước; xem mục 10 nếu muốn bật GPU sau.
WHISPER_MODEL_SIZE=small
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8
```

### 2.2. `3t-edu-tech-backend/.env` — thêm vào cuối tệp

```dotenv
# ── Khóa nội bộ (Level 3) ───────────────────────────────────────────────
# PHẢI TRÙNG với INTERNAL_API_KEY trong ai-service/.env.
AI_SERVICE_INTERNAL_KEY=WLBCDkZLaIrdhdFiliKt0p8FDcZahFJm

# ── Chữ ký chứng chỉ (Level 2) ──────────────────────────────────────────
# Thiếu biến này thì certificates.service tự dùng tạm JWT_SECRET và ghi cảnh
# báo. Đặt riêng để sau này đổi JWT_SECRET không làm hỏng chứng chỉ đã cấp.
CERTIFICATE_SECRET=MKLnr2dNrhhJ6RjQrQzQ20F5WRHo1huS

# ── Giới hạn tần suất khi TEST ──────────────────────────────────────────
# Mặc định 5 lần tải ZIP/giờ và 10 lượt gọi AI/giờ — hợp lý khi dùng thật,
# nhưng lúc test thì rất dễ chạm trần. Nới ra trong giai đoạn thử nghiệm:
RATE_LIMIT_IMPORT_MAX=50
RATE_LIMIT_IMPORT_ENRICH_MAX=50
```

> Hai khóa trên là chuỗi ngẫu nhiên tôi sinh sẵn cho bạn. Đây là môi trường
> local nên dùng luôn được. Khi lên server thật thì sinh khóa mới và cất vào
> GitHub Secrets, **không** commit vào Git.

Những biến khác (`IMPORT_TEMP_DIR`, `IMPORT_MAX_ZIP_MB`, …) đã được đặt sẵn
trong `docker-compose.dev.yml`, bạn không cần thêm vào `.env`.

---

## 3. Cập nhật khóa phụ thuộc Python

Tôi đã thêm `pypdf` vào `ai-service/pyproject.toml` (thư viện duy nhất phải
thêm cho toàn bộ tính năng). `uv.lock` đang lệch so với pyproject.

```powershell
cd D:\Lap_Trinh_ST\web\Dự_án_CNPM\ai-service
uv lock
```

**Chưa cài `uv` trên Windows?** Không sao — `Dockerfile.dev` cài gói bằng
`uv pip install -r pyproject.toml` (đọc thẳng pyproject, không đọc lock), nên
build vẫn ra đúng. Cứ bỏ qua bước này; nếu lúc chạy container báo lock cũ, quay
lại làm bước này sau.

---

## 4. Khởi động

```powershell
cd D:\Lap_Trinh_ST\web\Dự_án_CNPM
docker compose -f docker-compose.dev.yml up -d --build
```

Lần đầu mất khoảng **10–20 phút** (tải image SQL Server, build ai-service).

Migration cơ sở dữ liệu chạy **tự động**: service `database-init` dùng Flyway
áp lần lượt `V1` → `V8` trong thư mục `db-init/`, gồm cả `V5__course_versioning`,
`V6__certificates` và `V7__chat_history`. Bạn không phải chạy tay tệp SQL nào.

Theo dõi log:

```powershell
docker compose -f docker-compose.dev.yml logs -f backend ai-service
```

---

## 5. Kiểm tra từng lớp

Chạy lần lượt, **dừng lại ở bước nào hỏng** thay vì chạy tiếp.

### 5.1. Các container đều sống

```powershell
docker compose -f docker-compose.dev.yml ps
```

`database`, `backend`, `ai-service`, `redis`, `frontend` phải ở trạng thái
`running`. Riêng `database-init` **chạy xong rồi thoát với mã 0** — đó là đúng,
không phải lỗi.

### 5.2. Backend + cơ sở dữ liệu + Redis

```powershell
curl http://localhost:5000/v1/
```

Mong đợi `"status": "healthy"` với `database: connected` và `redis: connected`.

- `"status": "unhealthy"` → mất kết nối SQL Server, xem log `database`.
- `"status": "degraded"` → chỉ mất Redis. Hệ thống vẫn chạy nhưng **hàng đợi
  nhập khóa học sẽ không hoạt động** (toàn bộ trạng thái job nằm trên Redis).

### 5.3. AI Service

```powershell
curl http://localhost:2111/health
```

Mong đợi `"status": "healthy"` và `"llm_provider": "gemini"`.

Nếu thấy `"vllm": {"engine": "offline"}` và `"status": "degraded"` thì bạn đang
để `LLM_PROVIDER=auto` — quay lại mục 2.1 đổi thành `gemini`.

### 5.4. ★ Backend gọi được AI Service (đường vừa sửa ở mục 0)

Đây là phép thử quan trọng nhất, vì nó xác nhận đúng cái đã hỏng bấy lâu:

```powershell
docker compose -f docker-compose.dev.yml exec backend curl -s -o /dev/null -w "%{http_code}" http://ai-service:2111/health
```

Phải in ra `200`. Nếu ra `000` hoặc treo → hai container không thấy nhau, kiểm
tra lại `AI_SERVICE_URL` trong compose.

### 5.5. Khóa nội bộ khớp nhau

```powershell
docker compose -f docker-compose.dev.yml exec backend curl -s -o /dev/null -w "%{http_code}" http://ai-service:2111/api/extract/formats
```

- `401` → khóa **không khớp** hoặc chỉ đặt ở một phía.
- `200` → không có khóa nào được đặt (chế độ không xác thực).

Muốn xác nhận khóa đã bật đúng, gọi trực tiếp không kèm header phải bị chặn:

```powershell
curl -s -o /dev/null -w "%{http_code}" http://localhost:2111/api/extract/formats
```

Kết quả mong đợi là `401`.

### 5.6. Giao diện

Mở http://localhost:5173 → đăng nhập bằng tài khoản giảng viên → vào
**Khóa học của tôi**. Phải thấy nút **"Nhập Từ Tệp ZIP"** cạnh "Tạo Khóa Học Mới".

---

## 6. Chạy thử tính năng nhập khóa học

Dùng tệp `khoa-hoc-mau.zip` ở thư mục gốc dự án (2 chương, 5 bài, 2 video, 1
phụ đề, tên tiếng Việt có dấu).

| Bước | Thao tác | Mong đợi |
|------|----------|----------|
| 1 | Kéo `khoa-hoc-mau.zip` vào vùng thả | Hiện tên tệp + dung lượng |
| 2 | Bấm "Tải lên & phân tích" | Thanh tiến độ tải lên chạy tới 100% |
| 3 | Chờ phân tích | 2 chương, 5 bài, độ tin cậy 100% |
| 4 | Xem danh sách | Bài video có nhãn thời lượng `12:34` và `21:03`, một bài có nhãn "phụ đề" |
| 5 | Bấm **"Dùng AI viết mô tả"** | Sau ~30–60 giây, các ô mô tả được điền |
| 6 | Bấm **"Tạo câu hỏi trắc nghiệm"** | Hiện nhãn tím "N câu hỏi" ở các bài có tài liệu |
| 7 | Chọn Danh mục + Cấp độ, bấm "Tạo khóa học nháp" | Chuyển sang bước 4 — tải video lên |
| 8 | Chờ tải video | "Hoàn tất!" rồi về danh sách khóa học |

**Lưu ý ở bước 6**: ZIP mẫu chỉ có vài tệp text ngắn, nên có thể báo *"Không có
bài học nào đủ nội dung để ra đề"* — đúng như thiết kế (dưới 200 ký tự thì bị
loại). Muốn thử thật, nhét thêm một tệp PDF hoặc DOCX có vài đoạn văn vào ZIP.

**Lưu ý ở bước 8**: hai "video" trong ZIP mẫu là tệp MP4 tối giản tôi tạo ra để
kiểm tra bộ đọc thời lượng — Cloudinary có thể từ chối vì không phải video thật.
Đó không phải lỗi hệ thống. Muốn thử trọn vẹn thì thay bằng video MP4 thật.

---

## 7. Xử lý sự cố

### `ECONNREFUSED` khi bấm nút AI

Backend không thấy AI Service. Kiểm tra mục 5.4.

### Gemini trả `404 model not found`

Tên model trong `ai-service/.env` không còn tồn tại. Liệt kê model khả dụng:

```powershell
curl "https://generativelanguage.googleapis.com/v1beta/models?key=KHOA_GEMINI_CUA_BAN"
```

Rồi sửa `GEMINI_CHAT_MODEL`, `GEMINI_ROUTING_MODEL`, `GEMINI_EMBEDDING_MODEL`
cho khớp.

### Gemini trả `429 quota exceeded`

Hết hạn mức miễn phí. Hạn mức tính **theo project Google Cloud, không phải theo
API key** — tạo thêm key trong cùng project sẽ không giúp gì. Chờ sang ngày
hôm sau, hoặc dùng key của một project khác.

### Container `ai-service` tự khởi động lại liên tục

Xem log: `docker compose -f docker-compose.dev.yml logs ai-service`.
Thường là thiếu RAM (Whisper nạp model) → tăng `memory` trong `.wslconfig`.

### "Bạn đang có một lần nhập khóa học đang xử lý"

Mỗi người chỉ được một phiên tại một thời điểm. Vào lại trang nhập, bấm nút
**Hủy** trên giao diện. Hoặc xóa thẳng khóa Redis:

```powershell
docker compose -f docker-compose.dev.yml exec redis redis-cli --scan --pattern "import:*" | ForEach-Object { docker compose -f docker-compose.dev.yml exec redis redis-cli DEL $_ }
```

### Ổ đĩa đầy dần sau nhiều lần test

Thư mục tạm nằm trong volume riêng, xóa không mất dữ liệu thật:

```powershell
docker compose -f docker-compose.dev.yml down
docker volume rm cnpm_import-temp-dev
```

(Tên volume có tiền tố theo tên thư mục dự án — xem bằng `docker volume ls`.)

### Video không phát được sau khi nhập

Kiểm tra `mediaStatus` của phiên nhập. Nếu là `SKIPPED` thì Cloudinary chưa
được cấu hình; nếu `PARTIAL`/`FAILED` thì xem log backend. Trong mọi trường
hợp, khóa học **vẫn đã được tạo** — tải video thủ công ở trang Sửa khóa học.

---

## 8. Việc bảo mật còn treo

Ba khóa dưới đây **đã lộ trong lịch sử Git** và cần bạn thu hồi rồi cấp lại
trước khi đưa hệ thống lên server thật:

- `MASTER_API_KEY`
- `COURSE_AI_API_KEY`
- Khóa YouTube Data API (đã gỡ khỏi mã nguồn ở Level 3, nhưng giá trị cũ vẫn
  nằm trong lịch sử commit)

Xóa khỏi mã nguồn là chưa đủ — ai clone repo cũng đọc được lịch sử. Phải vào
Google Cloud Console / trang quản trị tương ứng để **thu hồi khóa cũ**.

Ở môi trường local thì việc này chưa gây hại gì, nhưng đừng quên trước khi
deploy.

---

## 9. Tóm tắt các lệnh

```powershell
cd D:\Lap_Trinh_ST\web\Dự_án_CNPM

# Khởi động
docker compose -f docker-compose.dev.yml up -d --build

# Xem log
docker compose -f docker-compose.dev.yml logs -f backend ai-service

# Dừng (giữ dữ liệu)
docker compose -f docker-compose.dev.yml down

# Dừng và XÓA SẠCH dữ liệu (chạy lại migration từ đầu)
docker compose -f docker-compose.dev.yml down -v

# Build lại một service sau khi sửa Dockerfile / pyproject
docker compose -f docker-compose.dev.yml up -d --build ai-service
```

Mã nguồn được mount vào container nên **sửa code không cần build lại**:
backend có nodemon, frontend có Vite HMR, ai-service có uvicorn reload.
Chỉ build lại khi đổi `package.json`, `pyproject.toml` hoặc `Dockerfile`.

---

## 10. (Tùy chọn) Bật GPU RTX 3050 cho Whisper

**Chỉ làm khi mọi thứ đã chạy ổn ở chế độ CPU.** Đây là phần tăng tốc, không
phải phần bắt buộc — và nó thêm vài chỗ có thể hỏng.

### Có đáng không?

Chỉ ảnh hưởng tới **phiên âm video sinh phụ đề tự động** — đúng một tính năng.
Toàn bộ phần nhập khóa học, viết mô tả, soạn trắc nghiệm đều **không** dùng GPU
(chúng gọi Gemini qua mạng).

Chênh lệch với model `small`, video 10 phút:

| Thiết bị | Thời gian ước tính |
|----------|--------------------|
| CPU (i5 gen 12, int8) | ~4–6 phút |
| RTX 3050 (float16)    | ~30–50 giây |

Đáng làm nếu bạn định phiên âm nhiều video. Còn nếu chỉ demo đồ án thì CPU đủ.

### Các bước

**1.** Cài driver NVIDIA mới nhất trên **Windows** (không cài driver trong WSL).

**2.** Kiểm tra WSL2 thấy GPU:

```powershell
wsl -d docker-desktop nvidia-smi
```

Thấy bảng thông tin RTX 3050 là được. Nếu báo `command not found` thì Docker
Desktop chưa bật GPU — vào Settings → Resources → bật **GPU support**.

**3.** Thêm khối `deploy` vào service `ai-service` trong `docker-compose.dev.yml`:

```yaml
  ai-service:
    # ... giữ nguyên phần đang có ...
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

**4.** Đổi trong `ai-service/.env`:

```dotenv
WHISPER_DEVICE=cuda
WHISPER_COMPUTE_TYPE=float16
```

**5.** Build lại **kèm nhóm phụ thuộc GPU**. `Dockerfile.dev` hiện KHÔNG cài
`--extra gpu`, mà `faster-whisper` cần thư viện runtime cuBLAS + cuDNN. Sửa
`ai-service/Dockerfile.dev`:

```dockerfile
RUN uv pip install --system -r pyproject.toml --extra gpu
```

và thêm dòng này sau đó:

```dockerfile
ENV LD_LIBRARY_PATH="/usr/local/lib/python3.12/site-packages/nvidia/cublas/lib:/usr/local/lib/python3.12/site-packages/nvidia/cudnn/lib:${LD_LIBRARY_PATH}"
```

(Copy nguyên từ `Dockerfile` bản production — nó đã làm đúng việc này.)

**6.** `start.bat -Rebuild`

⚠️ Nhóm `gpu` kéo về `nvidia-cublas-cu12` + `nvidia-cudnn-cu12`, **nặng thêm
khoảng 2GB** dung lượng image. Với ổ đĩa đang chật thì cân nhắc kỹ.

### Quay lại CPU nếu hỏng

Đổi `WHISPER_DEVICE=cpu`, `WHISPER_COMPUTE_TYPE=int8`, bỏ khối `deploy`, rồi
`start.bat -Rebuild`. Không mất dữ liệu gì.
