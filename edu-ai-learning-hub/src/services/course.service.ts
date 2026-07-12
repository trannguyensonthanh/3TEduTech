// src/services/course.service.ts

import { Section } from '@/services/section.service';
import apiHelper, { fetchWithAuth } from './apiHelper';
import { IsoDateTimeString, Lesson } from '@/services/lesson.service';

export interface CourseListItem {
  courseId: number;
  courseName: string;
  slug: string;
  thumbnailUrl?: string | null;
  originalPrice: number;
  discountedPrice?: number | null;
  language: string;
  statusId: string;
  isFeatured?: boolean;
  bestSeller?: boolean; // Thêm từ mock data trước đó, giữ lại nếu API có thể trả về
  averageRating?: number | null;
  reviewCount?: number;
  categoryName: string;
  levelName: string;
  instructorAccountId: number;
  instructorName: string;
  instructorAvatar?: string | null;
  studentCount: number;
  lessonsCount?: number;
  totalDurationSeconds?: number;
  lastUpdated?: IsoDateTimeString; // Thêm từ mock data trước đó, giữ lại nếu API có thể trả về
  // Các trường 'hasAssignments', 'hasCertificate' nếu API trả về
  hasCertificate?: boolean;
  pricing: PricingDetails;
}

// Cấu trúc giá mới
export interface PriceInfo {
  currency: 'VND' | 'USD' | string;
  originalPrice: number;
  discountedPrice: number | null;
}

export interface PricingDetails {
  base: PriceInfo;
  display: PriceInfo;
  exchangeRateUsed?: number;
}

export interface Course {
  courseId: number;
  courseName: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  requirements?: string | null;
  learningOutcomes?: string | null;
  thumbnailUrl?: string | null;
  thumbnailPublicId?: string | null; // Thêm nếu cần quản lý xóa
  introVideoUrl?: string | null;
  // originalPrice?: number;
  // discountedPrice?: number;
  instructorId?: number;
  categoryId?: number;
  levelId?: number;
  language?: string;
  statusId?: string; // CourseStatus Enum
  publishedAt?: string | null; // ISO Date string
  isFeatured?: 0 | 1 | null;
  createdAt?: string; // ISO Date string
  updatedAt?: string; // ISO Date string
  liveCourseId?: number; // ID của khóa học đang live (nếu có)

  // Thông tin join (từ API response)
  categoryName?: string;
  levelName?: string;
  statusName?: string;
  instructorName?: string;
  instructorAvatar?: string | null;
  averageRating?: number | null;
  reviewCount?: number;
  studentCount?: number; // Thêm nếu cần
  // Thông tin lồng nhau (từ API get detail)
  sections?: SectionWithLessons[] | Section[]; // Dùng SectionWithLessons nếu có
  isEnrolled?: boolean;
  userProgress?: Record<
    number,
    { isCompleted: boolean; lastWatchedPosition: number | null }
  >;
  instructorAccountId?: number; // Thêm nếu cần
  totalDuration?: number; // Tổng thời gian của tất cả các bài học trong khóa học
  totalLessons?: number; // Tổng số bài học trong khóa học
  pricing: PricingDetails;
}

export interface GetCoursesByCategorySlugParams {
  page?: number;
  limit?: number;
  sortBy?: string; // ví dụ: 'publishedAt:desc', 'averageRating:desc'
  levelId?: number;
  language?: string;
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
}

// Interface cho các tham số query khi lấy danh sách khóa học theo instructor ID
export interface GetCoursesByInstructorParams {
  page?: number;
  limit?: number;
  sortBy?: string; // ví dụ: 'PublishedAt:desc', 'AverageRating:desc'
  statusId?: string; // Lọc theo trạng thái khóa học (PUBLISHED, DRAFT, PENDING_APPROVAL)
  searchTerm?: string;
}

export enum CourseStatusId {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED', // Bổ sung nếu có
}
export interface AdminCourseView extends Course {
  // Kế thừa từ Course type cơ bản nếu có
  courseId: number;
  courseName: string;
  slug: string;
  instructorName?: string;
  instructorAvatar?: string | null;
  categoryName?: string;
  categoryId: number;
  levelId: number;
  levelName?: string;
  statusId: CourseStatusId | string;
  thumbnailUrl?: string | null;
  introVideoUrl?: string | null; // URL gốc (có thể cần signed URL nếu private)
  originalPrice?: number;
  discountedPrice?: number | null;
  sections?: Section[] | SectionWithLessons[]; // Bao gồm toàn bộ curriculum
  // Thông tin approval request liên quan
  approvalRequestId?: number; // ID của request đang pending
  submittedAt?: IsoDateTimeString; // Thời điểm gửi duyệt
  instructorNotes?: string | null; // Ghi chú của instructor khi gửi
  // Thêm các trường khác nếu API trả về
  shortDescription?: string;
  fullDescription?: string;
  requirements?: string;
  learningOutcomes?: string;
  language?: string;
  isFeatured?: 0 | 1 | null;
  averageRating?: number;
  reviewCount?: number;
}

export interface SectionWithLessons {
  sectionId: number | string;
  sectionName: string;
  sectionOrder: number;
  description?: string | null;
  lessons: Lesson[]; // dùng đúng Lesson được import
}
export type ApprovalStatusType = 'PENDING' | 'APPROVED' | 'REJECTED'; // Có thể thêm các trạng thái khác nếu cần
// export interface Lesson {
//   // Định nghĩa tạm ở đây, nên có ở lesson.service
//   lessonId: number;
//   lessonName: string;
//   lessonType: string; // LessonType Enum
//   isFreePreview: boolean;
//   videoDurationSeconds?: number | null;
//   // Các trường nội dung (VideoUrl, TextContent) có thể bị ẩn
//   [key: string]: any;
// }

export interface CourseListResponse {
  courses: CourseListItem[]; // Danh sách course với thông tin rút gọn
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CourseQueryParams {
  page?: number;
  limit?: number; // 0 = all
  searchTerm?: string;
  categoryId?: number;
  levelId?: number;
  instructorId?: number;
  statusId?: string; // CourseStatus Enum hoặc 'ALL'
  isFeatured?: 0 | 1 | null;
  sortBy?: string; // e.g., 'CreatedAt:desc'
  userPage?: boolean; // true nếu lấy cho trang người dùng
}

export interface CreateCourseData {
  courseName: string;
  categoryId: number;
  levelId?: number; // Level có thể không bắt buộc ở bước đầu
  language: 'vi' | 'en'; // Mặc định là Tiếng Việt
}

export interface UpdateCourseData {
  courseName?: string;
  categoryId?: number;
  levelId?: number;
  shortDescription?: string;
  fullDescription?: string;
  requirements?: string;
  learningOutcomes?: string;
  thumbnailUrl?: string; // Có thể cập nhật URL trực tiếp hoặc qua API upload
  introVideoUrl?: string;
  originalPrice?: number;
  discountedPrice?: number | null;
  language?: string;
  slug?: string;
}

export interface SubmitCourseData {
  notes?: string;
}

export interface ReviewCourseData {
  decision: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  adminNotes?: string;
}

export interface ToggleFeatureData {
  isFeatured: boolean;
}

// export interface ApprovalRequest {
//   RequestID: number;
//   CourseID: number;
//   // Thêm các trường khác nếu cần
//   [key: string]: any;
// }

// --- Interface MỚI cho Sync Curriculum ---
export interface SyncCurriculumPayload {
  sections: Section[]; // Gửi toàn bộ cấu trúc sections hiện tại (đã sắp xếp và loại bỏ File objects)
}

export interface SyncCurriculumResponse {
  message: string;
  // Backend có thể trả về curriculum đã cập nhật với ID thật nếu FE cần
  // updatedCurriculum?: Section[];
}

// --- Interface MỚI cho Bulk Reorder ---
export interface OrderItemData {
  id: number; // SectionID hoặc LessonID
  order: number;
}

export interface BulkReorderResponse {
  message: string;
}

// Interface cho một bản ghi Approval Request trả về từ API
export interface ApprovalRequestListItem {
  requestId: number;
  status: string; // ApprovalStatus Enum
  requestType: string; // ApprovalRequestType Enum
  requestDate: IsoDateTimeString; // CreatedAt của request
  reviewedAt?: string | null;
  instructorNotes?: string | null;
  adminNotes?: string | null;
  courseId: number;
  courseName: string;
  courseSlug: string;
  courseCurrentStatus?: string; // Trạng thái hiện tại của Course (tùy chọn)
  instructorId: number;
  instructorName: string;
  adminId?: number | null;
  adminName?: string | null;
  // Thêm các trường khác nếu API trả về
}

// Interface cho response danh sách Approval Requests
export interface ApprovalRequestListResponse {
  requests: ApprovalRequestListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Interface cho query params khi lấy danh sách Approval Requests
export interface ApprovalRequestQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string; // e.g., 'CreatedAt:desc', 'ReviewedAt:asc'
  status?: ApprovalStatusType | null; // 'PENDING', 'APPROVED', 'REJECTED'
  instructorId?: number;
  courseId?: number;
}

// --- Hàm gọi API ---

/** Lấy danh sách khóa học */
export const getCourses = async (
  params?: CourseQueryParams
): Promise<CourseListResponse> => {
  return apiHelper.get('/courses', undefined, params);
};

/** Lấy danh sách trạng thái khóa học */
export const getCourseStatuses = async (): Promise<
  { statusId: string; statusName: string; description: string }[]
> => {
  return apiHelper.get('/courses/course-statuses/statuses');
};

/** Instructor: Tạo khóa học mới */
export const createCourse = async (data: CreateCourseData): Promise<Course> => {
  return apiHelper.post('/courses', data);
};

/** Lấy chi tiết khóa học theo slug */
export const getCourseBySlug = async (slug: string): Promise<Course> => {
  // apiHelper sẽ tự động gửi token nếu có, service backend sẽ xử lý quyền xem
  return apiHelper.get(`/courses/${slug}`);
};

/** Instructor/Admin: Cập nhật khóa học */
export const updateCourse = async (
  courseId: number,
  data: UpdateCourseData
): Promise<Course> => {
  return apiHelper.patch(`/courses/${courseId}`, data);
};

/** Instructor/Admin: Xóa khóa học */
export const deleteCourse = async (courseId: number): Promise<void> => {
  await apiHelper.delete(`/courses/${courseId}`);
};

export interface CreateUpdateSessionResponse {
  message: string;
  updateCourse: Course; // Trả về thông tin của bản sao
}

export interface CancelUpdateSessionResponse {
  message: string;
  originalCourseSlug: string; // Để frontend redirect lại
}

/** Instructor/Admin: Upload/Cập nhật thumbnail */
export const updateCourseThumbnail = async (
  courseId: number,
  file: File
): Promise<Course> => {
  const formData = new FormData();
  formData.append('thumbnail', file);
  // Dùng fetch trực tiếp hoặc tạo hàm riêng trong apiHelper cho FormData
  // Giả sử apiHelper.patch có thể xử lý FormData (cần kiểm tra lại apiHelper)
  // return apiHelper.patch(`/courses/${courseId}/thumbnail`, formData, undefined, { 'Content-Type': undefined }); // Xóa content-type
  const API_BASE_URL: string = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/v1`;
  const url = new URL(`${API_BASE_URL}/courses/${courseId}/thumbnail`);
  return fetchWithAuth(url, {
    // Sử dụng fetchWithAuth đã có
    method: 'PATCH',
    body: formData,
    // Không cần set Content-Type, browser tự làm cho FormData
  });
};

/** Instructor/Admin: Upload/Cập nhật video giới thiệu */
export const updateCourseIntroVideo = async (
  courseId: number,
  file: File
): Promise<Course> => {
  const formData = new FormData();
  formData.append('introVideo', file); // Tên field phải khớp với Multer backend
  const API_BASE_URL: string = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/v1`; // Nên lấy từ config
  const url = new URL(`${API_BASE_URL}/courses/${courseId}/intro-video`);
  return fetchWithAuth(url, {
    method: 'PATCH',
    body: formData,
  });
};

/** Instructor: Gửi duyệt khóa học */
export const submitCourseForApproval = async (
  courseId: number,
  data?: SubmitCourseData
): Promise<{ message: string; request: ApprovalRequestListItem }> => {
  return apiHelper.post(`/courses/${courseId}/submit`, data || {});
};

/** Admin: Duyệt/Từ chối yêu cầu */
export const reviewCourseApproval = async (
  requestId: number,
  data: ReviewCourseData
): Promise<{ message: string; request: ApprovalRequestListItem }> => {
  // Lưu ý đường dẫn API có thể là /approval-requests/:requestId/review
  // return apiHelper.patch(`/courses/reviews/${requestId}`, data); // Đường dẫn cũ
  return apiHelper.patch(`/approval-requests/${requestId}/review`, data); // Đường dẫn đề xuất
};

/** Admin: Đánh dấu/bỏ đánh dấu nổi bật */
export const toggleCourseFeature = async (
  courseId: number,
  data: ToggleFeatureData
): Promise<Course> => {
  return apiHelper.patch(`/courses/${courseId}/feature`, data);
};

/**
 * Cập nhật thứ tự hàng loạt cho các Sections của một Course.
 * @param courseId ID của khóa học.
 * @param orderedSections Mảng các object { id: sectionId, order: newOrder }.
 * @returns Promise chứa response từ API.
 */
export const updateSectionsOrderApi = async (
  courseId: number,
  orderedSections: OrderItemData[]
): Promise<BulkReorderResponse> => {
  return apiHelper.patch(
    `/courses/${courseId}/sections/order`,
    orderedSections
  );
};

/**
 * Cập nhật thứ tự hàng loạt cho các Lessons của một Section.
 * @param sectionId ID của section.
 * @param orderedLessons Mảng các object { id: lessonId, order: newOrder }.
 * @returns Promise chứa response từ API.
 */
export const updateLessonsOrderApi = async (
  sectionId: number, // Cần sectionId thật
  orderedLessons: OrderItemData[]
): Promise<BulkReorderResponse> => {
  // API này lồng trong section
  return apiHelper.patch(
    `/sections/${sectionId}/lessons/order`,
    orderedLessons
  );
};

// Interface cho data khi review (đã có)
export interface ReviewCourseData {
  decision: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  adminNotes?: string;
}

/** Admin: Lấy danh sách các yêu cầu phê duyệt khóa học */
export const getApprovalRequests = async (
  params?: ApprovalRequestQueryParams
): Promise<ApprovalRequestListResponse> => {
  return apiHelper.get('/approval-requests', undefined, params);
};

/** Admin: Lấy chi tiết một yêu cầu phê duyệt */
export const getApprovalRequestDetails = async (
  requestId: number
): Promise<ApprovalRequestListItem> => {
  return apiHelper.get(`/approval-requests/${requestId}`);
};

// --- Hàm gọi API lấy danh sách khóa học theo category slug ---
export const getCoursesByCategorySlug = async (
  categorySlug: string,
  params?: GetCoursesByCategorySlugParams
): Promise<CourseListResponse> => {
  return apiHelper.get(
    `/categories/${categorySlug}/courses`,
    undefined,
    params
  );
};

export interface InstructorCourseParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  statusId?: string | null;
  categoryId?: number | null;
  levelId?: number | null;
  sortBy?: string;
}

/** Lấy danh sách khóa học của giảng viên đang đăng nhập */
export const getMyInstructorCourses = async (
  params?: InstructorCourseParams
): Promise<CourseListResponse> => {
  // Gọi endpoint mới, không cần truyền instructorId trên URL
  return apiHelper.get('/instructors/my-courses', undefined, params);
};

/** Tạo một phiên bản cập nhật cho khóa học đã publish */
export const createCourseUpdateSession = async (
  courseId: number
): Promise<CreateUpdateSessionResponse> => {
  return apiHelper.post(`/courses/${courseId}/create-update-session`);
};

/** Hủy phiên bản cập nhật đang thực hiện */
export const cancelCourseUpdateSession = async (
  updateCourseId: number
): Promise<CancelUpdateSessionResponse> => {
  return apiHelper.post(`/courses/${updateCourseId}/cancel-update`);
};

/** Lấy yêu cầu phê duyệt đang chờ xử lý của một khóa học */
export const getPendingApprovalRequestByCourseId = async (
  courseId: number
): Promise<ApprovalRequestListItem | null> => {
  return apiHelper.get(`/courses/${courseId}/pending-approval-request`);
};
