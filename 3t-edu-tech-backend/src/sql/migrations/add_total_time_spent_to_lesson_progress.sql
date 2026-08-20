-- Migration: Add TotalTimeSpent to LessonProgress
-- Description: Adds a column to track total time spent by a user on a lesson in seconds.

IF NOT EXISTS (
    SELECT * 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'LessonProgress' AND COLUMN_NAME = 'TotalTimeSpent'
)
BEGIN
    PRINT 'Adding TotalTimeSpent column to LessonProgress table...';
    ALTER TABLE LessonProgress
    ADD TotalTimeSpent INT NOT NULL DEFAULT 0;
    PRINT 'Column added successfully.';
END
ELSE
BEGIN
    PRINT 'Column TotalTimeSpent already exists in LessonProgress table.';
END
GO
