// src/hooks/queries/review.queries.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';
import {
  createOrUpdateReview,
  getReviewsByCourse,
  getMyReviewForCourse,
  deleteReview,
  Review,
  ReviewListResponse,
  ReviewQueryParams,
  CreateUpdateReviewData,
  InstructorReviewQueryParams,
  InstructorReviewListResponse,
  getCourseReviewsByInstructor,
} from '@/services/review.service';
import { courseKeys } from './course.queries'; // Để invalidate course rating

// Query Key Factory
const reviewKeys = {
  all: ['reviews'] as const,
  lists: (params?: ReviewQueryParams & { courseId?: number }) =>
    [...reviewKeys.all, 'list', params || {}] as const, // Thêm courseId vào key
  details: () => [...reviewKeys.all, 'detail'] as const,
  detail: (id: number | undefined) => [...reviewKeys.details(), id] as const,
  myReview: (courseId?: number) =>
    [...reviewKeys.all, 'my', { courseId }] as const,
  listByInstructor: (
    instructorId: number | string | undefined,
    params?: InstructorReviewQueryParams
  ) =>
    ['reviews', 'instructor', instructorId, 'courses', params || {}] as const,
};

// --- Queries ---

/** Hook lấy danh sách reviews của khóa học */
export const useReviewsByCourse = (
  courseId: number | undefined,
  params?: ReviewQueryParams,
  options?: Omit<
    UseQueryOptions<ReviewListResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = reviewKeys.lists({ ...params, courseId }); // Dùng key factory
  return useQuery<ReviewListResponse, Error>({
    queryKey: queryKey,
    queryFn: () => getReviewsByCourse(courseId!, params),
    enabled: !!courseId,
    staleTime: 5000, // Adjust the stale time as needed
    ...options,
  });
};

/** Hook lấy review của user hiện tại cho khóa học */
export const useMyReviewForCourse = (
  courseId: number | undefined,
  options?: Omit<UseQueryOptions<Review | null, Error>, 'queryKey' | 'queryFn'>
) => {
  const queryKey = reviewKeys.myReview(courseId);
  return useQuery<Review | null, Error>({
    queryKey: queryKey,
    queryFn: () => getMyReviewForCourse(courseId!),
    enabled: !!courseId,
    ...options,
  });
};

/**
 * Hook để lấy tất cả reviews cho các khóa học của một giảng viên.
 */
export const useCourseReviewsByInstructor = (
  instructorId: number | string | undefined,
  params?: InstructorReviewQueryParams,
  options?: Omit<
    UseQueryOptions<
      InstructorReviewListResponse,
      Error,
      InstructorReviewListResponse,
      (string | number | InstructorReviewQueryParams | undefined)[]
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<InstructorReviewListResponse, Error> => {
  const queryKey = Array.from(
    reviewKeys.listByInstructor(instructorId, params)
  );
  return useQuery<
    InstructorReviewListResponse,
    Error,
    InstructorReviewListResponse,
    (string | number | InstructorReviewQueryParams | undefined)[]
  >({
    queryKey: queryKey,
    queryFn: () => {
      if (!instructorId) {
        return Promise.reject(new Error('Instructor ID is required'));
      }
      return getCourseReviewsByInstructor(instructorId, params);
    },
    enabled: !!instructorId, // Only fetch if instructorId is provided
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    // keepPreviousData: true, // Consider for pagination UX
    ...options,
  });
};

// --- Mutations ---

/** Hook tạo/cập nhật review */
export const useCreateOrUpdateReview = (
  options?: UseMutationOptions<
    Review,
    Error,
    { courseId: number; data: CreateUpdateReviewData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Review,
    Error,
    { courseId: number; data: CreateUpdateReviewData }
  >({
    mutationFn: ({ courseId, data }) => createOrUpdateReview(courseId, data),
    onSuccess: (data, variables) => {
      // Invalidate danh sách reviews của khóa học đó
      queryClient.invalidateQueries({
        queryKey: reviewKeys.lists({ courseId: variables.courseId }),
      });
      // Invalidate query lấy review của user đó cho khóa học đó
      queryClient.invalidateQueries({
        queryKey: reviewKeys.myReview(variables.courseId),
      });
      // Invalidate cache chi tiết khóa học để cập nhật rating trung bình
      queryClient.invalidateQueries({
        queryKey: courseKeys.detailById(variables.courseId),
      });
      queryClient.invalidateQueries({
        queryKey: courseKeys.detailBySlug(undefined),
      }); // Cần slug?
      console.log('Review created/updated successfully.');
      // toast.success('Gửi đánh giá thành công!');
    },
    onError: (error) => {
      console.error('Create/update review failed:', error.message);
      // toast.error(error.message || 'Gửi đánh giá thất bại.');
    },
    ...options,
  });
};

/** Hook xóa review */
export const useDeleteReview = (
  options?: UseMutationOptions<
    void,
    Error,
    { reviewId: number; courseId?: number }
  >
) => {
  const queryClient = useQueryClient();
  // courseId optional, chỉ để invalidate cache course
  return useMutation<void, Error, { reviewId: number; courseId?: number }>({
    mutationFn: ({ reviewId }) => deleteReview(reviewId), // Service cần user để check quyền
    // mutationFn: ({ reviewId }) => deleteReview(reviewId, userFromContext),
    onSuccess: (_, variables) => {
      // Invalidate danh sách reviews của khóa học đó
      queryClient.invalidateQueries({
        queryKey: reviewKeys.lists({ courseId: variables.courseId }),
      });
      // Invalidate query lấy review của user đó cho khóa học đó (nếu đang cache)
      queryClient.invalidateQueries({
        queryKey: reviewKeys.myReview(variables.courseId),
      });
      // Invalidate cache chi tiết khóa học
      queryClient.invalidateQueries({
        queryKey: courseKeys.detailById(variables.courseId),
      });
      queryClient.invalidateQueries({
        queryKey: courseKeys.detailBySlug(undefined),
      });
      console.log('Review deleted successfully.');
      // toast.success('Xóa đánh giá thành công!');
    },
    onError: (error) => {
      console.error('Delete review failed:', error.message);
      // toast.error(error.message || 'Xóa đánh giá thất bại.');
    },
    ...options,
  });
};
