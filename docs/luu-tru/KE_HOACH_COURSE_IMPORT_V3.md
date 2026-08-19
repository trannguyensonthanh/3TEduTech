# Kế hoạch v3 — Nhập khóa học từ ZIP (bản chốt)

> 17/08/2026 · Trả lời 6 thắc mắc + kiến trúc đã sửa
> Trong bản này tôi **đổi ý ở 2 chỗ** so với v2 — đều vì bạn hỏi đúng.

---

# PHẦN 1 — TRẢ LỜI

## 1.1. ★ "Upload video lên Cloudinary luôn? Nếu tôi hủy không thêm khóa học thì video đó ra sao?"

**Bạn bắt đúng một lỗi thiết kế của tôi.** Đây là vấn đề *tài nguyên mồ côi*
(orphaned assets), và với hoàn cảnh của bạn nó nghiêm trọng hơn bình thường:
Cloudinary tính hạn mức theo **dung lượng lưu trữ + băng thông**, mà video ngốn
cả hai. Nạp thử 5 lần rồi hủy cả 5 là mất sạch hạn mức tháng cho... không gì cả.

### Sửa lại: KHÔNG upload video trong lúc nhập

```
━━ GIAI ĐOẠN 1 — Nhập (2–10 phút) ━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Video nằm YÊN trên đĩa tạm của CPU EC2.
  Chỉ đọc metadata bằng ffprobe (nhẹ, vài mili-giây/file):
      • Thời lượng   → để ước tính thời gian làm phụ đề
      • 1 ảnh thumbnail → để giảng viên nhận ra video nào là video nào
  KHÔNG chạm tới Cloudinary. KHÔNG tốn một byte hạn mức nào.

━━ Giảng viên xem bản nháp ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ┌─ HỦY ──────────────► Xóa thư mục tạm. Cloudinary sạch sẽ. Mất 0 đồng.
  │
  └─ CHẤP NHẬN ────────► Lúc này MỚI upload lên Cloudinary
                          (chạy nền qua hàng đợi, không bắt ai chờ)
```

### Vì sao làm được như vậy mà không mất gì

Màn hình duyệt **không thật sự cần phát được video**. Giảng viên đang xem lại
tài liệu *của chính họ* — họ chỉ cần biết "à, file này nằm ở chương 2, tên bài
là X, dài 24 phút". Ảnh thumbnail + tên + thời lượng là đủ.

Đổi lại, ta được ba thứ:

| Lợi ích | Chi tiết |
|---|---|
| Không có tài nguyên mồ côi | Hủy = xóa thư mục tạm, hết chuyện |
| Nhập nhanh hơn hẳn | Upload 500MB lên Cloudinary là bước **chậm nhất** của cả quy trình — nay nó ra khỏi đường đi chính |
| Thử nghiệm thoải mái | Bạn nạp đi nạp lại 20 lần lúc dev mà không tốn hạn mức |

### Quản lý thư mục tạm

```
/var/lib/3tedu/imports/{jobId}/
├── extracted/          ← cây thư mục gốc sau giải nén
└── thumbs/             ← ảnh thumbnail sinh từ video
```

Bốn ràng buộc bắt buộc:

1. **TTL 48 giờ.** Cron dọn mọi thư mục job quá hạn. Giảng viên bỏ dở thì hệ
   thống tự dọn, không cần ai nhớ.
2. **Kiểm tra dung lượng đĩa trống TRƯỚC khi nhận file.** Còn dưới 5GB thì từ
   chối kèm thông báo rõ ràng, thay vì để đĩa đầy làm chết cả backend.
3. **Tối đa 1 job đang chạy / giảng viên**, tối đa 3 job toàn hệ thống. Một ZIP
   500MB giải nén ra có thể hơn 1GB.
4. ⚠️ **Phải là Docker volume**, không phải thư mục trong container. Container
   khởi động lại là mất sạch — mà container *sẽ* khởi động lại (deploy, healthcheck
   thất bại, hết bộ nhớ).
   ```yaml
   # docker-compose.cpu-ec2.yml
   volumes:
     - import-temp:/var/lib/3tedu/imports
   ```

### Sau khi "Chấp nhận" thì upload lúc nào?

Cũng chạy nền, vì upload 500MB mất vài phút:

```
Bấm "Chấp nhận"
  → Tạo Course DRAFT + Sections + Lessons NGAY (chỉ ghi DB, ~1 giây)
  → Bài học video tạm ở trạng thái "đang tải lên"
  → Đẩy job vào `media-upload-queue` cho từng video
  → Upload xong: cập nhật ExternalVideoID + xóa file tạm của chính nó
```

Giảng viên thấy khóa học xuất hiện tức thì, video "sáng đèn" dần trong vài phút.
Khóa đang là `DRAFT` nên chưa ai học — không vội.

---

## 1.2. ★ "Ưu tiên file .srt cùng tên. Không có thì HỎI người dùng có muốn dùng AI không, cảnh báo là lâu"

**Ý này rất hay và tôi hoàn toàn đồng ý.** Nó giải quyết đúng ba vấn đề cùng lúc:
tiết kiệm thời gian GPU, tôn trọng công sức giảng viên đã bỏ ra, và đặt thao tác
tốn kém sau một lần đồng ý tường minh.

### Quy tắc ghép phụ đề

Ghép theo **tên gốc** (bỏ phần mở rộng), chấp nhận vài biến thể phổ biến:

```
bai1.mp4  +  bai1.srt          ✅ khớp
bai1.mp4  +  bai1.vi.srt       ✅ khớp (có hậu tố ngôn ngữ)
bai1.mp4  +  bai1.vtt          ✅ khớp (chuyển .vtt → .srt)
video/bai1.mp4 + subs/bai1.srt ✅ khớp (khác thư mục vẫn ghép được)
```

Ghép chéo thư mục quan trọng, vì nhiều người để phụ đề riêng một thư mục `subs/`.

### Màn hình hỏi ý kiến — thiết kế đề xuất

Sau khi bản nháp sẵn sàng, hiện một khối riêng:

```
┌───────────────────────────────────────────────────────────────┐
│  📝 Phụ đề                                                     │
│                                                                │
│  ✅ 7 video đã có sẵn phụ đề trong tệp ZIP — dùng luôn         │
│                                                                │
│  ⚠️ 3 video chưa có phụ đề:                                    │
│     ☑ 02-Vong-lap.mp4          24 phút                        │
│     ☑ 03-Ham.mp4               31 phút                        │
│     ☐ 05-Bai-tap-tong-hop.mp4  58 phút                        │
│                                                                │
│  Ước tính: ~11 phút xử lý (GPU đang bật)                      │
│                                                                │
│  ⏳ Phụ đề được tạo trong nền. Bạn KHÔNG cần chờ — khóa học    │
│     dùng được ngay, phụ đề xuất hiện dần sau đó.              │
│                                                                │
│         [ Bỏ qua ]        [ Tạo phụ đề cho 2 video đã chọn ]   │
└───────────────────────────────────────────────────────────────┘
```

Ba chi tiết đáng chú ý trong thiết kế này:

**Tick từng video, không phải nút "tất cả hay không".** Giảng viên thường muốn
làm phụ đề cho bài giảng chính nhưng bỏ qua video bài tập dài 1 tiếng. Cho họ
chọn.

**Ước tính thời gian phải trung thực và phụ thuộc trạng thái GPU thật:**

```python
# Hệ số thực đo với cấu hình hiện tại của bạn
FACTOR_GPU = 6.0   # T4 + medium + float16 ≈ 6× thời gian thực
FACTOR_CPU = 1.2   # small + int8 ≈ 1,2× — chậm hơn rất nhiều

def estimate(total_seconds: float, caps: Capabilities) -> str:
    if not caps.whisper:
        return "Máy chủ GPU đang tắt — phụ đề sẽ được tạo khi máy chủ bật lại"
    factor = FACTOR_GPU if caps.gpu else FACTOR_CPU
    minutes = math.ceil(total_seconds / factor / 60)
    return f"~{minutes} phút"
```

Dòng "máy chủ GPU đang tắt" **đặc biệt quan trọng với bạn**: nó biến việc tắt
server để tiết kiệm thành một trạng thái được hiển thị đàng hoàng, thay vì một
lỗi bí ẩn. Job vẫn nằm chờ trong hàng đợi và chạy khi bạn bật máy.

**Nhắc rõ "không cần chờ".** Nếu không nói, giảng viên sẽ ngồi nhìn màn hình 11
phút. Câu này khiến họ yên tâm rời đi.

### Ghi chú kỹ thuật

- Bảng `Subtitles` **đã có sẵn** (`subtitle.repository.js`) — chỉ cần ghi vào,
  không phải tạo mới.
- Phụ đề có sẵn trong ZIP đi thẳng vào DB ở giai đoạn "Chấp nhận", **không qua
  hàng đợi**, vì nó chỉ là chép text.
- Có thể cho phép giảng viên bấm "Tạo phụ đề" **sau này** từ trang quản lý bài
  học — không nhất thiết phải quyết ngay lúc nhập.

---

## 1.3. "Tạo quy ước đặt tên ZIP thì có mất tính tự động của AI không?"

**Đây là một lựa chọn giả.** Bạn không phải chọn một trong hai.

Cách làm đúng là **quy ước ưu tiên hơn cấu hình** (convention over configuration):
hệ thống **gợi ý** một cấu trúc, nhưng **chạy được kể cả khi không theo**.

| ZIP của giảng viên | Điểm tin cậy | Hệ thống làm gì | Chi phí |
|---|---|---|---|
| Theo đúng quy ước | ~0,95 | Tier 0 dựng cấu trúc | **0 token**, nhanh |
| Có thư mục nhưng tên lộn xộn | ~0,55 | AI nhóm lại giúp | Vài nghìn token |
| 50 file phẳng, tên vô nghĩa | ~0,15 | AI đọc nội dung để nhóm | Nhiều hơn |

**AI không biến mất — nó chuyển vai từ "người dựng chính" thành "lưới an toàn".**

### Và đây là điểm mấu chốt: cấu trúc chỉ là ~20% việc của AI

Kể cả khi ZIP hoàn hảo 100%, AI vẫn làm những việc mà quy ước không bao giờ thay
thế được:

| Việc | Quy ước làm được? |
|---|---|
| Chia chương, sắp thứ tự | ✅ Có — đây là 20% |
| **Viết mô tả từng bài từ NỘI DUNG** (không phải từ tên file) | ❌ Không |
| **Viết mô tả khóa học, mục tiêu học tập, yêu cầu đầu vào** | ❌ Không |
| **Sinh câu hỏi trắc nghiệm** | ❌ Không |
| **Đánh giá độ khó, gợi ý kỹ năng/thẻ** | ❌ Không |
| **Tóm tắt nội dung video từ transcript** | ❌ Không |

Nói cách khác: quy ước chỉ loại bỏ phần **AI phải ĐOÁN** — mà đó cũng chính là
phần AI dễ sai nhất. Phần AI thật sự giỏi (đọc hiểu và viết) vẫn nguyên vẹn.

### Quy ước đề xuất

```
Ten-Khoa-Hoc/
├── _khoa-hoc.md                  ← tùy chọn: mô tả, mục tiêu, yêu cầu
├── 01 - Gioi thieu/
│   ├── _chuong.md                ← tùy chọn: mô tả chương
│   ├── 01 - Python la gi.mp4
│   ├── 01 - Python la gi.srt     ← phụ đề đi kèm, cùng tên
│   └── 02 - Cai dat moi truong.pdf
└── 02 - Bien va kieu du lieu/
    └── 01 - Bien.pptx
```

- Thư mục cấp 1 = **chương**, số đầu tên = thứ tự
- File trong thư mục = **bài học**, số đầu tên = thứ tự
- File bắt đầu bằng `_` = siêu dữ liệu, **không phải bài học**
- Tự bỏ qua: `__MACOSX`, `.DS_Store`, `Thumbs.db`, `.git`, `node_modules`

### Cách trình bày để không giống một "luật lệ"

Hai chi tiết giao diện biến quy ước thành **gợi ý**, không phải rào cản:

**1. Nút tải "ZIP mẫu"** ngay cạnh ô upload. Giảng viên tải về, thay tài liệu
của mình vào, nén lại. Không phải đọc tài liệu hướng dẫn nào.

**2. Kiểm tra trước khi xử lý** — sau khi chọn file, trước khi bấm bắt đầu:

```
✅ Cấu trúc rõ ràng (0,92/1,0)
   Phát hiện 4 chương, 23 bài học. Hệ thống sẽ xử lý nhanh và chính xác.
   [ Bắt đầu ]
```
```
⚠️ Cấu trúc chưa rõ ràng (0,31/1,0)
   Tất cả 47 tệp nằm cùng một thư mục. AI sẽ phân tích nội dung để
   chia chương — chậm hơn và có thể cần bạn chỉnh lại nhiều.

   💡 Sắp xếp theo cấu trúc gợi ý sẽ cho kết quả tốt hơn hẳn.  [Xem mẫu]
   [ Vẫn tiếp tục ]  [ Để tôi sắp lại đã ]
```

Đây là **khuyến khích**, không phải chặn. Người vội cứ bấm tiếp tục; người muốn
kết quả tốt sẽ tự sắp lại. Và bạn tiết kiệm được token từ chính sự lựa chọn của
họ.

---

## 1.4. "Phần Qwen làm mà nó vắng mặt thì LLM khác thay và ngược lại — đã có chưa?"

**Có, ở §1.5 của bản v2.** Nhưng tôi viết chưa đủ rõ, nên cụ thể hóa lại đây:

| Công việc | Ưu tiên 1 | Ưu tiên 2 | Cả hai chết |
|---|---|---|---|
| Tóm tắt file (số lượng lớn) | **Qwen** (miễn phí) | Gemini Flash-Lite | Dùng 300 ký tự đầu của file |
| Phân loại bài giảng / bài tập | **Qwen** | Gemini Flash-Lite | Suy từ phần mở rộng + tên |
| Nhóm file thành chương | **Qwen** | Gemini Flash | Dùng cây thư mục (Tier 0) |
| Viết mô tả khóa học | **Gemini Flash** (chất lượng) | Qwen | Ghép mô tả các chương |
| Sinh câu hỏi trắc nghiệm | **Gemini Flash** | Qwen | Bỏ qua, để trống |

Hai chiều đầy đủ: Qwen chết → Gemini gánh; Gemini hết quota → Qwen gánh. Và
**cột cuối cùng mới là thứ quan trọng nhất** — cả hai chết thì vẫn có kết quả,
chỉ là thô hơn.

Điểm kỹ thuật mấu chốt là **phân loại lỗi**, quyết định có nên đổi provider hay
không:

```python
# 429 / hết quota / 5xx / timeout  → LỖI PHÍA HỌ  → đổi provider ngay
# 400 / prompt quá dài / bị chặn   → LỖI PHÍA MÌNH → provider khác cũng từ chối,
#                                     đổi chỉ tốn thời gian và che mất lỗi thật
```

Không phân loại mà cứ thấy lỗi là đổi provider, bạn sẽ gặp cảnh: prompt bị lỗi,
hệ thống thử Qwen → lỗi → thử Gemini → lỗi → thử khóa Gemini thứ 2 → lỗi... đốt
sạch quota vì một dấu ngoặc sai.

---

## 1.5. ★ "Bảng ImportJobs có thật sự cần không? Dùng bảng tạm được không?"

**Bạn đúng lần thứ hai. Bỏ luôn bảng SQL — dùng Redis.**

v1 tôi đề xuất 2 bảng, v2 rút còn 1, giờ là **0**. Bạn đẩy đúng hướng cả hai lần.

### Vì sao Redis hợp hơn ở đây

Dữ liệu này **bản chất là tạm thời**:
- Giảng viên chấp nhận → nó hóa thân thành `Courses`/`Sections`/`Lessons` thật
- Giảng viên hủy → nó là rác

Nó **không bao giờ** là dữ liệu cần giữ lâu dài. Mà đó chính là định nghĩa của
thứ nên nằm trong Redis.

| | Bảng SQL | Redis + TTL |
|---|---|---|
| Dọn dẹp | Phải viết cron xóa job cũ | **TTL tự lo** — 0 dòng code |
| Migration | Cần V9 | **Không cần** |
| Khớp vòng đời với file tạm | Phải đồng bộ thủ công | **Cùng TTL, tự nhất quán** |
| Mất khi Redis flush | — | Giảng viên nạp lại ZIP |

Về rủi ro Redis bị xóa: file tạm trên đĩa cũng có TTL riêng, nên **nếu Redis mất
thì file tạm cũng thành mồ côi** — tức là bạn *đằng nào cũng phải* dọn đĩa theo
lịch. Để trạng thái cùng chỗ với vòng đời của file khiến hai thứ luôn khớp nhau.
Còn hậu quả xấu nhất khi mất là "phải nạp lại ZIP" — phiền, nhưng không mất dữ
liệu thật nào cả.

### Thiết kế

```javascript
// BullMQ lo HÀNG ĐỢI CÔNG VIỆC.
// Khóa Redis riêng lo TRẠNG THÁI + KẾT QUẢ, có TTL tường minh.
//
// Vì sao tách đôi thay vì nhét hết vào job data của BullMQ:
// BullMQ tự dọn job đã hoàn thành theo `removeOnComplete`. Nếu để bản nháp
// trong đó, nó có thể biến mất trước khi giảng viên kịp xem — và bạn không
// kiểm soát được thời điểm.

const KEY = (jobId) => `import:job:${jobId}`;
const TTL_SECONDS = 48 * 3600;

await redis.setex(KEY(jobId), TTL_SECONDS, JSON.stringify({
  accountId,
  sourceName,
  status,          // PENDING | PROCESSING | READY | FAILED | ACCEPTED
  progress,        // 0..100
  statusMessage,   // "Đang đọc 12/48 tệp..."
  proposed,        // ← toàn bộ bản nháp
  stats,           // token đã dùng, số file mỗi tier
}));
```

Danh sách job của một giảng viên: một Redis Set nhỏ `import:user:{accountId}`
cùng TTL. Đủ dùng.

> **Khi nào thì mới cần bảng SQL?** Nếu sau này bạn muốn thống kê *"tính năng
> nhập khóa học được dùng bao nhiêu lần, tỉ lệ chấp nhận bao nhiêu"* cho báo
> cáo. Lúc đó thêm **một bảng log chỉ-ghi-thêm** với vài cột
> (`AccountID, FileName, FileCount, Accepted, CreatedAt`) — nhẹ và tách bạch.
> Nhưng đó là chuyện của Level 4, không phải bây giờ.

**Tổng kết: tính năng này cần đúng 0 migration.** Không `V9__` gì cả.

---

## 1.6. Bỏ gợi ý giá ✅

Bỏ. Giảng viên tự nhập. Đỡ một lời gọi LLM và đỡ một tranh cãi về việc AI có nên
đụng vào quyết định kinh doanh hay không.

---

# PHẦN 2 — LUỒNG HOÀN CHỈNH SAU KHI SỬA

```
┌─ 1. TẢI LÊN ────────────────────────────────────────────────┐
│  Chọn file .zip                                              │
│  → Kiểm tra trước: hiện điểm tin cậy cấu trúc                │
│  → Kiểm tra dung lượng đĩa trống                             │
└──────────┬───────────────────────────────────────────────────┘
           ▼
┌─ 2. XỬ LÝ (nền, 2–10 phút, tiến độ qua SSE) ────────────────┐
│  a. safe_extract() → /var/lib/3tedu/imports/{jobId}/         │
│  b. Duyệt cây, phân loại theo phần mở rộng     [0 token]     │
│  c. Ghép .srt với .mp4 theo tên                [0 token]     │
│  d. ffprobe: thời lượng + thumbnail            [0 token]     │
│  e. Bóc text PDF/DOCX/PPTX                     [0 token]     │
│  f. analyze_tree() → điểm tin cậy              [0 token]     │
│  g. Nếu điểm thấp → LLM nhóm lại               [Qwen→Gemini] │
│  h. LLM viết mô tả bài học + khóa học          [Qwen→Gemini] │
│  → Lưu Redis, TTL 48h                                        │
│  ⚠️ CHƯA hề chạm Cloudinary                                   │
└──────────┬───────────────────────────────────────────────────┘
           ▼
┌─ 3. DUYỆT BẢN NHÁP ─────────────────────────────────────────┐
│  • Kéo-thả sắp lại chương/bài                                │
│  • Sửa tiêu đề, mô tả tại chỗ                                │
│  • Bỏ tick file không muốn                                   │
│  • Khối phụ đề: 7 video có sẵn ✅ / 3 video chưa ⚠️ (§1.2)    │
└──────┬─────────────────────────────────┬─────────────────────┘
       │ HỦY                             │ CHẤP NHẬN
       ▼                                 ▼
┌──────────────────┐   ┌─ 4. GHI DỮ LIỆU ────────────────────┐
│ Xóa thư mục tạm  │   │  • Course DRAFT + Sections + Lessons │
│ Xóa khóa Redis   │   │  • Phụ đề có sẵn → ghi thẳng DB      │
│ Cloudinary sạch  │   │  • → media-upload-queue (video)      │
│ Mất 0 đồng ✅     │   │  • → subtitle-queue (chỉ video đã tick)│
└──────────────────┘   │  ⏸ GPU tắt? Job nằm chờ, không mất   │
                       └──────────────────────────────────────┘
```

---

# PHẦN 3 — KẾ HOẠCH TRIỂN KHAI (cập nhật)

### Giai đoạn A — Chạy được, không cần AI, không cần server GPU

```
[ ] Vá run_in_executor cho Whisper (lỗi có sẵn — làm trước, 3 dòng)
[ ] Thêm ffmpeg vào Dockerfile backend (apt-get install -y ffmpeg)
    → dùng ffprobe lấy thời lượng + thumbnail
[ ] Docker volume `import-temp` + cron dọn TTL 48h + kiểm tra đĩa trống
[ ] safe_extract(): Zip Slip, zip bomb, symlink, archive lồng nhau
[ ] Bóc text: pymupdf, python-docx, python-pptx, chardet
    → đồng thời vá loader.py (đang chỉ đọc .txt/.md/.csv)
[ ] Ghép .srt ↔ .mp4 theo tên gốc
[ ] analyze_tree() + điểm tin cậy
[ ] Trạng thái job trên Redis (KHÔNG bảng SQL)
[ ] BullMQ import-queue + tiến độ SSE
[ ] Màn hình duyệt + khối hỏi phụ đề
[ ] "Chấp nhận" → Course DRAFT + media-upload-queue
[ ] ZIP mẫu tải về + kiểm tra trước khi xử lý
```
🎯 **Demo được trọn vẹn. 0 token. Không cần GPU. Không tốn Cloudinary khi hủy.**

### Giai đoạn B — Lớp AI chống chịu

```
[ ] capabilities.probe()
[ ] generate_with_fallback() hai chiều + phân loại lỗi
[ ] Chế độ record/replay (làm sớm — tiết kiệm nhiều nhất khi dev)
[ ] Cache theo SHA-256 trên Redis
[ ] Qwen: tóm tắt + phân loại theo lô
[ ] Gemini: tổng hợp đề cương (1 lời gọi/khóa)
[ ] Chế độ DEGRADED + nút "Xử lý lại bằng AI"
```

### Giai đoạn C — Hoàn thiện

```
[ ] subtitle-queue (concurrency = 1) + webhook
[ ] Làm giàu mô tả bài học từ transcript
[ ] Sinh câu hỏi trắc nghiệm → QuizQuestions + QuizOptions
[ ] Đồng hồ tiết kiệm token
[ ] KeyPool theo dõi sức khỏe
```

---

# PHẦN 4 — NHỮNG GÌ ĐÃ ĐỔI QUA 3 BẢN

| Vấn đề | v1 | v2 | **v3 (chốt)** |
|---|---|---|---|
| Google Drive | 3 giai đoạn | Bỏ | Bỏ |
| Bảng SQL | 2 bảng | 1 bảng | ✅ **0 bảng — dùng Redis** |
| Video → Cloudinary | Lúc nhập | Lúc nhập | ✅ **Lúc CHẤP NHẬN** |
| Phụ đề | Tự động hết | Tự động hết | ✅ **Ưu tiên .srt có sẵn + hỏi trước** |
| Quy ước ZIP | Không có | Không có | ✅ **Có, kèm ZIP mẫu + kiểm tra trước** |
| Gợi ý giá | Có | Có | ✅ Bỏ |

**Hai chỗ tôi đổi ý vì bạn hỏi đúng:**

1. **Video/Cloudinary** — tôi đã bỏ sót chi phí của tài nguyên mồ côi. Bạn hỏi
   "hủy thì video ra sao" là đúng trọng tâm. Hoãn upload tới lúc chấp nhận vừa
   sửa được lỗi đó, vừa làm quy trình nhập nhanh hơn.
2. **Bảng SQL** — bạn ép đúng hai lần, và cả hai lần đều đúng. Dữ liệu tạm thì
   nằm ở chỗ dành cho dữ liệu tạm.

**Ba việc làm đầu tiên, đúng thứ tự:**

| # | Việc | Vì sao |
|---|---|---|
| 1 | Vá `run_in_executor` cho Whisper | Lỗi thật, đang tồn tại, độc lập với tính năng mới |
| 2 | `safe_extract()` + volume + cron dọn | Thiếu thì đây là lỗ hổng bảo mật và bom hẹn giờ cho ổ đĩa |
| 3 | Tier 0 + ghép .srt + màn hình duyệt | Demo được ngay, không cần AI, không cần GPU, không tốn Cloudinary |

Sau ba việc này bạn đã có một tính năng hoàn chỉnh để bảo vệ. Lớp AI ở giai đoạn
B làm nó ấn tượng hơn — **nhưng không phải thứ nó cần để sống sót**.
