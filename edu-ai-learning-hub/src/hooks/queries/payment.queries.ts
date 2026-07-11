// src/hooks/queries/payment.queries.ts
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import {
  capturePayPalOrder,
  CapturePayPalOrderData,
  CapturePayPalOrderResponse,
  createCryptoInvoice,
  CreateCryptoInvoiceData,
  CreateCryptoInvoiceResponse,
  createPayPalOrder,
  CreatePayPalOrderData,
  CreatePayPalOrderResponse,
  createStripeCheckoutSession,
  CreateStripeSessionData,
  CreateStripeSessionResponse,
  createVnpayPaymentUrl,
  CreateVnpayUrlData,
  CreateVnpayUrlResponse,
} from '@/services/payment.service';

/** Hook tạo URL thanh toán VNPay */
export const useCreateVnpayUrl = (
  options?: UseMutationOptions<
    CreateVnpayUrlResponse,
    Error,
    CreateVnpayUrlData
  >
) => {
  return useMutation<CreateVnpayUrlResponse, Error, CreateVnpayUrlData>({
    mutationFn: createVnpayPaymentUrl,
    onSuccess: (data) => {
      console.log('VNPay URL created.');

      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    },
    onError: (error) => {
      console.error('Create VNPay URL failed:', error.message);
    },
    ...options,
  });
};

/** Hook tạo phiên thanh toán Stripe */
export const useCreateStripeSession = (
  options?: UseMutationOptions<
    CreateStripeSessionResponse,
    Error,
    CreateStripeSessionData
  >
) => {
  return useMutation<
    CreateStripeSessionResponse,
    Error,
    CreateStripeSessionData
  >({
    mutationFn: createStripeCheckoutSession,
    onSuccess: (data) => {
      console.log('Stripe session created. Redirecting...');
      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    },
    onError: (error) => {
      console.error('Create Stripe session failed:', error.message);
    },
    ...options,
  });
};

/**
 * Hook mutation để tạo hóa đơn thanh toán Crypto.
 * Không tự động chuyển hướng, mà trả về dữ liệu để component hiển thị.
 */
export const useCreateCryptoInvoice = (
  options?: UseMutationOptions<
    CreateCryptoInvoiceResponse,
    Error,
    CreateCryptoInvoiceData
  >
) => {
  return useMutation<
    CreateCryptoInvoiceResponse,
    Error,
    CreateCryptoInvoiceData
  >({
    mutationFn: createCryptoInvoice,
    onSuccess: (data, variables, context) => {
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
      console.log('Crypto invoice created successfully:', data);
    },
    onError: (error, variables, context) => {
      if (options?.onError) {
        options.onError(error, variables, context);
      }
      console.error('Failed to create crypto invoice:', error.message);
    },
    ...options,
  });
};

/** Hook để gọi API tạo đơn hàng PayPal */
export const useCreatePayPalOrder = (
  options?: UseMutationOptions<
    CreatePayPalOrderResponse,
    Error,
    CreatePayPalOrderData
  >
) => {
  return useMutation<CreatePayPalOrderResponse, Error, CreatePayPalOrderData>({
    mutationFn: createPayPalOrder,
    ...options,
  });
};

/** Hook để gọi API capture thanh toán PayPal */
export const useCapturePayPalOrder = (
  options?: UseMutationOptions<
    CapturePayPalOrderResponse,
    Error,
    CapturePayPalOrderData
  >
) => {
  return useMutation<CapturePayPalOrderResponse, Error, CapturePayPalOrderData>(
    {
      mutationFn: capturePayPalOrder,
      ...options,
    }
  );
};
