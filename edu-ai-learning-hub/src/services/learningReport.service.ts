import apiHelper from '@/services/apiHelper';

export interface LearningReportData {
  overview: {
    totalCourses: number;
    totalCompletedLessons: number;
    totalLearningMinutes: number;
    averageCompletionPercentage: number;
  };
  courseProgress: Array<{
    courseId: number;
    courseName: string;
    thumbnailUrl: string | null;
    totalLessons: number;
    completedLessons: number;
    progressPercentage: number;
    enrolledAt: string;
    lastActivityAt: string | null;
    avgQuizScore: number | null;
  }>;
  quizPerformance: {
    totalAttempts: number;
    averageScore: number;
    passCount: number;
    failCount: number;
    recentAttempts: Array<{
      lessonId: number;
      courseName: string;
      score: number;
      isPassed: boolean;
      completedAt: string;
      attemptNumber: number;
    }>;
  };
  weeklyActivity: Array<{
    date: string;
    lessonsCompleted: number;
    minutesSpent: number;
  }>;
  streak: number;
  aiAnalysis: {
    overallAssessment: string;
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
    motivationScore: number;
  } | null;
}

export const fetchLearningReport = async (): Promise<LearningReportData> => {
  return apiHelper.get('/learning-report');
};
