/* =============================================================================
   V5__course_versioning.sql
   -----------------------------------------------------------------------------
   MỤC ĐÍCH: Bổ sung cơ chế PHIÊN BẢN KHÓA HỌC theo mô hình
             "clone → sửa → duyệt → phiên bản cũ giữ nguyên cho học viên cũ".

   TRIẾT LÝ (rất quan trọng để hiểu vì sao schema đơn giản như vậy):
     Mỗi phiên bản là MỘT DÒNG Courses RIÊNG BIỆT, với Sections/Lessons riêng.
     Vì Enrollments.CourseID đã trỏ đúng vào dòng Courses của phiên bản học viên
     đã mua, nên học viên TỰ ĐỘNG được "ghim" vào phiên bản đó mà KHÔNG cần
     thêm cột VersionID vào Enrollments, và KHÔNG cần đụng vào LessonProgress.

     → Sau khi duyệt v2, hệ thống KHÔNG SỬA GÌ trên v1. Dữ liệu học viên v1
       an toàn tuyệt đối vì không có câu lệnh nào chạm tới nó.

   CÁC CỘT THÊM VÀO Courses:
     VersionNumber      1, 2, 3...
     RootCourseID       ID của phiên bản đầu tiên (v1) — dùng để gom nhóm báo cáo
     PreviousVersionID  ID phiên bản liền trước — dùng dựng dòng thời gian
     IsLatestVersion    1 = phiên bản đang bán; 0 = phiên bản cũ
     VersionNotes       Ghi chú thay đổi (changelog) hiển thị cho học viên
     ArchivedAt         Thời điểm bị thay thế

   THỨ TỰ: Chạy SAU V4.
============================================================================= */

USE [ThreeTEduTechLMS];
GO

PRINT N'=== V5: Bắt đầu thiết lập Course Versioning ===';
GO

/* -----------------------------------------------------------------------------
   1. Thêm trạng thái SUPERSEDED vào bảng tra cứu CourseStatuses
      Phân biệt rõ 2 tình huống:
        ARCHIVED   = giảng viên CHỦ ĐỘNG xin ngừng xuất bản
        SUPERSEDED = tự động chuyển sang khi có phiên bản mới được duyệt
      Cả hai đều KHÔNG bán nữa, nhưng học viên đã mua vẫn học bình thường.
----------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.CourseStatuses WHERE StatusID = N'SUPERSEDED')
BEGIN
    INSERT INTO dbo.CourseStatuses (StatusID, StatusName, Description)
    VALUES (
        N'SUPERSEDED',
        N'Đã có phiên bản mới',
        N'Phiên bản cũ đã được thay thế bởi phiên bản mới hơn. Không còn bán ra, nhưng học viên đã mua vẫn giữ nguyên quyền truy cập và toàn bộ tiến độ.'
    );
    PRINT N'  [+] Đã thêm trạng thái SUPERSEDED';
END
ELSE
    PRINT N'  [=] Trạng thái SUPERSEDED đã tồn tại, bỏ qua';
GO

/* -----------------------------------------------------------------------------
   2. Các cột phiên bản trên bảng Courses
----------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID(N'dbo.Courses') AND name = N'VersionNumber')
BEGIN
    ALTER TABLE dbo.Courses
        ADD VersionNumber INT NOT NULL
        CONSTRAINT DF_Courses_VersionNumber DEFAULT (1);
    PRINT N'  [+] Đã thêm cột Courses.VersionNumber';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID(N'dbo.Courses') AND name = N'RootCourseID')
BEGIN
    ALTER TABLE dbo.Courses ADD RootCourseID BIGINT NULL;
    PRINT N'  [+] Đã thêm cột Courses.RootCourseID';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID(N'dbo.Courses') AND name = N'PreviousVersionID')
BEGIN
    ALTER TABLE dbo.Courses ADD PreviousVersionID BIGINT NULL;
    PRINT N'  [+] Đã thêm cột Courses.PreviousVersionID';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID(N'dbo.Courses') AND name = N'IsLatestVersion')
BEGIN
    ALTER TABLE dbo.Courses
        ADD IsLatestVersion BIT NOT NULL
        CONSTRAINT DF_Courses_IsLatestVersion DEFAULT (1);
    PRINT N'  [+] Đã thêm cột Courses.IsLatestVersion';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID(N'dbo.Courses') AND name = N'VersionNotes')
BEGIN
    ALTER TABLE dbo.Courses ADD VersionNotes NVARCHAR(MAX) NULL;
    PRINT N'  [+] Đã thêm cột Courses.VersionNotes';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID(N'dbo.Courses') AND name = N'ArchivedAt')
BEGIN
    ALTER TABLE dbo.Courses ADD ArchivedAt DATETIME2(7) NULL;
    PRINT N'  [+] Đã thêm cột Courses.ArchivedAt';
END
GO

/* -----------------------------------------------------------------------------
   3. BACKFILL — quan trọng, phải chạy đúng thứ tự

   3a. Mọi khóa học "thật" (không phải bản nháp cập nhật) là phiên bản gốc:
       RootCourseID = chính nó
----------------------------------------------------------------------------- */
UPDATE dbo.Courses
   SET RootCourseID = CourseID
 WHERE RootCourseID IS NULL
   AND LiveCourseID IS NULL;
PRINT N'  [~] Backfill RootCourseID cho các khóa học gốc: ' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + N' dòng';
GO

/* 3b. Các bản nháp cập nhật đang tồn tại: thừa hưởng RootCourseID từ khóa live,
       và là phiên bản kế tiếp (chưa phải bản mới nhất vì chưa được duyệt) */
UPDATE d
   SET d.RootCourseID    = ISNULL(l.RootCourseID, l.CourseID),
       d.VersionNumber   = ISNULL(l.VersionNumber, 1) + 1,
       d.PreviousVersionID = l.CourseID,
       d.IsLatestVersion = 0
  FROM dbo.Courses d
  JOIN dbo.Courses l ON d.LiveCourseID = l.CourseID
 WHERE d.RootCourseID IS NULL;
PRINT N'  [~] Backfill cho các bản nháp cập nhật: ' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + N' dòng';
GO

/* 3c. Bản nháp chưa từng xuất bản (DRAFT/PENDING/REJECTED, không có LiveCourseID)
       vẫn là v1 và là "mới nhất" trong dòng của nó — đã xử lý ở 3a. */

/* -----------------------------------------------------------------------------
   4. Khóa ngoại tự tham chiếu
      LƯU Ý: KHÔNG dùng ON DELETE CASCADE — nếu không, xóa v1 sẽ kéo sập v2.
----------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Courses_RootCourseID')
BEGIN
    ALTER TABLE dbo.Courses WITH CHECK
        ADD CONSTRAINT FK_Courses_RootCourseID
        FOREIGN KEY (RootCourseID) REFERENCES dbo.Courses (CourseID);
    PRINT N'  [+] Đã thêm FK_Courses_RootCourseID';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Courses_PreviousVersionID')
BEGIN
    ALTER TABLE dbo.Courses WITH CHECK
        ADD CONSTRAINT FK_Courses_PreviousVersionID
        FOREIGN KEY (PreviousVersionID) REFERENCES dbo.Courses (CourseID);
    PRINT N'  [+] Đã thêm FK_Courses_PreviousVersionID';
END
GO

/* -----------------------------------------------------------------------------
   5. Chỉ mục
----------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_Courses_RootCourseID_Version'
                 AND object_id = OBJECT_ID(N'dbo.Courses'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Courses_RootCourseID_Version
        ON dbo.Courses (RootCourseID, VersionNumber DESC)
        INCLUDE (StatusID, IsLatestVersion, Slug, CourseName);
    PRINT N'  [+] Đã tạo index IX_Courses_RootCourseID_Version';
END
GO

/* Index lọc: chỉ các phiên bản đang bán — dùng cho trang danh sách khóa học */
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_Courses_IsLatestVersion_Filtered'
                 AND object_id = OBJECT_ID(N'dbo.Courses'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Courses_IsLatestVersion_Filtered
        ON dbo.Courses (StatusID, CategoryID)
        INCLUDE (CourseName, Slug, OriginalPrice, DiscountedPrice, ThumbnailUrl)
        WHERE IsLatestVersion = 1;
    PRINT N'  [+] Đã tạo index IX_Courses_IsLatestVersion_Filtered';
END
GO

/* -----------------------------------------------------------------------------
   6. VIEW tiện dụng — dùng cho BÁO CÁO gom nhóm theo dòng khóa học

   Vấn đề: sau khi có phiên bản, "Khóa React" có thể là 3 dòng Courses (v1,v2,v3).
   Báo cáo "Top khóa học theo lượt ghi danh" nếu GROUP BY CourseID sẽ tách rời
   3 phiên bản → số liệu sai lệch. View này gom chúng lại theo RootCourseID.
----------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.vw_CourseFamilyStats', N'V') IS NOT NULL
    DROP VIEW dbo.vw_CourseFamilyStats;
GO

CREATE VIEW dbo.vw_CourseFamilyStats
AS
SELECT
    c.RootCourseID,
    MAX(CASE WHEN c.IsLatestVersion = 1 THEN c.CourseID END)    AS LatestCourseID,
    MAX(CASE WHEN c.IsLatestVersion = 1 THEN c.CourseName END)  AS LatestCourseName,
    MAX(CASE WHEN c.IsLatestVersion = 1 THEN c.Slug END)        AS LatestSlug,
    MAX(c.VersionNumber)                                        AS LatestVersionNumber,
    COUNT(DISTINCT c.CourseID)                                  AS TotalVersions,
    MAX(c.InstructorID)                                         AS InstructorID,
    (SELECT COUNT(*) FROM dbo.Enrollments e
      JOIN dbo.Courses c2 ON e.CourseID = c2.CourseID
     WHERE c2.RootCourseID = c.RootCourseID)                    AS TotalEnrollmentsAllVersions,
    (SELECT COUNT(*) FROM dbo.Enrollments e
      JOIN dbo.Courses c2 ON e.CourseID = c2.CourseID
     WHERE c2.RootCourseID = c.RootCourseID AND e.IsCompleted = 1) AS TotalCompletedAllVersions
FROM dbo.Courses c
WHERE c.LiveCourseID IS NULL          -- loại bản nháp đang soạn
GROUP BY c.RootCourseID;
GO
PRINT N'  [+] Đã tạo view vw_CourseFamilyStats';
GO

/* -----------------------------------------------------------------------------
   7. KIỂM TRA SAU KHI CHẠY — chạy các câu này để xác nhận
----------------------------------------------------------------------------- */
PRINT N'--- Kiểm tra kết quả ---';
SELECT
    CourseID, CourseName, Slug, StatusID,
    VersionNumber, RootCourseID, PreviousVersionID, IsLatestVersion, LiveCourseID
FROM dbo.Courses
ORDER BY RootCourseID, VersionNumber;
GO

-- Phải trả về 0 dòng. Nếu có dòng → backfill chưa hoàn tất.
SELECT COUNT(*) AS SoDongThieuRootCourseID
FROM dbo.Courses WHERE RootCourseID IS NULL;
GO

PRINT N'=== V5: Hoàn tất ===';
GO
