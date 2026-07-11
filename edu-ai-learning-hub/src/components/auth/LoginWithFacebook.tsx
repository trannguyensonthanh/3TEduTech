/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { LoginSocialFacebook, IResolveParams } from 'reactjs-social-login'; // Import từ thư viện mới
// Thay thế: import FacebookLogin, { ReactFacebookLoginInfo, ReactFacebookFailureResponse } from 'react-facebook-login';
import { FacebookLoginButton } from 'react-social-login-buttons'; // Thư viện nút bấm phổ biến (tùy chọn)
import { useFacebookLoginMutation } from '@/hooks/queries/auth.queries';
import EmailCollectionModal from './EmailCollectionModal';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const FACEBOOK_APP_ID = '1337377354382081';

const LoginWithFacebook: React.FC = () => {
  const { t } = useTranslation();
  const facebookLoginMutation = useFacebookLoginMutation({
    onSuccess: (data) => {
      console.log('Facebook login successful:', data);
      toast.success(t('loginWithFacebook.success'));
      window.location.href = '/'; // Chuyển hướng về trang chính sau khi đăng nhập thành công
    },
    onError: (error) => {
      console.error('Facebook login error:', error);
      toast.error(t('loginWithFacebook.error'));
    },
  });

  // New state for email collection modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [fbAccessToken, setFbAccessToken] = useState<string | null>(null);

  const handleResolve = ({ provider, data }: IResolveParams) => {
    if (provider === 'facebook' && data?.accessToken) {
      if (data.email) {
        // Có email -> Đăng nhập/Đăng ký bình thường
        facebookLoginMutation.mutate({ accessToken: data.accessToken });
      } else {
        // Không có email -> Mở modal yêu cầu nhập
        setFbAccessToken(data.accessToken);
        setShowCompleteModal(true);
      }
    } else {
      console.error(
        'Facebook login success but missing access token or wrong provider:',
        provider,
        data
      );
      toast.error(t('loginWithFacebook.error'));
    }
  };

  const handleReject = (error: any) => {
    console.error('Facebook Login Failed:', error);
    toast.error(t('loginWithFacebook.cancelled'));
  };

  if (!FACEBOOK_APP_ID) {
    console.error('Facebook App ID is not configured.');
    return <p>{t('loginWithFacebook.configError')}</p>;
  }
  const handleCompleteSuccess = () => {
    // Hiển thị thông báo yêu cầu check mail (không chuyển hướng login ngay)
    toast.info(t('loginWithFacebook.checkEmail'));
  };
  return (
    <div>
      <LoginSocialFacebook
        appId={FACEBOOK_APP_ID}
        onResolve={handleResolve}
        onReject={handleReject}
        // Các trường yêu cầu thêm (scope) nếu cần
        fields='name,email,picture' // Giống như trước
      >
        <FacebookLoginButton
          style={{
            width: '100%',
            fontSize: '14px',
            borderRadius: '4px',
            height: '42px',
          }}
        >
          {t('loginWithFacebook.button')}
        </FacebookLoginButton>
        {/* Hoặc nút tùy chỉnh của bạn: */}
        {/* <button>Đăng nhập bằng Facebook (Custom)</button> */}
      </LoginSocialFacebook>
      <EmailCollectionModal
        open={showCompleteModal && !!fbAccessToken}
        onClose={() => setShowCompleteModal(false)}
        facebookAccessToken={fbAccessToken}
        onSuccess={handleCompleteSuccess}
      />
      {/* {facebookLoginMutation.isError && <p style={{ color: 'red' }}>{facebookLoginMutation.error?.message}</p>} */}
    </div>
  );
};

export default LoginWithFacebook;
