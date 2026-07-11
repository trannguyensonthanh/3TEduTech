// src/pages/PaymentStatusPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import Layout from '@/components/layout/Layout'; // Đường dẫn layout của bạn
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShoppingBag,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import { useMyOrderDetail } from '@/hooks/queries/order.queries';
// import { Icons } from '@/components/common/Icons'; // Bỏ nếu không dùng nữa

const CheckoutReturn: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Dùng useSearchParams để lấy query params

  // State để hiển thị thông tin
  const [status, setStatus] = useState<
    'loading' | 'success' | 'failed' | 'cancelled' | 'pending_confirmation'
  >('loading');
  const [displayMessage, setDisplayMessage] = useState<string>(
    'Processing your payment result...'
  );
  const [orderIdDisplay, setOrderIdDisplay] = useState<string | null>(null);
  const [errorCodeDisplay, setErrorCodeDisplay] = useState<string | null>(null);

  useEffect(() => {
    // Backend đã xử lý và redirect về đây với các query params
    // Ví dụ URL: /payment/result?vnp_ResponseCode=00&orderId=19&message=Giao%20dich%20thanh%20cong
    // Hoặc /payment/result?momo_ResultCode=0&orderId=20&message=Thanh%20cong

    // --- Lấy các tham số chuẩn hóa từ URL ---
    // VNPAY
    const vnpResponseCode = searchParams.get('vnp_ResponseCode');
    // MoMo (ví dụ)
    const momoResultCode =
      searchParams.get('resultCode') || searchParams.get('momo_ResultCode');
    // Tham số chung
    const commonOrderId =
      searchParams.get('orderId') ||
      searchParams.get('vnp_TxnRef') ||
      searchParams.get('partnerRefId');
    let commonMessage =
      searchParams.get('message') ||
      searchParams.get('vnp_OrderInfo') ||
      searchParams.get('momo_Message');

    setOrderIdDisplay(commonOrderId);

    if (commonMessage) {
      try {
        commonMessage = decodeURIComponent(commonMessage.replace(/\+/g, ' '));
      } catch (e) {
        console.warn('Could not decode message from URL query params');
      }
    }

    // --- Logic xác định trạng thái dựa trên tham số ---
    // Ưu tiên VNPAY nếu có
    if (vnpResponseCode) {
      setErrorCodeDisplay(vnpResponseCode);
      if (vnpResponseCode === '00') {
        setStatus('success');
        setDisplayMessage(
          commonMessage ||
            'Your VNPAY payment was successful and your order is confirmed!'
        );
      } else if (vnpResponseCode === '24') {
        setStatus('cancelled');
        setDisplayMessage(
          commonMessage || 'You cancelled the VNPAY payment process.'
        );
      } else {
        setStatus('failed');
        setDisplayMessage(
          commonMessage ||
            `VNPAY payment failed (Code: ${vnpResponseCode}). Please try again or contact support.`
        );
      }
    }
    // Xử lý MoMo (ví dụ)
    else if (momoResultCode) {
      setErrorCodeDisplay(momoResultCode);
      if (
        momoResultCode === '0' ||
        momoResultCode.toLowerCase() === 'success'
      ) {
        // MoMo thường trả về 0 cho thành công
        setStatus('success');
        setDisplayMessage(
          commonMessage ||
            'Your MoMo payment was successful and your order is confirmed!'
        );
      } else {
        setStatus('failed');
        setDisplayMessage(
          commonMessage ||
            `MoMo payment failed (Code: ${momoResultCode}). Please try again or contact support.`
        );
      }
    }
    // Thêm các cổng thanh toán khác nếu có
    // ...
    else {
      // Trường hợp không có mã response code cụ thể từ cổng thanh toán
      // có thể dựa vào một tham số 'status' chung mà backend đặt
      const generalStatus = searchParams.get('status');
      if (generalStatus === 'success') {
        setStatus('success');
        setDisplayMessage(commonMessage || 'Your payment was successful!');
      } else if (generalStatus === 'failed') {
        setStatus('failed');
        setDisplayMessage(commonMessage || 'Your payment failed.');
      } else if (generalStatus === 'cancelled') {
        setStatus('cancelled');
        setDisplayMessage(commonMessage || 'Your payment was cancelled.');
      } else if (generalStatus === 'pending') {
        setStatus('pending_confirmation');
        setDisplayMessage(
          commonMessage ||
            'Your payment is pending confirmation. We will notify you shortly.'
        );
      } else {
        // Nếu không có thông tin gì rõ ràng, mặc định là lỗi hoặc trạng thái không xác định
        console.warn(
          'Payment status parameters not found or unrecognized in URL.'
        );
        setStatus('failed'); // Hoặc một trạng thái "unknown"
        setDisplayMessage(
          'Could not determine payment status. Please check your order history or contact support.'
        );
      }
    }
  }, [searchParams]); // Chỉ chạy khi query params thay đổi

  const handleNavigateToOrder = () => {
    if (orderIdDisplay) {
      navigate(`/courses`);
    } else {
      navigate('/user/orders');
    }
  };

  const handleRetryOrBrowse = () => {
    // Nếu thất bại, có thể điều hướng về trang checkout hoặc trang khóa học
    if (status === 'failed' || status === 'cancelled') {
      navigate('/cart'); // Hoặc /checkout nếu muốn thử lại ngay
    } else {
      navigate('/courses');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading': // Trạng thái loading ban đầu
        return (
          <>
            <Loader2 className='h-16 w-16 animate-spin text-primary mx-auto' />
            <p className='mt-4 text-lg text-muted-foreground'>
              Loading payment status...
            </p>
          </>
        );
      case 'success':
        return (
          <>
            <div className='h-20 w-20 rounded-full bg-green-100 dark:bg-green-800/30 flex items-center justify-center mx-auto ring-4 ring-green-200 dark:ring-green-700/40 mb-5'>
              <CheckCircle className='h-10 w-10 text-green-500 dark:text-green-400' />
            </div>
            <h3 className='text-2xl font-semibold'>Payment Successful!</h3>
            <p className='mt-2 text-muted-foreground max-w-sm mx-auto'>
              {displayMessage}
            </p>
            {orderIdDisplay && (
              <p className='text-xs text-muted-foreground mt-1'>
                Order ID: #{orderIdDisplay}
              </p>
            )}
            <div className='mt-8 flex flex-col sm:flex-row gap-3 justify-center'>
              <Button onClick={handleNavigateToOrder} size='lg'>
                View My Learning
              </Button>
              <Button
                variant='outline'
                onClick={() => navigate('/courses')}
                size='lg'
              >
                Explore More Courses
              </Button>
            </div>
          </>
        );
      case 'failed':
      case 'cancelled':
        return (
          <>
            <div
              className={`h-20 w-20 rounded-full ${
                status === 'cancelled'
                  ? 'bg-amber-100 dark:bg-amber-800/30 ring-amber-200 dark:ring-amber-700/40'
                  : 'bg-red-100 dark:bg-red-800/30 ring-red-200 dark:ring-red-700/40'
              } flex items-center justify-center mx-auto ring-4 mb-5`}
            >
              {status === 'cancelled' ? (
                <AlertTriangle className='h-10 w-10 text-amber-500 dark:text-amber-400' />
              ) : (
                <XCircle className='h-10 w-10 text-red-500 dark:text-red-400' />
              )}
            </div>
            <h3 className='text-2xl font-semibold'>
              {status === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed'}
            </h3>
            <p className='mt-2 text-muted-foreground max-w-sm mx-auto'>
              {displayMessage}
            </p>
            {orderIdDisplay && (
              <p className='text-xs text-muted-foreground mt-1'>
                Order ID: #{orderIdDisplay}
              </p>
            )}
            {errorCodeDisplay && (
              <p className='text-xs text-muted-foreground mt-1'>
                Details: Code {errorCodeDisplay}
              </p>
            )}
            <div className='mt-8 flex flex-col sm:flex-row gap-3 justify-center'>
              <Button onClick={handleRetryOrBrowse} size='lg'>
                {status === 'cancelled'
                  ? 'Browse Courses'
                  : 'Try Another Payment'}
              </Button>
              <Button
                variant='outline'
                onClick={() => navigate('/support')}
                size='lg'
              >
                Contact Support
              </Button>
            </div>
          </>
        );
      case 'pending_confirmation':
        return (
          <>
            <Clock className='h-16 w-16 text-amber-500 mx-auto mb-5' />
            <h3 className='text-2xl font-semibold'>
              Payment Pending Confirmation
            </h3>
            <p className='mt-2 text-muted-foreground max-w-sm mx-auto'>
              {displayMessage}
            </p>
            {orderIdDisplay && (
              <p className='text-xs text-muted-foreground mt-1'>
                Order ID: #{orderIdDisplay}
              </p>
            )}
            <div className='mt-8 flex flex-col sm:flex-row gap-3 justify-center'>
              <Button onClick={handleNavigateToOrder} size='lg'>
                Check Order Status
              </Button>
              <Button
                variant='outline'
                onClick={() => navigate('/courses')}
                size='lg'
              >
                Browse Courses
              </Button>
            </div>
          </>
        );
      default: // Trường hợp không xác định hoặc lỗi URL
        return (
          <>
            <AlertTriangle className='h-16 w-16 text-destructive mx-auto mb-5' />
            <h3 className='text-2xl font-semibold'>Unknown Payment Status</h3>
            <p className='mt-2 text-muted-foreground max-w-sm mx-auto'>
              {displayMessage}
            </p>
            {orderIdDisplay && (
              <p className='text-xs text-muted-foreground mt-1'>
                Reference Order ID: #{orderIdDisplay}
              </p>
            )}
            <div className='mt-8'>
              <Button onClick={() => navigate('/')} size='lg'>
                Go to Homepage
              </Button>
            </div>
          </>
        );
    }
  };

  return (
    <Layout>
      <div className='container mx-auto py-12 sm:py-16 md:py-20 px-4'>
        <div className='max-w-md mx-auto'>
          <Card className='shadow-xl border-t-4 border-primary animate-fadeIn'>
            {' '}
            {/* Thêm animation */}
            <CardHeader className='pb-4'>
              <CardTitle className='text-center text-2xl sm:text-3xl font-bold tracking-tight'>
                {status === 'loading' && 'Processing...'}
                {status === 'success' && 'Payment Confirmed'}
                {status === 'failed' && 'Payment Failed'}
                {status === 'cancelled' && 'Payment Cancelled'}
                {status === 'pending_confirmation' && 'Payment Pending'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-col items-center text-center py-6 sm:py-8'>
                {renderContent()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutReturn;
