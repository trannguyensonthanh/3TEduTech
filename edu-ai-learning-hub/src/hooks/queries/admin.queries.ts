// src/hooks/queries/admin.queries.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  getAdminDashboardOverview,
  AdminDashboardData,
  getQuizScoreReport,
  CourseQuizReport,
  getCourseEffectivenessReport,
  CourseEffectivenessData,
  getEnrollmentStatsReport,
  EnrollmentStatsData,
  getInstructorAnalytics,
  InstructorAnalyticsData,
} from '@/services/admin.service';

export const adminKeys = {
  dashboardOverview: ['admin', 'dashboard', 'overview'] as const,
  quizScores: (courseId?: number) =>
    ['admin', 'reports', 'quiz-scores', courseId] as const,
  courseEffectiveness: ['admin', 'reports', 'course-effectiveness'] as const,
  enrollmentStats: ['admin', 'reports', 'enrollment-stats'] as const,
  instructorAnalytics: (period?: string) =>
    ['instructor', 'analytics', period] as const,
};

export const useAdminDashboardOverview = (
  options?: Omit<
    UseQueryOptions<AdminDashboardData, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<AdminDashboardData, Error>({
    queryKey: adminKeys.dashboardOverview,
    queryFn: getAdminDashboardOverview,
    staleTime: 1000 * 60 * 5, // Cache dữ liệu dashboard trong 5 phút
    ...options,
  });
};

export const useQuizScoreReport = (courseId?: number) => {
  return useQuery<CourseQuizReport[], Error>({
    queryKey: adminKeys.quizScores(courseId),
    queryFn: () => getQuizScoreReport(courseId),
    staleTime: 1000 * 60 * 5,
  });
};

export const useCourseEffectivenessReport = () => {
  return useQuery<CourseEffectivenessData[], Error>({
    queryKey: adminKeys.courseEffectiveness,
    queryFn: getCourseEffectivenessReport,
    staleTime: 1000 * 60 * 5,
  });
};

export const useEnrollmentStatsReport = () => {
  return useQuery<EnrollmentStatsData, Error>({
    queryKey: adminKeys.enrollmentStats,
    queryFn: getEnrollmentStatsReport,
    staleTime: 1000 * 60 * 5,
  });
};

export const useInstructorAnalytics = (period?: string) => {
  return useQuery<InstructorAnalyticsData, Error>({
    queryKey: adminKeys.instructorAnalytics(period),
    queryFn: () => getInstructorAnalytics(period),
    staleTime: 1000 * 60 * 5,
  });
};
