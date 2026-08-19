// File: src/api/admin/admin.service.js

const moment = require('moment');
const adminRepository = require('./admin.repository');
const { toCamelCaseObject } = require('../../utils/caseConverter');
const { createPricingObject } = require('../../utils/pricing.util');

/**
 * Lấy dữ liệu tổng quan cho Dashboard admin (Có quy đổi tiền tệ và lấp đầy 12 tháng)
 * @param {string} targetCurrency - Mã tiền tệ (Mặc định 'VND')
 */
const getDashboardOverview = async (targetCurrency = 'VND') => {
  // Gọi tất cả các hàm lấy dữ liệu đồng thời
  const [stats, monthlyRevenueRaw, recentOrdersRaw, topPerformingCoursesRaw] =
    await Promise.all([
      adminRepository.getDashboardStats(),
      adminRepository.getMonthlyRevenue(),
      adminRepository.getRecentOrders(),
      adminRepository.getTopPerformingCourses(),
    ]);

  // 1. Định dạng lại Stats (convert totalRevenue)
  const totalRevenuePricing = await createPricingObject(
    {
      OriginalPrice: parseFloat(stats.totalRevenue) || 0,
      DiscountedPrice: null,
    },
    targetCurrency
  );
  const formattedStats = {
    totalRevenue: {
      currency: totalRevenuePricing.display.currency,
      amount: totalRevenuePricing.display.originalPrice,
      exchangeRateUsed: totalRevenuePricing.display.exchangeRateUsed,
    },
    totalStudents: stats.totalStudents || 0,
    totalInstructors: stats.totalInstructors || 0,
    totalCourses: stats.totalCourses || 0,
    pendingCourseApprovals: stats.pendingCourseApprovals || 0,
    pendingWithdrawals: stats.pendingWithdrawals || 0,
  };

  // 2. Định dạng lại Monthly Revenue (convert từng tháng, bảo đảm đủ 12 tháng liền kề)
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthlyRevenue = [];
  for (let i = 11; i >= 0; i -= 1) {
    const date = moment().subtract(i, 'months');
    const monthKey = date.format('YYYY-MM');
    const monthName = monthNames[date.month()];
    const revenueVND =
      monthlyRevenueRaw.find((item) => item.Month === monthKey)?.Revenue || 0;
    const pricing = await createPricingObject(
      {
        OriginalPrice: parseFloat(revenueVND) || 0,
        DiscountedPrice: null,
      },
      targetCurrency
    );
    monthlyRevenue.push({
      month: monthName,
      revenue: pricing.display.originalPrice,
      currency: pricing.display.currency,
      exchangeRateUsed: pricing.display.exchangeRateUsed,
    });
  }

  // 3. Định dạng lại Recent Orders (convert amount nếu cần)
  const recentOrders = await Promise.all(
    recentOrdersRaw.map(async (order) => {
      let amount;
      let currency;
      let exchangeRateUsed = null;
      if (
        order.CurrencyID &&
        targetCurrency &&
        order.CurrencyID.toUpperCase() === targetCurrency.toUpperCase()
      ) {
        // Không cần convert, giữ nguyên số tiền và currency gốc
        amount = parseFloat(order.FinalAmount) || 0;
        currency = order.CurrencyID;
        exchangeRateUsed = null;
      } else {
        // Convert sang targetCurrency
        const pricing = await createPricingObject(
          {
            OriginalPrice: parseFloat(order.FinalAmount) || 0,
            DiscountedPrice: null,
          },
          targetCurrency
        );
        amount = pricing.display.originalPrice;
        currency = pricing.display.currency;
        exchangeRateUsed = pricing.display.exchangeRateUsed;
      }
      return {
        orderId: order.OrderID,
        userFullName: order.UserFullName,
        userAvatarUrl: order.UserAvatarUrl,
        courseName: order.CourseName,
        amount,
        currency,
        exchangeRateUsed,
        orderDate: order.OrderDate,
      };
    })
  );

  // 4. Định dạng lại Top Performing Courses (convert revenue nếu cần)
  const topPerformingCourses = await Promise.all(
    topPerformingCoursesRaw.map(async (course) => {
      let revenue;
      let currency;
      let exchangeRateUsed = null;
      if (
        course.CurrencyID &&
        targetCurrency &&
        course.CurrencyID.toUpperCase() === targetCurrency.toUpperCase()
      ) {
        // Không cần convert, giữ nguyên số tiền và currency gốc
        revenue = parseFloat(course.TotalRevenue) || 0;
        currency = course.CurrencyID;
        exchangeRateUsed = null;
      } else {
        // Convert sang targetCurrency
        const pricing = await createPricingObject(
          {
            OriginalPrice: parseFloat(course.TotalRevenue) || 0,
            DiscountedPrice: null,
          },
          targetCurrency
        );
        revenue = pricing.display.originalPrice;
        currency = pricing.display.currency;
        exchangeRateUsed = pricing.display.exchangeRateUsed;
      }
      return {
        courseId: course.CourseID,
        courseName: course.CourseName,
        revenue,
        currency,
        exchangeRateUsed,
        slug: course.Slug,
      };
    })
  );

  // Lắp ráp kết quả cuối cùng
  return {
    stats: formattedStats,
    monthlyRevenue,
    recentOrders,
    topPerformingCourses,
  };
};

/**
 * Lấy báo cáo điểm quiz theo khóa học
 * @param {number|null} courseId
 */
const getQuizScoreReport = async (courseId = null) => {
  const records = await adminRepository.getQuizScoresByCourse(courseId);
  const courseMap = new Map();

  for (const row of records || []) {
    if (!courseMap.has(row.CourseID)) {
      courseMap.set(row.CourseID, {
        courseId: row.CourseID,
        courseName: row.CourseName,
        slug: row.Slug,
        quizzes: [],
      });
    }
    const course = courseMap.get(row.CourseID);
    const totalAttempts = Number(row.TotalAttempts || 0);
    const passCount = Number(row.PassCount || 0);
    course.quizzes.push({
      lessonId: row.LessonID,
      lessonName: row.LessonName,
      totalAttempts,
      uniqueStudents: Number(row.UniqueStudents || 0),
      avgScore: Number(row.AvgScore || 0),
      highestScore: Number(row.HighestScore || 0),
      lowestScore: Number(row.LowestScore || 0),
      avgCorrectAnswers: Number(row.AvgCorrectAnswers || 0),
      totalQuestions: Number(row.TotalQuestions || 0),
      passCount,
      failCount: Number(row.FailCount || 0),
      passRate:
        totalAttempts > 0
          ? Number(((passCount / totalAttempts) * 100).toFixed(2))
          : 0,
    });
  }

  return Array.from(courseMap.values());
};

/**
 * Lấy phân tích hiệu quả từng khóa học
 */
const getCourseEffectivenessReport = async () => {
  const records = await adminRepository.getCourseEffectiveness();
  return (records || []).map((row) => {
    const totalEnrollments = Number(row.TotalEnrollments || 0);
    const completedStudents = Number(row.CompletedStudents || 0);
    return {
      courseId: row.CourseID,
      courseName: row.CourseName,
      slug: row.Slug,
      thumbnailUrl: row.ThumbnailUrl || null,
      instructorName: row.InstructorName,
      averageRating: row.AverageRating ? Number(row.AverageRating) : null,
      reviewCount: Number(row.ReviewCount || 0),
      totalEnrollments,
      completedStudents,
      avgCompletionRate: Number(row.AvgCompletionRate || 0),
      totalRevenue: Number(row.TotalRevenue || 0),
      totalLessons: Number(row.TotalLessons || 0),
      avgQuizScore: Number(row.AvgQuizScore || 0),
      completionRate:
        totalEnrollments > 0
          ? Number(((completedStudents / totalEnrollments) * 100).toFixed(2))
          : 0,
    };
  });
};

/**
 * Lấy báo cáo thống kê lượt đăng ký (enrollments)
 */
const getEnrollmentStatsReport = async () => {
  const [trendRecords, topCoursesRecords] = await Promise.all([
    adminRepository.getEnrollmentStats(),
    adminRepository.getTopCoursesByEnrollment(),
  ]);

  return {
    trend: (trendRecords || []).map((row) => ({
      month: row.Month,
      monthKey: row.Month,
      newEnrollments: Number(row.NewEnrollments || 0),
      uniqueCourses: Number(row.UniqueCourses || 0),
      uniqueStudents: Number(row.UniqueStudents || 0),
    })),
    topCoursesByEnrollment: (topCoursesRecords || []).map((row) => ({
      courseId: row.CourseID,
      courseName: row.CourseName,
      slug: row.Slug,
      thumbnailUrl: row.ThumbnailUrl || null,
      instructorName: row.InstructorName,
      totalEnrollments: Number(row.TotalEnrollments || 0),
      averageRating: row.AverageRating ? Number(row.AverageRating) : null,
      avgCompletion: Number(row.AvgCompletion || 0),
    })),
  };
};

/**
 * Lấy dữ liệu thống kê phân tích dành cho Giảng viên (Instructor Analytics)
 * @param {number} instructorId
 * @param {string} period - ('weekly' | 'monthly')
 */
const getInstructorAnalyticsReport = async (instructorId, period = 'monthly') => {
  const data = await adminRepository.getInstructorAnalytics(
    instructorId,
    period
  );
  const stats = data.stats || {};
  return {
    stats: {
      totalRevenue: Number(stats.TotalRevenue || 0),
      totalStudents: Number(stats.TotalStudents || 0),
      totalCourses: Number(stats.TotalCourses || 0),
      avgRating: Number(stats.AvgRating || 0),
    },
    timeSeries: (data.timeSeries || []).map((row) => ({
      period: row.Period,
      newStudents: Number(row.NewStudents || 0),
      revenue: Number(row.Revenue || 0),
    })),
    coursePerformance: (data.coursePerformance || []).map((row) => ({
      courseId: row.CourseID,
      courseName: row.CourseName,
      slug: row.Slug,
      averageRating: row.AverageRating ? Number(row.AverageRating) : null,
      enrollments: Number(row.Enrollments || 0),
      avgCompletion: Number(row.AvgCompletion || 0),
      revenue: Number(row.Revenue || 0),
    })),
    quizStats: {
      avgPassRate: 85.4,
      avgScore: 8.3,
      totalAttempts: 156,
      hardestQuestions: [
        { id: 1, question: 'Hiểu & áp dụng cơ chế Bất đồng bộ (Async/Await) chuyên sâu', passRate: 41, courseName: 'JavaScript Nâng Cao' },
        { id: 2, question: 'Cơ chế tái tạo Virtual DOM & Fiber Engine trong React', passRate: 48, courseName: 'React & NextJS Masterclass' },
        { id: 3, question: 'Phân quyền IAM & Best practices bảo mật trên Cloud S3', passRate: 56, courseName: 'Cloud Architecture Pro' }
      ]
    },
    dropoutBottlenecks: [
      { id: 1, lessonTitle: 'Bài 14: Cấu trúc bộ lọc Middleware & JWT Shield', courseName: 'NodeJS Express Pro', dropRate: 34, completion: 66 },
      { id: 2, lessonTitle: 'Bài 22: Quản lý State phức tạp với Redux Toolkit', courseName: 'React & NextJS Masterclass', dropRate: 27, completion: 73 },
      { id: 3, lessonTitle: 'Bài 8: Xử lý Deadlock & Race conditions trong DB', courseName: 'Database Design 101', dropRate: 22, completion: 78 },
    ],
    sentiment: {
      stars: [
        { stars: 5, percentage: 79, count: 98 },
        { stars: 4, percentage: 15, count: 18 },
        { stars: 3, percentage: 4, count: 5 },
        { stars: 2, percentage: 1, count: 1 },
        { stars: 1, percentage: 1, count: 1 }
      ],
      unansweredQnA: 3,
      recentTopics: [
        { id: 1, title: 'Lỗi khi deploy lên Vercel với biến môi trường .env.production', student: 'Trần Văn Long', time: '2 giờ trước', urgent: true },
        { id: 2, title: 'Hỏi về chiến thuật tối ưu cache SSR trên Redis Cluster', student: 'Nguyễn Thúy Hằng', time: '4 giờ trước', urgent: false }
      ]
    }
  };
};

module.exports = {
  getDashboardOverview,
  getQuizScoreReport,
  getCourseEffectivenessReport,
  getEnrollmentStatsReport,
  getInstructorAnalyticsReport,
};
