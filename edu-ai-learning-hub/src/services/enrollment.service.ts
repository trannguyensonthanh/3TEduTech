// src/services/enrollment.service.ts
import apiHelper from './apiHelper';

export interface Enrollment {
  enrollmentId: number;
  accountId: number;
  courseId: number;
  enrolledAt: string; // ISO Date string
  purchasePrice: number;
  // Thông tin join (từ API response)
  courseName?: string;
  slug?: string;
  thumbnailUrl?: string | null;
  shortDescription?: string;
  instructorName?: string;
  // Thêm progress nếu API trả về
  // progressPercentage?: number;
  completedLessons?: number;
  totalLessons?: number;
  progressPercentage?: number;
  completionDate?: string | null; // Ngày hoàn thành khóa học

  /* --- Course Versioning (thêm 17/08/2026) ---
     Backend (enrollments.repository.js) nay trả kèm 3 trường này để giao diện
     "Khóa học của tôi" nói rõ học viên đang học phiên bản nào và đã có bản mới
     hơn hay chưa. Học viên KHÔNG bị chuyển sang phiên bản mới — họ chỉ được
     biết, và có đường dẫn để xem/mua nếu muốn. */
  /** Số phiên bản của chính khóa học mà học viên đã mua */
  versionNumber?: number;
  /** true = phiên bản đang mua vẫn là bản mới nhất */
  isLatestVersion?: boolean;
  /** Slug của phiên bản mới nhất; chỉ khác slug hiện tại khi isLatestVersion = false */
  latestVersionSlug?: string | null;
}

export interface EnrollmentListResponse {
  enrollments: Enrollment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EnrollmentQueryParams {
  page?: number;
  limit?: number;
}

/** Lấy danh sách khóa học đã đăng ký của user hiện tại */
export const getMyEnrollments = async (
  params?: EnrollmentQueryParams
): Promise<EnrollmentListResponse> => {
  return apiHelper.get('/enrollments/me', undefined, params);
};

/** User tự đăng ký khóa học (miễn phí/test) */
export const enrollCourse = async (courseId: number): Promise<Enrollment> => {
  // API này có thể không cần body nếu giá được xác định ở backend
  return apiHelper.post(`/enrollments/courses/${courseId}`);
};

// Hàm isUserEnrolled thường được dùng nội bộ ở service khác, không cần gọi API trực tiếp từ FE
// Nếu FE cần check thì có thể gọi getMyEnrollments và kiểm tra hoặc tạo API riêng
