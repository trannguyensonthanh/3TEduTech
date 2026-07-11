/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/section.service.ts
import apiHelper from './apiHelper';

export interface Section {
  tempId?: string | number; // Dùng cho UI, không gửi lên API
  sectionId?: number;
  courseId?: number;
  sectionName: string;
  sectionOrder: number;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lessons?: any[]; // Kiểu Lesson đầy đủ nếu API trả về
}

export interface SectionListData {
  sections: Section[];
}

export interface CreateSectionData {
  // courseId lấy từ URL
  sectionName: string;
  description?: string;
}

export interface UpdateSectionData {
  sectionName?: string;
  description?: string;
}

export interface SectionOrderData {
  id: number; // SectionID
  order: number;
}

/** Lấy danh sách sections của khóa học */
export const getSections = async (
  courseId: number
): Promise<SectionListData> => {
  // API này thường không gọi riêng lẻ, mà được tích hợp trong getCourseBySlug
  // Nếu vẫn cần gọi riêng:
  return apiHelper.get(`/courses/${courseId}/sections`);
};

/** Tạo section mới */
export const createSection = async (
  courseId: number,
  data: CreateSectionData
): Promise<Section> => {
  return apiHelper.post(`/courses/${courseId}/sections`, data);
};

/** Cập nhật thứ tự sections */
export const updateSectionsOrder = async (
  courseId: number,
  sectionOrders: SectionOrderData[]
): Promise<SectionListData> => {
  // API Backend nhận mảng trong body: { sectionOrders: [...] } hoặc trực tiếp mảng?
  // Giả sử API nhận trực tiếp mảng trong body
  // Hoặc nếu API nhận object: return apiHelper.patch(`/courses/${courseId}/sections/order`, { sectionOrders });
  return apiHelper.patch(`/courses/${courseId}/sections/order`, sectionOrders);
};

/** Cập nhật thông tin section */
export const updateSection = async (
  courseId: number,
  sectionId: number,
  data: UpdateSectionData
): Promise<Section> => {
  return apiHelper.patch(`/courses/${courseId}/sections/${sectionId}`, data);
};

/** Xóa section */
export const deleteSection = async (
  courseId: number,
  sectionId: number
): Promise<void> => {
  await apiHelper.delete(`/courses/${courseId}/sections/${sectionId}`);
};
