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
      // Invalidate cache progress của khóa học chứa bài học này
      // Cần lấy courseId từ data hoặc variables? -> Hơi khó, cách đơn giản là invalidate all course progress
      queryClient.invalidateQueries({ queryKey: progressKeys.all });
      // Hoặc invalidate cache chi tiết khóa học để cập nhật userProgress
      queryClient.invalidateQueries({ queryKey: courseKeys.details() }); // Invalidate all course details
      console.log(
        `Lesson ${variables.lessonId} completion marked as ${variables.isCompleted}.`
      );
    },
    onError: (error) => {
      console.error('Mark lesson completion failed:', error.message);
    },
    ...options,
  });
};

/** Hook cập nhật vị trí xem video */
export const useUpdateLastWatchedPosition = (
  options?: UseMutationOptions<
    LessonProgress,
    Error,
    { lessonId: number; position: number }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    LessonProgress,
    Error,
    { lessonId: number; position: number }
  >({
    mutationFn: ({ lessonId, position }) =>
      updateLastWatchedPosition(lessonId, position),
    onSuccess: (data, variables) => {
      // Có thể cập nhật cache course progress hoặc chi tiết khóa học nếu cần ngay lập tức
      queryClient.invalidateQueries({ queryKey: progressKeys.all });
      queryClient.invalidateQueries({ queryKey: courseKeys.details() });
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
