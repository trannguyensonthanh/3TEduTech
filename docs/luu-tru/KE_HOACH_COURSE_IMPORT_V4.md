# Kế hoạch v4 — Nhập khóa học từ ZIP (bản đầy đủ)

> 18/08/2026 · Bổ sung: môi trường local ↔ server, phủ đầy đủ trường dữ liệu,
> nhóm nhiều API key Gemini.
> Kế thừa v3 (0 bảng SQL · video upload lúc chấp nhận · ưu tiên .srt có sẵn).

---

# PHẦN 1 — LOCAL vs SERVER: LƯU TRỮ

## 1.1. Bạn nói đúng — tôi mới chỉ mô tả phía server

Nguyên tắc: **mã nguồn không được biết mình đang chạy ở đâu.** Đường dẫn lưu trữ
là **cấu hình**, không phải hằng số trong code.

```js
// src/config/index.js — bổ sung
IMPORT_TEMP_DIR: Joi.string()
  .default('/var/lib/3tedu/imports')
  .description('Thư mục tạm giải nén ZIP. Local và server khác nhau qua .env'),

IMPORT_TTL_HOURS: Joi.number().default(48),
IMPORT_MAX_ZIP_MB: Joi.number().default(200),
IMPORT_MIN_FREE_DISK_GB: Joi.number().default(5),
```

```env
# .env  (máy bạn)
IMPORT_TEMP_DIR=/app/.tmp/imports
IMPORT_MAX_ZIP_MB=200

# .env.production  (CPU EC2)
IMPORT_TEMP_DIR=/var/lib/3tedu/imports
IMPORT_MAX_ZIP_MB=500
```

Code chỉ viết `config.importTempDir`. **Không một dòng `if (isProduction)` nào.**

## 1.2. ⚠️ Điểm quan trọng: dùng named volume, KHÔNG dùng bind mount

`docker-compose.dev.yml` hiện mount mã nguồn bằng bind mount:

```yaml
volumes:
  - ./3t-edu-tech-backend:/app     # ← ổ đĩa Windows của bạn
```

**Tuyệt đối đừng để thư mục tạm nằm trong đó.** Ba lý do:

1. **Ổ Windows (NTFS) không phân biệt hoa/thường; ổ server (ext4) thì có.**
   Trên máy bạn, `Bai1.PDF` và `bai1.pdf` là **một file** — file sau ghi đè file
   trước, bạn không hề biết. Lên server chúng là **hai file** khác nhau. Kết quả:
   local ra 20 bài, server ra 21 bài. Rất khó lần ra nguyên nhân.
2. **Bind mount qua Docker Desktop trên Windows chậm khủng khiếp** — giải nén
   1000 file có thể chậm gấp 10–20 lần so với volume gốc Linux.
3. Rác giải nén sẽ nằm lẫn vào cây mã nguồn, dễ vô tình commit lên Git.

Sửa `docker-compose.dev.yml`:

```yaml
  backend:
    volumes:
      - ./3t-edu-tech-backend:/app
      - /app/node_modules
      - import-temp-dev:/app/.tmp/imports    # ← THÊM: volume Linux thật

volumes:
  mssql-data-dev:
  redis-data-dev:
  import-temp-dev:                            # ← THÊM
```

Và `docker-compose.cpu-ec2.yml`:

```yaml
  backend:
    volumes:
      - import-temp:/var/lib/3tedu/imports

volumes:
  import-temp:
```

Nhờ vậy **cả local lẫn server đều giải nén trên ext4 trong container** — cùng
một hệ tệp, cùng một hành vi. Đây là cách rẻ nhất để loại bỏ cả một lớp khác
biệt môi trường.

## 1.3. ffmpeg — phải thêm vào Dockerfile backend

`Dockerfile` hiện chỉ cài `curl`. Cần `ffprobe` để lấy thời lượng và ảnh
thumbnail video:

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl \
      ffmpeg \
    && rm -rf /var/lib/apt/lists/*
```

Làm ở **cả `Dockerfile` và `Dockerfile.dev`**. Thiếu ở dev thì bạn code xong
tưởng chạy tốt, lên server mới lộ (hoặc ngược lại — còn tệ hơn).

> Ảnh image tăng khoảng 100MB. Chấp nhận được, và đổi lại bạn khỏi phải gửi
> video sang AI Service chỉ để đọc metadata.

---

# PHẦN 2 — REDIS CHẠY Ở CẢ HAI NƠI KHÔNG?

**Có, và bạn đã cấu hình xong rồi.** `docker-compose.dev.yml` đã có sẵn:

```yaml
  redis:
    image: redis:7-alpine
    container_name: edutech-redis-dev
    ports:
      - "16379:6379"          # host 16379 → container 6379
    volumes:
      - redis-data-dev:/data
    command: redis-server --save 60 1 --loglevel warning
```

Và backend đã trỏ đúng: `REDIS_URL=redis://edutech-redis-dev:6379`.

| | Local | Server |
|---|---|---|
| Redis | `edutech-redis-dev:6379` (compose dev) | `redis:6379` (compose cpu-ec2) |
| Cấu hình | `REDIS_URL` trong `.env` | `REDIS_URL` trong `.env.production` |
| Bền vững | `--save 60 1` (ghi đĩa) | tương tự |

**Không phải làm gì thêm.** Việc bỏ bảng SQL ở v3 hóa ra còn thuận lợi hơn tôi
nghĩ — hạ tầng Redis đã sẵn sàng ở cả hai môi trường từ trước.

Một lưu ý nhỏ: `--save 60 1` nghĩa là Redis ghi đĩa sau mỗi 60 giây nếu có ít
nhất 1 thay đổi. Nếu container chết đột ngột, bạn có thể mất tối đa 60 giây dữ
liệu — với job nhập khóa học thì hoàn toàn chấp nhận được (nạp lại ZIP là xong).

---

# PHẦN 3 — ★ "LOCAL MƯỢT THÌ SERVER CÓ OK KHÔNG?"

## Trả lời thẳng: **KHÔNG tự động OK.** Và đây là danh sách những gì sẽ vỡ.

Tôi liệt kê theo thứ tự **khả năng xảy ra × mức độ khó chẩn đoán**.

---

### 3.1. 🔴 BẢNG MÃ TÊN FILE TRONG ZIP — thủ phạm số một với tiếng Việt

Đây là lỗi tôi gần như **chắc chắn** bạn sẽ gặp nếu không xử lý trước.

**Nguyên nhân:** chuẩn ZIP có một bit cờ (bit 11 trong *general purpose flag*)
báo "tên file mã hóa UTF-8". Nhiều công cụ nén **không đặt cờ này** và ghi tên
file theo bảng mã hệ thống:

| Công cụ nén | Hành vi |
|---|---|
| Windows "Send to → Compressed folder" | Thường KHÔNG đặt cờ UTF-8 |
| 7-Zip (mặc định) | KHÔNG đặt cờ — dùng bảng mã OEM cục bộ |
| WinRAR | Có tùy chọn, mặc định tùy phiên bản |
| macOS "Compress" | Đặt UTF-8, nhưng dạng **NFD** (xem §3.2) |
| `zip` trên Linux | Thường đặt UTF-8 |

**Hậu quả cụ thể:** giảng viên nén thư mục `Bài 1 - Giới thiệu/` bằng 7-Zip trên
Windows tiếng Việt. Đọc bằng thư viện mặc định trên Linux, tên thư mục thành:

```
B└i 1 - Gi╗ыi thi╠єu/      ← rác
```

Rồi mọi thứ đổ theo dây chuyền: tên chương sai → ghép `.srt` với `.mp4` thất bại
→ AI nhận vào toàn ký tự rác → mô tả bài học vô nghĩa.

**Vì sao local không lộ:** nếu bạn test bằng file ZIP do chính bạn tạo trên
Windows, và thư viện Node đoán đúng bảng mã hệ thống, nó chạy ổn. Lên server
Linux (locale `C.UTF-8`) thì đoán khác → vỡ.

**Cách xử lý:**

```js
// src/utils/zipEncoding.js — Ý TƯỞNG
const iconv = require('iconv-lite');

/**
 * Giải mã tên entry trong ZIP một cách chống chịu.
 *
 * Dùng thư viện đọc ZIP nào cho ta cả BUFFER THÔ của tên file lẫn cờ UTF-8
 * (yauzl làm được; adm-zip chỉ trả chuỗi đã giải mã sẵn nên khó cứu).
 */
function decodeEntryName(rawNameBuffer, hasUtf8Flag) {
  // 1. Có cờ UTF-8 → tin tưởng luôn
  if (hasUtf8Flag) {
    return normalize(rawNameBuffer.toString('utf8'));
  }

  // 2. Không có cờ, nhưng rất nhiều công cụ hiện đại vẫn ghi UTF-8 mà quên
  //    đặt cờ. Thử UTF-8 trước; nếu không xuất hiện ký tự thay thế U+FFFD
  //    thì coi như đúng.
  const asUtf8 = rawNameBuffer.toString('utf8');
  if (!asUtf8.includes('�')) {
    return normalize(asUtf8);
  }

  // 3. Còn lại: bảng mã cũ. CP437 là mặc định theo chuẩn ZIP, nhưng Windows
  //    tiếng Việt hay dùng CP1258. Thử lần lượt, chọn kết quả "trông Việt nhất".
  for (const codepage of ['cp1258', 'cp437', 'cp1252']) {
    const decoded = iconv.decode(rawNameBuffer, codepage);
    if (looksLikeVietnamese(decoded)) return normalize(decoded);
  }

  // 4. Bó tay → giữ nguyên, gắn cờ để giao diện nhắc giảng viên đổi tên
  return normalize(asUtf8);
}

// ★ NFC bắt buộc — xem §3.2
const normalize = (s) => s.normalize('NFC').replace(/\\/g, '/');
```

Thư viện cần: `yauzl` (đọc ZIP, cho buffer thô + cờ) và `iconv-lite` (chuyển
bảng mã). Cả hai đều nhỏ, không phụ thuộc native.

---

### 3.2. 🔴 CHUẨN HÓA UNICODE — NFC vs NFD

Chữ **"Bài"** có **hai** cách biểu diễn hợp lệ trong Unicode:

| Dạng | Byte | Hệ điều hành |
|---|---|---|
| **NFC** (dựng sẵn) | `B` `à` `i` — 3 ký tự | Windows, Linux |
| **NFD** (tách rời) | `B` `a`+`◌̀` `i` — 4 ký tự | **macOS** |

Hai chuỗi này **hiển thị y hệt nhau** nhưng `===` trả về `false`.

Hậu quả với tính năng của bạn: giảng viên dùng Mac nén file, `Bài-1.mp4` (NFD)
và `Bài-1.srt` (NFD) — ghép được. Nhưng nếu một file do Mac tạo còn file kia
copy từ Windows, một bên NFC một bên NFD → **không ghép được phụ đề**, và bạn
nhìn hai cái tên giống hệt nhau trên màn hình mà không hiểu vì sao.

**Cách xử lý:** `.normalize('NFC')` **mọi** tên file ngay khi đọc ra, một lần
duy nhất, tại `decodeEntryName()` ở trên. Sau đó toàn hệ thống chỉ làm việc với
NFC.

---

### 3.3. 🟠 HOA/THƯỜNG — NTFS ≠ ext4

| | Windows (NTFS) | Linux (ext4) |
|---|---|---|
| `Bai1.PDF` vs `bai1.pdf` | **Cùng một file** | **Hai file khác nhau** |

Giải nén trên volume Linux (§1.2) đã xử lý phần lớn vấn đề. Nhưng **việc ghép
`.srt` ↔ `.mp4` vẫn phải so sánh không phân biệt hoa/thường**, vì trong ZIP hai
file có thể là `Bai1.MP4` và `bai1.srt`:

```js
const pairKey = (path) =>
  basenameWithoutExt(path).normalize('NFC').toLowerCase();
```

---

### 3.4. 🟠 DẤU PHÂN CÁCH ĐƯỜNG DẪN

Chuẩn ZIP quy định dùng `/`. Nhưng một số công cụ Windows cũ ghi `\`. Trên Linux
`\` **không phải** dấu phân cách → cả đường dẫn `Chuong1\Bai1.pdf` bị coi là
**một tên file duy nhất**, và bạn mất toàn bộ cấu trúc thư mục.

Đã xử lý trong `normalize()` ở §3.1: `.replace(/\\/g, '/')`.

---

### 3.5. 🟠 GIỚI HẠN BỘ NHỚ

`docker-compose.dev.yml` đặt `mem_limit: 768m` cho backend. Đọc một PDF 300
trang bằng thư viện có thể ngốn vài trăm MB. Xử lý song song 4 file là chạm trần
→ container bị OOM kill, **job biến mất không một dòng log**.

Cách xử lý:
- Xử lý file **tuần tự**, không song song (import vốn chạy nền, chậm hơn chút không sao)
- Bỏ qua file lớn bất thường (> 100MB cho tài liệu) và ghi rõ vào bản nháp
- Nâng `mem_limit` của backend dev lên `1536m` nếu máy bạn đủ RAM

---

### 3.6. 🟡 DUNG LƯỢNG ĐĨA

Docker Desktop trên máy bạn thường có sẵn hàng trăm GB. CPU EC2 `t3.medium` mặc
định chỉ **8–30GB**, và đã chứa image Docker, log, ChromaDB.

Cách xử lý: kiểm tra đĩa trống **trước khi nhận file** (§1.1,
`IMPORT_MIN_FREE_DISK_GB`), và cron dọn TTL 48h.

---

### 3.7. 🟡 MÚI GIỜ

Container chạy UTC; Windows của bạn là UTC+7. Ước tính "phụ đề xong lúc mấy giờ"
sẽ lệch 7 tiếng.

Cách xử lý: mọi thời điểm lưu ở UTC, chỉ đổi sang giờ địa phương ở tầng hiển
thị. Dự án đã có `moment-timezone` — dùng nó nhất quán.

---

### 3.8. Bảng kiểm trước khi tin "local chạy được là xong"

| Kiểm tra | Cách làm |
|---|---|
| ☐ ZIP tên tiếng Việt nén bằng **7-Zip** (không đặt cờ UTF-8) | Nén thử, kiểm tra tên đọc ra đúng |
| ☐ ZIP nén bằng **Windows Explorer** | Như trên |
| ☐ ZIP có tên file hoa/thường lẫn lộn | `Bai1.MP4` + `bai1.srt` phải ghép được |
| ☐ ZIP có thư mục lồng 3 cấp | Cấu trúc không bị bẹp |
| ☐ ZIP rỗng / chỉ có `__MACOSX` | Báo lỗi tử tế, không sập |
| ☐ File 150MB | Không OOM |
| ☐ Chạy trên `docker-compose.dev.yml` **thật**, không phải `npm run dev` trên Windows | Đây là điều kiện tiên quyết |

> **Lời khuyên quan trọng nhất của phần này:** luôn phát triển bằng
> `docker-compose.dev.yml`, **đừng chạy `npm run dev` trực tiếp trên Windows**.
> Khi cả local lẫn server đều là container Linux, khoảng cách môi trường gần như
> biến mất — và bạn không phải nhớ 8 mục ở trên nữa.

---

# PHẦN 4 — ★ PHỦ ĐẦY ĐỦ TRƯỜNG DỮ LIỆU

Bạn hỏi rất đúng. Dưới đây là **toàn bộ** trường của `Courses`, `Sections`,
`Lessons`, và nguồn giá trị của từng trường.

**Bốn nguồn:**

| Ký hiệu | Nguồn | Nguyên tắc |
|---|---|---|
| 🔧 | **HỆ THỐNG** | Backend tự đặt. **AI tuyệt đối không được quyết định** |
| 📁 | **TIER 0** | Suy từ cấu trúc/tên file. 0 token |
| 🤖 | **AI** | LLM sinh ra, giảng viên sửa được |
| 👤 | **GIẢNG VIÊN** | Bắt buộc người nhập/xác nhận |

## 4.1. Bảng `Courses`

| Trường | Nguồn | Giá trị |
|---|---|---|
| `CourseID` | 🔧 | IDENTITY |
| `CourseName` | 📁→🤖 | `_khoa-hoc.md` → tên thư mục gốc → AI làm đẹp |
| `Slug` | 🔧 | `slugify(CourseName)` + hậu tố nếu trùng |
| `ShortDescription` | 🤖 | AI tổng hợp, ~150 ký tự |
| `FullDescription` | 📁→🤖 | `_khoa-hoc.md` nếu có, không thì AI |
| `Requirements` | 📁→🤖 | `_khoa-hoc.md`, hoặc AI suy từ nội dung |
| `LearningOutcomes` | 🤖 | AI — 4–6 gạch đầu dòng |
| `ThumbnailUrl` | 📁 | Ảnh đầu tiên ở thư mục gốc → khung hình video đầu → **null** |
| `ThumbnailPublicId` | 🔧 | Cloudinary trả về lúc chấp nhận |
| `IntroVideoUrl` | 📁 | Video tên `intro*` / `gioi-thieu*` → null |
| `IntroVideoPublicId` | 🔧 | Cloudinary |
| `OriginalPrice` | 👤 | **Bắt buộc giảng viên nhập** (đã bỏ gợi ý AI) |
| `DiscountedPrice` | 👤 | Mặc định `NULL` |
| `InstructorID` | 🔧 | `req.user.id` — **không bao giờ lấy từ AI** |
| `CategoryID` | 🤖👤 | ⚠️ AI **chọn từ danh sách có sẵn** (xem §4.4), giảng viên xác nhận |
| `LevelID` | 🤖👤 | ⚠️ Như trên |
| `Language` | 📁🤖 | Nhận diện từ text, mặc định `vi` |
| `StatusID` | 🔧 | **Luôn `DRAFT`**. Không nhận từ AI trong mọi trường hợp |
| `PublishedAt` | 🔧 | `NULL` |
| `IsFeatured` | 🔧 | `0` |
| `LiveCourseID` | 🔧 | `NULL` (đây là khóa mới, không phải bản cập nhật) |
| `VersionNumber` | 🔧 | `1` |
| `RootCourseID` | 🔧 | Chính nó, đặt sau khi INSERT |
| `PreviousVersionID` | 🔧 | `NULL` |
| `IsLatestVersion` | 🔧 | `1` |
| `VersionNotes` | 🔧 | `"Tạo tự động từ tệp <tên>.zip"` |
| `ArchivedAt` | 🔧 | `NULL` |
| `AverageRating` / `ReviewCount` | 🔧 | `NULL` / `0` |
| `CreatedAt` / `UpdatedAt` | 🔧 | `GETDATE()` |

## 4.2. Bảng `Sections`

| Trường | Nguồn | Giá trị |
|---|---|---|
| `SectionID` | 🔧 | IDENTITY |
| `CourseID` | 🔧 | Khóa vừa tạo |
| `SectionName` | 📁→🤖 | Tên thư mục đã bỏ tiền tố số → AI làm đẹp |
| `SectionOrder` | 📁 | Tiền tố số, hoặc thứ tự trong cây (**bắt đầu từ 0** — xem `updateSectionsOrder`) |
| `Description` | 📁→🤖 | `_chuong.md` → AI |
| `OriginalID` | 🔧 | `NULL` |
| `IsArchived` | 🔧 | `0` |

## 4.3. Bảng `Lessons`

| Trường | Nguồn | Giá trị |
|---|---|---|
| `LessonID` | 🔧 | IDENTITY |
| `SectionID` | 🔧 | Chương cha |
| `LessonName` | 📁→🤖 | Tên file đã bỏ số + đuôi → AI làm đẹp |
| `Description` | 🤖 | **AI sinh từ NỘI DUNG**, không phải từ tên file |
| `LessonOrder` | 📁 | Tiền tố số |
| `LessonType` | 📁 | `.mp4/.mkv/.mov` → `VIDEO` · `.pdf/.docx/.pptx/.md/.txt` → `TEXT` · (`QUIZ` sinh riêng) |
| `VideoSourceType` | 🔧 | `'CLOUDINARY'` |
| `ExternalVideoID` | 🔧 | Cloudinary `public_id` — **điền sau**, lúc upload xong |
| `VideoDurationSeconds` | 📁 | `ffprobe` |
| `ThumbnailUrl` | 📁 | Khung hình `ffmpeg` tại giây thứ 3 |
| `TextContent` | 📁 | **Text đã bóc** từ PDF/DOCX/PPTX — dùng cho cả RAG |
| `IsFreePreview` | 🔧👤 | `0`; gợi ý bài đầu = `1`, giảng viên quyết |
| `OriginalID` | 🔧 | `NULL` |
| `IsArchived` | 🔧 | `0` |

**Phụ đề** (bảng `Subtitles`) — từ `.srt` có sẵn, hoặc Whisper sau khi chấp nhận.
**Trắc nghiệm** (`QuizQuestions` + `QuizOptions`) — AI sinh, giai đoạn C.

## 4.4. ⚠️ Hai trường dễ gây lỗi khóa ngoại nhất

`CategoryID` và `LevelID` là **khóa ngoại**. Nếu để AI tự do trả về, nó sẽ bịa
ra `"Lập trình Web"` trong khi bảng `Categories` của bạn chỉ có
`"Web Development"` → **INSERT thất bại**, cả job đổ.

**Cách làm đúng — cho AI chọn trong danh sách, không cho AI sáng tạo:**

```js
// 1. Lấy danh sách THẬT từ CSDL
const categories = await categoryRepo.findAll();   // [{id: 8, name: 'Web Development'}, ...]
const levels     = await levelRepo.findAll();      // [{id: 1, name: 'Cơ bản'}, ...]

// 2. Đưa vào prompt và BẮT chọn theo ID
//    "Chọn MỘT categoryId từ danh sách sau. Chỉ trả về số ID.
//     8 = Web Development
//     9 = Data Science
//     ..."

// 3. ★ Kiểm tra lại kết quả — KHÔNG BAO GIỜ tin thẳng
const validIds = new Set(categories.map((c) => c.id));
const categoryId = validIds.has(Number(ai.categoryId))
  ? Number(ai.categoryId)
  : null;   // null → giao diện bắt giảng viên tự chọn

// null tốt hơn nhiều so với một ID sai: một bên là ô trống cần điền,
// bên kia là khóa học nằm nhầm danh mục mà không ai phát hiện.
```

Nguyên tắc chung, áp cho **mọi** trường AI sinh ra:

> **Không bao giờ ghi thẳng đầu ra của LLM vào CSDL.** Luôn có một bước kiểm tra
> ở giữa: đúng kiểu dữ liệu, đúng độ dài cột, khóa ngoại tồn tại thật. Sai thì
> trả `null` và để giảng viên điền, chứ không đoán bừa.

Kiểm tra độ dài cũng quan trọng: `CourseName` là `NVARCHAR(500)`, `LessonName`
là `NVARCHAR(255)`. AI viết dài quá → lỗi tràn chuỗi, mất cả job.

---

# PHẦN 5 — ★ NHIỀU API KEY GEMINI

## 5.1. Ba điều cần biết trước

**1. Hạn mức tính theo PROJECT, không theo KEY.** Tài liệu Google ghi rõ:
*"Rate limits are applied per project, not per API key."* Tạo 5 key trong cùng
một project → hạn mức **y hệt 1 key**. Muốn thêm quota thật thì phải khác
project (hoặc khác tài khoản).

**2. Về điều khoản.** Tôi đã nêu ở tài liệu trước, nhắc lại ngắn gọn để bạn
quyết định có đủ thông tin: tạo nhiều **tài khoản Google** nhằm nhân hạn mức
miễn phí là đi ngược điều khoản của Google, và rủi ro là bị khóa **cả cụm** —
thường vào đúng lúc dùng nhiều nhất. Đây là lựa chọn của bạn; tôi thiết kế công
cụ, còn cách dùng thuộc về bạn.

**3. Bản thân `KeyPool` là mẫu thiết kế chính đáng** và bạn nên có nó bất kể
quyết định trên: khóa bị thu hồi nhầm, gặp 429 tạm thời, xoay vòng khóa định kỳ
mà không phải dừng dịch vụ. Trình bày trong báo cáo dưới góc độ **khả năng chịu
lỗi** là hoàn toàn hợp lý.

## 5.2. Thiết kế `KeyPool`

```python
# ai-service/src/core/key_pool.py — Ý TƯỞNG

class KeyState(str, Enum):
    HEALTHY = "healthy"
    COOLING = "cooling"   # tạm nghỉ, sẽ thử lại
    DEAD    = "dead"      # hỏng thật, không thử nữa


@dataclass
class ManagedKey:
    key_id: str          # "k1", "k2"... — ★ log bằng ID, KHÔNG BAO GIỜ log key
    api_key: str
    state: KeyState = KeyState.HEALTHY
    cooldown_until: float = 0.0
    consecutive_failures: int = 0
    calls_today: int = 0


class KeyPool:
    async def acquire(self) -> ManagedKey | None:
        """Chọn khóa dùng được. Hết khóa → None (KHÔNG ném lỗi).

        Trả None để tầng trên tự xuống Qwen hoặc xuống Tier 0. Ném lỗi ở đây
        sẽ làm chết cả job chỉ vì phần tô điểm không chạy được.
        """
        now = time.time()
        for k in self._keys:
            # Hết thời gian nghỉ → tự hồi phục
            if k.state == KeyState.COOLING and now >= k.cooldown_until:
                k.state = KeyState.HEALTHY

        healthy = [k for k in self._keys if k.state == KeyState.HEALTHY]
        if not healthy:
            return None

        # Chọn khóa ÍT DÙNG NHẤT hôm nay → trải đều tải, không dồn vào khóa đầu
        return min(healthy, key=lambda k: k.calls_today)

    async def report_failure(self, k: ManagedKey, err: Exception) -> None:
        """★ PHÂN LOẠI LỖI — phần quan trọng nhất của cả lớp này."""
        kind = classify(err)

        if kind is ErrKind.INVALID_KEY:      # 400 / 403 API_KEY_INVALID
            # Khóa sai hoặc đã bị thu hồi. Thử lại bao nhiêu lần cũng vô ích.
            k.state = KeyState.DEAD
            logger.error(f"[KeyPool] Khóa {k.key_id} không hợp lệ, loại vĩnh viễn.")

        elif kind is ErrKind.QUOTA_EXHAUSTED:  # 429 RESOURCE_EXHAUSTED
            # Nghỉ tăng dần, TRẦN 1 GIỜ.
            #
            # Cố ý KHÔNG tính "nghỉ tới nửa đêm giờ Thái Bình Dương": lịch reset
            # quota của Google có thể đổi và ta không kiểm soát được. Thử lại
            # mỗi giờ thì hệ thống TỰ hồi phục đúng lúc quota thật sự reset,
            # mà không cần biết lúc đó là mấy giờ.
            k.consecutive_failures += 1
            backoff = min(60 * (2 ** k.consecutive_failures), 3600)
            k.state = KeyState.COOLING
            k.cooldown_until = time.time() + backoff

        elif kind in (ErrKind.RATE_LIMITED, ErrKind.SERVER_ERROR, ErrKind.TIMEOUT):
            k.state = KeyState.COOLING
            k.cooldown_until = time.time() + 30

        else:
            # Lỗi PHÍA MÌNH (prompt sai, quá dài, bị chặn nội dung).
            # Đổi khóa không giúp gì — khóa này vẫn khỏe.
            pass
```

## 5.3. Bốn chi tiết dễ làm sai

**1. Trạng thái phải nằm trên Redis, không phải trong biến toàn cục.** Nếu giữ
trong RAM tiến trình: restart container là quên sạch → thử lại ngay khóa vừa hết
quota → 429 tiếp. Và khi chạy nhiều bản sao backend, mỗi bản có một cái nhìn
khác nhau về sức khỏe khóa.

```python
# Khóa Redis: gemini:key:{key_id}:state  — TTL bằng thời gian nghỉ
```

**2. Không bao giờ ghi khóa vào log.** Log bằng `key_id` (`k1`, `k2`). Log file
có thể bị chia sẻ, đưa vào báo cáo, đẩy lên Git.

**3. Cấu hình qua biến môi trường, mỗi khóa một dòng nhãn:**

```env
# ai-service/.env — KHÔNG commit
GEMINI_API_KEYS=AIza...aaa,AIza...bbb,AIza...ccc
```
```python
keys = [k.strip() for k in settings.gemini_api_keys.split(",") if k.strip()]
```

**4. Van an toàn cấp job.** Dù có bao nhiêu khóa, vẫn giới hạn **10 lời gọi
Gemini mỗi job import**. Một vòng lặp lỗi có thể đốt sạch mọi khóa trong vài
phút — van cứng ở tầng job là thứ duy nhất chặn được.

## 5.4. Hướng bổ sung năng lực đáng cân nhắc hơn

Điểm mấu chốt: **`llm_provider.py` của bạn đã nói giao thức OpenAI** (vì vLLM
dùng chuẩn đó). Nghĩa là các nhà cung cấp sau **cắm vào được mà gần như không
phải sửa code** — chỉ đổi `base_url` và `model`:

| Nhà cung cấp | Ghi chú |
|---|---|
| **Groq** | Tầng miễn phí rộng, tốc độ rất cao, chuẩn OpenAI |
| **OpenRouter** | Có một số model miễn phí, một tài khoản dùng nhiều model |
| **Together AI** | Tầng miễn phí cho lập trình viên |
| **Ollama** (máy bạn) | Qwen bản nhỏ, chạy local, 0 chi phí |

Dùng **nhiều nhà cung cấp khác nhau** vừa hợp lệ hoàn toàn, vừa đáng khen về mặt
kiến trúc (không phụ thuộc một nhà cung cấp) — và thực tế cho **nhiều dung lượng
hơn** so với việc gom nhiều khóa của cùng một nhà.

```python
# Thứ tự dự phòng đề xuất
PROVIDER_CHAIN = [
    "qwen_vllm",      # server GPU — miễn phí, không giới hạn
    "gemini_pool",    # nhóm khóa Gemini
    "groq",           # miễn phí, rất nhanh
    "openrouter",     # dự phòng cuối
]
# Hết sạch → Tier 0 (DEGRADED), KHÔNG làm hỏng job
```

---

# PHẦN 6 — KẾ HOẠCH TRIỂN KHAI

### Giai đoạn A — Nền tảng (không cần AI, không cần GPU)

```
[ ] Vá run_in_executor cho Whisper (lỗi có sẵn, 3 dòng, độc lập)
[ ] Thêm ffmpeg vào Dockerfile + Dockerfile.dev
[ ] Thêm volume import-temp vào compose dev + cpu-ec2
[ ] config: IMPORT_TEMP_DIR / TTL / MAX_ZIP_MB / MIN_FREE_DISK_GB
[ ] zipEncoding.js — giải mã tên file + NFC + đổi \ thành /   ★ làm SỚM
[ ] safe_extract(): Zip Slip, zip bomb, symlink, archive lồng nhau
[ ] Bóc text: pymupdf, python-docx, python-pptx, chardet
    → đồng thời vá loader.py (đang chỉ đọc .txt/.md/.csv)
[ ] ffprobe: thời lượng + thumbnail
[ ] Ghép .srt ↔ .mp4 (NFC + không phân biệt hoa/thường)
[ ] analyze_tree() + điểm tin cậy
[ ] Trạng thái job trên Redis (TTL 48h)
[ ] Cron dọn thư mục tạm quá hạn
[ ] BullMQ import-queue + tiến độ SSE
[ ] Màn hình duyệt + khối hỏi phụ đề
[ ] "Chấp nhận" → Course DRAFT (phủ đủ trường §4) + media-upload-queue
[ ] ZIP mẫu tải về + kiểm tra trước khi xử lý
[ ] Chạy đủ 7 mục trong bảng kiểm §3.8
```

### Giai đoạn B — Lớp AI chống chịu

```
[ ] capabilities.probe()
[ ] KeyPool + trạng thái trên Redis (§5.2)
[ ] generate_with_fallback() — chuỗi provider + phân loại lỗi
[ ] Chế độ record/replay  ★ làm sớm, tiết kiệm nhất khi dev
[ ] Cache theo SHA-256
[ ] Qwen: tóm tắt + phân loại theo lô
[ ] Gemini: tổng hợp đề cương (1 lời gọi/khóa)
[ ] Kiểm tra CategoryID/LevelID theo danh sách thật (§4.4)
[ ] Van an toàn 10 lời gọi/job
[ ] Chế độ DEGRADED + nút "Xử lý lại bằng AI"
```

### Giai đoạn C — Hoàn thiện

```
[ ] subtitle-queue (concurrency = 1) + webhook
[ ] Làm giàu mô tả bài học từ transcript
[ ] Sinh trắc nghiệm → QuizQuestions + QuizOptions
[ ] Đồng hồ tiết kiệm token
[ ] Bổ sung Groq / OpenRouter vào chuỗi provider
```

### Thư viện cần thêm

```jsonc
// 3t-edu-tech-backend/package.json
"yauzl": "^3.1.3",        // đọc ZIP — cho buffer thô + cờ UTF-8
"iconv-lite": "^0.6.3",   // chuyển bảng mã cp1258/cp437
```
```toml
# ai-service/pyproject.toml
"pymupdf>=1.24",
"python-docx>=1.1",
"python-pptx>=0.6",
"chardet>=5.2",
```

---

# PHẦN 7 — TÓM TẮT 4 CÂU HỎI

| Câu hỏi | Trả lời ngắn |
|---|---|
| **Local lưu ở đâu?** | `IMPORT_TEMP_DIR` trong `.env`. Local `/app/.tmp/imports`, server `/var/lib/3tedu/imports`. Code không biết mình ở đâu |
| **Redis chạy cả hai nơi?** | ✅ **Đã có sẵn** — `docker-compose.dev.yml` đã cấu hình `edutech-redis-dev`. Không phải làm gì |
| **Local mượt thì server OK?** | ❌ **Không tự động.** 7 khác biệt ở §3, nguy hiểm nhất là **bảng mã tên file ZIP tiếng Việt**. Cách rẻ nhất để loại bỏ: **luôn dev bằng `docker-compose.dev.yml`** |
| **Phủ đủ trường dữ liệu?** | ✅ Bảng đầy đủ ở §4. Điểm cốt yếu: `CategoryID`/`LevelID` phải **chọn từ danh sách thật**, và **không bao giờ ghi thẳng đầu ra LLM vào CSDL** |
| **Nhiều API key Gemini?** | ✅ Thiết kế ở §5. Nhớ: **quota theo project chứ không theo key**; trạng thái để trên Redis; log bằng `key_id`; van 10 lời gọi/job |

**Ba việc làm trước tiên, đúng thứ tự:**

| # | Việc | Vì sao |
|---|---|---|
| 1 | `zipEncoding.js` + chuẩn hóa NFC | Sai ở đây thì **mọi thứ phía sau đều sai**, mà triệu chứng lại rất khó đoán |
| 2 | `safe_extract()` + volume + cron dọn | Thiếu thì đây là lỗ hổng bảo mật và bom hẹn giờ cho ổ đĩa |
| 3 | Tier 0 + phủ đủ trường §4 + màn hình duyệt | Demo được ngay, 0 token, không cần GPU |

Riêng việc vá `run_in_executor` cho Whisper thì **làm bất cứ lúc nào** — nó là
lỗi đang tồn tại, chỉ 3 dòng, và độc lập hoàn toàn với tính năng mới.

---

## Nguồn tham khảo

- [Gemini API — Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) — *"Rate limits are applied per project, not per API key"*
- [.ZIP File Format Specification — PKWARE](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT) — bit 11 (EFS) của general purpose flag quy định mã hóa UTF-8 cho tên file
- [Unicode Normalization Forms (UAX #15)](https://unicode.org/reports/tr15/) — khác biệt NFC/NFD
