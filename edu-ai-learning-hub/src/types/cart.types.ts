// src/types/cart.types.ts

import { IsoDateTimeString } from '@/types/common.types';

export interface CartItem {
  cartItemId: number;
  courseId: number;
  courseName: string;
  slug: string;
  thumbnailUrl: string | null;
  instructorName: string;
  currentPrice: number; // Giá hiện tại (có thể đã giảm)
  originalPrice: number; // Giá gốc
  addedAt: IsoDateTimeString;
}

export interface CartSummary {
  totalOriginalPrice: number;
  totalDiscount: number; // Tổng tiền tiết kiệm từ giá gốc so với giá giảm
  finalPrice: number; // Tổng tiền phải trả (chưa bao gồm promotion)
  itemCount: number;
}

export interface CartDetails {
  cartId: number;
  items: CartItem[];
  summary: CartSummary;
}

// Thông tin khuyến mãi đã được xác thực, dùng ở client-side
export interface ValidatedPromotionInfo {
  promotionId: number;
  discountCode: string;
  discountAmount: number; // Số tiền được giảm từ mã khuyến mãi
  message?: string;
}
