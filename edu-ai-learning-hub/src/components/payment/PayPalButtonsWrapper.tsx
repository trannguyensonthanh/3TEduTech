/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/payment/PayPalButtonsWrapper.tsx
import React, { useState } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import {
  useCreatePayPalOrder,
  useCapturePayPalOrder,
} from '@/hooks/queries/payment.queries';
import { toast } from 'sonner';
import { Icons } from '../common/Icons';
import { useCreateOrderFromCart } from '@/hooks/queries/order.queries';

interface PayPalButtonsWrapperProps {
  validatedPromo: any;

  onPaymentSuccess: (details: any) => void;
  createdOrder: boolean;
  setCreatedOrder: React.Dispatch<React.SetStateAction<boolean>>;
}

const PayPalButtonsWrapper: React.FC<PayPalButtonsWrapperProps> = ({
  validatedPromo,
  onPaymentSuccess,
  createdOrder,
  setCreatedOrder,
}) => {
  const [{ isPending: isPayPalScriptLoading }] = usePayPalScriptReducer();
  // Sử dụng state thay vì ref cho internalOrderId
  const [internalOrderId, setInternalOrderId] = React.useState<number | null>(
    null
  );
  const { mutateAsync: createPayPalOrder, isPending: isCreatingOrderPayPal } =
    useCreatePayPalOrder();
  const { mutateAsync: capturePayPalOrder, isPending: isCapturingOrder } =
    useCapturePayPalOrder();
  const { mutateAsync: createOrderMutateAsync, isPending: isCreatingOrder } =
    useCreateOrderFromCart();
  // 1. Tạo đơn hàng trên server khi PayPal Buttons sẵn sàng render
  const createOrder = async () => {
    if (isCreatingOrder) return null;
    const promotionCodePayload = validatedPromo?.discountCode || null;
    try {
      const dataOrder = await createOrderMutateAsync(promotionCodePayload);
      if (!dataOrder || !dataOrder.orderId) {
        toast.error('Could not create internal order.');
        return null;
      }
      setInternalOrderId(dataOrder.orderId); // Lưu vào state
      const response = await createPayPalOrder({
        orderId: dataOrder.orderId,
      });
      if (!response || !response.orderId) {
        toast.error('Could not create PayPal order.');
        return null;
      }
      return response.orderId; // ✅ Đây mới là return có giá trị
    } catch (error) {
      toast.error((error as Error).message || 'Could not create order.');
      return null;
    }
  };

  const isProcessing =
    isPayPalScriptLoading || isCreatingOrderPayPal || isCapturingOrder;
  console.log('isProcessing:', isProcessing);
  // 2. Capture thanh toán trên server sau khi người dùng xác nhận
  const onApprove = async (data: any) => {
    try {
      if (!internalOrderId) {
        toast.error('Internal orderId is missing. Please try again.');
        return;
      }
      const response = await capturePayPalOrder({
        orderId: data.orderID, // PayPal Order ID từ SDK
        internalOrderId, // ID đơn hàng nội bộ
      });
      toast.success(response.message || 'Payment successful!');
      onPaymentSuccess(response); // Gọi callback để cha xử lý (ví dụ: redirect)
    } catch (error) {
      console.error('PayPal capture error:', error);
      toast.error((error as Error).message || 'Payment capture failed.');
      throw new Error('Failed to capture PayPal order.');
    }
  };

  const onError = (err: any) => {
    console.error('PayPal Checkout Error:', err);
    toast.error(
      'An error occurred with the PayPal transaction. Please try again.'
    );
  };

  const onCancel = (data) => {
    console.log('Payment cancelled by user:', data);

    setCreatedOrder(false);
    console.log('Setting isProcessingPayment to FALSE due to onCancel');
  };

  if (isPayPalScriptLoading) {
    return (
      <div className='flex items-center justify-center h-14 w-full bg-muted rounded-md'>
        <Icons.spinner className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  return (
    // style={{ layout: 'vertical' }} là để hiển thị nút PayPal và các nút thẻ riêng biệt
    <PayPalButtons
      style={{ layout: 'vertical', label: 'pay' }}
      createOrder={createOrder}
      onApprove={onApprove}
      onError={onError}
      onCancel={onCancel}
      disabled={isProcessing}
    />
  );
};

export default PayPalButtonsWrapper;
