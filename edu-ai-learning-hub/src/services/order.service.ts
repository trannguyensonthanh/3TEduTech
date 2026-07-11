// src/services/order.service.ts
import { IsoDateTimeString } from '@/types/common.types';
import apiHelper from './apiHelper';
import { PricingDetails } from '@/services/course.service';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface PriceInfo {
  currency: 'VND' | 'USD' | string;
  price: number;
  discountedPrice?: number | null;
}

export interface PricingOrderDetails {
  base: PriceInfo;
  display: PriceInfo;
  exchangeRateUsed?: number;
}

export interface OrderItem {
  orderItemId: number;
  courseId: number;
  priceAtOrder: number;
  enrollmentId?: number | null;
  // Thông tin join
  courseName?: string;
  slug?: string;
  thumbnailUrl?: string | null;
  instructorName?: string | null;
  pricing: PricingOrderDetails;
}

export interface Order {
  orderId: number;
  accountId: number;
  orderDate: IsoDateTimeString;
  originalTotalPrice: number;
  discountAmount: number;
  finalAmount: number;
  promotionId?: number | null;
  paymentId?: number | null;
  orderStatus: OrderStatus;
  // Thông tin join
  items?: OrderItem[];
  paymentStatusId?: string | null; // PaymentStatus Enum
  paymentMethodName?: string | null; // Tên phương thức thanh toán
}

export interface OrderListResponse {
  orders: Partial<Order>[]; // Thông tin rút gọn
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: string; // OrderStatus Enum
}

export interface CreateOrderFromCartPayload {
  promotionCode?: string | null; // Backend sẽ validate lại
}

/** Tạo đơn hàng từ giỏ hàng */
export const createOrderFromCart = async (
  promotionCode?: string | null
): Promise<Order> => {
  return apiHelper.post('/orders', { promotionCode });
};

/** Lấy lịch sử đơn hàng */
export const getMyOrders = async (
  params?: OrderQueryParams
): Promise<OrderListResponse> => {
  return apiHelper.get('/orders', undefined, params);
};

/** Lấy chi tiết đơn hàng */
export const getMyOrderDetails = async (orderId: number): Promise<Order> => {
  return apiHelper.get(`/orders/${orderId}`);
};
