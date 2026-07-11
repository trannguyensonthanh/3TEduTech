/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/user.service.ts
import apiHelper, { fetchWithAuth } from './apiHelper';

// --- Kiểu dữ liệu (Ví dụ) ---
export interface UserProfile {
  accountId: number; // ID tài khoản
  headline?: string | null; // Tiêu đề cá nhân
  coverImageUrl?: string | null; // URL ảnh bìa (có thể null)
  email: string; // Email của người dùng
  roleId: string; // Vai trò của người dùng (e.g., 'ADMIN', 'INSTRUCTOR', 'STUDENT')
  status: string; // Trạng thái tài khoản (e.g., 'ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION')
  fullName: string; // Họ và tên đầy đủ
  avatarUrl?: string | null; // URL ảnh đại diện (có thể null)
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null; // Giới tính
  birthDate?: string | null; // Ngày sinh (YYYY-MM-DD)
  phoneNumber?: string | null; // Số điện thoại
  location?: string | null; // Địa chỉ hoặc vị trí
  professionalTitle?: string | null; // Chức danh chuyên môn
  bio?: string | null; // Tiểu sử ngắn
  aboutMe?: string | null; // Thông tin chi tiết về bản thân
  bankAccountNumber?: string | null; // Số tài khoản ngân hàng
  bankName?: string | null; // Tên ngân hàng
  bankAccountHolderName?: string | null; // Tên chủ tài khoản ngân hàng
  skills?: any; // Danh sách kỹ năng
  socialLinks?: any; // Danh sách liên kết mạng xã hội
  createdAt?: string; // Thời gian tạo tài khoản
  updatedAt?: string; // Thời gian cập nhật tài khoản
  courses?: number; // Số lượng khóa học đã tạo (nếu là giảng viên)
}

// Định nghĩa kiểu cho liên kết mạng xã hội
export interface SocialLink {
  platform: 'LINKEDIN' | 'GITHUB' | 'TWITTER' | 'FACEBOOK' | 'OTHER'; // Nền tảng mạng xã hội
  url: string; // URL liên kết
}

export interface UpdateUserProfileData {
  fullName?: string;
  avatarUrl?: string | null;
  coverImageUrl?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  birthDate?: string | null; // YYYY-MM-DD
  phoneNumber?: string | null;
  headline?: string | null;
  location?: string | null;
}

export interface UserListResponse {
  users: UserProfile[]; // Danh sách user với thông tin cơ bản
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  role?: string;
  status?: string;
}

export interface NotificationPreferences {
  courseUpdates?: boolean;
  newRecommendations?: boolean;
  promotions?: boolean;
  platformAnnouncements?: boolean;
  // Thêm các tùy chọn khác nếu có
}

// --- Các hàm gọi API ---

/** Lấy profile của user đang đăng nhập */
export const getMyProfile = async (): Promise<UserProfile> => {
  console.log('Fetching user profile...');
  return apiHelper.get('/users/me');
};

/** Cập nhật profile của user đang đăng nhập */
export const updateMyProfile = async (
  data: UpdateUserProfileData
): Promise<UserProfile> => {
  return apiHelper.patch('/users/me', data);
};

// --- Admin APIs ---

/** Admin: Lấy danh sách users */
export const getUsers = async (
  params: UserQueryParams
): Promise<UserListResponse> => {
  return apiHelper.get('/users', undefined, params); // Truyền params vào hàm get
};

/** Admin: Lấy chi tiết user */
export const getUserById = async (userId: number): Promise<UserProfile> => {
  return apiHelper.get(`/users/${userId}`);
};

/** Admin: Cập nhật status user */
export const updateUserStatus = async (
  userId: number,
  status: string
): Promise<{ message: string }> => {
  return apiHelper.patch(`/users/${userId}/status`, { status });
};

/** Admin: Cập nhật role user */
export const updateUserRole = async (
  userId: number,
  roleId: string
): Promise<{ message: string }> => {
  return apiHelper.patch(`/users/${userId}/role`, { roleId });
};

/** Cập nhật avatar của user đang đăng nhập */
export const updateMyAvatar = async (
  avatarFile: File
): Promise<UserProfile> => {
  const formData = new FormData();
  formData.append('avatar', avatarFile);
  // Dùng fetch trực tiếp hoặc tạo hàm riêng trong apiHelper cho FormData
  // Giả sử apiHelper.patch có thể xử lý FormData (cần kiểm tra lại apiHelper)
  // return apiHelper.patch(`/courses/${courseId}/thumbnail`, formData, undefined, { 'Content-Type': undefined }); // Xóa content-type
  const API_BASE_URL: string = 'http://localhost:5000/v1';
  const url = new URL(`${API_BASE_URL}/users/me/avatar`);
  return fetchWithAuth(url, {
    // Sử dụng fetchWithAuth đã có
    method: 'POST',
    body: formData,
    // Không cần set Content-Type, browser tự làm cho FormData
  });
};

/** Lấy cài đặt thông báo email của user */
export const getMyNotificationPreferences =
  async (): Promise<NotificationPreferences> => {
    return apiHelper.get('/users/me/notification-preferences');
  };

// /** Cập nhật cài đặt thông báo email của user */
// export const updateMyNotificationPreferences = async (
//   preferences: Partial<NotificationPreferences> // Cho phép cập nhật một phần
// ): Promise<NotificationPreferences> => {
//   return apiHelper.put('/users/me/notification-preferences', preferences);
// };
