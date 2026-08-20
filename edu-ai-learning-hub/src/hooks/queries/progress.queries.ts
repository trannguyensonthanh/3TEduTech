// src/hooks/queries/progress.queries.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import {
  markLessonCompletion,
  updateLastWatchedPosition,
  getCourseProgress,
  LessonProgress,
  CourseProgressResponse,
} from '@/services/progress.service';
import { courseKeys } from './course.queries'; // Để invalidate course detail (userProgress)
import { toast } from 'sonner';
// import { lessonKeys } from './lesson.queries'; // Để invalidate lesson detail? (ít cần)

// Query Key Factory
export const progressKeys = {
  all: ['progress'] as const,
  courseProgress: (courseId: number | undefined) =>
    [...progressKeys.all, 'course', courseId] as const,
  // Key cho từng lesson progress có thể không cần nếu getCourseProgress trả về đủ
};

// --- Queries ---

/** Hook lấy tiến độ tổng quan của khóa học */
export const useCourseProgress = (
  courseId: number | undefined,
  options?: Omit<
    UseQueryOptions<CourseProgressResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = progressKeys.courseProgress(courseId);
  return useQuery<CourseProgressResponse, Error>({
    queryKey: queryKey,
    queryFn: () => getCourseProgress(courseId!),
    enabled: !!courseId,
    ...options,
  });
};

// --- Mutations ---

/** Hook đánh dấu hoàn thành bài học */
export const useMarkLessonCompletion = (
  options?: UseMutationOptions<
    LessonProgress,
    Error,
    { lessonId: number; isCompleted: boolean }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    LessonProgress,
    Error,
    { lessonId: number; isCompleted: boolean }
  >({
    mutationFn: ({ lessonId, isCompleted }) =>
      markLessonCompletion(Number(lessonId), isCompleted),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: progressKeys.all });
      
      // Update cache manually for instant UI update
      queryClient.setQueriesData(
        { queryKey: courseKeys.details() },
        (oldData: any) => {
          if (!oldData) return oldData;
          const newProgress = { ...(oldData.userProgress || {}) };
          newProgress[variables.lessonId] = {
            ...(newProgress[variables.lessonId] || {}),
            isCompleted: variables.isCompleted,
          };
          return {
            ...oldData,
            userProgress: newProgress,
          };
        }
      );
      
      console.log(
        `Lesson ${variables.lessonId} completion marked as ${variables.isCompleted}.`
      );
    },
    onError: (error) => {
      console.error('Mark lesson completion failed:', error.message);
      toast.error(error.message || 'Đánh dấu hoàn thành thất bại');
    },
    ...options,
  });
};

/** Hook cập nhật vị trí xem video */
export const useUpdateLastWatchedPosition = (options?: UseMutationOptions<LessonProgress, Error, { lessonId: number; position: number; timeSpentDelta?: number }>) => {
  const queryClient = useQueryClient();
  return useMutation<
    LessonProgress,
    Error,
    { lessonId: number; position: number; timeSpentDelta?: number }
  >({
    mutationFn: ({ lessonId, position, timeSpentDelta }) =>
      updateLastWatchedPosition(lessonId, position, timeSpentDelta),
    onSuccess: (data, variables) => {
      // Có thể cập nhật cache course progress nếu cần
      queryClient.invalidateQueries({ queryKey: progressKeys.all });
      
      // Update cache manually instead of invalidating to prevent stale server cache overwrites
      queryClient.setQueriesData(
        { queryKey: courseKeys.details() },
        (oldData: any) => {
          if (!oldData) return oldData;
          const newProgress = { ...(oldData.userProgress || {}) };
          newProgress[variables.lessonId] = {
            ...(newProgress[variables.lessonId] || {}),
            lastWatchedPosition: variables.position,
          };
          return {
            ...oldData,
            userProgress: newProgress,
          };
        }
      );
      
      console.log(
        `Lesson ${variables.lessonId} position updated to ${variables.position}.`
      );
    },
    onError: (error) => {
      console.error('Update watched position failed:', error.message);
    },
    ...options,
  });
};
