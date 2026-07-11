/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/instructor.service.ts
import { Skill } from '@/services/skill.service';
import apiHelper from './apiHelper';
import { IsoDateTimeString } from '@/services/lesson.service';

export interface InstructorProfile {
  // Kết hợp từ UserProfile và InstructorProfile
  accountId: number;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  coverImageUrl?: string | null;
  headline?: string | null;
  location?: string | null;
  gender?: string | null;
  birthDate?: string | null; // ISO Date
  phoneNumber?: string | null;
  professionalTitle?: string | null;
  bio?: string | null;
  aboutMe?: string | null;
  // Thông tin bank có thể không trả về ở đây để bảo mật
  // BankAccountNumber?: string | null;
  // BankName?: string | null;
  // BankAccountHolderName?: string | null;
  createdAt: string; // Account CreatedAt
  memberSince?: string; // Alias cho CreatedAt nếu cần
  skills: { skillId: number; skillName: string }[];
  socialLinks: { platform: string; url: string }[];
  totalCourses?: number;
  totalStudents?: number;
  averageRating?: number | null;
}

export interface UpdateInstructorProfileData {
  // Các trường cho phép instructor tự cập nhật
  headline?: string;
  location?: string;
  professionalTitle?: string;
  bio?: string;
  aboutMe?: string;
}

export interface BankInfo {
  bankAccountNumber: string | null;
  bankName: string | null;
  bankAccountHolderName: string | null;
}

export interface UpdateBankInfoData {
  bankAccountNumber: string;
  bankName: string;
  bankAccountHolderName: string;
}

export interface InstructorSkill {
  skillId: number;
  skillName: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface DashboardData {
  totalCourses?: number;
  totalStudents?: number;
  lifetimeEarnings?: number; // Có thể không chính xác 100% từ transaction cuối
  availableBalance?: number;
  pendingWithdrawal?: number;
  averageRating?: number | null;
  unreadNotifications?: number;
  // Thêm các số liệu khác nếu cần
}

export interface InstructorListItem {
  accountId: number;
  slug?: string; // Nếu có slug cho trang profile giảng viên
  fullName: string;
  avatarUrl?: string | null;
  professionalTitle?: string | null;
  headline?: string | null;
  averageRating?: number | null;
  totalStudents?: number;
  totalCourses?: number;
  mainSkills?: Pick<Skill, 'skillId' | 'skillName'>[]; // Chỉ lấy ID và tên kỹ năng
}

export interface InstructorListResponse {
  instructors: InstructorListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Định nghĩa các query params cho API giảng viên
export interface InstructorQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  skillId?: number; // Lọc theo kỹ năng/chuyên môn
  minRating?: number;
  sortBy?:
    | 'rating:desc'
    | 'studentCount:desc'
    | 'courseCount:desc'
    | 'name:asc'
    | 'name:desc';
  // Thêm các filter khác nếu cần
}

export interface InstructorStudentItem {
  accountId: number;
  fullName: string;
  avatarUrl?: string | null;
  email: string;
  enrolledCoursesCount: number;
  averageCompletionRate?: number | null;
  lastLearningActivityTimestamp?: IsoDateTimeString | null; // TÊN TRƯỜNG MỚI
  status: 'ACTIVE' | 'INACTIVE';
}

export interface InstructorStudentListResponse {
  students: InstructorStudentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InstructorStudentQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  courseId?: number | null;
  sortBy?:
    | 'fullName:asc'
    | 'fullName:desc'
    | 'lastLearningActivityTimestamp:asc' // SỬA Ở ĐÂY
    | 'lastLearningActivityTimestamp:desc' // SỬA Ở ĐÂY
    | 'averageCompletionRate:asc'
    | 'averageCompletionRate:desc'
    | 'enrolledCoursesCount:asc'
    | 'enrolledCoursesCount:desc';
}

// Interface mới cho Financial Overview
export interface InstructorFinancialOverviewResponse {
  currentBalance: number;
  totalLifetimeEarnings: number;
  pendingPayoutsAmount: number;
  totalStudentsLifetime: number;
  currencyId: string;
  minWithdrawalAmount: number; // chưa có
  revenueSharePercentage: number; // chưa có mặc định là 70%
}

export interface InstructorPayoutMethodItem {
  payoutMethodId: number; // PK của InstructorPayoutMethods
  methodId: string; // Ví dụ: "PAYPAL", "BANK_TRANSFER"
  methodName: string; // Ví dụ: "PayPal", "Bank Account"
  details: Record<string, any>; // JSON chi tiết, tuỳ vào loại phương thức
  isPrimary: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface BankAccountDetails {
  accountHolderName: string; // Bắt buộc
  bankName: string; // Bắt buộc
  accountNumber: string; // Bắt buộc
  country: string; // Mã ISO 2 ký tự, RẤT NÊN CÓ, có thể là bắt buộc

  // Các trường dưới đây có thể là tùy chọn, hoặc bắt buộc tùy theo 'country'
  iban?: string | null;
  swiftBic?: string | null;
  routingNumber?: string | null; // Cho US
  // Thêm các mã vùng khác nếu cần: Sort Code (UK), BSB (Australia), Transit Number (Canada), IFSC (India)

  bankAddress_street?: string | null;
  bankAddress_city?: string | null;
  bankAddress_state?: string | null; // State/Province/Region
  bankAddress_postalCode?: string | null;
  // bankAddress_country sẽ giống trường country ở trên

  currencyId?: string | null; // Loại tiền tệ của tài khoản ngân hàng
  accountType?: 'CHECKING' | 'SAVINGS' | null;
}

export interface CreateInstructorPayoutMethodData {
  methodId: 'PAYPAL' | 'BANK_TRANSFER';
  details:
    | {
        email?: string; // Cho PayPal
      }
    | BankAccountDetails; // Cho Bank Transfer
  isPrimary?: boolean;
}

export interface UpdatePayoutMethodDetailsData {
  [key: string]: any; // Cho phép object bất kỳ, backend sẽ validate
}

// --- Interfaces cho Dashboard ---
export interface DashboardStat {
  totalStudents: number;
  totalCourses: number;
  totalLifetimeEarnings: number;
  availableBalance: number;
  currencyId: string;
}

export interface RecentEnrollment {
  studentAccountId: number;
  studentName: string;
  studentAvatarUrl: string | null;
  courseId: number;
  courseName: string;
  enrolledAt: string; // ISO String
}

export interface TopPerformingCourse {
  courseId: number;
  courseName: string;
  courseSlug: string;
  recentEnrollments: number;
  recentRevenue: number;
}

export interface InstructorDashboardData {
  stats: DashboardStat;
  recentEnrollments: RecentEnrollment[];
  topPerformingCourses: TopPerformingCourse[];
}

/** Lấy profile đầy đủ của instructor đang đăng nhập */
export const getMyInstructorProfile = async (): Promise<InstructorProfile> => {
  return apiHelper.get('/instructors/me/profile');
};

/** Instructor cập nhật profile chuyên nghiệp */
export const updateMyInstructorProfile = async (
  data: UpdateInstructorProfileData
): Promise<InstructorProfile> => {
  return apiHelper.patch('/instructors/me/profile', data);
};

/** Instructor cập nhật thông tin ngân hàng */
export const updateMyBankInfo = async (
  data: UpdateBankInfoData
): Promise<BankInfo> => {
  return apiHelper.put('/instructors/me/bank-info', data);
};

/** Instructor lấy danh sách kỹ năng */
export const getMySkills = async (): Promise<{ skills: InstructorSkill[] }> => {
  // Giả sử API GET /me/profile đã trả về skills, nếu không cần tạo API riêng
  const profile = await getMyInstructorProfile();
  return { skills: profile.skills || [] };
  // Hoặc nếu có API riêng: return apiHelper.get('/instructors/me/skills');
};

/** Instructor thêm kỹ năng */
export const addMySkill = async (
  skillId: number
): Promise<{ skills: InstructorSkill[] }> => {
  return apiHelper.post('/instructors/me/skills', { skillId });
};

/** Instructor xóa kỹ năng */
export const removeMySkill = async (
  skillId: number
): Promise<{ skills: InstructorSkill[] }> => {
  return apiHelper.delete(`/instructors/me/skills/${skillId}`);
};

/** Instructor lấy danh sách social links */
export const getMySocialLinks = async (): Promise<{
  socialLinks: SocialLink[];
}> => {
  // Giả sử API GET /me/profile đã trả về social links
  const profile = await getMyInstructorProfile();
  return { socialLinks: profile.socialLinks || [] };
  // Hoặc nếu có API riêng: return apiHelper.get('/instructors/me/social-links');
};

/** Instructor thêm/cập nhật social link */
export const addOrUpdateMySocialLink = async (
  platform: string,
  url: string
): Promise<{ socialLinks: SocialLink[] }> => {
  return apiHelper.put('/instructors/me/social-links', { platform, url });
};

/** Instructor xóa social link */
export const removeMySocialLink = async (
  platform: string
): Promise<{ socialLinks: SocialLink[] }> => {
  return apiHelper.delete(`/instructors/me/social-links/${platform}`);
};

// /** Instructor lấy dữ liệu dashboard */
// export const getMyDashboardData = async (): Promise<DashboardData> => {
//   return apiHelper.get('/instructors/me/dashboard');
// };

/** Lấy profile công khai của instructor */
export const getInstructorPublicProfile = async (
  instructorId: number
): Promise<Partial<InstructorProfile>> => {
  // Chỉ trả về các trường public
  return apiHelper.get(`/instructors/${instructorId}/profile`);
};

/** Lấy danh sách giảng viên (public) */
export const getInstructors = async (
  params?: InstructorQueryParams
): Promise<InstructorListResponse> => {
  return apiHelper.get('/instructors', undefined, params);
};

/** Instructor: Lấy danh sách học viên của mình */
export const getMyStudentsApi = async (
  params?: InstructorStudentQueryParams
): Promise<InstructorStudentListResponse> => {
  return apiHelper.get('/instructors/me/students', undefined, params); // Endpoint API của bạn
};

/** Instructor: Lấy dữ liệu tổng quan tài chính cho dashboard */
export const getMyFinancialOverview =
  async (): Promise<InstructorFinancialOverviewResponse> => {
    return apiHelper.get('/instructors/me/financial-overview');
  };

/** Instructor: Cập nhật chi tiết của một phương thức thanh toán */
export const updateMyPayoutMethodDetails = async (
  payoutMethodId: number,
  details: UpdatePayoutMethodDetailsData
): Promise<{ payoutMethods: InstructorPayoutMethodItem[] }> => {
  return apiHelper.put(
    `/instructors/me/payout-methods/${payoutMethodId}`,
    details
  );
};

/** Instructor: Lấy danh sách phương thức thanh toán đã lưu */
export const getMyPayoutMethods = async (): Promise<
  InstructorPayoutMethodItem[]
> => {
  const response = await apiHelper.get('/instructors/me/payout-methods');
  // Giả sử API trả về mảng trực tiếp, nếu không, điều chỉnh response.data (hoặc tương tự)
  return response.payoutMethods || response || [];
};

/** Instructor: Thêm phương thức thanh toán mới */
export const addMyPayoutMethod = async (
  data: CreateInstructorPayoutMethodData
): Promise<InstructorPayoutMethodItem> => {
  return apiHelper.post('/instructors/me/payout-methods', data);
};

/** Instructor: Đặt một phương thức thanh toán làm mặc định */
export const setMyPrimaryPayoutMethod = async (
  payoutMethodId: number
): Promise<InstructorPayoutMethodItem> => {
  return apiHelper.patch(
    `/instructors/me/payout-methods/${payoutMethodId}/set-primary`
  );
};

/** Instructor: Xóa một phương thức thanh toán */
export const deleteMyPayoutMethod = async (
  payoutMethodId: number
): Promise<void> => {
  await apiHelper.delete(`/instructors/me/payout-methods/${payoutMethodId}`);
};

/** Instructor: Lấy dữ liệu tổng hợp cho Dashboard */
export const getMyDashboardOverview =
  async (): Promise<InstructorDashboardData> => {
    return apiHelper.get('/instructors/me/dashboard-overview');
  };
