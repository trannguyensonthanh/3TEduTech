/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/token.service.ts

/**
 * Lấy Access Token từ user đã lưu trong localStorage.
 * @returns {string | null} Access Token hoặc null nếu không có user/token.
 */
const getLocalAccessToken = (): string | null => {
  if (typeof window !== 'undefined' && localStorage.getItem('user')) {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) return null;
      const user: any = JSON.parse(userString);
      return user?.accessToken || null;
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
      // Có thể xóa localStorage bị lỗi
      // removeUser();
      return null;
    }
  }
  return null;
};

/**
 * Lấy thông tin user đã lưu trong localStorage.
 * @returns {any | null} Đối tượng user hoặc null.
 */
const getLocalUser = (): any | null => {
  if (typeof window !== 'undefined' && localStorage.getItem('user')) {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) return null;
      const user: any = JSON.parse(userString);
      return user;
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
      // removeUser();
      return null;
    }
  }
  return null;
};

/**
 * Lưu thông tin user (bao gồm cả access token) vào localStorage.
 * @param {any} user Đối tượng user nhận từ API đăng nhập (hoặc chỉ chứa các trường cần lưu).
 */
const setUser = (user: any | null): void => {
  if (typeof window !== 'undefined') {
    if (user) {
      try {
        // Đảm bảo chỉ lưu các trường cần thiết và đúng kiểu any
        const userToStore: any = {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          accessToken: user.accessToken,
          status: user.status,
          avatarUrl: user.avatarUrl,
        };
        localStorage.setItem('user', JSON.stringify(userToStore));
        console.log('User info saved to local storage.');
      } catch (e) {
        console.error('Error saving user to localStorage:', e);
      }
    } else {
      // Nếu user là null, có thể hiểu là logout hoặc xóa
      removeUser();
    }
  }
};

// Hàm cập nhật chỉ AccessToken trong user đã lưu
const updateLocalAccessToken = (newToken: string): void => {
  if (typeof window !== 'undefined') {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user: any = JSON.parse(userString);
        user.accessToken = newToken;
        localStorage.setItem('user', JSON.stringify(user));
        console.log('Access token updated in local storage.');
      }
    } catch (e) {
      console.error('Error updating access token in localStorage:', e);
    }
  }
};

/**
 * Xóa thông tin user khỏi localStorage.
 */
const removeUser = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');

    console.log('User info removed from local storage.');
  }
};

// Tạo đối tượng service để export
const TokenService = {
  getLocalAccessToken,
  getLocalUser,
  setUser,
  removeUser,
  updateLocalAccessToken,
};

// Export dưới dạng object để giữ nguyên cách import
export default TokenService;
