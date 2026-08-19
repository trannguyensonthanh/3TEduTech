/* =============================================================================
   V4__fix_missing_migrations.sql
   -----------------------------------------------------------------------------
   MỤC ĐÍCH: Vá 2 migration ĐÃ VIẾT NHƯNG CHƯA ĐƯỢC CHẠY trên database thật.

   Đối chiếu schema live (17/08/2026) cho thấy:
     - Bảng Enrollments THIẾU cột IsCompleted, CompletedAt  (V2 chưa chạy)
     - Ràng buộc CK_CourseApprovalRequests_RequestType THIẾU 'ARCHIVE_SUBMISSION'
       (V3 chưa chạy)

   Hệ quả nếu không chạy file này:
     - progress.service.js:81-85, 222-245 (Progress Protection) → lỗi
       "Invalid column name 'IsCompleted'"
     - enrollments.repository.js:266-271 (đánh dấu hoàn thành) → lỗi tương tự
     - courses.service.js:1547-1552 (xin ngừng xuất bản) → lỗi vi phạm CHECK

   AN TOÀN: Toàn bộ script idempotent — chạy nhiều lần không gây lỗi.
   THỨ TỰ: Chạy file này TRƯỚC V5.
============================================================================= */

USE [ThreeTEduTechLMS];
GO

PRINT N'=== V4: Bắt đầu vá các migration còn thiếu ===';
GO

/* -----------------------------------------------------------------------------
   1. Enrollments.IsCompleted — cờ "đã hoàn thành khóa học" (Progress Protection)
   Khi học viên đạt 100%, cờ này khóa cứng vĩnh viễn để nội dung mới thêm vào
   sau đó không làm tụt tiến độ của họ.
----------------------------------------------------------------------------- */
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Enrollments') AND name = N'IsCompleted'
)
BEGIN
    ALTER TABLE dbo.Enrollments
        ADD IsCompleted BIT NOT NULL
        CONSTRAINT DF_Enrollments_IsCompleted DEFAULT (0);
    PRINT N'  [+] Đã thêm cột Enrollments.IsCompleted';
END
ELSE
    PRINT N'  [=] Cột Enrollments.IsCompleted đã tồn tại, bỏ qua';
GO

/* -----------------------------------------------------------------------------
   2. Enrollments.CompletedAt — mốc thời gian hoàn thành (dùng cho chứng chỉ)
----------------------------------------------------------------------------- */
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Enrollments') AND name = N'CompletedAt'
)
BEGIN
    ALTER TABLE dbo.Enrollments ADD CompletedAt DATETIME2(7) NULL;
    PRINT N'  [+] Đã thêm cột Enrollments.CompletedAt';
END
ELSE
    PRINT N'  [=] Cột Enrollments.CompletedAt đã tồn tại, bỏ qua';
GO

/* -----------------------------------------------------------------------------
   3. Cho phép RequestType = 'ARCHIVE_SUBMISSION'
   (luồng giảng viên xin ngừng xuất bản khóa học đã có học viên)
----------------------------------------------------------------------------- */
IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = N'CK_CourseApprovalRequests_RequestType'
)
BEGIN
    ALTER TABLE dbo.CourseApprovalRequests
        DROP CONSTRAINT CK_CourseApprovalRequests_RequestType;
    PRINT N'  [-] Đã gỡ ràng buộc RequestType cũ';
END
GO

ALTER TABLE dbo.CourseApprovalRequests WITH CHECK
    ADD CONSTRAINT CK_CourseApprovalRequests_RequestType CHECK (
        RequestType IN (
            'INITIAL_SUBMISSION',
            'RE_SUBMISSION',
            'UPDATE_SUBMISSION',
            'ARCHIVE_SUBMISSION'
        )
    );
PRINT N'  [+] Đã tạo lại ràng buộc RequestType (có ARCHIVE_SUBMISSION)';
GO

/* -----------------------------------------------------------------------------
   4. Chỉ mục hỗ trợ đếm tiến độ (tối ưu các truy vấn % hoàn thành)
----------------------------------------------------------------------------- */
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Enrollments_Account_IsCompleted'
      AND object_id = OBJECT_ID(N'dbo.Enrollments')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Enrollments_Account_IsCompleted
        ON dbo.Enrollments (AccountID, IsCompleted)
        INCLUDE (CourseID, EnrolledAt, CompletedAt);
    PRINT N'  [+] Đã tạo index IX_Enrollments_Account_IsCompleted';
END
GO

/* -----------------------------------------------------------------------------
   5. (TÙY CHỌN) Backfill: đánh dấu hoàn thành cho học viên đã học hết bài

   Bỏ comment khối dưới nếu bạn muốn hệ thống tự nhận diện các học viên đã học
   xong từ trước (dựa trên LessonProgress). Chỉ đếm bài CHƯA lưu trữ.

   Khuyến nghị: chạy phần SELECT trước để xem sẽ ảnh hưởng bao nhiêu dòng.
----------------------------------------------------------------------------- */
/*
-- Xem trước (không thay đổi dữ liệu):
SELECT e.EnrollmentID, e.AccountID, e.CourseID, e.EnrolledAt
FROM dbo.Enrollments e
WHERE e.IsCompleted = 0
  AND (SELECT COUNT(*) FROM dbo.Lessons l
       JOIN dbo.Sections s ON l.SectionID = s.SectionID
       WHERE s.CourseID = e.CourseID AND l.IsArchived = 0 AND s.IsArchived = 0) > 0
  AND (SELECT COUNT(*) FROM dbo.Lessons l
       JOIN dbo.Sections s ON l.SectionID = s.SectionID
       WHERE s.CourseID = e.CourseID AND l.IsArchived = 0 AND s.IsArchived = 0)
      = (SELECT COUNT(*) FROM dbo.LessonProgress lp
         JOIN dbo.Lessons l ON lp.LessonID = l.LessonID
         JOIN dbo.Sections s ON l.SectionID = s.SectionID
         WHERE lp.AccountID = e.AccountID AND s.CourseID = e.CourseID
           AND lp.IsCompleted = 1 AND l.IsArchived = 0 AND s.IsArchived = 0);

-- Thực hiện backfill:
UPDATE e
   SET e.IsCompleted = 1,
       e.CompletedAt = ISNULL(
           (SELECT MAX(lp.CompletedAt) FROM dbo.LessonProgress lp
            JOIN dbo.Lessons l ON lp.LessonID = l.LessonID
            JOIN dbo.Sections s ON l.SectionID = s.SectionID
            WHERE lp.AccountID = e.AccountID AND s.CourseID = e.CourseID
              AND lp.IsCompleted = 1),
           GETDATE())
FROM dbo.Enrollments e
WHERE e.IsCompleted = 0
  AND (SELECT COUNT(*) FROM dbo.Lessons l
       JOIN dbo.Sections s ON l.SectionID = s.SectionID
       WHERE s.CourseID = e.CourseID AND l.IsArchived = 0 AND s.IsArchived = 0) > 0
  AND (SELECT COUNT(*) FROM dbo.Lessons l
       JOIN dbo.Sections s ON l.SectionID = s.SectionID
       WHERE s.CourseID = e.CourseID AND l.IsArchived = 0 AND s.IsArchived = 0)
      = (SELECT COUNT(*) FROM dbo.LessonProgress lp
         JOIN dbo.Lessons l ON lp.LessonID = l.LessonID
         JOIN dbo.Sections s ON l.SectionID = s.SectionID
         WHERE lp.AccountID = e.AccountID AND s.CourseID = e.CourseID
           AND lp.IsCompleted = 1 AND l.IsArchived = 0 AND s.IsArchived = 0);
GO
*/

PRINT N'=== V4: Hoàn tất ===';
GO
