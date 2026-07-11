// src/services/payment.service.ts
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import apiHelper from './apiHelper';

export interface CreateVnpayUrlData {
  orderId: number;
  bankCode?: string;
  locale?: 'vn' | 'en';
}

export interface CreateVnpayUrlResponse {
  paymentUrl: string;
}

// --- Interface mới cho Stripe ---
export interface CreateStripeSessionData {
  orderId: number;
}

export interface CreateStripeSessionResponse {
  sessionId: string;
  paymentUrl: string;
}

// --- INTERFACE MỚI CHO CRYPTO ---
export interface CreateCryptoInvoiceData {
  orderId: number;
  cryptoCurrency: string; // "usdttrc20", "btc", "eth"...
}

export interface CreateCryptoInvoiceResponse {
  paymentId: number;
  payAddress: string;
  payAmount: number;
  cryptoCurrency: string;
  network: string;
  originalAmount: number;
  expiresAt: string; // ISO 8601 string
}

// --- Interfaces mới cho PayPal ---
export interface CreatePayPalOrderData {
  orderId: number; // ID đơn hàng nội bộ của chúng ta
}

export interface CreatePayPalOrderResponse {
  orderId: string; // ID đơn hàng từ PayPal trả về
}

export interface CapturePayPalOrderData {
  orderId: string; // ID đơn hàng của PayPal
  internalOrderId: number;
}

export interface CapturePayPalOrderResponse {
  message: string;
  orderId: number;
  paymentId: number;
}

export interface CreateMomoUrlData {
  orderId: number;
}

export interface CreateMomoUrlResponse {
  paymentUrl: string;
}

/** Tạo URL thanh toán VNPay */
export const createVnpayPaymentUrl = async (
  data: CreateVnpayUrlData
): Promise<CreateVnpayUrlResponse> => {
  return apiHelper.post('/payments/vnpay/create-url', data);
};

/** Tạo phiên thanh toán Stripe */
export const createStripeCheckoutSession = async (
  data: CreateStripeSessionData
): Promise<CreateStripeSessionResponse> => {
  return apiHelper.post('/payments/stripe/create-checkout-session', data);
};

/**
 * Yêu cầu backend tạo một hóa đơn thanh toán Crypto.
 * @param data - Chứa orderId và loại crypto người dùng chọn.
 * @returns Thông tin chi tiết để hiển thị cho người dùng thanh toán.
 */
export const createCryptoInvoice = async (
  data: CreateCryptoInvoiceData
): Promise<CreateCryptoInvoiceResponse> => {
  return apiHelper.post('/payments/crypto/create-invoice', data);
};

/** Backend: Tạo một đơn hàng trên PayPal */
export const createPayPalOrder = async (
  data: CreatePayPalOrderData
): Promise<CreatePayPalOrderResponse> => {
  return apiHelper.post('/payments/paypal/create-order', data);
};

/** Backend: Hoàn tất (capture) thanh toán PayPal */
export const capturePayPalOrder = async (
  data: CapturePayPalOrderData
): Promise<CapturePayPalOrderResponse> => {
  return apiHelper.post('/payments/paypal/capture-order', data);
};

export const createMomoPaymentUrl = async (
  data: CreateMomoUrlData
): Promise<CreateMomoUrlResponse> => {
  return apiHelper.post('/payments/momo/create-payment-url', data);
};

/** Hook tạo URL thanh toán MoMo */
export const useCreateMomoUrl = (
  options?: UseMutationOptions<CreateMomoUrlResponse, Error, CreateMomoUrlData>
) => {
  return useMutation<CreateMomoUrlResponse, Error, CreateMomoUrlData>({
    mutationFn: createMomoPaymentUrl,
    onSuccess: (data) => {
      console.log('MoMo URL created.');
      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl; // Tự động chuyển hướng
      }
    },
    onError: (error) => {
      console.error('Create MoMo URL failed:', error.message);
    },
    ...options,
  });
};
