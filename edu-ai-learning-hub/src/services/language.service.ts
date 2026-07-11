// src/services/language.service.ts
import apiHelper from './apiHelper'; // Đảm bảo đường dẫn đúng

// --- Kiểu dữ liệu (Interfaces) ---

export interface Language {
  languageCode: string;
  languageName: string;
  nativeName?: string | null; // Cho phép null nếu không có tên bản địa
  isActive?: boolean;
  displayOrder?: number | null; // Cho phép null nếu không có thứ tự hiển thị
  CreatedAt: string;
  UpdatedAt: string;
}

// Kiểu dữ liệu cho response từ API lấy danh sách
// API GET /languages trả về { languages: [...] }
export interface LanguageListResponse {
  languages: Language[];

  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// Kiểu dữ liệu cho request body khi tạo ngôn ngữ mới (Admin)
export interface CreateLanguageData {
  languageCode: string; // Mã ngôn ngữ (vd: 'en', 'vi')
  languageName: string; // Tên hiển thị (vd: 'English', 'Tiếng Việt')
  nativeName?: string; // Tên bản địa (vd: 'English', 'Tiếng Việt')
  isActive?: boolean; // Mặc định là true ở backend
  displayOrder?: number; // Tùy chọn
}

// Kiểu dữ liệu cho request body khi cập nhật ngôn ngữ (Admin)
export interface UpdateLanguageData {
  languageName?: string;
  nativeName?: string | null; // Cho phép set null để xóa
  isActive?: boolean;
  displayOrder?: number | null; // Cho phép set null
}

// --- Hàm gọi API ---

/**
 * Lấy danh sách tất cả các ngôn ngữ (có thể filter theo isActive).
 * @param {object} [params] - Tùy chọn filter.
 * @param {boolean} [params.isActive] - Lọc theo trạng thái active.
 * @returns {Promise<LanguageListResponse>} - Mảng các đối tượng Language.
 */
export const getLanguages = async (params?: {
  isActive?: boolean;
}): Promise<LanguageListResponse> => {
  // API backend GET /languages hỗ trợ query param 'isActive'
  return apiHelper.get('/languages', undefined, params);
};

/**
 * Admin: Lấy chi tiết một ngôn ngữ bằng mã của nó.
 * @param {string} languageCode - Mã ngôn ngữ (ví dụ: 'en', 'vi').
 * @returns {Promise<Language>} - Chi tiết đối tượng Language.
 */
export const getLanguageByCode = async (
  languageCode: string
): Promise<Language> => {
  // API backend GET /languages/:languageCode
  return apiHelper.get(`/languages/${languageCode.toLowerCase()}`); // Chuẩn hóa code
};

/**
 * Admin: Tạo một ngôn ngữ mới.
 * @param {CreateLanguageData} data - Dữ liệu ngôn ngữ cần tạo.
 * @returns {Promise<Language>} - Đối tượng Language vừa được tạo.
 */
export const createLanguage = async (
  data: CreateLanguageData
): Promise<Language> => {
  // API backend POST /languages
  return apiHelper.post('/languages', {
    ...data,
    languageCode: data.languageCode.toLowerCase(),
  }); // Chuẩn hóa code
};

/**
 * Admin: Cập nhật thông tin một ngôn ngữ.
 * @param {string} languageCode - Mã ngôn ngữ cần cập nhật.
 * @param {UpdateLanguageData} data - Dữ liệu cần cập nhật.
 * @returns {Promise<Language>} - Đối tượng Language đã được cập nhật.
 */
export const updateLanguage = async (
  languageCode: string,
  data: UpdateLanguageData
): Promise<Language> => {
  // API backend PATCH /languages/:languageCode
  return apiHelper.patch(`/languages/${languageCode.toLowerCase()}`, data); // Chuẩn hóa code
};

/**
 * Admin: Xóa một ngôn ngữ.
 * @param {string} languageCode - Mã ngôn ngữ cần xóa.
 * @returns {Promise<void>}
 */
export const deleteLanguage = async (languageCode: string): Promise<void> => {
  // API backend DELETE /languages/:languageCode
  await apiHelper.delete(`/languages/${languageCode.toLowerCase()}`); // Chuẩn hóa code
};
