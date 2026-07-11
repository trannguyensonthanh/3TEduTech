// src/pages/CryptoPaymentPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { CryptoPaymentDialog } from '@/components/checkout/CryptoPaymentDialog';
import { CreateCryptoInvoiceResponse } from '@/services/payment.service';
import { Icons } from '@/components/common/Icons';

const SESSION_STORAGE_KEY = 'cryptoPaymentInfo';

const CryptoPaymentPage = () => {
  const navigate = useNavigate();
  const [paymentInfo, setPaymentInfo] =
    useState<CreateCryptoInvoiceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Đọc thông tin từ sessionStorage khi trang được tải
    const storedInfo = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (storedInfo) {
      try {
        const parsedInfo: CreateCryptoInvoiceResponse = JSON.parse(storedInfo);

        // Kiểm tra xem thông tin có hết hạn không
        if (new Date(parsedInfo.expiresAt) > new Date()) {
          setPaymentInfo(parsedInfo);
        } else {
          console.warn('Crypto payment session has expired.');
          navigate('/cart', { replace: true });
        }

        // Xóa khỏi sessionStorage sau khi đã đọc để tránh dùng lại
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } catch (error) {
        console.error(
          'Failed to parse payment info from session storage',
          error
        );
        navigate('/cart', { replace: true });
      }
    } else {
      // Nếu không có thông tin, chuyển hướng về giỏ hàng
      console.warn('No crypto payment info found in session storage.');
      navigate('/cart', { replace: true });
    }
    setIsLoading(false);
  }, [navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className='container mx-auto flex items-center justify-center h-[60vh]'>
          <Icons.loader2 className='h-10 w-10 animate-spin text-primary' />
        </div>
      </Layout>
    );
  }

  // CryptoPaymentDialog sẽ luôn mở khi ở trang này
  return (
    <Layout>
      <CryptoPaymentDialog
        isOpen={true}
        // Khi đóng dialog, chuyển hướng người dùng
        onClose={() => navigate('/orders')}
        paymentInfo={paymentInfo}
      />
    </Layout>
  );
};

export default CryptoPaymentPage;
