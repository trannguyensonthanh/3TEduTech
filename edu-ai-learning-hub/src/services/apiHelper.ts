/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/apiHelper.ts
import { logoutUserApi, refreshToken } from '@/services/auth.service';
import TokenService from './token.service';

const API_BASE_URL: string = 'http://localhost:5000/v1';

// Định nghĩa kiểu dữ liệu cho lỗi API trả về (nếu backend có cấu trúc lỗi chuẩn)
export class APIError extends Error {
  status: number;
  body: any;

  constructor(message: string, status: number, body?: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.body = body;
  }
}

// --- Quản lý Trạng thái Refresh ---
let isRefreshing = false; // Cờ chống gọi refresh nhiều lần
let refreshPromise: Promise<string | null> | null = null; // Promise cho request refresh đang chạy

// --- Hàm fetch chính có xử lý Refresh ---
interface FetchOptions extends RequestInit {
  _retry?: boolean; // Cờ để đánh dấu đã thử lại sau refresh hay chưa
}

const CURRENCY_STORAGE_KEY = 'app-currency'; // Đảm bảo key này giống hệt trong SettingsContext

const getLocalCurrency = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(CURRENCY_STORAGE_KEY) || 'VND';
  }
  return 'VND';
};

const handleResponse = async (res: Response) => {
  const result = await res.json().catch(() => ({})); // lỡ BE trả về plain text thì vẫn không crash

  if (!res.ok) {
    throw new APIError(
      result.message || `Request failed with status ${res.status}`,
      res.status,
      result
    );
  }

  return result;
};

/**
 * Thực hiện fetch API, tự động gắn access token và xử lý refresh token khi gặp 401.
 * @param path Đường dẫn API (ví dụ: '/courses')
 * @param options Các tùy chọn của Fetch API (method, body, headers tùy chỉnh...)
 * @param isRetry Cờ đánh dấu đây là lần gọi lại sau khi refresh (không nên đặt thủ công)
 * @returns Promise chứa kết quả JSON từ API
 * @throws {APIError} Nếu API trả về lỗi hoặc refresh token thất bại
 */
export const fetchWithAuth = async (
  path: string | URL,
  options: RequestInit = {},
  isRetry = false
): Promise<any> => {
  console.log('Fetching:', path, options); // Log để kiểm tra request
  const currentToken = TokenService.getLocalAccessToken(); // Lấy access token từ localStorage
  const currentCurrency = getLocalCurrency();
  // Chuẩn bị headers
  const headers = new Headers(options.headers || {}); // Tạo Headers object
  if (currentToken) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    // Không set Content-Type cho FormData
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (currentCurrency) {
    headers.set('X-Currency', currentCurrency);
  }
  // Cấu hình fetch options cuối cùng
  const fetchOptions: RequestInit = {
    ...options,
    headers: headers,
    credentials: 'include', // Cần nếu backend dùng cookie cho refresh token và ở domain khác
  };

  try {
    const res = await fetch(path, fetchOptions);
    return await handleResponse(res); // Xử lý response thành công hoặc throw APIError nếu res.ok là false (trừ 401 sẽ xử lý bên dưới)
  } catch (error: unknown) {
    // Chỉ xử lý lỗi 401 và chưa phải là lần retry
    if (error instanceof APIError && error.status === 401 && !isRetry) {
      console.warn('Received 401, attempting token refresh...');

      if (!isRefreshing) {
        // Nếu chưa có request refresh nào đang chạy, bắt đầu chạy
        isRefreshing = true;
        refreshPromise = refreshToken({}, currentToken) // Gọi API refresh token (backend đọc cookie)
          .then((response) => {
            const newAccessToken = response?.accessToken; // Lấy token mới từ response refresh
            console.log('Refresh token response:', response); // Log kết quả để kiểm tra
            if (!newAccessToken)
              throw new Error('Refresh response missing accessToken');
            TokenService.updateLocalAccessToken(newAccessToken);
            console.log('Token refreshed successfully via fetchWithAuth.');
            return newAccessToken; // Trả về token mới
          })
          .catch(async (refreshError) => {
            console.error('Error refreshing token:', refreshError);
            // <= Thêm async ở đây
            console.error(
              'Token refresh failed:',
              refreshError?.message || refreshError
            );
            // **GỌI API LOGOUT BACKEND Ở ĐÂY**
            try {
              // Lấy token cũ (có thể đã hết hạn) để gửi nếu API logout cần
              const expiredToken = TokenService.getLocalAccessToken();
              await logoutUserApi(expiredToken || ''); // Gọi hàm gọi API logout gốc
              console.log(
                'Attempted to call backend logout API after refresh failure.'
              );
            } catch (logoutApiError) {
              console.error('Backend logout API call failed:', logoutApiError);
              // Không cần làm gì thêm ở đây, lỗi đã được log
            } finally {
              // **LUÔN DỌN DẸP CLIENT**
              TokenService.removeUser(); // Xóa access token cũ
              if (currentToken) {
                window.location.href = '/';
              }
            }
            return null; // Trả về null để báo refresh lỗi
          })
          .finally(() => {
            isRefreshing = false; // Reset cờ
            // refreshPromise = null; // Xóa promise đã hoàn thành
          });
      }

      // Đợi request refresh hoàn thành (hoặc request đang chạy hoàn thành)
      const newAccessToken = await refreshPromise;

      if (newAccessToken) {
        // Nếu refresh thành công, gọi lại API gốc với token mới và đánh dấu là retry
        console.log('Retrying original request with new token...');
        // Tạo options mới với header đã cập nhật token
        const retryHeaders = new Headers(fetchOptions.headers);
        retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
        const retryOptions = { ...fetchOptions, headers: retryHeaders };
        return fetchWithAuth(path, retryOptions, true); // Gọi lại chính hàm này, đánh dấu isRetry = true
      } else {
        // Nếu refresh thất bại, ném lỗi ban đầu hoặc lỗi refresh
        throw error instanceof APIError
          ? error
          : new APIError('Session expired or refresh failed', 401);
      }
    } else {
      // Ném lại các lỗi khác (không phải 401 hoặc là lần retry bị lỗi)
      throw error;
    }
  }
};

// --- Các hàm Helper dùng fetchWithAuthRefresh ---
export const get = (
  path: string,
  tokenIgnored = '',
  params: Record<string, any> = {}
): Promise<any> => {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  return fetchWithAuth(url, { method: 'GET' });
};

export const post = (
  path: string,
  options: any = {},
  tokenIgnored = '',
  extraHeader = {},
  extra = {}
): Promise<any> => {
  const url = new URL(`${API_BASE_URL}${path}`);
  return fetchWithAuth(url, {
    method: 'POST',
    headers: extraHeader as HeadersInit, // Cast nếu cần
    body: JSON.stringify(options),
    ...extra, // Thêm các tùy chọn khác nếu cần
  });
};

export const patch = (
  path: string,
  options: any = {},
  tokenIgnored = ''
): Promise<any> => {
  const url = new URL(`${API_BASE_URL}${path}`);
  return fetchWithAuth(url, {
    method: 'PATCH',
    body: JSON.stringify(options),
  });
};

export const put = (
  path: string,
  options: any = {},
  tokenIgnored = ''
): Promise<any> => {
  const url = new URL(`${API_BASE_URL}${path}`);
  return fetchWithAuth(url, {
    method: 'PUT',
    body: JSON.stringify(options),
  });
};

// DELETE
export const del = (path: string, tokenIgnored = ''): Promise<any> => {
  const url = new URL(`${API_BASE_URL}${path}`);
  return fetchWithAuth(url, { method: 'DELETE' });
};

// --- Export các hàm helper ---
const apiHelper = {
  get,
  post,
  put,
  delete: del, // Map 'delete' sang hàm 'del'
  patch,
  // Thêm patch nếu cần
};

export default apiHelper;

// Export thêm kiểu lỗi để có thể bắt ở component
// export { ApiError }; // Hoặc export trực tiếp từ class trên
