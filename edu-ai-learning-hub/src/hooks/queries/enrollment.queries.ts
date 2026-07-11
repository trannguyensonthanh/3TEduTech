// src/hooks/queries/enrollment.queries.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getMyEnrollments,
  enrollCourse,
  Enrollment,
  EnrollmentListResponse,
  EnrollmentQueryParams,
} from '@/services/enrollment.service';
import { courseKeys } from './course.queries'; // Để invalidate course detail (isEnrolled)
import { useMyProfile } from '@/hooks/queries/user.queries';
import { format } from 'date-fns';

// Kiểu dữ liệu sau khi xử lý ở FE, thêm dynamicCertificateId
export interface ProcessedEnrollment extends Enrollment {
  dynamicCertificateId?: string;
}

export interface CategorizedEnrollments {
  completed: ProcessedEnrollment[];
  inProgress: ProcessedEnrollment[];
}

// Query Key Factory
const enrollmentKeys = {
  all: ['enrollments'] as const,
  myLists: (params?: EnrollmentQueryParams) =>
    [...enrollmentKeys.all, 'myList', params || {}] as const,
};

// --- Queries ---

/** Hook lấy danh sách khóa học đã đăng ký */
export const useMyEnrollments = (
  params?: EnrollmentQueryParams,
  options?: Omit<
    UseQueryOptions<EnrollmentListResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = enrollmentKeys.myLists(params);
  return useQuery<EnrollmentListResponse, Error>({
    queryKey: queryKey,
    queryFn: () => getMyEnrollments(params),
    staleTime: 1000 * 60, // Adjust the stale time as needed (e.g., 1 minute)
    ...options,
  });
};

// --- Mutations ---

/** Hook để user tự enroll (khóa miễn phí/test) */
export const useEnrollCourse = (
  options?: UseMutationOptions<Enrollment, Error, number>
) => {
  const queryClient = useQueryClient();
  return useMutation<Enrollment, Error, number>({
    // Input là courseId
    mutationFn: enrollCourse,
    onSuccess: (data) => {
      // Invalidate danh sách enrollment của user
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.myLists() });
      // Invalidate chi tiết khóa học để cập nhật isEnrolled
      queryClient.invalidateQueries({
        queryKey: courseKeys.detailById(data.courseId),
      });
      queryClient.invalidateQueries({
        queryKey: courseKeys.detailBySlug(undefined),
      }); // Cần slug?
      // toast.success('Đăng ký khóa học thành công!');
    },
    onError: (error) => {
      console.error('Enrollment failed:', error.message);
      // toast.error(error.message || 'Đăng ký khóa học thất bại.');
    },
    ...options,
  });
};

export const useMyCategorizedEnrollmentsWithCertificateInfo = (
  params?: EnrollmentQueryParams,
  options?: Omit<
    UseQueryOptions<
      CategorizedEnrollments,
      Error,
      CategorizedEnrollments,
      ReturnType<typeof enrollmentKeys.myLists>
    >,
    'queryKey' | 'queryFn' | 'select' | 'enabled'
  >
) => {
  const { data: userProfile } = useMyProfile(); // Lấy thông tin user, bao gồm accountId

  return useQuery<
    EnrollmentListResponse,
    Error,
    CategorizedEnrollments,
    ReturnType<typeof enrollmentKeys.myLists>
  >({
    queryKey: enrollmentKeys.myLists(params),
    queryFn: () => getMyEnrollments(params),
    enabled: !!userProfile, // Chỉ fetch enrollments khi đã có thông tin user (để lấy accountId)
    select: (data) => {
      const completed: ProcessedEnrollment[] = [];
      const inProgress: ProcessedEnrollment[] = [];

      data.enrollments.forEach((enrollment) => {
        const processed: ProcessedEnrollment = { ...enrollment };
        if (
          enrollment.progressPercentage === 100 &&
          enrollment.completionDate &&
          userProfile?.accountId
        ) {
          // Tạo dynamicCertificateId
          const datePart = format(
            new Date(enrollment.completionDate),
            'yyyyMMdd'
          );
          processed.dynamicCertificateId = `3TE-${userProfile.accountId}-${enrollment.courseId}-${datePart}`;
          completed.push(processed);
        } else {
          inProgress.push(processed);
        }
      });
      return { completed, inProgress };
    },
    staleTime: 1000 * 60 * 5, // 5 phút
    ...options,
  });
};
