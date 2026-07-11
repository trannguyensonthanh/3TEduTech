// src/services/review.service.ts
import apiHelper from './apiHelper';
export type IsoDateTimeString = string; // Dùng cho DATETIME2
export type IsoDateString = string; // Dùng cho DATE
export interface Review {
  reviewId: number;
  courseId: number;
  accountId: number;
  rating: number; // 1-5
  comment?: string | null;
  reviewedAt: IsoDateTimeString;
  // --- Dữ liệu join tiềm năng ---
  userFullName?: string;
  userAvatar?: string | null;
}

export interface ReviewListResponse {
  reviews: Review[];
  total: number;
  averageRating: number | null;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReviewQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string; // 'ReviewedAt:desc', 'Rating:desc', etc.
  rating?: number; // 1-5
}

export interface CreateUpdateReviewData {
  rating: number; // 1-5
  comment?: string;
}

export interface InstructorReviewItem {
  reviewId: number;
  courseId: number; // ID của khóa học được đánh giá
  courseName: string; // Tên của khóa học
  rating: number; // Rating cho khóa học đó
  comment?: string | null;
  accountId: number; // ID người đánh giá
  userFullName?: string; // Tên người đánh giá
  userAvatarUrl?: string | null;
  reviewedAt: IsoDateTimeString;
}

export interface InstructorReviewListResponse {
  reviews: InstructorReviewItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InstructorReviewQueryParams {
  page?: number;
  limit?: number;
  sortBy?: 'reviewedAt:desc' | 'rating:desc' | 'rating:asc';
  minRating?: number;
}

/** Tạo hoặc cập nhật đánh giá */
export const createOrUpdateReview = async (
  courseId: number,
  data: CreateUpdateReviewData
): Promise<Review> => {
  return apiHelper.post(`/courses/${courseId}/reviews`, data);
};

/** Lấy danh sách đánh giá của khóa học */
export const getReviewsByCourse = async (
  courseId: number,
  params?: ReviewQueryParams
): Promise<ReviewListResponse> => {
  return apiHelper.get(`/courses/${courseId}/reviews`, undefined, params);
};

/** Lấy đánh giá của user hiện tại cho khóa học */
export const getMyReviewForCourse = async (
  courseId: number
): Promise<Review | null> => {
  // API trả về null nếu chưa có review
  return apiHelper.get(`/courses/${courseId}/reviews/my-review`);
};

/** Xóa đánh giá */
export const deleteReview = async (reviewId: number): Promise<void> => {
  // API này đứng riêng
  await apiHelper.delete(`/reviews/${reviewId}`);
};

/** Lấy tất cả reviews cho các khóa học của một giảng viên */
export const getCourseReviewsByInstructor = async (
  instructorId: number | string,
  params?: InstructorReviewQueryParams
): Promise<InstructorReviewListResponse> => {
  return apiHelper.get(
    `/reviews/${instructorId}/course-reviews`,
    undefined,
    params
  );
};
