# 3T EduTech — Kế Hoạch Hoàn Thiện (Bản v2 — Chính thức)
### Đã điều chỉnh theo quyết định của bạn + đối chiếu với schema SQL Server THẬT

> **Ngày:** 17/08/2026 · **Thay thế** bản kế hoạch trước
> **Cơ sở dữ liệu đối chiếu:** script schema live bạn gửi (không phải `V1__init.sql`)
> **Trạng thái:** chờ bạn duyệt → sau khi OK sẽ bắt tay sửa code

---

## PHẦN 0 — HAI PHÁT HIỆN MỚI TỪ SCHEMA THẬT (quan trọng nhất tài liệu này)

Khi đối chiếu schema live bạn gửi với thư mục `db-init/`, tôi phát hiện **hai migration đã viết nhưng CHƯA BAO GIỜ ĐƯỢC CHẠY** trên database thật.

### 🔴 Phát hiện 1 — `V2__add_enrollment_columns.sql` chưa chạy

Schema live của bạn:
```sql
CREATE TABLE [dbo].[Enrollments](
	[EnrollmentID] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountID] [bigint] NOT NULL,
	[CourseID] [bigint] NOT NULL,
	[EnrolledAt] [datetime2](7) NOT NULL,
	[PurchasePrice] [decimal](18, 4) NOT NULL,
	-- ❌ KHÔNG CÓ IsCompleted
	-- ❌ KHÔNG CÓ CompletedAt
```

Nhưng code đang dùng 2 cột này ở nhiều nơi:

| File:dòng | Code |
|---|---|
| `progress.service.js:81-85` | Đặt cờ hoàn thành khi đạt 100% |
| `progress.service.js:222-245` | Toàn bộ cơ chế "Progress Protection" |
| `enrollments.repository.js:266-271` | `UPDATE Enrollments SET IsCompleted = 1, CompletedAt = GETDATE()` |
| `enrollments.service.js:118-141` | Trả `completionDate` cho frontend |

→ **Tính năng "Bảo vệ tiến độ học viên" mà bạn đã viết code hiện đang lỗi runtime**: `Invalid column name 'IsCompleted'`.

> ⚠️ Điều này cũng làm **sai một khuyến nghị trong bản kế hoạch trước**: tôi từng đề xuất sửa `e.CompletionPercentage` → `e.IsCompleted` trong `admin.repository.js`. Sửa như vậy **vẫn lỗi** cho tới khi chạy V4. Thứ tự đúng là: **chạy V4 trước, rồi mới sửa code**.

### 🔴 Phát hiện 2 — `V3__add_archive_submission.sql` chưa chạy

Schema live:
```sql
CONSTRAINT [CK_CourseApprovalRequests_RequestType] CHECK
  (([RequestType]='RE_SUBMISSION' OR [RequestType]='UPDATE_SUBMISSION'
    OR [RequestType]='INITIAL_SUBMISSION'))
    -- ❌ KHÔNG CÓ 'ARCHIVE_SUBMISSION'
```
→ `courses.service.js:1547-1552` tạo yêu cầu `ARCHIVE_SUBMISSION` sẽ **vi phạm CHECK constraint** ngay khi giảng viên bấm "Xin ngừng xuất bản".

### ✅ Ba tin tốt từ schema live

1. `UQ_LessonProgress_Account_Lesson UNIQUE (AccountID, LessonID)` — **có tồn tại**. Đây là mục "chưa xác minh được" trong báo cáo trước, giờ đã rõ: code bắt lỗi 2627/2601 là đúng, không cần bổ sung gì.
2. `FK_OrderItems_CourseID` **không có** `ON DELETE` → lưới an toàn tình cờ ngăn xóa khóa học đã bán, đúng như phân tích.
3. `FK_DiscussionThreads_LessonID` cũng **không có** `ON DELETE` → chặn xóa bài học đã có thảo luận. Một lưới an toàn nữa, dù không đồng đều.

---

## PHẦN 1 — CHỐT CÁC QUYẾT ĐỊNH CỦA BẠN

| Chủ đề | Quyết định | Xử lý trong kế hoạch này |
|---|---|---|
| PostgreSQL | ❌ **Không làm** — refactor quá nhiều | Chuyển sang giải trình trong báo cáo. Text mẫu ở Phần 5 |
| Socket.IO | ✅ **Làm nếu tích hợp được** | Đưa vào Level 2, kèm đánh giá độ khó (thực tế khá dễ) |
| Course Versioning | ✅ **Theo mô hình bạn nêu**: clone → sửa → duyệt → v1 giữ nguyên | Toàn bộ Phần 2. **Tôi hoàn toàn đồng ý — mô hình của bạn tốt hơn đề xuất trước của tôi** |
| Xóa chức năng delete | ✅ **Bỏ đi để khỏi ảnh hưởng** | Danh sách cụ thể ở Phần 4.1 |
| Code không dùng | ✅ **Comment lại cho gọn** | Danh sách cụ thể ở Phần 4.1 |

---

## PHẦN 2 — COURSE VERSIONING THEO MÔ HÌNH CỦA BẠN

### 2.1 Vì sao mô hình của bạn TỐT HƠN đề xuất trước của tôi

Bản kế hoạch trước tôi đề xuất bảng `CourseVersions` riêng + cột `VersionID` trên `Enrollments`. **Mô hình bạn nêu đơn giản hơn nhiều mà vẫn đạt mục tiêu** — và tôi nhận ra lý do rất hay:

> **Mỗi phiên bản đã là một dòng `Courses` riêng với `Sections`/`Lessons` riêng. Mà `Enrollments.CourseID` vốn đã trỏ đúng vào dòng đó. Nghĩa là học viên ĐÃ ĐƯỢC GHIM vào phiên bản của họ một cách tự nhiên — không cần thêm cột `VersionID`, không cần đụng vào `LessonProgress`.**

Hệ quả cực kỳ quan trọng: **khi duyệt v2, hệ thống KHÔNG CHẠY BẤT KỲ CÂU LỆNH NÀO chạm vào v1.** Dữ liệu học viên v1 an toàn không phải nhờ logic bảo vệ, mà nhờ *không có gì đụng vào nó cả*. Đây là loại an toàn mạnh nhất.

Và nó **xóa sổ luôn bug P0-3** (`cloneFullLesson` gọi sai ở `courses.service.js:1037`) — không phải sửa, mà là **xóa hẳn toàn bộ khối diff-and-patch** vì không còn cần thiết.

### 2.2 Luồng nghiệp vụ chi tiết

```
┌─ TRẠNG THÁI BAN ĐẦU ────────────────────────────────────────┐
│  Course #100  "React Cơ Bản"   slug: react-co-ban           │
│  StatusID=PUBLISHED  VersionNumber=1  RootCourseID=100       │
│  IsLatestVersion=1                                           │
│  → 50 học viên đã mua (Enrollments.CourseID = 100)          │
└──────────────────────────────────────────────────────────────┘
                          │
      ① Giảng viên bấm "Tạo phiên bản mới"
         (createUpdateSession — code ĐÃ CÓ, chỉ cần bổ sung vài cột)
                          ▼
┌─ Course #205 (BẢN NHÁP) ────────────────────────────────────┐
│  slug: react-co-ban-update-a1b2c3d4   ← slug tạm, đã có sẵn │
│  StatusID=DRAFT  VersionNumber=2  RootCourseID=100           │
│  LiveCourseID=100  IsLatestVersion=0                         │
│  → Sections/Lessons được clone sang, có OriginalID trỏ về v1 │
│  → 0 học viên. Giảng viên sửa/thêm/xóa THOẢI MÁI            │
└──────────────────────────────────────────────────────────────┘
                          │
      ② Gửi duyệt → ③ Admin bấm Duyệt
         (promoteCourseVersion — HÀM MỚI, thay cho toàn bộ sync cũ)
                          ▼
┌─ SAU KHI DUYỆT (1 transaction duy nhất) ────────────────────┐
│                                                              │
│  Course #100 (v1)          Course #205 (v2)                 │
│  slug: react-co-ban--v1    slug: react-co-ban   ← nhận slug │
│  StatusID=SUPERSEDED       StatusID=PUBLISHED               │
│  IsLatestVersion=0         IsLatestVersion=1                │
│  ArchivedAt=NOW            PreviousVersionID=100            │
│                            LiveCourseID=NULL                │
│                                                              │
│  ⚠️ Sections/Lessons/LessonProgress của #100: KHÔNG ĐỘNG VÀO │
│                                                              │
│  → 50 học viên cũ: Enrollments.CourseID vẫn =100            │
│    vẫn học giáo trình cũ, tiến độ nguyên vẹn, chứng chỉ v1  │
│  → Người mua mới: mua #205, học giáo trình mới              │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Xử lý `Slug` — chi tiết dễ bỏ sót

`UQ_Courses_Slug` là ràng buộc UNIQUE, nên việc "chuyển slug" phải làm đúng thứ tự trong cùng transaction:

```sql
-- Bước 1: đổi slug khóa cũ TRƯỚC (giải phóng slug đẹp)
UPDATE Courses SET Slug = CONCAT(@oldSlug, '--v', @oldVersion) WHERE CourseID = @oldId;
-- Bước 2: gán slug đẹp cho khóa mới
UPDATE Courses SET Slug = @oldSlug WHERE CourseID = @newId;
```

Làm ngược lại sẽ vi phạm UNIQUE. Lợi ích: link cũ `/courses/react-co-ban` luôn trỏ tới phiên bản mới nhất (tốt cho SEO và người dùng), còn học viên v1 truy cập qua `CourseID` từ "Khóa học của tôi" nên không bị ảnh hưởng.

### 2.4 Trạng thái mới `SUPERSEDED`

Đã có `ARCHIVED` nhưng ý nghĩa khác:

| Trạng thái | Ý nghĩa | Bán? | Học viên cũ vào được? |
|---|---|---|---|
| `PUBLISHED` | Đang bán | ✅ | ✅ |
| `SUPERSEDED` | **MỚI** — đã có phiên bản mới thay thế | ❌ | ✅ **phải cho vào** |
| `ARCHIVED` | Giảng viên chủ động ngừng xuất bản | ❌ | ✅ **phải cho vào** |

→ Kéo theo việc **bắt buộc phải sửa quy tắc truy cập** (lỗi P1-2 trong báo cáo trước): hiện `courses.repository.js:626-629` lọc cứng `StatusID = 'PUBLISHED'` nên học viên đã mua sẽ bị **404** khi khóa chuyển sang `SUPERSEDED`. Đây giờ không còn là lỗi nhỏ nữa mà là **điều kiện tiên quyết** để versioning hoạt động.

Quy tắc mới:
```
Cho phép xem chi tiết khóa học NẾU:
   StatusID = 'PUBLISHED'
   HOẶC người dùng là giảng viên sở hữu / admin
   HOẶC EXISTS(SELECT 1 FROM Enrollments WHERE AccountID=@me AND CourseID=@id)
```

### 2.5 Ảnh hưởng tới BÁO CÁO — điểm dễ sai

Sau khi có phiên bản, "Khóa React" có thể là 3 dòng `Courses`. Báo cáo `GROUP BY CourseID` sẽ **tách rời 3 phiên bản** → "Top khóa học theo lượt ghi danh" sẽ hiển thị sai.

Giải pháp: file `V5` đã tạo sẵn view `vw_CourseFamilyStats` gom nhóm theo `RootCourseID`. Các báo cáo tổng hợp dùng view này; báo cáo chi tiết theo phiên bản thì dùng `CourseID` như cũ.

### 2.6 Ảnh hưởng tới RAG / Chatbot — điểm RẤT dễ quên

`aiSync.service.js:60-64` hiện ingest theo `course_name`:
```js
await axios.post(`${baseUrl}/api/ingest/course`, {
  course_name: c.CourseName,   // ← v1 và v2 trùng tên → đè lên nhau!
  ...
```
Sau khi có phiên bản, v1 và v2 thường **cùng tên khóa học** → tri thức v2 sẽ đè lên v1 trong ChromaDB → **chatbot trả lời học viên v1 bằng nội dung v2**. Vi phạm đúng nguyên tắc mà versioning muốn bảo vệ.

Phải sửa: thêm `course_id` vào metadata, và:
- Tài liệu `course_overview` (dùng cho tư vấn bán hàng): **chỉ ingest phiên bản mới nhất** (`IsLatestVersion = 1`)
- Nội dung bài giảng (dùng cho trợ lý trong khóa): **ingest theo từng `CourseID`**, lọc theo `course_id` khi truy vấn

---

## PHẦN 3 — CÁC FILE SQL ĐÃ SẴN SÀNG

Đã viết sẵn 5 file, đặt trong thư mục `db-init/`. Tất cả đều **idempotent** (chạy nhiều lần không lỗi) và có `PRINT` báo tiến trình.

| File | Nội dung | Bắt buộc? |
|---|---|---|
| `V4__fix_missing_migrations.sql` | Vá 2 migration chưa chạy (`IsCompleted`, `CompletedAt`, `ARCHIVE_SUBMISSION`) + index | 🔴 **BẮT BUỘC, chạy đầu tiên** |
| `V5__course_versioning.sql` | 6 cột versioning + trạng thái `SUPERSEDED` + backfill + view báo cáo | 🔴 Bắt buộc cho versioning |
| `V6__certificates.sql` | Bảng `Certificates` (đề cương mục B4) | 🟠 Cần cho đề cương |
| `V7__chat_history.sql` | `ChatSessions` + `ChatMessages` + view phân tích | 🟠 Cần cho tách chat |
| `V8__protect_student_data.sql` | Bỏ CASCADE nguy hiểm trên dữ liệu học viên | 🟡 Rất nên làm |

### Thứ tự chạy

```
V4  →  V5  →  V6  →  V7  →  V8
```

### ⚠️ Trước khi chạy — sao lưu

```sql
BACKUP DATABASE [ThreeTEduTechLMS]
TO DISK = N'D:\Backup\ThreeTEduTechLMS_before_V4.bak'
WITH FORMAT, INIT, NAME = N'Truoc khi chay V4-V8', COMPRESSION;
```

### Ghi chú về V8

V8 **không bỏ hết CASCADE** — đây là điểm tinh tế:

- **Giữ** `Sections→Courses` và `Lessons→Sections` CASCADE → cần để xóa **bản nháp** (hủy phiên cập nhật vẫn phải chạy được)
- **Bỏ** `LessonProgress→Lessons`, `QuizAttempts→Lessons`, `Enrollments→Courses` → đây là **dữ liệu học viên**

Kết quả: xóa bản nháp vẫn trơn tru (bản nháp không có tiến độ/ghi danh), nhưng xóa nội dung đã có học viên sẽ bị **database chặn thẳng** (lỗi 547) — kể cả khi bug ở tầng ứng dụng hoặc thao tác tay trong SSMS.

---

## PHẦN 4 — KẾ HOẠCH SỬA CODE

### 4.1 Code sẽ XÓA / COMMENT (bạn đã đồng ý)

Đây là phần làm hệ thống **gọn hơn và an toàn hơn cùng lúc**:

| File | Phần code | Lý do bỏ |
|---|---|---|
| `courses.service.js` ~982-1064 | `syncLiveCourseFromUpdate()` | Mô hình mới không patch bản live nữa → **bug P0-3 biến mất theo** |
| `courses.service.js` 822-837 | `cloneFullLesson()` | Chỉ phục vụ sync cũ |
| `courses.service.js` 842-869 | `syncQuizForLesson()` | Chỉ phục vụ sync cũ |
| `courses.service.js` ~874-980 | `syncLessonsForSection()` | Chỉ phục vụ sync cũ |
| `courses.service.js` ~790-817 | `cloneLessonSubComponents()` | Kiểm tra: nếu `cloneCurriculum` (repository) không gọi thì bỏ |
| `sections.service.js:127-149` | `deleteSection()` xóa cứng | Thay bằng archive |
| `sections.repository.js:159-166` | `deleteSectionById()` | Thay bằng `archiveSectionsByIds` (đã có sẵn) |
| `lessons.service.js:352-357` | `deleteLesson()` xóa cứng | Thay bằng archive |
| `lessons.repository.js:343-349` | `deleteLessonById()` | Thay bằng `archiveLessonsByIds` (đã có sẵn) |
| `courseSync.queue.js` | Toàn bộ worker sync | Thay bằng `promoteCourseVersion` chạy đồng bộ — đơn giản hơn nhiều, và **hết luôn rủi ro job treo vĩnh viễn** |

> 💡 **Gợi ý cách comment:** giữ lại code cũ trong block comment kèm ghi chú
> `/* [BỎ TỪ v2 - 17/08/2026] Thay bằng mô hình Course Versioning, xem promoteCourseVersion() */`
> để khi bảo vệ đồ án bạn giải thích được quá trình tiến hóa kiến trúc.

### 4.2 Code phải SỬA

#### Nhóm A — Sửa lỗi đang hỏng (làm ngay sau khi chạy V4)

| # | File:dòng | Sửa gì |
|---|---|---|
| A1 | `approvalRequests.routes.js:15` | Bỏ `Roles.INSTRUCTOR` khỏi `authorize([...])` |
| A2 | `courses.service.js:1069` (đầu `reviewCourseApproval`) | Thêm guard: `if (![Roles.ADMIN, Roles.SUPERADMIN].includes(user.role)) throw new ApiError(403, ...)` |
| A3 | `admin.repository.js:255,256,326,439` | `e.CompletionPercentage` → `e.IsCompleted` (dùng `= 1` hoặc `AVG(CAST(e.IsCompleted AS FLOAT))*100`) |
| A4 | `admin.repository.js:290,295,296,413,422,426,427` | `e.EnrollmentDate` → `e.EnrolledAt` |
| A5 | `learningReport.repository.js:29,52` | `e.ProgressPercentage` → `e.IsCompleted` |
| A6 | `progress.repository.js:184-186, 211-213` | Thêm `AND l.IsArchived = 0 AND s.IsArchived = 0` |
| A7 | `enrollments.repository.js:137-148,158-170,184-196` | Thêm `AND l.IsArchived = 0 AND s.IsArchived = 0` |
| A8 | `courses.repository.js:642-647, 652-659` | Thêm `AND l.IsArchived = 0` (tổng số bài + thời lượng hiển thị) |
| A9 | `progressReminderJob.js:15-16` | Thêm `AND l.IsArchived = 0 AND s.IsArchived = 0` |
| A10 | `notifications.service.js:42` | Bỏ `if (type === 'COURSE_SUBMITTED')` → đẩy SSE cho mọi thông báo |

#### Nhóm B — Course Versioning

| # | File | Sửa gì |
|---|---|---|
| B1 | `courses.repository.js:784` `cloneCourseRecord` | Thêm vào danh sách cột INSERT: `VersionNumber`, `RootCourseID`, `PreviousVersionID`, `IsLatestVersion`. Sửa hàm map kiểu dữ liệu (dòng 789-795) để nhận `sql.Int`/`sql.BigInt`/`sql.Bit` |
| B2 | `courses.service.js:1447` `createUpdateSession` | Truyền thêm overrides: `VersionNumber: live.VersionNumber + 1`, `RootCourseID: live.RootCourseID ?? live.CourseID`, `PreviousVersionID: live.CourseID`, `IsLatestVersion: 0` |
| B3 | `courses.service.js` **HÀM MỚI** | `promoteCourseVersion(draftId, liveId, transaction)` — hoán đổi slug + trạng thái theo Phần 2.2/2.3 |
| B4 | `courses.service.js:1097-1140` | Nhánh `UPDATE_SUBMISSION`: thay việc enqueue job bằng gọi thẳng `promoteCourseVersion` trong transaction |
| B5 | `courses.repository.js:626-629` | Quy tắc truy cập mới (Phần 2.4) — cho học viên đã ghi danh vào khóa `SUPERSEDED`/`ARCHIVED` |
| B6 | `courses.repository.js` (`queryCourses`) | Trang danh sách/tìm kiếm: thêm `AND IsLatestVersion = 1` để không hiện phiên bản cũ |
| B7 | `enrollments.repository.js:108-113` | "Khóa học của tôi": thêm cột `VersionNumber`, `IsLatestVersion` để UI hiện nhãn *"Bạn đang học phiên bản 1 — đã có phiên bản 2"* |
| B8 | `aiSync.service.js:29-64` | Ingest theo `CourseID`; `course_overview` chỉ lấy `IsLatestVersion = 1` (Phần 2.6) |
| B9 | `courses.service.js:451-465` | Không xóa file Cloudinary khi khóa bị xóa là **bản nháp** (`LiveCourseID != null`) — bản nháp dùng chung `ThumbnailPublicId` với bản live |

#### Nhóm C — Tách Chat + Bảo mật AI Service

| # | File | Sửa gì |
|---|---|---|
| C1 | `ChatbotUI.tsx:53` | Thêm `storageKey: 'chat_master_v1'` |
| C2 | `AIAssistantDialog.tsx:28,55` | Thêm prop `courseId`; truyền `storageKey: \`chat_course_${courseId}_v1\`` |
| C3 | `useChatbot.ts:185,239` | Thêm tùy chọn `streamFn` — không ép dùng `streamAgentAI` cho mọi trường hợp |
| C4 | `ai.service.ts` **HÀM MỚI** | `streamCourseAI()` gọi endpoint course, **có forward `course_name`** |
| C5 | `ai.service.ts:4-5` | Bỏ hardcode `MASTER_API_KEY` / `COURSE_AI_API_KEY` |
| C6 | `agent.py:295,343` | Đọc `request.course_context`; route `COURSE_LEARN` → `query_course()` thay vì `query_master()` |
| C7 | `ai-service/src/main.py` | Middleware xác thực đọc `X-Internal-Key` từ env |
| C8 | Backend **module mới** `src/api/ai/` | 5 endpoint theo ghi chú cuối file `V7` |

#### Nhóm D — Chứng chỉ & Socket.IO

| # | Việc | Ghi chú |
|---|---|---|
| D1 | Module `src/api/certificates/` | 5 endpoint theo ghi chú cuối file `V6`. Thêm `CERTIFICATE_SECRET` vào `.env.production` |
| D2 | Sinh PDF phía server | Dùng `pdfkit` hoặc `puppeteer`. Frontend đã có `CertificatePDFDocument.tsx` để tham khảo bố cục |
| D3 | Socket.IO | `server.js:31` — đổi `app.listen(PORT)` thành `const httpServer = http.createServer(app); const io = new Server(httpServer, {cors}); httpServer.listen(PORT)`. Xác thực bằng JWT trong `io.use()`. Giữ SSE hiện có song song hoặc chuyển dần |

> **Về độ khó Socket.IO:** thực tế **dễ hơn bạn nghĩ**, vì `event.manager.js` đã trừu tượng hóa sẵn `sendEventToUser()`. Chỉ cần viết lại phần thân hàm đó để phát qua `io.to(userId).emit(...)` — các nơi gọi không phải sửa gì. Ước tính ~1 ngày.

---

## PHẦN 5 — POSTGRESQL: TEXT GIẢI TRÌNH CHO BÁO CÁO

Bạn quyết định không làm PostgreSQL. Để không bị trừ điểm khi thầy đối chiếu đề cương, hãy **chủ động nêu trước** trong báo cáo. Đoạn dưới bạn có thể dùng luôn:

> **Lý do lựa chọn Microsoft SQL Server thay cho PostgreSQL**
>
> Trong giai đoạn phân tích thiết kế, nhóm đã khảo sát cả PostgreSQL và Microsoft SQL Server. Quyết định cuối cùng chọn SQL Server dựa trên bốn căn cứ kỹ thuật:
>
> *Thứ nhất, yêu cầu về độ chính xác tài chính.* Hệ thống có nghiệp vụ thanh toán đa tiền tệ (5 cổng: VNPay, MoMo, Stripe, PayPal, Crypto), ví số dư giảng viên và quy trình rút tiền. Các bảng `CoursePayments`, `InstructorBalanceTransactions`, `Payouts` sử dụng `decimal(36,18)` cho tỷ giá và `decimal(18,4)` cho số tiền, cùng cơ chế transaction với mức cô lập cao để đảm bảo không xảy ra sai lệch số dư khi có truy cập đồng thời.
>
> *Thứ hai, sự phù hợp của T-SQL với nghiệp vụ hiện tại.* Toàn bộ tầng repository (khoảng 30 module) khai thác các đặc trưng T-SQL như mệnh đề `OUTPUT Inserted.*` để lấy bản ghi vừa ghi trong cùng một lượt truy vấn, chỉ mục lọc (filtered index) và `FORMAT()` cho các báo cáo theo kỳ.
>
> *Thứ ba, khả năng tích hợp hạ tầng đám mây.* AWS RDS hỗ trợ SQL Server ở mức managed service với sao lưu tự động và mã hóa SSL sẵn có, phù hợp với kiến trúc triển khai đã thiết kế.
>
> *Thứ tư, tính khả thi trong phạm vi đồ án.* Việc chuyển đổi tại thời điểm hiện tại sẽ phải viết lại toàn bộ lược đồ và khoảng 30 module truy vấn, tạo ra rủi ro hồi quy không tương xứng với lợi ích thu được.
>
> Nhóm đã tìm hiểu PostgreSQL ở mức lý thuyết và ghi nhận các ưu thế của nó: chi phí bản quyền bằng không, hệ sinh thái extension phong phú (đặc biệt là `pgvector` cho tìm kiếm ngữ nghĩa — rất phù hợp với module RAG), và kiểu `JSONB` mạnh mẽ. Đây là hướng nâng cấp được đề xuất trong lộ trình tương lai, cụ thể là áp dụng mô hình **polyglot persistence**: giữ SQL Server cho dữ liệu giao dịch tài chính, đồng thời bổ sung PostgreSQL kèm `pgvector` cho dữ liệu hội thoại AI và vector embedding — thay thế cho ChromaDB hiện tại.

> 💡 Nếu sau này còn thời gian và muốn "chạm" vào PostgreSQL với chi phí thấp, cách rẻ nhất là đưa **2 bảng chat ở file V7** sang PostgreSQL thay vì SQL Server. Chúng hoàn toàn độc lập với phần tài chính, và bạn sẽ có luận điểm polyglot persistence *thật* chứ không chỉ trên lý thuyết. Ước tính thêm 2-3 ngày.

---

## PHẦN 6 — LỘ TRÌNH THỰC HIỆN

### 🔴 LEVEL 0 — Chạy SQL + sửa lỗi đang hỏng (1.5 ngày)

```
[ ] 0.1  Sao lưu database
[ ] 0.2  Chạy V4  → xác nhận Enrollments có IsCompleted, CompletedAt
[ ] 0.3  Chạy V8  → xác nhận bảng quy tắc xóa ở cuối file V8
[ ] 0.4  Sửa nhóm A1-A2  (chặn giảng viên tự duyệt)
[ ] 0.5  Sửa nhóm A3-A5  (10 tham chiếu cột sai → 4 API báo cáo sống lại)
[ ] 0.6  Sửa nhóm A6-A9  (8 truy vấn thiếu IsArchived → học viên đạt được 100%)
[ ] 0.7  Sửa nhóm A10    (bật SSE cho mọi thông báo)
[ ] 0.8  Sửa C1-C2       (tách storageKey — vá nhanh, chưa cần DB)
[ ] 0.9  TEST: gọi thử 4 API báo cáo, hoàn thành 1 khóa học kiểm tra 100%
```

**Kết thúc Level 0:** Progress Protection chạy được, 3/3 báo cáo trong đề cương hết lỗi 500, học viên nhận được 100%, lỗ hổng phân quyền đã vá, chat không lẫn lịch sử.

### 🟠 LEVEL 1 — Course Versioning (3-4 ngày)

```
[ ] 1.1  Chạy V5 → kiểm tra bảng kết quả ở cuối file (RootCourseID không NULL)
[ ] 1.2  Comment/xóa khối diff-and-patch (mục 4.1)
[ ] 1.3  Chuyển deleteSection/deleteLesson sang archive
[ ] 1.4  Sửa B1-B2 (cloneCourseRecord + createUpdateSession mang cột version)
[ ] 1.5  Viết promoteCourseVersion() (B3) + đấu vào reviewCourseApproval (B4)
[ ] 1.6  Sửa B5 (quy tắc truy cập) + B6 (danh sách chỉ hiện bản mới nhất)
[ ] 1.7  Sửa B9 (không xóa ảnh Cloudinary của bản nháp)
[ ] 1.8  Sửa B8 (RAG ingest theo CourseID)   ← RẤT DỄ QUÊN
[ ] 1.9  UI: nhãn phiên bản + trang "Lịch sử phiên bản" (B7)
[ ] 1.10 TEST kịch bản đầy đủ:
         tạo khóa → mua bằng TK học viên → học 3/5 bài →
         GV tạo v2, thêm 2 bài → admin duyệt →
         ✓ học viên cũ vẫn thấy 5 bài, tiến độ 3/5 nguyên vẹn
         ✓ người mua mới thấy 7 bài
         ✓ slug react-co-ban trỏ tới v2
```

### 🟡 LEVEL 2 — Lấp khoảng trống đề cương (4-5 ngày)

```
[ ] 2.1  Chạy V6 → module src/api/certificates/ (D1)
[ ] 2.2  Sinh PDF chứng chỉ phía server + QR verify (D2)
[ ] 2.3  Socket.IO (D3)
[ ] 2.4  Email nhắc nhở song song in-app
[ ] 2.5  Đưa text giải trình PostgreSQL vào báo cáo (Phần 5)
```

### 🟢 LEVEL 3 — Chat History DB (3 ngày)

```
[ ] 3.1  Chạy V7
[ ] 3.2  Module src/api/ai/ (C8) — 5 endpoint + SSE passthrough
[ ] 3.3  Sửa C3-C4 (useChatbot nhận streamFn, hàm stream riêng cho course)
[ ] 3.4  Sửa C6 (agent.py đọc course_context)
[ ] 3.5  Sửa C5, C7 (bỏ hardcode key, thêm middleware xác thực)
[ ] 3.6  Frontend chuyển từ localStorage sang API
```

### ⭐ LEVEL 4 — Điểm cộng khi bảo vệ (tùy thời gian)

```
[ ] 4.1  Dashboard "Bài giảng gây nhiều thắc mắc nhất" (view vw_CourseChatInsights)
[ ] 4.2  So sánh hiệu quả v1 vs v2 (tỷ lệ hoàn thành theo phiên bản)
[ ] 4.3  Audit log thao tác admin
[ ] 4.4  Nhắc nhở AI dùng thêm tín hiệu từ chat history
[ ] 4.5  Unit test cho promoteCourseVersion + công thức tính %
```

**Tổng ước tính: 12-14 ngày làm việc.** Nếu gấp, Level 0 + Level 1 (5-6 ngày) đã đủ để hệ thống chạy đúng và có điểm nhấn kiến trúc để bảo vệ.

---

## PHẦN 7 — CÂU HỎI CẦN BẠN XÁC NHẬN TRƯỚC KHI SỬA CODE

1. **Học viên v1 có được "nâng cấp" lên v2 miễn phí không?**
   - (a) Không — v1 là v1, muốn v2 phải mua lại → đơn giản nhất, đúng nguyên tắc nhất
   - (b) Có, tự nguyện — thêm nút "Nâng cấp", `Enrollments.CourseID` chuyển sang v2, tiến độ chuyển theo `OriginalID`
   - (c) Có, tự động
   > Tôi nghiêng về **(a)** cho đồ án — đúng tinh thần "mua v1 thì học v1", và ít code nhất. (b) có thể để ở phần "hướng phát triển".

2. **Giới hạn số phiên bản?** Ví dụ chỉ giữ 5 phiên bản gần nhất, hay giữ vĩnh viễn? (Giữ vĩnh viễn thì đúng nguyên tắc hơn, và với quy mô đồ án thì không tốn kém gì.)

3. **Giảng viên có được sửa nhẹ (sửa lỗi chính tả, thay link video hỏng) trên phiên bản đã publish không?**
   - Nếu **không** → đúng nguyên tắc tuyệt đối, nhưng video hỏng ở v1 sẽ hỏng vĩnh viễn với học viên v1
   - Nếu **có** → cần thêm luồng "patch" có duyệt
   > Với đồ án tôi đề xuất: **không cho sửa**, và ghi rõ trong báo cáo rằng đây là đánh đổi có chủ đích. Nếu thầy hỏi thì đó chính là câu trả lời thể hiện bạn đã cân nhắc.

4. **Có muốn tôi viết luôn code mẫu cho `promoteCourseVersion()` không**, hay bạn tự viết theo mô tả ở Phần 2.2-2.3?

---

## PHỤ LỤC — ĐỐI CHIẾU VỚI BẢN KẾ HOẠCH TRƯỚC

| Nội dung bản trước | Trạng thái ở bản này |
|---|---|
| P0-1 giảng viên tự duyệt | Giữ nguyên → A1, A2 |
| P0-2 cột sai trong báo cáo | **Đã bổ sung điều kiện**: phải chạy V4 trước, nếu không sửa sang `IsCompleted` vẫn lỗi |
| P0-3 bug `cloneFullLesson` | **Không cần sửa nữa** — xóa cả khối diff-and-patch |
| P0-4 CASCADE xóa tiến độ | Giữ nguyên → V8 (đã tinh chỉnh: chỉ bỏ CASCADE ở dữ liệu học viên) |
| P0-5 chat dùng chung | Giữ nguyên → C1-C8 |
| P0-6 % tiến độ sai | Giữ nguyên → A6-A9 |
| P0-7 AI service không xác thực | Giữ nguyên → C5, C7 |
| Đề xuất bảng `CourseVersions` riêng | **Đã bỏ** — thay bằng mô hình của bạn (đơn giản và tốt hơn) |
| Đề xuất `Enrollments.VersionID` | **Đã bỏ** — không cần, `CourseID` đã ghim sẵn |
| Đề xuất luồng PATCH sửa lỗi | Chuyển thành **câu hỏi #3** để bạn quyết |
| Phương án PostgreSQL A/B/C | **Đã chốt A** theo quyết định của bạn, kèm text giải trình |
