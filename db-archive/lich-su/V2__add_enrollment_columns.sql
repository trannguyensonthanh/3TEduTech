-- File: db-init/V2__add_enrollment_columns.sql
-- SQL MIGRATION: Bảo Vệ Tiến Độ Học Viên (Progress Protection) - Thêm IsCompleted và CompletedAt
USE [ThreeTEduTechLMS];
GO

-- Cột 1: Cờ đánh dấu hoàn thành vĩnh viễn
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Enrollments') AND name = 'IsCompleted'
)
BEGIN
    ALTER TABLE Enrollments ADD IsCompleted BIT NOT NULL DEFAULT 0;
    PRINT N'✅ Added column IsCompleted to Enrollments table.';
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
GO
