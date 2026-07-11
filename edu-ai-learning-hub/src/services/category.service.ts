// src/services/category.service.ts
import apiHelper from './apiHelper';

export interface Category {
  categoryId: number;
  categoryName: string;
  slug: string;
  description?: string | null;
  iconUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  courseCount?: number;
}

export interface CategoryListData {
  categories: Category[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface CategoryQueryParams {
  page?: number;
  limit?: number; // 0 = all
  searchTerm?: string;
}

export interface CreateCategoryData {
  categoryName: string;
  slug?: string;
  description?: string;
  iconUrl?: string;
}

export interface UpdateCategoryData {
  categoryName?: string;
  slug?: string;
  description?: string;
  iconUrl?: string;
}

export const getCategories = async (
  params?: CategoryQueryParams
): Promise<CategoryListData> => {
  return apiHelper.get('/categories', undefined, params);
};

export const createCategory = async (
  data: CreateCategoryData
): Promise<Category> => {
  return apiHelper.post('/categories', data);
};

export const getCategoryById = async (
  categoryId: number
): Promise<Category> => {
  return apiHelper.get(`/categories/${categoryId}`);
};

/**
 * Lấy chi tiết một category bằng slug của nó.
 * @param {string} categorySlug - Slug của category.
 * @returns {Promise<Category>} - Chi tiết đối tượng Category.
 */
export const getCategoryBySlug = async (
  categorySlug: string
): Promise<Category> => {
  return apiHelper.get(`/categories/slug/${categorySlug}`);
};

export const updateCategory = async (
  categoryId: number,
  data: UpdateCategoryData
): Promise<Category> => {
  return apiHelper.patch(`/categories/${categoryId}`, data);
};

export const deleteCategory = async (categoryId: number): Promise<void> => {
  // API trả về 204 hoặc 200, hàm del có thể không trả về body
  await apiHelper.delete(`/categories/${categoryId}`);
};
