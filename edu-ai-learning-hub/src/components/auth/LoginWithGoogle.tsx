import React, { useState } from 'react';
import {
  GoogleOAuthProvider,
  GoogleLogin,
  CredentialResponse,
} from '@react-oauth/google';
import { useGoogleLoginMutation } from '@/hooks/queries/auth.queries'; // Import hook
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const GOOGLE_CLIENT_ID =
  '842841125748-m1iqnlla8aifbfpfj3fpfandvh33n5vc.apps.googleusercontent.com'; // Lấy Client ID từ biến môi trường frontend

const LoginWithGoogle: React.FC = () => {
  const { t } = useTranslation();
  const googleLoginMutation = useGoogleLoginMutation({
    onSuccess: (data) => {
      console.log('Google login successful:', data);
      toast.success(t('loginWithGoogle.success'));
      window.location.href = '/'; // Chuyển hướng về trang chính sau khi đăng nhập thành công
    },
    onError: (error) => {
      console.error('Google login error:', error);
      toast.error(t('loginWithGoogle.error'));
    },
  });

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    console.log('Google Credential Response:', credentialResponse);
    if (credentialResponse.credential) {
      // credential chính là ID Token
      googleLoginMutation.mutate({ idToken: credentialResponse.credential });
    } else {
      console.error('Google login did not return credential (ID Token).');
      toast.error(t('loginWithGoogle.noCredential'));
    }
  };

  const handleGoogleError = () => {
    console.error('Google Login Failed');
    toast.error(t('loginWithGoogle.error'));
  };

  if (!GOOGLE_CLIENT_ID) {
    console.error(
      'Google Client ID is not configured in frontend environment variables.'
    );
    return <p>{t('loginWithGoogle.configError')}</p>;
  }

  return (
    <div className='flex flex-col items-center justify-center space-y-4'>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap // Tùy chọn: hiển thị popup one-tap
        />
        {googleLoginMutation.isPending && (
          <p>{t('loginWithGoogle.processing')}</p>
        )}
        {/* Có thể hiển thị lỗi từ mutation ở đây nếu cần */}
      </GoogleOAuthProvider>
    </div>
  );
};

export default LoginWithGoogle;
