# Level 1 — Course Versioning: Bàn giao & Kịch bản kiểm thử

> Ngày hoàn thành: 17/08/2026
> Trạng thái: **đã commit vào dự án**. Còn 1 việc bạn phải tự làm — xem mục 0.

---

## 0. VIỆC BẮT BUỘC TRƯỚC KHI CHẠY CODE

Bạn mới chạy `V4__fix_missing_migrations.sql`. **Code Level 1 sẽ lỗi ngay lần
gọi API đầu tiên nếu chưa chạy `V5`**, vì nó tham chiếu các cột chưa tồn tại.

```
db-init/V5__course_versioning.sql      ← CHẠY NGAY, bắt buộc
db-init/V8__protect_student_data.sql   ← nên chạy, nhưng chưa chặn Level 1
```

Sau khi chạy V5, câu kiểm tra ở cuối file phải trả về **0 dòng**:

```sql
SELECT COUNT(*) AS SoDongThieuRootCourseID
FROM dbo.Courses WHERE RootCourseID IS NULL;
```

Nếu ra khác 0 → backfill chưa xong, **đừng khởi động backend**, báo lại để xử lý.

---

## 1. Mô hình đã triển khai — tóm tắt trong 6 dòng

| Khái niệm | Ý nghĩa |
|---|---|
| Mỗi phiên bản | Là **một dòng `Courses` riêng**, có `Sections`/`Lessons` riêng |
| Học viên được "ghim" | Nhờ `Enrollments.CourseID` trỏ thẳng vào phiên bản đã mua — **không cần cột `VersionID`** |
| `RootCourseID` | Gốc của cả dòng khóa học, không đổi qua các đời. Dùng để gom nhóm báo cáo |
| `LiveCourseID` | Chỉ có ở **bản nháp**, trỏ tới khóa đang chạy mà nó sắp thay thế. Duyệt xong thì `= NULL` |
| `IsLatestVersion` | `1` = phiên bản đang bán |
| `SUPERSEDED` | Trạng thái mới: bị thay thế **tự động**. Khác `ARCHIVED` = giảng viên **chủ động** xin ngừng bán |

**Điểm mấu chốt:** khi duyệt v2, hệ thống **không chạy một câu lệnh nào** động
tới `Sections`/`Lessons`/`LessonProgress` của v1. Dữ liệu học viên v1 an toàn
không nhờ cơ chế bảo vệ nào cả, mà vì **không có gì chạm vào nó**.

---

## 2. Luồng đầy đủ sau khi tích hợp

```
Giảng viên bấm "Cập nhật khóa học"
   └─ createUpdateSession
        • clone Courses + toàn bộ Sections/Lessons  → bản nháp
        • bản nháp mang sẵn: VersionNumber = n+1, RootCourseID, PreviousVersionID, IsLatestVersion = 0
        • KHÔNG đụng gì tới khóa đang chạy — nó vẫn PUBLISHED và VẪN BÁN BÌNH THƯỜNG

Giảng viên sửa trên bản nháp → gửi duyệt (UPDATE_SUBMISSION)

Admin duyệt
   └─ promoteDraftToLiveVersion  (ĐỒNG BỘ, trong cùng 1 transaction)
        1. v1: Slug → "slug--v1-<id>", StatusID → SUPERSEDED, IsLatestVersion → 0, ArchivedAt = now
        2. v2: nhận slug đẹp, StatusID → PUBLISHED, IsLatestVersion → 1, LiveCourseID → NULL
        → hoặc CẢ HAI thành công, hoặc CẢ HAI rollback. Không còn trạng thái nửa vời.

Sau commit — chỉ gửi thông báo (lỗi ở bước này không ảnh hưởng dữ liệu):
   • Giảng viên: "Phiên bản v2 đã được phê duyệt"
   • Học viên v1: "Đã có phiên bản mới. Bạn vẫn học phiên bản đã mua, tiến độ giữ nguyên."

Admin từ chối → bản nháp về REJECTED, giảng viên sửa tiếp rồi gửi lại.
Giảng viên hủy   → xóa bản nháp. Khóa đang chạy KHÔNG bị đụng tới.
```

---

## 3. Những lỗi cũ đã được vá cùng lúc

| # | Lỗi | Hậu quả nếu để nguyên |
|---|---|---|
| 1 | Worker BullMQ chạy `syncLiveCourseFromUpdate` **sau** khi đã commit `APPROVED` | Job lỗi → yêu cầu duyệt **kẹt vĩnh viễn**: đã APPROVED nhưng nội dung không bao giờ áp dụng, không có đường về PENDING. Nay đã bỏ hẳn worker, thăng cấp chạy đồng bộ |
| 2 | `checkCourseAccess` có backdoor `!isAdmin` | Admin sửa/xóa được chương của khóa PUBLISHED. Kết hợp `ON DELETE CASCADE` trên `FK_LessonProgress_LessonID` → **một lệnh xóa chương quét sạch tiến độ toàn bộ học viên**. Nay áp dụng cho mọi vai trò |
| 3 | `deleteCourse` chỉ chặn giảng viên | Admin xóa vĩnh viễn khóa có học viên. Nay chặn **mọi vai trò**, cộng thêm chặn xóa phiên bản đã phát hành để bảo toàn lịch sử |
| 4 | `cancelUpdate` xóa tài nguyên Cloudinary của bản nháp | Bản nháp **dùng chung** `ThumbnailPublicId` với bản gốc → **mất ảnh bìa của khóa đang bán**. Nay đã bỏ bước dọn Cloudinary |
| 5 | Học viên mua v1, sau khi v1 → SUPERSEDED thì bấm vào bị **404** | `findCourseWithFullDetailsBySlug` chỉ cho xem `PUBLISHED`. Nay thêm ngoại lệ `EXISTS` trên `Enrollments` |
| 6 | AI Sync ingest theo `course_name` | v1 và v2 **trùng tên** → tri thức v2 **ghi đè** v1 trong ChromaDB → chatbot trả lời học viên v1 bằng nội dung v2. Đúng thứ versioning sinh ra để ngăn. Nay chỉ ingest `IsLatestVersion = 1` và gửi kèm `course_id` + `version_number` vào metadata |
| 7 | Đọc `Courses` bằng kết nối riêng **ngay sau** câu `UPDATE` trong transaction | **Tự khóa chính mình** (self-deadlock): kết nối riêng chờ khóa ghi, transaction chờ câu đọc. Request treo tới hết lock timeout. Chỉ lộ ra khi có tải thật |
| 8 | Slug về hưu `slug--v1` có thể tràn `nvarchar(500)` | Câu `UPDATE` ném lỗi tràn chuỗi → **rollback cả transaction duyệt**. Nay cắt phần gốc trước khi nối hậu tố, và thêm `CourseID` để đảm bảo duy nhất tuyệt đối |
| 9 | Danh sách khóa học hiện cả bản nháp và phiên bản cũ | Nay `findAllCourses` lọc `LiveCourseID IS NULL AND ISNULL(IsLatestVersion,1) = 1` |

---

## 4. Danh sách file đã thay đổi

### Backend

| File | Thay đổi |
|---|---|
| `core/enums/CourseStatus.js` | `+ SUPERSEDED` (giữ **thuần chuỗi** — `courses.validation.js:54` spread `Object.values()` vào Joi) |
| `api/courses/courses.repository.js` | `+ promoteDraftToLiveVersion`, `+ findVersionsByRootId`, `+ hasEnrollment`, `+ hasEnrollmentInCourseFamily`; `findCourseById` nhận `transaction`; `findCourseWithFullDetailsBySlug` có lối thoát `EXISTS`-enrollment; `cloneCourseRecord` có bảng kiểu SQL tường minh; `findAllCourses` lọc phiên bản |
| `api/courses/courses.service.js` | Nhánh `UPDATE_SUBMISSION` viết lại **đồng bộ**; `createUpdateSession` gắn metadata phiên bản; `cancelUpdate` không đụng khóa live & không xóa Cloudinary; `deleteCourse` chặn mọi vai trò + bảo toàn lịch sử; `+ getCourseVersionHistory`; ~300 dòng Diff-and-Patch đã comment |
| `api/courses/courses.controller.js` + `.routes.js` | `+ GET /courses/:courseId/versions` |
| `api/sections/sections.service.js` | Bỏ backdoor `!isAdmin` (kéo theo `lessons.service.js` vì nó import `checkCourseAccess`) |
| `api/enrollments/enrollments.repository.js` | `+ VersionNumber`, `IsLatestVersion`, `LatestVersionSlug` |
| `services/aiSync.service.js` | Chỉ ingest phiên bản đang bán, gửi kèm metadata phiên bản |
| `queues/courseSync.queue.js` | `startCourseSyncWorker` thành no-op (giữ chữ ký để `server.js` không phải sửa) |

### Frontend

| File | Thay đổi |
|---|---|
| `services/course.service.ts` | `+ getCourseVersionHistory()` + kiểu dữ liệu |
| `services/enrollment.service.ts` | `+ versionNumber`, `isLatestVersion`, `latestVersionSlug` |
| `components/course/CourseVersionHistory.tsx` | **Mới** — dòng thời gian các phiên bản |

### SQL

| File | Trạng thái |
|---|---|
| `db-init/V5__course_versioning.sql` | **CHƯA CHẠY — chạy ngay** |

---

## 5. Cách nhúng giao diện (2 chỗ, mỗi chỗ vài dòng)

### 5a. Trang chi tiết khóa học — `pages/CourseDetail.tsx`

```tsx
import CourseVersionHistory from '@/components/course/CourseVersionHistory';

// ...đặt trong phần nội dung, ví dụ dưới khối "Nội dung khóa học":
<CourseVersionHistory courseId={course.courseId} className="mt-6" />
```

Component **tự ẩn** khi khóa chỉ có 1 phiên bản, hoặc khi người xem không đủ
quyền (API trả 403) — nên đặt vào là chạy, không cần điều kiện bọc ngoài.

### 5b. Trang "Khóa học của tôi" — `pages/MyCourses.tsx`

```tsx
{enrollment.isLatestVersion === false && (
  <div className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800
                  dark:bg-amber-950 dark:text-amber-200">
    Bạn đang học <strong>phiên bản {enrollment.versionNumber}</strong>.
    Khóa học đã có bản cập nhật mới hơn — nội dung và tiến độ của bạn được giữ nguyên.
    {enrollment.latestVersionSlug && (
      <Link
        to={`/courses/${enrollment.latestVersionSlug}`}
        className="ml-1 font-medium underline"
      >
        Xem bản mới
      </Link>
    )}
  </div>
)}
```

---

## 6. KỊCH BẢN KIỂM THỬ ĐẦU–CUỐI

Chạy đúng thứ tự. Mỗi bước có câu SQL kiểm chứng — **đây chính là phần bạn nên
chụp màn hình để đưa vào báo cáo đồ án**.

### Chuẩn bị
1. Chạy `V5__course_versioning.sql`, xác nhận câu kiểm tra trả về 0 dòng.
2. Khởi động lại backend. Log phải xuất hiện:
   `[Course Sync] Worker đã ngừng hoạt động — thăng cấp phiên bản khóa học nay chạy đồng bộ...`
3. Chọn một khóa học `PUBLISHED` **đã có ít nhất 1 học viên**. Ghi lại `CourseID` → gọi là **C1**.

### TC-01 · Trạng thái xuất phát
```sql
SELECT CourseID, Slug, StatusID, VersionNumber, RootCourseID,
       PreviousVersionID, IsLatestVersion, LiveCourseID
FROM Courses WHERE CourseID = <C1>;
```
✅ `VersionNumber = 1`, `RootCourseID = C1`, `IsLatestVersion = 1`, `LiveCourseID = NULL`

Ghi lại số bài học đã hoàn thành của học viên (dùng để đối chiếu ở TC-07):
```sql
SELECT AccountID, COUNT(*) AS SoBaiDaXong
FROM LessonProgress lp
JOIN Lessons l  ON lp.LessonID = l.LessonID
JOIN Sections s ON l.SectionID = s.SectionID
WHERE s.CourseID = <C1> AND lp.IsCompleted = 1
GROUP BY AccountID;
```

### TC-02 · Không ai sửa được khóa đang bán
Đăng nhập **Admin**, thử thêm/sửa/xóa một chương của C1.
✅ Nhận `400 Bad Request`: *"Không thể ... trên khóa học đã xuất bản ... Hãy dùng chức năng Tạo phiên bản mới"*
→ Đây là bằng chứng backdoor Admin đã bị bịt.

### TC-03 · Tạo phiên cập nhật
Giảng viên bấm "Cập nhật khóa học". Ghi lại `CourseID` bản nháp → **D**.
```sql
SELECT CourseID, Slug, StatusID, VersionNumber, RootCourseID,
       PreviousVersionID, IsLatestVersion, LiveCourseID
FROM Courses WHERE CourseID IN (<C1>, <D>);
```
✅ D: `StatusID = DRAFT`, `VersionNumber = 2`, `RootCourseID = C1`, `PreviousVersionID = C1`, `IsLatestVersion = 0`, `LiveCourseID = C1`
✅ **C1 KHÔNG đổi gì cả** — vẫn `PUBLISHED`, vẫn `IsLatestVersion = 1`

### TC-04 · Khóa cũ vẫn bán bình thường trong lúc soạn nháp
Mở trang khóa học C1 bằng tài khoản khách.
✅ Vẫn hiển thị, vẫn mua được. Bản nháp D **không** xuất hiện trong danh sách khóa học.

### TC-05 · Sửa nháp rồi gửi duyệt
Trên D: đổi tên một bài học, thêm một chương mới, gửi duyệt.
✅ Trạng thái D → `PENDING`. C1 vẫn `PUBLISHED`.

### TC-06 · Admin duyệt
```sql
SELECT CourseID, Slug, StatusID, VersionNumber, IsLatestVersion,
       LiveCourseID, ArchivedAt, PublishedAt
FROM Courses WHERE RootCourseID = <C1> ORDER BY VersionNumber;
```
✅ C1: `StatusID = SUPERSEDED`, `Slug = '<slug-cũ>--v1-<C1>'`, `IsLatestVersion = 0`, `ArchivedAt` có giá trị
✅ D:  `StatusID = PUBLISHED`, `Slug = '<slug-đẹp>'`, `IsLatestVersion = 1`, `LiveCourseID = NULL`

### TC-07 · ⭐ BÀI KIỂM TRA QUAN TRỌNG NHẤT — dữ liệu học viên v1
Chạy lại **đúng câu SQL đếm tiến độ ở TC-01**.
✅ **Số liệu phải y hệt TC-01, không sai một dòng.**

```sql
-- Chương/bài của v1 còn nguyên?
SELECT COUNT(*) FROM Sections WHERE CourseID = <C1>;
SELECT COUNT(*) FROM Lessons l JOIN Sections s ON l.SectionID = s.SectionID
 WHERE s.CourseID = <C1>;

-- Ghi danh của v1 còn trỏ đúng v1?
SELECT EnrollmentID, AccountID, CourseID FROM Enrollments WHERE CourseID = <C1>;
```
✅ Tất cả giữ nguyên. Đây là bằng chứng trực tiếp cho yêu cầu của thầy.

### TC-08 · Học viên v1 vẫn vào học được
Đăng nhập bằng học viên đã mua v1 → "Khóa học của tôi" → bấm vào khóa.
✅ Vào được (dù C1 đang `SUPERSEDED`), thấy **nội dung cũ**, tiến độ nguyên vẹn.
✅ Có nhãn *"Bạn đang học phiên bản 1 — đã có phiên bản 2"* (nếu đã nhúng 5b).
✅ Có thông báo trong chuông: *"Khóa học ... vừa có phiên bản mới (v2)"*.

### TC-09 · Người mua mới nhận v2
Tài khoản khác mở slug đẹp → mua.
```sql
SELECT TOP 1 CourseID FROM Enrollments ORDER BY EnrollmentID DESC;
```
✅ Trả về **D**, không phải C1.

### TC-10 · Lịch sử phiên bản
`GET /v1/courses/<D>/versions` (hoặc `<C1>` — cả hai phải cho cùng kết quả).
✅ Trả 2 phiên bản, mới nhất trước.
✅ Bằng tài khoản **học viên**: có dữ liệu nhưng **không có** `studentCount`.
✅ Bằng tài khoản **khách chưa mua**: `403`.
✅ Bằng học viên **chỉ mua v1** nhưng gọi bằng ID của **v2**: vẫn `200` (nhờ `hasEnrollmentInCourseFamily`).

### TC-11 · Không xóa được lịch sử
Admin thử xóa C1 (`SUPERSEDED`).
✅ `400`: *"Đây là một phiên bản đã phát hành trong lịch sử khóa học nên không thể xóa vĩnh viễn."*

### TC-12 · Chatbot không lẫn phiên bản
Khởi động lại backend để AI Sync chạy.
✅ Log `[AI Sync]` chỉ đếm phiên bản đang bán — C1 **không** được ingest lại.
✅ Hỏi chatbot về khóa học → chỉ giới thiệu v2.

### TC-13 · Hủy nháp không phá gì
Tạo phiên cập nhật mới trên D rồi bấm "Hủy".
✅ Bản nháp biến mất khỏi DB.
✅ D vẫn `PUBLISHED`, **ảnh bìa và video giới thiệu vẫn hiển thị** (bug Cloudinary đã vá).

---

## 7. Đã biết trước — không phải lỗi

- **Bản nháp chưa duyệt không hiện trong `/courses`**: cố ý. Giảng viên xem ở
  trang quản lý khóa học của mình.
- **`VersionNotes` chưa có ô nhập trên giao diện**: cột và API đã sẵn sàng; chỉ
  cần thêm một `Textarea` ở màn hình gửi duyệt là hiển thị được changelog cho
  học viên. Không chặn Level 1.
- **Học viên v1 không được nâng cấp lên v2 miễn phí**: đây là quyết định mặc
  định tôi đã chọn (câu hỏi số 1 ở Phần 7 của `KE_HOACH_V2_CHINH_THUC.md` bạn
  chưa trả lời). Muốn đổi thì báo, sửa không tốn nhiều công.
- **`addCourseSyncJob` vẫn còn trong `courseSync.queue.js`**: không còn ai gọi,
  giữ lại để không phải sửa `server.js`. Vô hại.

---

## 8. Bước tiếp theo

**Level 2** — chứng chỉ (backend), Socket.IO cho thảo luận/thông báo realtime,
email nhắc tiến độ, và phần viết so sánh PostgreSQL cho báo cáo.

Trước khi bắt đầu, nên chạy nốt `V8__protect_student_data.sql`: nó gỡ
`ON DELETE CASCADE` khỏi `LessonProgress → Lessons`, `QuizAttempts → Lessons`
và `Enrollments → Courses`. Sau Level 1 thì không còn đường code nào xóa nhầm
nữa, nhưng V8 là lớp chặn ở tầng CSDL — thao tác tay trực tiếp trên SQL Server
cũng không phá được dữ liệu học viên.
