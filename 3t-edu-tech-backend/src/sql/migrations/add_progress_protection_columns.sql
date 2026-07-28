-- ============================================================
-- SQL MIGRATION: Bảo Vệ Tiến Độ Học Viên (Progress Protection)
-- Dự án: 3TEduTech - Nâng Cấp Enterprise
-- Ngày: 2026-07-26
-- ============================================================
-- Mô tả: Thêm 2 cột vào bảng Enrollments để khóa cứng
-- trạng thái hoàn thành khóa học cho học viên.
--
-- Khi học viên hoàn thành 100% bài học, hệ thống sẽ tự động:
-- 1. Set IsCompleted = 1
-- 2. Set CompletedAt = thời điểm hoàn thành
--
-- Từ đó, dù Giảng viên thêm/xóa bài mới, tiến độ của
-- học viên đã tốt nghiệp LUÔN LUÔN hiển thị 100%.
-- ============================================================

-- Cột 1: Cờ đánh dấu hoàn thành vĩnh viễn
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Enrollments') AND name = 'IsCompleted'
)
BEGIN
    ALTER TABLE Enrollments ADD IsCompleted BIT NOT NULL DEFAULT 0;
    PRINT N'✅ Added column IsCompleted to Enrollments table.';
END
ELSE
BEGIN
    PRINT N'⏭️ Column IsCompleted already exists. Skipping.';
END
GO

-- Cột 2: Thời điểm hoàn thành (dùng cho Chứng chỉ & Lịch sử)
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Enrollments') AND name = 'CompletedAt'
)
BEGIN
    ALTER TABLE Enrollments ADD CompletedAt DATETIME2 NULL;
    PRINT N'✅ Added column CompletedAt to Enrollments table.';
END
ELSE
BEGIN
    PRINT N'⏭️ Column CompletedAt already exists. Skipping.';
END
GO

-- ============================================================
-- (TÙY CHỌN) Backfill: Đánh dấu các học viên đã hoàn thành
-- 100% trong quá khứ nhưng chưa được lock.
-- Chạy lệnh này SAU khi đã thêm 2 cột ở trên.
-- ============================================================
-- UPDATE e
-- SET e.IsCompleted = 1, e.CompletedAt = GETDATE()
-- FROM Enrollments e
-- WHERE e.IsCompleted = 0
--   AND (
--     SELECT COUNT(*)
--     FROM Lessons l
--     JOIN Sections s ON l.SectionID = s.SectionID
--     WHERE s.CourseID = e.CourseID
--   ) > 0
--   AND (
--     SELECT COUNT(*)
--     FROM Lessons l
--     JOIN Sections s ON l.SectionID = s.SectionID
--     WHERE s.CourseID = e.CourseID
--   ) = (
--     SELECT COUNT(*)
--     FROM LessonProgress lp
--     JOIN Lessons l ON lp.LessonID = l.LessonID
--     JOIN Sections s ON l.SectionID = s.SectionID
--     WHERE lp.AccountID = e.AccountID AND s.CourseID = e.CourseID AND lp.IsCompleted = 1
--   );

PRINT N'🎉 Migration completed successfully!';
GO
