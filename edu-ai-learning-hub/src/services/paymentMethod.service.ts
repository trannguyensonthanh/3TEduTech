// src/services/paymentMethod.service.ts
import { IsoDateTimeString } from '@/types/common.types';
import apiHelper from './apiHelper';

export interface PaymentMethod {
  methodId: string;
  methodName: string;
  iconUrl?: string | null;
  description?: string | null;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
}

export interface PaymentMethodListResponse {
  paymentMethods: PaymentMethod[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface PaymentMethodQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
}

export interface CreatePaymentMethodData {
  methodId: string;
  methodName: string;
  iconUrl?: string;
  description?: string;
}

export interface UpdatePaymentMethodData {
  methodName?: string;
  iconUrl?: string;
  description?: string;
}

// --- Hàm gọi API ---
/** Lấy danh sách phương thức thanh toán */
export const getPaymentMethods = async (
  params?: PaymentMethodQueryParams
): Promise<PaymentMethodListResponse> => {
  return apiHelper.get('/payment-methods', undefined, params);
};

/** Tạo phương thức thanh toán mới */
export const createPaymentMethod = async (
  data: CreatePaymentMethodData
): Promise<PaymentMethod> => {
  return apiHelper.post('/payment-methods', data);
};

/** Cập nhật phương thức thanh toán */
export const updatePaymentMethod = async (
  methodId: string,
  data: UpdatePaymentMethodData
): Promise<PaymentMethod> => {
  return apiHelper.patch(`/payment-methods/${methodId}`, data);
};

/** Xóa phương thức thanh toán */
export const deletePaymentMethod = async (methodId: string): Promise<void> => {
  await apiHelper.delete(`/payment-methods/${methodId}`);
};
