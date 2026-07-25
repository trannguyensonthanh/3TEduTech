import React, { useState, useEffect } from 'react';
import {
  GoogleOAuthProvider,
  GoogleLogin,
  CredentialResponse,
} from '@react-oauth/google';
import { useGoogleLoginMutation } from '@/hooks/queries/auth.queries'; // Import hook
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import apiHelper from '@/services/apiHelper';

const LoginWithGoogle: React.FC = () => {
  const { t } = useTranslation();
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await apiHelper.get('/auth/google/client-id');
        if (response?.clientId) {
          setGoogleClientId(response.clientId);
        } else {
          console.error('No Google Client ID returned from server');
        }
      } catch (err) {
        console.error('Failed to fetch Google Client ID from backend:', err);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  const googleLoginMutation = useGoogleLoginMutation({
    onSuccess: (data) => {
      console.log('Google login successful:', data);
      toast.success(t('loginWithGoogle.success'));
      window.location.href = '/'; // Chuyển hướng về trang chính sau khi đăng nhập thành công
    },
    onError: (error: any) => {
      console.error('Google login error:', error);
      const errorMessage = error?.body?.message || error?.message || t('loginWithGoogle.error');
      toast.error(errorMessage);
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

  if (loadingConfig) {
    return <p>{t('loginWithGoogle.processing')}</p>;
  }

  if (!googleClientId) {
    console.error(
      'Google Client ID is not configured on the server.'
    );
    return <p>{t('loginWithGoogle.configError')}</p>;
  }

  return (
    <div className='flex flex-col items-center justify-center space-y-4'>
      <GoogleOAuthProvider clientId={googleClientId}>
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
