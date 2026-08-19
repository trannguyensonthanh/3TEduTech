# Kế hoạch v2 — Nhập khóa học từ ZIP

> Trả lời câu hỏi + kiến trúc chốt lại · 17/08/2026
> Thay thế bản `DE_XUAT_COURSE_IMPORT_AGENT.md` ở những chỗ khác biệt.

---

# PHẦN 1 — TRẢ LỜI TRỰC TIẾP

## 1.1. Bỏ Google Drive ✅

Đồng ý hoàn toàn. Chỉ ZIP. Bỏ được: OAuth, màn hình đồng ý, xác minh ứng dụng
của Google, quản lý refresh token. Tiết kiệm khoảng **1/3 khối lượng công việc**
mà mất chưa tới 10% giá trị.

---

## 1.2. "Tại sao thêm 2 bảng? Cứ trích xuất rồi hiện bản nháp ra màn hình được không?"

**Bạn nói đúng — tôi đã thiết kế thừa. Bỏ bảng `ImportFiles`.**

Nhưng vẫn nên giữ **một** bảng, và lý do không phải là "để lưu trữ" mà là **thời
gian xử lý**:

| Thời gian xử lý | Cách làm phù hợp |
|---|---|
| < 30 giây | Đồng bộ, trả JSON thẳng về trình duyệt, **0 bảng** |
| Vài phút | Bất đồng bộ, **cần chỗ giữ trạng thái** |

Một ZIP thật của giảng viên (30–200 file PDF/PPTX, vài chục MB) mất **2–10 phút**
để bóc text + gọi LLM. Ở mức đó, làm đồng bộ sẽ gặp:

- HTTP request timeout (nginx `proxy_read_timeout 300s`, trình duyệt còn ngắn hơn)
- Giảng viên lỡ F5 hoặc mất mạng → **mất trắng**, phải nạp lại từ đầu, tốn token lần nữa
- Không hiện được tiến độ (mà bạn vừa vá xong kênh SSE ở Level 2, rất nên dùng)

**Vậy chốt lại: đúng 1 bảng.**

```sql
ImportJobs
├── ImportJobID      BIGINT IDENTITY
├── AccountID        BIGINT          -- giảng viên
├── SourceName       NVARCHAR(500)   -- tên file zip
├── Status           VARCHAR(20)     -- PENDING|PROCESSING|READY|FAILED|ACCEPTED
├── Progress         INT             -- 0..100
├── StatusMessage    NVARCHAR(500)   -- "Đang đọc 12/48 tệp..."
├── ProposedJson     NVARCHAR(MAX)   -- ★ TOÀN BỘ bản nháp nằm ở đây
├── StatsJson        NVARCHAR(MAX)   -- token đã dùng, số file mỗi tier
├── ResultCourseID   BIGINT NULL     -- khóa DRAFT khi giảng viên chấp nhận
└── CreatedAt / CompletedAt / ErrorMessage
```

Chỉ vậy. Danh sách file, cây thư mục, mô tả từng bài — **nằm hết trong
`ProposedJson`**. Không cần bảng thứ hai vì bạn sẽ không bao giờ truy vấn kiểu
"tìm tất cả file PDF trong mọi lần import". Nó là một khối dữ liệu đọc-ghi trọn
gói.

> **Có thể bỏ luôn bảng này không?** Về lý thuyết có — BullMQ đã lưu trạng thái
> job trong Redis. Nhưng: Redis trong dự án này là **cache** (có thể mất bất cứ
> lúc nào), BullMQ mặc định dọn job cũ, và `ProposedJson` vài trăm KB nằm trong
> RAM thì lãng phí. Một bảng SQL đơn giản đáng giá hơn nhiều so với công sức
> tiết kiệm được.

**Còn phần "hiện bản nháp ra màn hình cho giảng viên tự quyết định" — đúng y như
bạn nói.** Đó chính là thiết kế: AI ghi vào `ProposedJson`, giao diện đọc ra,
giảng viên sửa/bỏ tick, bấm "Chấp nhận" thì backend mới ghi vào `Courses` /
`Sections` / `Lessons`. **Không có gì tự động vào cơ sở dữ liệu thật.**

---

## 1.3. "Qwen xử lý cấu trúc thư mục, biết file nào là video để gọi API nào"

Ở đây cần tách bạch **hai việc rất khác nhau** mà dễ bị gộp làm một:

### Việc A — "File này là video hay PDF?" → **KHÔNG dùng LLM**

```python
".mp4" → VIDEO   → Cloudinary + hàng đợi phụ đề
".pdf" → DOCUMENT → PyMuPDF bóc text
".pptx"→ SLIDE    → python-pptx bóc text
".py"  → CODE     → đọc thẳng, đưa vào TextContent
```

Đây là một bảng tra cứu. Dùng LLM cho việc này thì:
- Tốn token cho thứ đã biết chắc chắn
- **Có thể sai** — LLM đoán "file này chắc là video" trong khi phần mở rộng đã
  nói rõ. Sai ở bước này làm hỏng toàn bộ các bước sau
- Chậm hơn khoảng 1000 lần

Nên bổ sung kiểm tra **magic bytes** (4 byte đầu file) để chống trường hợp đổi
đuôi file — nhưng đó vẫn là code, không phải LLM.

### Việc B — "Nhóm 50 file này thành chương nào?" → **ĐÂY MỚI LÀ VIỆC CỦA LLM**

Và đây chính là chỗ ý tưởng của bạn đúng. Nhưng không phải lúc nào cũng cần.
Cách dung hòa: **Tier 0 tự chấm điểm tin cậy, thấp thì mới leo lên LLM.**

```python
# Ý TƯỞNG
def analyze_tree(files: list[FileNode]) -> TreeAnalysis:
    """Suy ra cấu trúc từ tên file/thư mục, KÈM điểm tin cậy."""
    score = 0.0

    # Có thư mục con → gần như chắc chắn mỗi thư mục là một chương
    if has_subdirectories(files):
        score += 0.5

    # Tên file có tiền tố số (01-, 02-, Bai1, Chuong2...) → có thứ tự rõ ràng
    numbered_ratio = count_numbered_prefix(files) / len(files)
    score += 0.4 * numbered_ratio

    # Tên file dài, có nghĩa (không phải "final_v2_REAL.pdf")
    score += 0.1 * meaningful_name_ratio(files)

    return TreeAnalysis(structure=..., confidence=score)


# Ngưỡng quyết định
analysis = analyze_tree(files)
if analysis.confidence >= 0.75:
    outline = analysis.structure          # Tier 0 — 0 token
else:
    outline = await llm_group_files(...)  # Qwen/Gemini vào cuộc
```

**Ví dụ thực tế:**

| Cấu trúc ZIP | Điểm | Xử lý |
|---|---|---|
| `01-Gioi-thieu/01-Python-la-gi.pdf`, `02-Bien/...` | ~0,95 | Tier 0, **0 token** |
| Tất cả 50 file phẳng, tên `Bai1.pdf`, `Bai2.pdf` | ~0,55 | LLM nhóm lại thành chương |
| 50 file phẳng, tên `final.pdf`, `sua_lan_3.pdf` | ~0,15 | LLM đọc **nội dung** để nhóm |

Như vậy Qwen vẫn làm đúng việc bạn muốn — chỉ là **chỉ khi cần**. ZIP gọn gàng
thì không tốn gì; ZIP lộn xộn thì AI dọn hộ.

---

## 1.4. ★ "Tắt server thì code ở local kiểu gì?" — Câu hỏi quan trọng nhất

Bạn hoàn toàn đúng, và đây là **ràng buộc thiết kế phải giải quyết ngay từ đầu**,
không phải chắp vá về sau.

### Giải pháp: Dò năng lực lúc chạy (Capability Probe)

Đường ống xử lý **không được phép giả định** provider nào đang có. Đầu mỗi job,
nó tự hỏi "lúc này tôi có gì trong tay?" rồi chọn kế hoạch phù hợp.

```python
# src/core/capabilities.py — Ý TƯỞNG
@dataclass
class Capabilities:
    qwen: bool        # vLLM có phản hồi không
    gemini: bool      # còn khóa nào khỏe không
    whisper: bool     # có GPU / model nạp được không
    cloudinary: bool  # đã cấu hình chưa

async def probe() -> Capabilities:
    """Dò MỘT LẦN đầu job, cache trong suốt job đó.

    Dò một lần chứ không dò mỗi bước: nếu dò lại liên tục, một job 200 file
    sẽ tạo ra 200 lượt healthcheck vô ích. Trong một job vài phút, trạng thái
    hạ tầng gần như không đổi.
    """
    ...
```

Ba chế độ tự phát hiện, **cùng một mã nguồn, không đổi cấu hình**:

| Chế độ | Hoàn cảnh | Hệ thống tự làm gì |
|---|---|---|
| 🏠 **LOCAL** | Máy bạn, vLLM tắt, không GPU | Tier 0 + **Gemini** cho phần AI. Bỏ qua phụ đề, đánh dấu "chờ xử lý" |
| ☁️ **SERVER** | GPU EC2 bật đủ | Tier 0 + **Qwen** chính, Gemini dự phòng. Phụ đề chạy nền |
| 🛟 **DEGRADED** | Cả Qwen lẫn Gemini đều chết | **Tier 0 vẫn ra bản nháp**, gắn cờ "AI chưa xử lý — vui lòng hoàn thiện thủ công" |

Điểm mấu chốt của chế độ DEGRADED: **tính năng không bao giờ hỏng hoàn toàn.**
Không có AI thì vẫn có cấu trúc từ tên file — vẫn hơn hẳn việc giảng viên gõ tay
từ số 0.

### Ba mẹo để code ở local mà không đốt quota

**1. Chế độ ghi–phát lại (replay) — hữu ích nhất khi làm giao diện**

```bash
LLM_MODE=record   # gọi thật, đồng thời lưu response vào fixtures/*.json
LLM_MODE=replay   # KHÔNG gọi mạng, đọc từ fixtures ra
LLM_MODE=live     # bình thường
```

Chạy `record` **đúng một lần** với một ZIP mẫu. Sau đó suốt quá trình làm giao
diện (chỉnh màu, sửa bố cục, sửa logic kéo-thả — hàng trăm lần chạy lại), bật
`replay`: **0 token, phản hồi tức thì**. Chi phí thực hiện: khoảng 40 dòng code.

Đây cũng là nền cho việc viết test tự động sau này (Level 4).

**2. Ollama cho Qwen bản nhỏ trên máy cá nhân (tùy chọn)**

Nếu máy bạn có ≥16GB RAM, cài Ollama rồi chạy `qwen3:4b` hoặc `qwen3:8b`. Nó
cũng phơi ra **API tương thích OpenAI** — nghĩa là chỉ cần đổi `VLLM_BASE_URL`
sang `http://localhost:11434/v1`, **không phải sửa một dòng code nào** trong
`llm_provider.py`.

Chất lượng thấp hơn Qwen 27B trên server, nhưng để kiểm tra đường ống chạy đúng
thì thừa đủ. Và tuyệt đối không tốn token.

**3. Bộ nhớ đệm theo hash nội dung**

Cùng một file (SHA-256 giống nhau) → dùng lại kết quả cũ. Lúc phát triển bạn sẽ
nạp đi nạp lại **cùng một ZIP** hàng chục lần; từ lần thứ hai trở đi gần như
miễn phí. Lưu vào Redis với TTL 7 ngày là đủ.

---

## 1.5. Fallback hai chiều Gemini ↔ Qwen

Hiện `llm_provider.py` **chỉ có một chiều**: Qwen hỏng → Gemini. Không có chiều
ngược lại. Bạn nói đúng, cần sửa.

```python
# src/core/llm_provider.py — thay thế logic hiện tại. Ý TƯỞNG.

class AllProvidersFailed(Exception):
    """Mọi provider đều không dùng được. Tầng trên tự quyết định xử lý."""


async def generate_with_fallback(task: LLMTask) -> LLMResult:
    # Thứ tự ưu tiên do BẢNG LUẬT quyết định, không phải LLM quyết định.
    #   - Việc số lượng lớn, độ khó thấp  → Qwen trước (miễn phí)
    #   - Việc cần chất lượng cao         → Gemini trước
    providers = build_provider_order(task, await probe())

    errors = []
    for provider in providers:
        try:
            return await provider.generate(task)
        except ProviderError as e:
            errors.append((provider.name, e))

            # ★ PHÂN LOẠI LỖI — đây là phần quan trọng nhất.
            # Đổi provider chỉ hợp lý khi lỗi thuộc về PHÍA HỌ.
            if e.kind in (QUOTA_EXCEEDED, RATE_LIMITED, SERVER_ERROR, TIMEOUT):
                logger.warning(f"{provider.name} lỗi ({e.kind}), thử provider kế tiếp...")
                continue

            # Lỗi thuộc về PHÍA MÌNH (prompt sai, quá dài, nội dung bị chặn):
            # provider khác cũng sẽ từ chối y hệt. Thử tiếp chỉ tốn thêm thời
            # gian và che mất lỗi thật.
            raise

    raise AllProvidersFailed(errors)
```

### Xử lý khi cả hai đều chết — khác nhau theo ngữ cảnh

Đây là điểm tinh tế: **không phải chỗ nào cũng nên báo lỗi.**

| Ngữ cảnh | Cả hai chết thì làm gì | Vì sao |
|---|---|---|
| **Chat** (`/v1/ai/sessions/:id/chat`) | ❌ Báo lỗi rõ ràng: *"Trợ lý AI hiện không hoạt động, vui lòng thử lại sau"* | Không có câu trả lời thì chẳng còn gì để hiển thị |
| **Nhập khóa học** | ⚠️ **Không báo lỗi** — trả bản nháp Tier 0, gắn cờ `aiEnriched: false` | Cấu trúc từ tên file vẫn dùng được. Bỏ đi cả job vì thiếu phần tô điểm là lãng phí |
| **Gợi ý câu hỏi** | 🔇 Im lặng, trả mảng rỗng | Tính năng phụ, mất cũng không sao |

Giao diện của phần nhập khóa học nên hiện một dải nhắc:

> ⚠️ *AI hiện không khả dụng. Cấu trúc bên dưới được suy ra từ tên tệp và thư
> mục. Bạn có thể chỉnh sửa thủ công, hoặc bấm "Xử lý lại bằng AI" khi dịch vụ
> hoạt động trở lại.*

Nút "Xử lý lại bằng AI" rất đáng làm: giảng viên nhập lúc server tắt, hôm sau
server bật thì làm giàu thêm — **không phải nạp lại ZIP**.

---

## 1.6. Dùng LLM gợi ý giá khóa học

Khả thi, nhưng phải làm đúng cách, nếu không nó sẽ **bịa số**.

**Sai:** *"Khóa học về Python, giá bao nhiêu?"* → LLM đoán bừa, không căn cứ.

**Đúng:** đưa cho LLM **dữ liệu thật từ chính cơ sở dữ liệu của bạn**:

```sql
-- Lấy mặt bằng giá của các khóa cùng danh mục & cùng cấp độ
SELECT
    COUNT(*)                                        AS SoKhoa,
    MIN(ISNULL(DiscountedPrice, OriginalPrice))     AS GiaThapNhat,
    MAX(ISNULL(DiscountedPrice, OriginalPrice))     AS GiaCaoNhat,
    AVG(ISNULL(DiscountedPrice, OriginalPrice))     AS GiaTrungBinh,
    AVG(CAST(SoBaiHoc AS FLOAT))                    AS SoBaiTrungBinh
FROM ...
WHERE CategoryID = @CategoryID
  AND LevelID = @LevelID
  AND StatusID = 'PUBLISHED'
  AND IsLatestVersion = 1;
```

Rồi hỏi LLM: *"Mặt bằng danh mục này là 299k–899k, trung bình 549k cho khóa
trung bình 24 bài. Khóa mới có 31 bài, trình độ Trung cấp. Đề xuất khoảng giá và
giải thích ngắn gọn."*

**Ba nguyên tắc bắt buộc:**

1. **Trả về KHOẢNG giá, không phải một con số.** *"Đề xuất 450.000–650.000đ"*
   trung thực hơn *"599.000đ"* — con số lẻ tạo cảm giác chính xác giả tạo.
2. **Luôn kèm lý do**, để giảng viên đánh giá được lập luận: *"cao hơn trung
   bình vì có nhiều bài hơn 30%, nhưng bạn chưa có đánh giá nào nên nên đặt ở
   nửa dưới của khoảng."*
3. **KHÔNG bao giờ tự đặt giá.** Chỉ gợi ý, ô nhập giá vẫn để trống, giảng viên
   tự điền. Giá là quyết định kinh doanh — AI đặt nhầm một số 0 là mất tiền thật.

Chi phí: **một lời gọi Gemini Flash-Lite duy nhất cho cả khóa học**, khoảng
300 token. Không đáng kể.

---

## 1.7. ★ Whisper hoạt động thế nào trong luồng tự động?

Đây là câu hỏi hay nhất, và câu trả lời có một cảnh báo quan trọng.

### Điều đầu tiên: Whisper KHÔNG tốn token

Whisper là mô hình chạy cục bộ (`faster-whisper`), không phải API. Nó tốn **thời
gian GPU**, không tốn tiền theo lượt gọi. Với hoàn cảnh của bạn, đây là tin tốt.

### Điều thứ hai: Whisper CHẬM — và đây mới là vấn đề

Con số thực tế với cấu hình hiện tại của bạn:

| Môi trường | Cấu hình | Tốc độ | Video 1 giờ mất |
|---|---|---|---|
| GPU EC2 #2 (T4) | `medium` + `float16` + `cuda` | ~5–8× thời gian thực | **~8–12 phút** |
| Máy local | `small` + `int8` + `cpu` | ~1–2× thời gian thực | **~30–60 phút** |

Một ZIP có 10 video, mỗi video 30 phút → **1,5–2 giờ trên GPU**, và **cả buổi**
trên CPU.

👉 **Kết luận: Whisper TUYỆT ĐỐI không được nằm trong luồng nhập khóa học.**
Giảng viên không thể ngồi chờ 2 tiếng để xem bản nháp.

### Thiết kế: tách làm hai giai đoạn

```
━━━ GIAI ĐOẠN 1 — Nhập khóa học (2–10 phút) ━━━━━━━━━━━━━━━━━━━━━

  Giải nén → phát hiện .mp4
      │
      ├─ Upload lên Cloudinary                → có VideoUrl
      ├─ Đọc thời lượng video (ffprobe)       → VideoDurationSeconds
      ├─ Tạo Lesson với LessonType = 'VIDEO'
      └─ Mô tả tạm suy từ TÊN FILE            → 0 token
      
  ✅ Giảng viên xem bản nháp NGAY. Video xem được. Chưa có phụ đề.


━━━ GIAI ĐOẠN 2 — Sau khi giảng viên bấm "Chấp nhận" ━━━━━━━━━━━━

  Với mỗi bài học có video:
      └─ Đẩy job vào hàng đợi `subtitle-queue` (BullMQ)
              │
              │  ⏳ Có thể mất hàng giờ. Không ai phải chờ.
              │  ⏸️  GPU tắt? Job nằm yên trong Redis, bật lên chạy tiếp.
              ▼
      AI Service: download_and_transcribe_task()
              │
              ├─ Tải video từ Cloudinary
              ├─ Whisper phiên âm → .srt
              ├─ Nạp transcript vào ChromaDB   → trợ lý AI hiểu nội dung video
              └─ Webhook về backend            → lưu Subtitles + cập nhật Lesson
                      │
                      └─ (Tùy chọn) Dùng transcript LÀM GIÀU mô tả bài học
                         bằng một lời gọi Qwen — lúc này mới có nội dung thật
```

### Tin tốt: hạ tầng đã có sẵn

Trong `ai-service/src/api/tasks.py` **đã có sẵn** đúng hàm cần dùng:

```python
async def download_and_transcribe_task(
    video_url: str,
    course_name: str,
    lesson_name: str,
    lesson_id: int | None = None,
    webhook_url: str | None = None,   # ← đã có sẵn cơ chế gọi ngược về backend
)
```

Nó đã làm đủ: tải video → phiên âm → nạp RAG → webhook trả SRT. **Bạn gần như
không phải viết mới gì cho phần này**, chỉ cần một hàng đợi BullMQ gọi tới nó.

### Vì sao bắt buộc phải dùng hàng đợi chứ không gọi thẳng

Đây chính là câu trả lời cho mối lo "tắt server để tiết kiệm" của bạn:

- Giảng viên nhập khóa học lúc **23h**, GPU EC2 đang tắt
- Job phụ đề vào hàng đợi Redis, **nằm chờ**
- Sáng hôm sau bạn bật GPU EC2 → worker tự nối lại → **phụ đề xuất hiện dần**
- Giảng viên không hề bị chặn, khóa học vẫn dùng được suốt thời gian đó

Nếu gọi thẳng AI Service thì lời gọi đó thất bại và **mất luôn**, không có gì
thử lại.

### ⚠️ LỖI TÔI PHÁT HIỆN — cần vá trước khi làm tính năng này

`tasks.py` gọi Whisper như sau:

```python
async def download_and_transcribe_task(...):     # ← hàm BẤT ĐỒNG BỘ
    ...
    result = transcribe_video(temp_path)          # ← nhưng đây là hàm ĐỒNG BỘ, chặn luồng
```

`transcribe_video()` là mã tính toán nặng chạy đồng bộ. Gọi thẳng nó trong một
hàm `async` sẽ **chặn đứng event loop của FastAPI** suốt thời gian phiên âm.

Hậu quả cụ thể, không phải lý thuyết:

| Trong lúc phiên âm một video 30 phút... | Điều gì xảy ra |
|---|---|
| Học viên hỏi trợ lý AI | Treo, không phản hồi |
| Docker gọi `/health` | Quá hạn → đánh dấu unhealthy |
| Docker thấy unhealthy nhiều lần | **Khởi động lại container giữa chừng** → phiên âm mất trắng, lặp lại vô hạn |

Bản vá:

```python
import asyncio

# Đẩy phần tính toán nặng sang thread riêng để event loop được giải phóng.
loop = asyncio.get_running_loop()
result = await loop.run_in_executor(None, transcribe_video, temp_path)
```

Hiện tại lỗi này chưa lộ rõ vì phiên âm được gọi thủ công và hiếm khi. **Nhưng
tính năng nhập khóa học sẽ đẩy hàng chục video vào đó** — lúc đó nó thành sự cố
hằng ngày.

### Hai điều chỉnh khác cho Whisper

**1. Giới hạn đồng thời = 1.** Model Whisper `medium` chiếm VRAM cố định trên
T4 16GB. Chạy hai bản phiên âm song song sẽ hết VRAM và crash. Đặt worker của
`subtitle-queue` với `concurrency: 1`.

**2. Nạp sẵn model lúc khởi động (chỉ khi có GPU).** Model nạp lần đầu mất
30 giây–2 phút. Nếu để lần phiên âm đầu tiên gánh chi phí này, nó dễ chạm
timeout. Nạp sẵn trong `lifespan` khi `WHISPER_DEVICE=cuda`; ở local (`cpu`) thì
**đừng nạp** — sẽ làm chậm khởi động mỗi lần bạn sửa code.

---

# PHẦN 2 — KIẾN TRÚC CHỐT LẠI

```
┌─ TRÌNH DUYỆT ────────────────────────────────────────────────┐
│  Upload .zip  →  Xem tiến độ (SSE)  →  Duyệt bản nháp        │
└──────────┬───────────────────────────────────────────────────┘
           │
┌─ BACKEND (CPU EC2) ──────────────────────────────────────────┐
│  • Nhận file, ghi ImportJobs (1 bảng duy nhất)               │
│  • BullMQ: import-queue                                       │
│  • ĐIỀU PHỐI toàn bộ — giữ mọi trạng thái                     │
│  • Đẩy tiến độ qua SSE                                        │
└──────────┬───────────────────────────────────────────────────┘
           │
    ┌──────┴──────┬─────────────────┬──────────────────┐
    ▼             ▼                 ▼                  ▼
┌─ TIER 0 ─┐ ┌─ AI SERVICE ──┐ ┌─ Cloudinary ┐ ┌─ subtitle-queue ─┐
│ Node.js  │ │ (GPU EC2 #2)  │ │  video/ảnh  │ │  CHẠY SAU khi    │
│          │ │               │ │             │ │  giảng viên      │
│ • unzip  │ │ • bóc PDF/PPT │ └─────────────┘ │  chấp nhận       │
│ • cây thư│ │ • Qwen tóm tắt│                 │  ⏸ GPU tắt→chờ   │
│   mục    │ │ • Gemini tổng │                 └──────────────────┘
│ • 0 token│ │   hợp (1 lần) │
└──────────┘ └───────────────┘
```

**Ba nguyên tắc xuyên suốt:**

1. **Tier 0 luôn chạy trước và luôn ra kết quả.** AI chỉ làm giàu thêm.
2. **Backend giữ mọi trạng thái.** AI Service stateless (không chạm được RDS —
   đúng thiết kế Security Group).
3. **Không có gì tự động vào cơ sở dữ liệu thật.** Giảng viên bấm "Chấp nhận"
   thì mới ghi `Courses`/`Sections`/`Lessons` dưới dạng `DRAFT`.

---

# PHẦN 3 — KẾ HOẠCH TRIỂN KHAI

### Giai đoạn A — Chạy được, chưa cần AI (ưu tiên cao nhất)

```
[ ] Vá lỗi run_in_executor cho Whisper (§1.7) — làm TRƯỚC, độc lập
[ ] V9__course_import.sql — 1 bảng ImportJobs
[ ] safe_extract(): chặn Zip Slip, zip bomb, symlink, archive lồng nhau
[ ] Bóc text: pymupdf, python-docx, python-pptx, chardet
    → đồng thời vá luôn loader.py (hiện chỉ đọc .txt/.md/.csv)
[ ] analyze_tree() + điểm tin cậy (§1.3)
[ ] BullMQ import-queue + tiến độ qua SSE
[ ] Màn hình duyệt bản nháp (kéo-thả, bỏ tick, sửa tại chỗ)
[ ] Nút "Chấp nhận" → tạo khóa DRAFT
```
🎯 **Mốc này đã demo được trọn vẹn, 0 token, không phụ thuộc server AI.**

### Giai đoạn B — Lớp AI có khả năng chống chịu

```
[ ] capabilities.probe() — dò năng lực lúc chạy (§1.4)
[ ] generate_with_fallback() — hai chiều + phân loại lỗi (§1.5)
[ ] Chế độ record/replay (§1.4) — làm SỚM, tiết kiệm nhiều nhất
[ ] Cache theo SHA-256 trên Redis
[ ] Tier 1 (Qwen): tóm tắt + phân loại theo lô
[ ] Tier 3 (Gemini): tổng hợp đề cương — 1 lời gọi/khóa
[ ] Chế độ DEGRADED + nút "Xử lý lại bằng AI"
```

### Giai đoạn C — Hoàn thiện

```
[ ] subtitle-queue (concurrency = 1) + webhook
[ ] Làm giàu mô tả bài học từ transcript
[ ] Gợi ý giá dựa trên dữ liệu thật (§1.6)
[ ] Sinh câu hỏi trắc nghiệm → QuizQuestions + QuizOptions
[ ] Đồng hồ tiết kiệm token
[ ] KeyPool có theo dõi sức khỏe
```

**Thư viện cần thêm** (`ai-service/pyproject.toml`):
```toml
"pymupdf>=1.24",     # PDF — nhanh hơn pypdf ~10 lần
"python-docx>=1.1",
"python-pptx>=0.6",  # slide là định dạng phổ biến nhất của giảng viên
"chardet>=5.2",      # đoán bảng mã — cần cho .txt tiếng Việt
```

Backend chỉ cần `unzipper` hoặc `adm-zip` (giải nén), không cần gì thêm.

---

# PHẦN 4 — TÓM TẮT NHỮNG GÌ THAY ĐỔI SO VỚI BẢN TRƯỚC

| Vấn đề | Bản trước | Bản này |
|---|---|---|
| Google Drive | 3 giai đoạn | ❌ Bỏ hẳn |
| Số bảng | 2 | ✅ **1** — bạn nói đúng, tôi thiết kế thừa |
| Qwen với cấu trúc thư mục | "đừng dùng LLM" | ✅ Dùng — nhưng **theo ngưỡng tin cậy** |
| Chạy ở local | Không đề cập | ✅ **Capability Probe + replay mode** |
| Fallback | Một chiều | ✅ **Hai chiều + phân loại lỗi + DEGRADED** |
| Whisper | Chỉ nhắc qua | ✅ Tách 2 giai đoạn + **phát hiện lỗi chặn event loop** |
| Gợi ý giá | Không có | ✅ Có, **dựa trên dữ liệu thật** |

**Ba việc nên làm đầu tiên, theo đúng thứ tự:**

| # | Việc | Vì sao trước |
|---|---|---|
| 1 | Vá `run_in_executor` cho Whisper | Lỗi có thật, đang tồn tại, độc lập với tính năng mới. 3 dòng code |
| 2 | `safe_extract()` đủ 4 lớp chặn | Không có nó thì đây là lỗ hổng bảo mật, không phải tính năng |
| 3 | Tier 0 + màn hình duyệt | Demo được ngay, không cần server AI, không sợ hết quota |

Sau ba việc này bạn đã có một tính năng hoàn chỉnh để trình bày. Phần AI ở giai
đoạn B là lớp làm cho nó ấn tượng hơn — **không phải thứ nó phụ thuộc vào để
sống**. Đó cũng chính là điều bạn đang lo, và kiến trúc này giải quyết đúng nó.
