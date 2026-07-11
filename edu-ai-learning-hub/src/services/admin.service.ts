// src/services/admin.service.ts
import apiHelper from './apiHelper';

export interface DashboardStat {
  totalRevenue: { currency: string; amount: number };
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  pendingCourseApprovals: number;
  pendingWithdrawals: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface RecentOrder {
  orderId: number;
  userFullName: string;
  userAvatarUrl: string | null;
  courseName: string;
  amount: number;
  currency: string;
  orderDate: string;
}

export interface TopCourse {
  courseId: number;
  courseName: string;
  revenue: number;
  currency: string;
  slug: string;
}

export interface AdminDashboardData {
  stats: DashboardStat;
  monthlyRevenue: MonthlyRevenue[];
  recentOrders: RecentOrder[];
  topPerformingCourses: TopCourse[];
}

/** Admin: Lấy dữ liệu tổng quan cho Dashboard */
export const getAdminDashboardOverview =
  async (): Promise<AdminDashboardData> => {
    return apiHelper.get('/admin/dashboard/overview');
  };

// ===== Report Interfaces =====

export interface QuizScoreData {
  lessonId: number;
  lessonName: string;
  totalAttempts: number;
  uniqueStudents: number;
  avgScore: number;
  highestScore: number;
  lowestScore: number;
  avgCorrectAnswers: number;
  totalQuestions: number;
  passCount: number;
  failCount: number;
  passRate: number;
}

export interface CourseQuizReport {
  courseId: number;
  courseName: string;
  slug: string;
  quizzes: QuizScoreData[];
}

export interface CourseEffectivenessData {
  courseId: number;
  courseName: string;
  slug: string;
  thumbnailUrl: string | null;
  instructorName: string;
  averageRating: number | null;
  reviewCount: number;
  totalEnrollments: number;
  completedStudents: number;
  avgCompletionRate: number;
  totalRevenue: number;
  totalLessons: number;
  avgQuizScore: number;
  completionRate: number;
}

export interface EnrollmentTrendItem {
  month: string;
  monthKey: string;
  newEnrollments: number;
  uniqueCourses: number;
  uniqueStudents: number;
}

export interface TopCourseByEnrollment {
  courseId: number;
  courseName: string;
  slug: string;
  thumbnailUrl: string | null;
  instructorName: string;
  totalEnrollments: number;
  averageRating: number | null;
  avgCompletion: number;
}

export interface EnrollmentStatsData {
  trend: EnrollmentTrendItem[];
  topCoursesByEnrollment: TopCourseByEnrollment[];
}

export interface InstructorAnalyticsStats {
  totalRevenue: number;
  totalStudents: number;
  totalCourses: number;
  avgRating: number;
}

export interface TimeSeriesItem {
  period: string;
  newStudents: number;
  revenue: number;
}

export interface CoursePerformanceItem {
  courseId: number;
  courseName: string;
  slug: string;
  averageRating: number | null;
  enrollments: number;
  avgCompletion: number;
  revenue: number;
}

export interface InstructorAnalyticsData {
  stats: InstructorAnalyticsStats;
  timeSeries: TimeSeriesItem[];
  coursePerformance: CoursePerformanceItem[];
}

// ===== Report API Functions =====

export const getQuizScoreReport = async (
  courseId?: number
): Promise<CourseQuizReport[]> => {
  const params = courseId ? `?courseId=${courseId}` : '';
  return apiHelper.get(`/admin/reports/quiz-scores${params}`);
};

export const getCourseEffectivenessReport = async (): Promise<
  CourseEffectivenessData[]
> => {
  return apiHelper.get('/admin/reports/course-effectiveness');
};

export const getEnrollmentStatsReport =
  async (): Promise<EnrollmentStatsData> => {
    return apiHelper.get('/admin/reports/enrollment-stats');
  };

export const getInstructorAnalytics = async (
  period?: string
): Promise<InstructorAnalyticsData> => {
  const params = period ? `?period=${period}` : '';
  return apiHelper.get(`/instructors/me/analytics${params}`);
};

