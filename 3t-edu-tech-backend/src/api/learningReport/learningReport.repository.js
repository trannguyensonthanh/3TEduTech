const { getConnection, sql } = require('../../database/connection');

const getOverviewStats = async (accountId) => {
  const pool = await getConnection();
  const request = pool.request();
  request.input('AccountID', sql.BigInt, accountId);

  const query = `
    SELECT
      (SELECT COUNT(*) 
       FROM Enrollments 
       JOIN Courses ON Enrollments.CourseID = Courses.CourseID 
       WHERE Enrollments.AccountID = @AccountID AND Courses.StatusID = 'PUBLISHED'
      ) AS TotalEnrolledCourses,
      
      (SELECT COUNT(*) 
       FROM LessonProgress lp
       JOIN Lessons l ON lp.LessonID = l.LessonID
       JOIN Sections s ON l.SectionID = s.SectionID
       JOIN Enrollments e ON s.CourseID = e.CourseID AND e.AccountID = @AccountID
       WHERE lp.AccountID = @AccountID AND lp.IsCompleted = 1
      ) AS TotalCompletedLessons,
      
      (SELECT ISNULL(SUM(DATEDIFF(MINUTE, CreatedAt, LastWatchedAt)), 0)
       FROM LessonProgress
       WHERE AccountID = @AccountID AND LastWatchedAt IS NOT NULL
      ) AS TotalLearningTimeMinutes,
      
      (SELECT ISNULL(AVG(e.ProgressPercentage), 0)
       FROM Enrollments e
       JOIN Courses c ON e.CourseID = c.CourseID
       WHERE e.AccountID = @AccountID AND c.StatusID = 'PUBLISHED'
      ) AS AvgCompletionPercentage
  `;
  
  const result = await request.query(query);
  return result.recordset[0];
};

const getCourseProgressDetails = async (accountId) => {
  const pool = await getConnection();
  const request = pool.request();
  request.input('AccountID', sql.BigInt, accountId);

  const query = `
    SELECT 
      c.CourseName,
      c.CourseID,
      c.ThumbnailURL,
      (SELECT COUNT(*) FROM Lessons l JOIN Sections s ON l.SectionID = s.SectionID WHERE s.CourseID = c.CourseID) AS TotalLessons,
      (SELECT COUNT(*) FROM LessonProgress lp JOIN Lessons l ON lp.LessonID = l.LessonID JOIN Sections s ON l.SectionID = s.SectionID WHERE s.CourseID = c.CourseID AND lp.AccountID = @AccountID AND lp.IsCompleted = 1) AS CompletedLessons,
      e.ProgressPercentage,
      e.EnrolledAt,
      (SELECT MAX(COALESCE(LastWatchedAt, CompletedAt)) FROM LessonProgress lp JOIN Lessons l ON lp.LessonID = l.LessonID JOIN Sections s ON l.SectionID = s.SectionID WHERE s.CourseID = c.CourseID AND lp.AccountID = @AccountID) AS LastActivityAt,
      (SELECT AVG(qa.Score) FROM QuizAttempts qa JOIN Lessons l ON qa.LessonID = l.LessonID JOIN Sections s ON l.SectionID = s.SectionID WHERE s.CourseID = c.CourseID AND qa.AccountID = @AccountID AND qa.CompletedAt IS NOT NULL) AS AvgQuizScore
    FROM Enrollments e
    JOIN Courses c ON e.CourseID = c.CourseID
    WHERE e.AccountID = @AccountID AND c.StatusID = 'PUBLISHED'
  `;
  
  const result = await request.query(query);
  return result.recordset;
};

const getQuizPerformance = async (accountId) => {
  const pool = await getConnection();
  const request = pool.request();
  request.input('AccountID', sql.BigInt, accountId);

  const statsQuery = `
    SELECT 
      COUNT(*) AS TotalAttempts,
      ISNULL(AVG(Score), 0) AS AverageScore,
      SUM(CASE WHEN IsPassed = 1 THEN 1 ELSE 0 END) AS PassCount,
      SUM(CASE WHEN IsPassed = 0 THEN 1 ELSE 0 END) AS FailCount
    FROM QuizAttempts
    WHERE AccountID = @AccountID AND CompletedAt IS NOT NULL
  `;
  
  const recentQuery = `
    SELECT TOP 10 
      qa.LessonID,
      c.CourseName,
      qa.Score,
      qa.IsPassed,
      qa.CompletedAt,
      qa.AttemptNumber
    FROM QuizAttempts qa
    JOIN Lessons l ON qa.LessonID = l.LessonID
    JOIN Sections s ON l.SectionID = s.SectionID
    JOIN Courses c ON s.CourseID = c.CourseID
    WHERE qa.AccountID = @AccountID AND qa.CompletedAt IS NOT NULL
    ORDER BY qa.CompletedAt DESC
  `;
  
  const [statsResult, recentResult] = await Promise.all([
    request.query(statsQuery),
    request.query(recentQuery)
  ]);

  return {
    ...statsResult.recordset[0],
    RecentAttempts: recentResult.recordset
  };
};

const getWeeklyActivity = async (accountId) => {
  const pool = await getConnection();
  const request = pool.request();
  request.input('AccountID', sql.BigInt, accountId);

  const query = `
    WITH Last7Days AS (
      SELECT CAST(GETDATE() AS DATE) AS Date
      UNION ALL
      SELECT DATEADD(day, -1, Date)
      FROM Last7Days
      WHERE Date > CAST(DATEADD(day, -6, GETDATE()) AS DATE)
    )
    SELECT 
      FORMAT(d.Date, 'yyyy-MM-dd') AS Date,
      (SELECT COUNT(*) FROM LessonProgress lp WHERE lp.AccountID = @AccountID AND CAST(lp.CompletedAt AS DATE) = d.Date) AS LessonsCompleted,
      (SELECT ISNULL(SUM(DATEDIFF(MINUTE, CreatedAt, LastWatchedAt)), 0) FROM LessonProgress lp WHERE lp.AccountID = @AccountID AND CAST(lp.LastWatchedAt AS DATE) = d.Date AND lp.LastWatchedAt IS NOT NULL) AS MinutesSpent
    FROM Last7Days d
    ORDER BY d.Date ASC
  `;
  
  const result = await request.query(query);
  return result.recordset;
};

const getLearningStreak = async (accountId) => {
  const pool = await getConnection();
  const request = pool.request();
  request.input('AccountID', sql.BigInt, accountId);

  const query = `
    SELECT DISTINCT CAST(COALESCE(LastWatchedAt, CompletedAt) AS DATE) AS ActivityDate
    FROM LessonProgress
    WHERE AccountID = @AccountID AND (LastWatchedAt IS NOT NULL OR CompletedAt IS NOT NULL)
    ORDER BY ActivityDate DESC
  `;
  
  const result = await request.query(query);
  const dates = result.recordset.map(r => r.ActivityDate);
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let checkDate = new Date(today);
  
  // Allow streak to continue if they haven't learned today yet, but learned yesterday
  if (dates.length > 0) {
    const firstActivityDate = new Date(dates[0]);
    firstActivityDate.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(today - firstActivityDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0 || diffDays === 1) {
      checkDate = new Date(firstActivityDate);
    } else {
      return 0; // Streak broken
    }
  }

  for (const dateStr of dates) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === checkDate.getTime()) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};

module.exports = {
  getOverviewStats,
  getCourseProgressDetails,
  getQuizPerformance,
  getWeeklyActivity,
  getLearningStreak
};
