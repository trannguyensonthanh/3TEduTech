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
    'Đang xử lý kết quả thanh toán…'
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
            'Thanh toán VNPAY thành công, đơn hàng của bạn đã được xác nhận.'
        );
      } else if (vnpResponseCode === '24') {
        setStatus('cancelled');
        setDisplayMessage(
          commonMessage || 'Bạn đã hủy giao dịch VNPAY.'
        );
      } else {
        setStatus('failed');
        setDisplayMessage(
          commonMessage ||
            `Thanh toán VNPAY không thành công (mã ${vnpResponseCode}). Bạn thử lại hoặc liên hệ hỗ trợ nhé.`
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
            'Thanh toán MoMo thành công, đơn hàng của bạn đã được xác nhận.'
        );
      } else {
        setStatus('failed');
        setDisplayMessage(
          commonMessage ||
            `Thanh toán MoMo không thành công (mã ${momoResultCode}). Bạn thử lại hoặc liên hệ hỗ trợ nhé.`
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
        setDisplayMessage(commonMessage || 'Thanh toán thành công.');
      } else if (generalStatus === 'failed') {
        setStatus('failed');
        setDisplayMessage(commonMessage || 'Thanh toán không thành công.');
      } else if (generalStatus === 'cancelled') {
        setStatus('cancelled');
        setDisplayMessage(commonMessage || 'Giao dịch đã bị hủy.');
      } else if (generalStatus === 'pending') {
        setStatus('pending_confirmation');
        setDisplayMessage(
          commonMessage ||
            'Giao dịch đang chờ xác nhận. Chúng tôi sẽ báo bạn ngay khi có kết quả.'
        );
      } else {
        // Nếu không có thông tin gì rõ ràng, mặc định là lỗi hoặc trạng thái không xác định
        console.warn(
          'Payment status parameters not found or unrecognized in URL.'
        );
        setStatus('failed'); // Hoặc một trạng thái "unknown"
        setDisplayMessage(
          'Không xác định được trạng thái thanh toán. Bạn xem lại lịch sử đơn hàng hoặc liên hệ hỗ trợ nhé.'
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
              Đang tải trạng thái thanh toán…
            </p>
          </>
        );
      case 'success':
        return (
          <>
            <div className='h-20 w-20 rounded-full bg-success-soft flex items-center justify-center mx-auto mb-5'>
              <CheckCircle className='h-10 w-10 text-success' aria-hidden='true' />
            </div>
            <h3 className='text-2xl font-semibold'>Thanh toán thành công</h3>
            <p className='mt-2 text-muted-foreground max-w-sm mx-auto'>
              {displayMessage}
            </p>
            {orderIdDisplay && (
              <p className='text-xs text-muted-foreground mt-1'>
                Mã đơn hàng: #{orderIdDisplay}
              </p>
            )}
            <div className='mt-8 flex flex-col sm:flex-row gap-3 justify-center'>
              <Button onClick={handleNavigateToOrder} size='lg'>
                Vào khu học tập
              </Button>
              <Button
                variant='outline'
                onClick={() => navigate('/courses')}
                size='lg'
              >
                Khám phá thêm khóa học
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
                status === 'cancelled' ? 'bg-warning-soft' : 'bg-danger-soft'
              } flex items-center justify-center mx-auto mb-5`}
            >
              {status === 'cancelled' ? (
                <AlertTriangle className='h-10 w-10 text-warning' aria-hidden='true' />
              ) : (
                <XCircle className='h-10 w-10 text-danger' aria-hidden='true' />
              )}
            </div>
            <h3 className='text-2xl font-semibold'>
              {status === 'cancelled'
                ? 'Đã hủy thanh toán'
                : 'Thanh toán không thành công'}
            </h3>
            <p className='mt-2 text-muted-foreground max-w-sm mx-auto'>
              {displayMessage}
            </p>
            {orderIdDisplay && (
              <p className='text-xs text-muted-foreground mt-1'>
                Mã đơn hàng: #{orderIdDisplay}
              </p>
            )}
            {errorCodeDisplay && (
              <p className='text-xs text-muted-foreground mt-1'>
                Chi tiết: mã {errorCodeDisplay}
              </p>
            )}
            <div className='mt-8 flex flex-col sm:flex-row gap-3 justify-center'>
              <Button onClick={handleRetryOrBrowse} size='lg'>
                {status === 'cancelled'
                  ? 'Xem các khóa học'
                  : 'Thử phương thức khác'}
              </Button>
              <Button
                variant='outline'
                onClick={() => navigate('/support')}
                size='lg'
              >
                Liên hệ hỗ trợ
              </Button>
            </div>
          </>
        );
      case 'pending_confirmation':
        return (
          <>
            <Clock className='h-16 w-16 text-warning mx-auto mb-5' aria-hidden='true' />
            <h3 className='text-2xl font-semibold'>
              Giao dịch đang chờ xác nhận
            </h3>
            <p className='mt-2 text-muted-foreground max-w-sm mx-auto'>
              {displayMessage}
            </p>
            {orderIdDisplay && (
              <p className='text-xs text-muted-foreground mt-1'>
                Mã đơn hàng: #{orderIdDisplay}
              </p>
            )}
            <div className='mt-8 flex flex-col sm:flex-row gap-3 justify-center'>
              <Button onClick={handleNavigateToOrder} size='lg'>
                Xem trạng thái đơn hàng
              </Button>
              <Button
                variant='outline'
                onClick={() => navigate('/courses')}
                size='lg'
              >
                Xem các khóa học
              </Button>
            </div>
          </>
        );
      default: // Trường hợp không xác định hoặc lỗi URL
        return (
          <>
            <AlertTriangle className='h-16 w-16 text-destructive mx-auto mb-5' />
            <h3 className='text-2xl font-semibold'>Trạng thái thanh toán chưa rõ</h3>
            <p className='mt-2 text-muted-foreground max-w-sm mx-auto'>
              {displayMessage}
            </p>
            {orderIdDisplay && (
              <p className='text-xs text-muted-foreground mt-1'>
                Mã đơn tham chiếu: #{orderIdDisplay}
              </p>
            )}
            <div className='mt-8'>
              <Button onClick={() => navigate('/')} size='lg'>
                Về trang chủ
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
          <Card className='rounded-xl border border-border bg-card shadow-none animate-fadeIn'>
            {' '}
            {/* Thêm animation */}
            <CardHeader className='pb-4'>
              <CardTitle className='text-center text-2xl sm:text-3xl font-bold tracking-tight'>
                {status === 'loading' && 'Đang xử lý…'}
                {status === 'success' && 'Đã xác nhận thanh toán'}
                {status === 'failed' && 'Thanh toán không thành công'}
                {status === 'cancelled' && 'Đã hủy thanh toán'}
                {status === 'pending_confirmation' && 'Đang chờ thanh toán'}
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
