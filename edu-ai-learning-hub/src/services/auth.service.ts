/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/auth.service.ts
import apiHelper, { APIError } from './apiHelper'; // Import helper và kiểu lỗi
import TokenService from './token.service';

// --- Kiểu dữ liệu (Ví dụ - nên định nghĩa chi tiết hơn) ---
export interface LoginCredentials {
  email: string;
  password?: string; // Password có thể không cần cho social login
}

export interface RegisterData extends LoginCredentials {
  fullName: string;
  roleId?: string;
}

export interface UserInfo {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  status: string;
}

export interface LoginResponse {
  accessToken: string;
  // refreshToken được xử lý qua cookie
  user: UserInfo;
}

export interface RegisterResponse {
  message: string;
  user: {
    accountId: number;
    email: string;
    role: string;
    status: string;
  };
}

export interface RefreshResponse {
  accessToken: string;
}

export interface CompleteFacebookRegistrationData {
  accessToken: string; // Access Token Facebook từ thư viện frontend
  email: string; // Email do người dùng nhập thủ công
}

// Response trả về chỉ là message
export interface CompleteFacebookRegistrationResponse {
  message: string;
}

// --- Kiểu dữ liệu mới ---
// Định nghĩa kiểu cho Skill Input (ID hoặc string)
type SkillInput = number | string;

// Định nghĩa kiểu cho Social Link Input
export interface SocialLinkInput {
  platform: string;
  url: string;
}

// Định nghĩa kiểu cho dữ liệu đăng ký Instructor
export interface RegisterInstructorData {
  email: string;
  password?: string; // Password có thể không bắt buộc nếu có social login sau này
  fullName: string;
  professionalTitle?: string;
  bio?: string;
  skills?: SkillInput[];
  socialLinks?: SocialLinkInput[];
}

// Định nghĩa kiểu cho response (giống register thường)
export interface RegisterInstructorResponse {
  message: string;
  user: {
    accountId: number;
    email: string;
    role: string; // Sẽ là 'GV'
    status: string; // Sẽ là 'PENDING_VERIFICATION'
  };
}

// Kiểu dữ liệu cho request body của Change Password
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string; // Mặc dù backend có thể không cần field này nếu đã validate newPassword
}

// Kiểu dữ liệu cho request body của Google Login
export interface GoogleLoginData {
  idToken: string; // Nhận ID Token từ thư viện @react-oauth/google
}

// Kiểu dữ liệu cho request body của Facebook Login
export interface FacebookLoginData {
  accessToken: string; // Nhận Access Token từ thư viện react-facebook-login
  // userId?: string; // Có thể gửi thêm nếu cần
}

/** Đăng ký tài khoản Giảng viên mới */
export const registerInstructor = async (
  data: RegisterInstructorData
): Promise<RegisterInstructorResponse> => {
  return apiHelper.post('/auth/register/instructor', data);
};

/** Đăng nhập bằng Email/Password */
export const loginUser = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  const response: LoginResponse = await apiHelper.post(
    '/auth/login',
    credentials,
    '',
    {},
    { credentials: 'include' }
  );
  // Lưu thông tin user và access token vào localStorage sau khi đăng nhập thành công
  if (response?.accessToken && response?.user) {
    // Gộp accessToken vào user object để lưu chung
    const userToStore = { ...response.user, accessToken: response.accessToken };
    TokenService.setUser(userToStore);
  }
  return response;
};

/** Đăng ký tài khoản mới */
export const registerUser = async (
  data: RegisterData
): Promise<RegisterResponse> => {
  return apiHelper.post('/auth/register', data);
};

// src/services/auth.service.ts
export const refreshToken = async (
  data = {},
  tokenIgnored = ''
): Promise<{ accessToken: string }> => {
  const API_BASE_URL: string = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/v1`;
  try {
    // Gọi fetch trực tiếp, KHÔNG qua fetchWithAuth
    const res = await fetch(API_BASE_URL + '/auth/refresh-tokens', {
      // *** Endpoint đúng là /refresh-tokens ***
      method: 'POST',
      headers: {
        // Authorization: `Bearer ${tokenIgnored}`, // API refresh token KHÔNG cần Access Token cũ
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include', // *** Quan trọng: Để gửi cookie refreshToken ***
      body: JSON.stringify(data), // Body có thể rỗng nếu backend chỉ đọc cookie
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Nếu API refresh token cũng trả về 401 -> Refresh token hết hạn/không hợp lệ
      throw new APIError(
        result.message || `Refresh token failed with status ${res.status}`,
        res.status, // Trả về status code lỗi từ API refresh
        result
      );
    }
    if (!result.accessToken) {
      throw new Error('Refresh response missing accessToken');
    }
    return result as { accessToken: string };
  } catch (error: any) {
    console.error('API call to refresh token failed:', error);
    throw error; // Ném lỗi để catch trong fetchWithAuth xử lý
  }
};

/** Đăng xuất */
export const logoutUser = async (): Promise<{ message: string }> => {
  // Gọi API backend để backend xử lý phía server (vd: blacklist token nếu cần, xóa cookie)
  const response = await apiHelper.post(
    '/auth/logout',
    {},
    '',
    {},
    {
      credentials: 'include', // Gửi cookie (nếu có)
    }
  ); // apiHelper sẽ tự động gửi token hiện tại
  // Xóa thông tin user và token khỏi localStorage phía client
  document.cookie = 'refreshToken=; Max-Age=0; path=/;'; // Xóa refreshToken bằng cách đặt Max-Age=0
  TokenService.removeUser();
  return response;
};

export const logoutUserApi = async (token = ''): Promise<any> => {
  const API_BASE_URL: string = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/v1`;
  try {
    const res = await fetch(API_BASE_URL + '/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Gửi Authorization nếu API backend yêu cầu token để biết logout user nào
        // (mặc dù khi refresh fail thì token này có thể đã hết hạn)
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      credentials: 'include', // Gửi cookie (nếu có)
      body: JSON.stringify({}), // Không cần body nếu API không yêu cầu
    });
    // Không cần quan tâm nhiều đến kết quả response logout, chỉ cần gọi là chính
    if (!res.ok) {
      console.warn(`API call to /auth/logout failed with status ${res.status}`);
    }
    return res.json().catch(() => ({})); // Trả về kết quả hoặc object rỗng
  } catch (error) {
    console.error('API call to /auth/logout failed:', error);
    throw error; // Ném lỗi để có thể bắt ở nơi gọi nếu cần
  }
};

/** Gọi API Backend để refresh token (Backend đọc cookie refreshToken) */
export const refreshTokenApi = async (): Promise<RefreshResponse> => {
  // KHÔNG dùng apiHelper.post vì nó sẽ cố gắng refresh nếu gặp 401 -> vòng lặp
  // Gọi fetch trực tiếp như hàm refreshToken cũ hoặc tạo hàm riêng trong apiHelper ko retry
  // Tạm thời dùng hàm refreshToken đã có (cần đảm bảo nó không bị lỗi vòng lặp)
  const result = await refreshToken(
    {},
    TokenService.getLocalAccessToken() || ''
  ); // Gửi token cũ (có thể hết hạn) nếu API backend cần
  if (result?.accessToken) {
    TokenService.updateLocalAccessToken(result.accessToken); // Cập nhật token mới vào local
  }
  return result;
};

/** Xác thực email */
export const verifyUserEmail = async (
  token: string
): Promise<{ message: string }> => {
  // Token nằm trong query param, không cần body
  return apiHelper.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
};

/** Yêu cầu reset mật khẩu */
export const requestPasswordResetApi = async (
  email: string
): Promise<{ message: string }> => {
  return apiHelper.post('/auth/request-password-reset', { email });
};

/** Thực hiện reset mật khẩu */
export const resetPasswordApi = async (
  token: string,
  newPassword: string
): Promise<{ message: string }> => {
  // Token nằm trong query param
  const path = `/auth/reset-password?token=${encodeURIComponent(token)}`;
  return apiHelper.post(path, { newPassword });
};

/** Đăng nhập bằng Google (gửi ID Token lên backend) */
export const loginWithGoogle = async (
  data: GoogleLoginData
): Promise<LoginResponse> => {
  const response: LoginResponse = await apiHelper.post(
    '/auth/google/login',
    data
  );
  // Lưu thông tin user và access token vào localStorage sau khi đăng nhập thành công
  if (response?.accessToken && response?.user) {
    const userToStore = { ...response.user, accessToken: response.accessToken };
    TokenService.setUser(userToStore);
  }
  return response;
};

/** Đăng nhập bằng Facebook (gửi Access Token lên backend) */
export const loginWithFacebook = async (
  data: FacebookLoginData
): Promise<LoginResponse> => {
  const response: LoginResponse = await apiHelper.post(
    '/auth/facebook/login',
    data
  );
  // Lưu thông tin user và access token vào localStorage
  if (response?.accessToken && response?.user) {
    const userToStore = { ...response.user, accessToken: response.accessToken };
    TokenService.setUser(userToStore);
  }
  return response;
};

// // --- Hàm xử lý Social Login Redirect ---
// // Frontend không gọi API này trực tiếp, chỉ cần xử lý URL callback
// export const handleSocialLoginSuccess = (searchParams: URLSearchParams) => {
//   const accessToken = searchParams.get('accessToken');
//   const userId = searchParams.get('userId');
//   const role = searchParams.get('role');

//   if (accessToken && userId && role) {
//     // Cần lấy thêm fullName, email, avatar từ backend hoặc lưu tạm khi redirect?
//     // Cách tốt hơn: Backend trả về thông tin user cơ bản cùng accessToken
//     // Giả sử backend trả về user object trong queryParams (không khuyến khích)
//     // const user = JSON.parse(searchParams.get('user') || '{}');
//     // => Cách an toàn: FE gọi API /users/me NGAY SAU KHI có accessToken
//     const userToStore = { id: parseInt(userId, 10), role, accessToken }; // Lưu tạm thời
//     TokenService.setUser(userToStore);
//     // TODO: Gọi API /users/me để lấy thông tin user đầy đủ và cập nhật lại localStorage
//     console.log('Social login success, tokens received.');
//     return true;
//   } else {
//     console.error('Social login callback missing required parameters.');
//     TokenService.removeUser(); // Xóa nếu có lỗi
//     return false;
//   }
// };

/**
 * Hoàn tất đăng ký bằng Facebook khi người dùng tự cung cấp email.
 * @param {CompleteFacebookRegistrationData} data - Chứa accessToken và email.
 * @returns {Promise<CompleteFacebookRegistrationResponse>}
 */
export const completeFacebookRegistration = async (
  data: CompleteFacebookRegistrationData
): Promise<CompleteFacebookRegistrationResponse> => {
  return apiHelper.post('/auth/facebook/complete-registration', data);
};

/** Thay đổi mật khẩu người dùng hiện tại */
export const changePassword = async (
  data: ChangePasswordData
): Promise<{ message: string }> => {
  // Backend có thể chỉ cần currentPassword và newPassword
  // confirmNewPassword thường chỉ dùng cho validation ở frontend hoặc schema backend
  const payload = {
    currentPassword: data.currentPassword,
    newPassword: data.newPassword,
  };
  return apiHelper.post('/auth/change-password', payload);
};
