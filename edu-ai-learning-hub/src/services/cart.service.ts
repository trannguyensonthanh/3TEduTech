// src/services/cart.service.ts
import { PricingDetails } from '@/services/course.service';
import apiHelper from './apiHelper';

export interface CartItem {
  cartItemId: number;
  courseId: number;
  courseName: string;
  slug: string;
  thumbnailUrl: string | null;
  instructorName: string;
  // currentPrice: number;
  // originalPrice: number;
  priceAtAddition: number;
  addedAt: string; // ISO Date string
  pricing: PricingDetails;
}

export interface CartSummary {
  displayCurrency: 'VND' | 'USD' | string;
  totalOriginalPrice: number;
  totalDiscount: number;
  finalPrice: number; // Giá trước khi áp dụng promotion code
  itemCount: number;
}

export interface ValidatedPromotionInfo {
  promotionId: number;
  discountCode: string;
  discountAmount: number; // Số tiền được giảm từ mã khuyến mãi
  message?: string;
}

export interface CartDetails {
  cartId: number;
  items: CartItem[];
  summary: CartSummary;
}

/** Lấy thông tin giỏ hàng hiện tại */
export const viewMyCart = async (): Promise<CartDetails> => {
  return apiHelper.get('/cart');
};

/** Thêm khóa học vào giỏ hàng */
export const addCourseToCart = async (
  courseId: number
): Promise<{ message: string; cart: CartDetails }> => {
  return apiHelper.post('/cart', { courseId });
};

/** Xóa khóa học khỏi giỏ hàng */
export const removeCourseFromCart = async (
  courseId: number
): Promise<{ message: string; cart: CartDetails }> => {
  return apiHelper.delete(`/cart/courses/${courseId}`);
};

/** (Optional) Xóa toàn bộ giỏ hàng */
export const clearMyCart = async (): Promise<{
  message: string;
  cart: CartDetails;
}> => {
  return apiHelper.delete('/cart');
};
