-- Cập nhật TotalTimeSpent cho những bài học VIDEO đã hoàn thành
UPDATE lp
SET lp.TotalTimeSpent = ISNULL(l.VideoDurationSeconds, 0)
FROM LessonProgress lp
JOIN Lessons l ON lp.LessonID = l.LessonID
WHERE lp.IsCompleted = 1 
  AND l.LessonType = 'VIDEO'
  AND l.VideoDurationSeconds IS NOT NULL;
