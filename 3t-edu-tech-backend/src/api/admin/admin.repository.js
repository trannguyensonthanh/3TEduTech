// File: src/api/admin/admin.repository.js

const { getConnection, sql } = require('../../database/connection');
const logger = require('../../utils/logger');
const Roles = require('../../core/enums/Roles');
const OrderStatus = require('../../core/enums/OrderStatus');
const ApprovalStatus = require('../../core/enums/ApprovalStatus');
const WithdrawalStatus = require('../../core/enums/WithdrawalStatus');

/**
 * Lấy các số liệu thống kê chính cho dashboard.
 */
const getDashboardStats = async () => {
  try {
    const pool = await getConnection();
    const request = pool.request();

    // Sử dụng CTEs (Common Table Expressions) để tính toán từng phần riêng biệt
    const query = `
        WITH RevenueCTE AS (
            SELECT ISNULL(SUM(FinalAmount), 0) as TotalRevenue
            FROM Orders
            WHERE OrderStatus = @CompletedStatus
        ),
        StudentCTE AS (
            SELECT COUNT(AccountID) as TotalStudents
            FROM Accounts
            WHERE RoleID = @StudentRole
        ),
        InstructorCTE AS (
            SELECT COUNT(AccountID) as TotalInstructors
            FROM Accounts
            WHERE RoleID = @InstructorRole
        ),
        CourseCTE AS (
            SELECT COUNT(CourseID) as TotalCourses
            FROM Courses
        ),
        ApprovalCTE AS (
            SELECT COUNT(RequestID) as PendingApprovals
            FROM CourseApprovalRequests
            WHERE Status = @PendingApprovalStatus
        ),
        WithdrawalCTE AS (
            SELECT COUNT(RequestID) as PendingWithdrawals
            FROM WithdrawalRequests
            WHERE Status = @PendingWithdrawalStatus
        )
        SELECT 
            (SELECT TotalRevenue FROM RevenueCTE) as totalRevenue,
            (SELECT TotalStudents FROM StudentCTE) as totalStudents,
            (SELECT TotalInstructors FROM InstructorCTE) as totalInstructors,
            (SELECT TotalCourses FROM CourseCTE) as totalCourses,
            (SELECT PendingApprovals FROM ApprovalCTE) as pendingCourseApprovals,
            (SELECT PendingWithdrawals FROM WithdrawalCTE) as pendingWithdrawals;
    `;

    request.input('CompletedStatus', sql.VarChar, OrderStatus.COMPLETED);
    request.input('StudentRole', sql.VarChar, Roles.STUDENT);
    request.input('InstructorRole', sql.VarChar, Roles.INSTRUCTOR);
    request.input('PendingApprovalStatus', sql.VarChar, ApprovalStatus.PENDING);
    request.input(
      'PendingWithdrawalStatus',
      sql.VarChar,
      WithdrawalStatus.PENDING
    );

    const result = await request.query(query);
    return result.recordset[0];
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

/**
 * Lấy dữ liệu doanh thu theo tháng cho 12 tháng gần nhất.
 */
const getMonthlyRevenue = async () => {
  try {
    const pool = await getConnection();
    const request = pool.request();

    // Lấy ngày đầu tiên của 11 tháng trước
    const date = new Date();
    date.setMonth(date.getMonth() - 11);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);

    request.input('StartDate', sql.DateTime, date);
    request.input('CompletedStatus', sql.VarChar, OrderStatus.COMPLETED);

    // Nhóm theo Năm và Tháng
    const query = `
        SELECT
            FORMAT(OrderDate, 'yyyy-MM') as Month,
            SUM(FinalAmount) as Revenue
        FROM Orders
        WHERE OrderStatus = @CompletedStatus AND OrderDate >= @StartDate
        GROUP BY FORMAT(OrderDate, 'yyyy-MM')
        ORDER BY Month ASC;
    `;

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    logger.error('Error fetching monthly revenue:', error);
    throw error;
  }
};

/**
 * Lấy 5 đơn hàng hoàn thành gần đây nhất.
 */
const getRecentOrders = async () => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('CompletedStatus', sql.VarChar, OrderStatus.COMPLETED);

    // Lấy 1 khóa học đầu tiên trong đơn hàng để hiển thị
    const query = `
        WITH RecentOrdersCTE AS (
            SELECT TOP 5
                o.OrderID,
                o.AccountID,
                o.FinalAmount,
                o.CurrencyID,
                o.OrderDate,
                (SELECT TOP 1 CourseID FROM OrderItems oi WHERE oi.OrderID = o.OrderID) as FirstCourseID
            FROM Orders o
            WHERE o.OrderStatus = @CompletedStatus
            ORDER BY o.OrderDate DESC
        )
        SELECT 
            ro.OrderID,
            ro.FinalAmount,
            ro.CurrencyID,
            ro.OrderDate,
            up.FullName as UserFullName,
            up.AvatarUrl as UserAvatarUrl,
            c.CourseName
        FROM RecentOrdersCTE ro
        JOIN UserProfiles up ON ro.AccountID = up.AccountID
        JOIN Courses c ON ro.FirstCourseID = c.CourseID
        ORDER BY ro.OrderDate DESC;
    `;

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    logger.error('Error fetching recent orders:', error);
    throw error;
  }
};

/**
 * Lấy top 5 khóa học có doanh thu cao nhất.
 */
const getTopPerformingCourses = async () => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('CompletedStatus', sql.VarChar, OrderStatus.COMPLETED);

    const query = `
        SELECT TOP 5
            c.CourseID,
            c.CourseName,
            o.CurrencyID,
            SUM(oi.PriceAtOrder) as TotalRevenue,
            c.Slug
        FROM OrderItems oi
        JOIN Courses c ON oi.CourseID = c.CourseID
        JOIN Orders o ON oi.OrderID = o.OrderID
        WHERE o.OrderStatus = @CompletedStatus
        GROUP BY c.CourseID, c.CourseName, c.Slug, o.CurrencyID
        ORDER BY TotalRevenue DESC;
    `;

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    logger.error('Error fetching top performing courses:', error);
    throw error;
  }
};

/**
 * Lấy báo cáo điểm quiz theo khóa học.
 */
const getQuizScoresByCourse = async (courseId = null) => {
  try {
    const pool = await getConnection();
    const request = pool.request();

    let courseFilter = '';
    if (courseId) {
      request.input('CourseID', sql.Int, courseId);
      courseFilter = 'AND c.CourseID = @CourseID';
    }

    const query = `
        SELECT 
            c.CourseID,
            c.CourseName,
            c.Slug,
            l.LessonID,
            l.LessonName,
            COUNT(DISTINCT qa.AttemptID) as TotalAttempts,
            COUNT(DISTINCT qa.AccountID) as UniqueStudents,
            ISNULL(AVG(CAST(qa.Score AS FLOAT)), 0) as AvgScore,
            ISNULL(MAX(qa.Score), 0) as HighestScore,
            ISNULL(MIN(qa.Score), 0) as LowestScore,
            ISNULL(AVG(CAST(qa.CorrectAnswers AS FLOAT)), 0) as AvgCorrectAnswers,
            ISNULL(MAX(qa.TotalQuestions), 0) as TotalQuestions,
            SUM(CASE WHEN qa.Score >= 70 THEN 1 ELSE 0 END) as PassCount,
            SUM(CASE WHEN qa.Score < 70 THEN 1 ELSE 0 END) as FailCount
        FROM QuizAttempts qa
        JOIN Lessons l ON qa.LessonID = l.LessonID
        JOIN Sections s ON l.SectionID = s.SectionID
        JOIN Courses c ON s.CourseID = c.CourseID
        WHERE qa.CompletedAt IS NOT NULL ${courseFilter}
        GROUP BY c.CourseID, c.CourseName, c.Slug, l.LessonID, l.LessonName
        ORDER BY c.CourseName, l.LessonName;
    `;

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    logger.error('Error fetching quiz scores by course:', error);
    throw error;
  }
};

/**
 * Lấy phân tích hiệu quả từng khóa học.
 */
const getCourseEffectiveness = async () => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('CompletedStatus', sql.VarChar, OrderStatus.COMPLETED);

    const query = `
        SELECT 
            c.CourseID,
            c.CourseName,
            c.Slug,
            c.AverageRating,
            c.ReviewCount,
            c.ThumbnailUrl,
            up.FullName as InstructorName,
            (SELECT COUNT(*) FROM Enrollments e WHERE e.CourseID = c.CourseID) as TotalEnrollments,
            /* [SỬA 17/08/2026] e.CompletionPercentage KHÔNG TỒN TẠI trong bảng Enrollments.
               Schema thật chỉ có: EnrollmentID, AccountID, CourseID, EnrolledAt,
               PurchasePrice, IsCompleted, CompletedAt.
               Truy vấn cũ khiến API /v1/admin/reports/course-effectiveness luôn trả lỗi 500. */
            (SELECT COUNT(*) FROM Enrollments e WHERE e.CourseID = c.CourseID AND e.IsCompleted = 1) as CompletedStudents,
            /* Tỷ lệ hoàn thành trung bình: tính thật từ LessonProgress.
               Học viên đã được khóa cờ IsCompleted=1 luôn tính 100% để tôn trọng
               cơ chế "Progress Protection". Bài/chương đã lưu trữ bị loại khỏi mẫu số. */
            ISNULL((
                SELECT AVG(
                    CASE WHEN e2.IsCompleted = 1 THEN 100.0 ELSE ISNULL(
                        CAST((SELECT COUNT(*) FROM LessonProgress lp
                                JOIN Lessons lx  ON lp.LessonID = lx.LessonID
                                JOIN Sections sx ON lx.SectionID = sx.SectionID
                               WHERE lp.AccountID = e2.AccountID AND sx.CourseID = e2.CourseID
                                 AND lp.IsCompleted = 1 AND lx.IsArchived = 0 AND sx.IsArchived = 0
                             ) AS FLOAT) * 100.0
                        / NULLIF((SELECT COUNT(*) FROM Lessons ly
                                    JOIN Sections sy ON ly.SectionID = sy.SectionID
                                   WHERE sy.CourseID = e2.CourseID
                                     AND ly.IsArchived = 0 AND sy.IsArchived = 0), 0)
                    , 0) END
                )
                FROM Enrollments e2 WHERE e2.CourseID = c.CourseID
            ), 0) as AvgCompletionRate,
            ISNULL((SELECT SUM(oi.PriceAtOrder) FROM OrderItems oi JOIN Orders o ON oi.OrderID = o.OrderID WHERE oi.CourseID = c.CourseID AND o.OrderStatus = @CompletedStatus), 0) as TotalRevenue,
            /* [SỬA] Loại bài/chương đã lưu trữ để khớp với giáo trình học viên thực sự nhìn thấy */
            (SELECT COUNT(DISTINCT l.LessonID) FROM Lessons l JOIN Sections s ON l.SectionID = s.SectionID WHERE s.CourseID = c.CourseID AND l.IsArchived = 0 AND s.IsArchived = 0) as TotalLessons,
            (SELECT ISNULL(AVG(CAST(qa.Score AS FLOAT)), 0) FROM QuizAttempts qa JOIN Lessons l ON qa.LessonID = l.LessonID JOIN Sections s ON l.SectionID = s.SectionID WHERE s.CourseID = c.CourseID AND qa.CompletedAt IS NOT NULL) as AvgQuizScore
        FROM Courses c
        JOIN UserProfiles up ON c.InstructorID = up.AccountID
        ORDER BY TotalEnrollments DESC;
    `;

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    logger.error('Error fetching course effectiveness:', error);
    throw error;
  }
};

/**
 * Lấy thống kê enrollment theo thời gian (12 tháng gần nhất).
 */
const getEnrollmentStats = async () => {
  try {
    const pool = await getConnection();
    const request = pool.request();

    const date = new Date();
    date.setMonth(date.getMonth() - 11);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);

    request.input('StartDate', sql.DateTime, date);

    /* [SỬA 17/08/2026] Cột đúng trong schema là EnrolledAt, KHÔNG phải EnrollmentDate.
       Truy vấn cũ khiến API /v1/admin/reports/enrollment-stats luôn trả lỗi 500. */
    const query = `
        SELECT
            FORMAT(e.EnrolledAt, 'yyyy-MM') as Month,
            COUNT(*) as NewEnrollments,
            COUNT(DISTINCT e.CourseID) as UniqueCourses,
            COUNT(DISTINCT e.AccountID) as UniqueStudents
        FROM Enrollments e
        WHERE e.EnrolledAt >= @StartDate
        GROUP BY FORMAT(e.EnrolledAt, 'yyyy-MM')
        ORDER BY Month ASC;
    `;

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    logger.error('Error fetching enrollment stats:', error);
    throw error;
  }
};

/**
 * Lấy top khóa học theo số enrollment.
 */
const getTopCoursesByEnrollment = async (limit = 10) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('Limit', sql.Int, limit);

    const query = `
        SELECT TOP (@Limit)
            c.CourseID,
            c.CourseName,
            c.Slug,
            c.ThumbnailUrl,
            up.FullName as InstructorName,
            COUNT(e.EnrollmentID) as TotalEnrollments,
            c.AverageRating,
            /* [SỬA 17/08/2026] e.CompletionPercentage không tồn tại.
               Dùng tỷ lệ % học viên đã hoàn thành khóa (IsCompleted = 1). */
            ISNULL(AVG(CAST(e.IsCompleted AS FLOAT)) * 100, 0) as AvgCompletion
        FROM Courses c
        JOIN Enrollments e ON c.CourseID = e.CourseID
        JOIN UserProfiles up ON c.InstructorID = up.AccountID
        GROUP BY c.CourseID, c.CourseName, c.Slug, c.ThumbnailUrl, up.FullName, c.AverageRating
        ORDER BY TotalEnrollments DESC;
    `;

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    logger.error('Error fetching top courses by enrollment:', error);
    throw error;
  }
};

/**
 * Lấy analytics cho instructor (dùng cho InstructorAnalytics).
 */
const getInstructorAnalytics = async (instructorId, period = 'monthly') => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('InstructorID', sql.BigInt, instructorId);
    request.input('CompletedStatus', sql.VarChar, OrderStatus.COMPLETED);

    const date = new Date();
    date.setMonth(date.getMonth() - (period === 'weekly' ? 1 : 11));
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    request.input('StartDate', sql.DateTime, date);

    const dateFormat = period === 'weekly' ? 'yyyy-MM-dd' : 'yyyy-MM';

    // Stats summary - Tính chuẩn xác từng thông số độc lập, doanh thu lấy từ InstructorBalanceTransactions
    const statsQuery = `
        DECLARE @TotalRevenue DECIMAL(18,2) = (
            SELECT ISNULL(SUM(Amount), 0)
            FROM InstructorBalanceTransactions
            WHERE AccountID = @InstructorID AND Type = 'CREDIT_SALE'
        );
        IF @TotalRevenue = 0 OR @TotalRevenue IS NULL
        BEGIN
            SET @TotalRevenue = (
                SELECT ISNULL(SUM(oi.PriceAtOrder), 0)
                FROM OrderItems oi
                JOIN Orders o ON oi.OrderID = o.OrderID
                JOIN Courses c ON oi.CourseID = c.CourseID
                WHERE c.InstructorID = @InstructorID AND o.OrderStatus = @CompletedStatus
            );
        END

        DECLARE @TotalStudents INT = (
            SELECT COUNT(DISTINCT e.AccountID)
            FROM Enrollments e
            JOIN Courses c ON e.CourseID = c.CourseID
            WHERE c.InstructorID = @InstructorID
        );

        DECLARE @TotalCourses INT = (
            SELECT COUNT(*)
            FROM Courses
            WHERE InstructorID = @InstructorID AND StatusID IN ('PUBLISHED', 'UPDATING')
        );
        IF @TotalCourses = 0
        BEGIN
            SET @TotalCourses = (
                SELECT COUNT(*) FROM Courses WHERE InstructorID = @InstructorID
            );
        END

        DECLARE @AvgRating FLOAT = (
            SELECT ISNULL(AVG(CAST(AverageRating AS FLOAT)), 0)
            FROM Courses
            WHERE InstructorID = @InstructorID AND AverageRating IS NOT NULL AND AverageRating > 0
        );

        SELECT
            ISNULL(@TotalRevenue, 0) as TotalRevenue,
            ISNULL(@TotalStudents, 0) as TotalStudents,
            ISNULL(@TotalCourses, 0) as TotalCourses,
            ISNULL(@AvgRating, 0) as AvgRating;
    `;

    // Time-series data
    /* [SỬA 17/08/2026] EnrollmentDate → EnrolledAt (4 vị trí trong truy vấn này).
       Đây là nguyên nhân API /v1/instructors/me/analytics trả lỗi 500. */
    const timeSeriesQuery = `
        SELECT
            FORMAT(e.EnrolledAt, '${dateFormat}') as Period,
            COUNT(DISTINCT e.AccountID) as NewStudents,
            ISNULL((
                SELECT SUM(oi.PriceAtOrder)
                FROM OrderItems oi
                JOIN Orders o ON oi.OrderID = o.OrderID
                JOIN Courses c2 ON oi.CourseID = c2.CourseID
                WHERE c2.InstructorID = @InstructorID
                    AND o.OrderStatus = @CompletedStatus
                    AND FORMAT(o.OrderDate, '${dateFormat}') = FORMAT(e.EnrolledAt, '${dateFormat}')
            ), 0) as Revenue
        FROM Enrollments e
        JOIN Courses c ON e.CourseID = c.CourseID
        WHERE c.InstructorID = @InstructorID AND e.EnrolledAt >= @StartDate
        GROUP BY FORMAT(e.EnrolledAt, '${dateFormat}')
        ORDER BY Period ASC;
    `;

    // Course performance for this instructor
    const coursePerfQuery = `
        SELECT
            c.CourseID,
            c.CourseName,
            c.Slug,
            c.AverageRating,
            COUNT(e.EnrollmentID) as Enrollments,
            /* [SỬA 17/08/2026] e.CompletionPercentage không tồn tại → dùng IsCompleted */
            ISNULL(AVG(CAST(e.IsCompleted AS FLOAT)) * 100, 0) as AvgCompletion,
            ISNULL((SELECT SUM(oi.PriceAtOrder) FROM OrderItems oi JOIN Orders o ON oi.OrderID = o.OrderID WHERE oi.CourseID = c.CourseID AND o.OrderStatus = @CompletedStatus), 0) as Revenue
        FROM Courses c
        LEFT JOIN Enrollments e ON c.CourseID = e.CourseID
        WHERE c.InstructorID = @InstructorID
        GROUP BY c.CourseID, c.CourseName, c.Slug, c.AverageRating
        ORDER BY Revenue DESC;
    `;

    const [statsResult, timeSeriesResult, coursePerfResult] = await Promise.all([
      request.query(statsQuery),
      pool.request()
        .input('InstructorID', sql.BigInt, instructorId)
        .input('CompletedStatus', sql.VarChar, OrderStatus.COMPLETED)
        .input('StartDate', sql.DateTime, date)
        .query(timeSeriesQuery),
      pool.request()
        .input('InstructorID', sql.BigInt, instructorId)
        .input('CompletedStatus', sql.VarChar, OrderStatus.COMPLETED)
        .query(coursePerfQuery),
    ]);

    return {
      stats: statsResult.recordset[0],
      timeSeries: timeSeriesResult.recordset,
      coursePerformance: coursePerfResult.recordset,
    };
  } catch (error) {
    logger.error('Error fetching instructor analytics:', error);
    throw error;
  }
};

module.exports = {
  getDashboardStats,
  getMonthlyRevenue,
  getRecentOrders,
  getTopPerformingCourses,
  getQuizScoresByCourse,
  getCourseEffectiveness,
  getEnrollmentStats,
  getTopCoursesByEnrollment,
  getInstructorAnalytics,
};
