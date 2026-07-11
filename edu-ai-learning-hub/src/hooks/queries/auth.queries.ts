// src/hooks/queries/auth.queries.ts
import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import {
  loginUser,
  registerUser,
  logoutUser,
  verifyUserEmail,
  requestPasswordResetApi,
  resetPasswordApi,
  refreshTokenApi,
  LoginResponse,
  RegisterResponse,
  LoginCredentials,
  RegisterData,
  registerInstructor,
  RegisterInstructorData,
  RegisterInstructorResponse,
  loginWithGoogle,
  loginWithFacebook,
  GoogleLoginData,
  FacebookLoginData,
  completeFacebookRegistration,
  CompleteFacebookRegistrationData,
  CompleteFacebookRegistrationResponse,
  ChangePasswordData,
  changePassword,
} from '@/services/auth.service'; // Điều chỉnh đường dẫn nếu cần
import TokenService from '@/services/token.service';
import { toast } from 'sonner';
// import { useRouter } from 'next/router'; // Hoặc react-router-dom
// import { toast } from 'react-toastify'; // Hoặc thư viện toast khác
const authKeys = {
  userProfile: ['userProfile'] as const, // Key cho thông tin user
};
// --- Mutations ---

/** Hook để đăng nhập */
export const useLoginMutation = (
  options?: UseMutationOptions<LoginResponse, Error, LoginCredentials>
) => {
  const queryClient = useQueryClient();
  // const router = useRouter();

  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // Service đã lưu token vào localStorage
      queryClient.invalidateQueries({ queryKey: ['userProfile'] }); // Invalidate profile để fetch lại
      console.log('Login successful');
      // Chuyển hướng có thể xử lý ở component gọi hook
      // router.push('/dashboard');
      // toast.success('Đăng nhập thành công!');
    },
    onError: (error) => {
      console.error('Login failed:', error.message);
      // toast.error(error.message || 'Đăng nhập thất bại');
    },
    ...options,
  });
};

/** Hook để đăng ký */
export const useRegisterMutation = (
  options?: UseMutationOptions<RegisterResponse, Error, RegisterData>
) => {
  return useMutation<RegisterResponse, Error, RegisterData>({
    mutationFn: registerUser,
    onSuccess: (data) => {
      console.log('Registration successful:', data.message);
      // toast.info(data.message); // Thông báo kiểm tra email
    },
    onError: (error) => {
      console.error('Registration failed:', error.message);
      // toast.error(error.message || 'Đăng ký thất bại.');
    },
    ...options,
  });
};

/** Hook để đăng xuất */
export const useLogoutMutation = (
  options?: UseMutationOptions<{ message: string }, Error, void>
) => {
  const queryClient = useQueryClient();
  // const router = useRouter();

  return useMutation<{ message: string }, Error, void>({
    mutationFn: logoutUser, // Service đã bao gồm việc xóa token local
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['userProfile'], exact: true });
      // Có thể clear toàn bộ cache nếu muốn user phải fetch lại mọi thứ
      // queryClient.clear();
      console.log('Logout successful.');
      // Chuyển hướng xử lý ở component
      // router.push('/login');
      toast.success('Đăng xuất thành công.');
      window.location.href = '/'; // Hoặc router.push('/login');
    },
    onError: (error) => {
      console.error('Logout failed:', error.message);
      // Dù API lỗi, vẫn nên thử xóa local storage và chuyển hướng
      TokenService.removeUser();
      queryClient.removeQueries({ queryKey: ['userProfile'], exact: true });
      window.location.href = '/'; // Hoặc router.push('/login');
      toast.error('Có lỗi xảy ra khi đăng xuất.');
    },
    ...options,
  });
};

/** Hook để refresh token (ít khi gọi trực tiếp từ component, apiHelper tự xử lý) */
export const useRefreshTokenMutation = (
  options?: UseMutationOptions<{ accessToken: string }, Error, void>
) => {
  return useMutation<{ accessToken: string }, Error, void>({
    mutationFn: refreshTokenApi, // Service đã cập nhật local token
    onSuccess: () => {
      console.log('Token refreshed via manual mutation.');
      // Không cần invalidate gì đặc biệt ở đây vì các request sau sẽ dùng token mới
    },
    onError: (error) => {
      console.error('Manual token refresh failed:', error.message);
      // Có thể logout user nếu refresh thất bại
      // logoutMutate(); // Gọi mutation logout
    },
    ...options,
  });
};

/** Hook để xác thực email */
export const useVerifyEmailMutation = (
  options?: UseMutationOptions<{ message: string }, Error, string>
) => {
  return useMutation<{ message: string }, Error, string>({
    // Input là token (string)
    mutationFn: (token: string) => verifyUserEmail(token),
    onSuccess: (data) => {
      console.log('Email verification successful:', data.message);
      // toast.success(data.message);
    },
    onError: (error) => {
      console.error('Email verification failed:', error.message);
      // toast.error(error.message || 'Xác thực email thất bại.');
    },
    ...options,
  });
};

/** Hook để yêu cầu reset password */
export const useRequestPasswordResetMutation = (
  options?: UseMutationOptions<{ message: string }, Error, string>
) => {
  return useMutation<{ message: string }, Error, string>({
    // Input là email (string)
    mutationFn: (email: string) => requestPasswordResetApi(email),
    onSuccess: (data) => {
      console.log('Password reset request successful:', data.message);
      // toast.info(data.message);
    },
    onError: (error) => {
      console.error('Password reset request failed:', error.message);
      // toast.error(error.message || 'Yêu cầu đặt lại mật khẩu thất bại.');
    },
    ...options,
  });
};

/** Hook để thực hiện reset password */
export const useResetPasswordMutation = (
  options?: UseMutationOptions<
    { message: string },
    Error,
    { token: string; newPassword: string }
  >
) => {
  return useMutation<
    { message: string },
    Error,
    { token: string; newPassword: string }
  >({
    mutationFn: ({ token, newPassword }) =>
      resetPasswordApi(token, newPassword),
    onSuccess: (data) => {
      console.log('Password reset successful:', data.message);
      // toast.success(data.message);
      // Có thể chuyển hướng về trang login
    },
    onError: (error) => {
      console.error('Password reset failed:', error.message);
      // toast.error(error.message || 'Đặt lại mật khẩu thất bại.');
    },
    ...options,
  });
};

/** Hook để đăng ký Giảng viên */
export const useRegisterInstructorMutation = (
  options?: UseMutationOptions<
    RegisterInstructorResponse,
    Error,
    RegisterInstructorData
  >
) => {
  return useMutation<RegisterInstructorResponse, Error, RegisterInstructorData>(
    {
      mutationFn: registerInstructor,
      onSuccess: (data) => {
        console.log('Instructor registration successful:', data.message);
        // Hiển thị thông báo yêu cầu kiểm tra email
        // toast.info(data.message);
        // Có thể chuyển hướng đến trang thông báo chờ xác thực
      },
      onError: (error) => {
        console.error('Instructor registration failed:', error.message);
        // toast.error(error.message || 'Đăng ký giảng viên thất bại.');
      },
      ...options,
    }
  );
};

// --- Hooks mới cho Social Login ---

/** Hook để đăng nhập bằng Google */
export const useGoogleLoginMutation = (
  options?: UseMutationOptions<LoginResponse, Error, GoogleLoginData>
) => {
  const queryClient = useQueryClient();
  // const router = useRouter();

  return useMutation<LoginResponse, Error, GoogleLoginData>({
    mutationFn: loginWithGoogle,
    onSuccess: (data) => {
      // Service đã lưu token/user vào localStorage
      queryClient.invalidateQueries({ queryKey: authKeys.userProfile }); // Invalidate profile
      console.log('Google Login successful');
      // Chuyển hướng ở component
      // router.push('/dashboard');
      // toast.success('Đăng nhập bằng Google thành công!');
    },
    onError: (error) => {
      console.error('Google Login failed:', error.message);
      TokenService.removeUser(); // Đảm bảo xóa thông tin nếu login lỗi
      // toast.error(error.message || 'Đăng nhập bằng Google thất bại.');
    },
    ...options,
  });
};

/** Hook để đăng nhập bằng Facebook */
export const useFacebookLoginMutation = (
  options?: UseMutationOptions<LoginResponse, Error, FacebookLoginData>
) => {
  const queryClient = useQueryClient();
  // const router = useRouter();

  return useMutation<LoginResponse, Error, FacebookLoginData>({
    mutationFn: loginWithFacebook,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: authKeys.userProfile });
      console.log('Facebook Login successful');
      // router.push('/dashboard');
      // toast.success('Đăng nhập bằng Facebook thành công!');
    },
    onError: (error) => {
      console.error('Facebook Login failed:', error.message);
      TokenService.removeUser();
      // toast.error(error.message || 'Đăng nhập bằng Facebook thất bại.');
    },
    ...options,
  });
};

/** Hook để hoàn tất đăng ký Facebook khi thiếu email */
export const useCompleteFacebookRegistrationMutation = (
  options?: UseMutationOptions<
    CompleteFacebookRegistrationResponse,
    Error,
    CompleteFacebookRegistrationData
  >
) => {
  return useMutation<
    CompleteFacebookRegistrationResponse,
    Error,
    CompleteFacebookRegistrationData
  >({
    mutationFn: completeFacebookRegistration,
    onSuccess: (data) => {
      console.log('Facebook registration completion successful:', data.message);
      // Hiển thị thông báo yêu cầu kiểm tra email
      // toast.info(data.message);
      // Không cần làm gì với token hay user state ở đây vì user cần verify email
      // Có thể đóng modal nhập email lại
    },
    onError: (error) => {
      console.error('Facebook registration completion failed:', error.message);
      // Hiển thị lỗi cho người dùng trên form/modal nhập email
      // toast.error(error.message || 'Hoàn tất đăng ký thất bại.');
    },
    ...options,
  });
};

/** Hook để thay đổi mật khẩu */
export const useChangePasswordMutation = (
  options?: UseMutationOptions<{ message: string }, Error, ChangePasswordData>
) => {
  return useMutation<{ message: string }, Error, ChangePasswordData>({
    mutationFn: (data: ChangePasswordData) => changePassword(data),
    onSuccess: (data) => {
      console.log('Password change successful:', data.message);
      toast.success(data.message || 'Đổi mật khẩu thành công!');
      // Không cần invalidate userProfile vì mật khẩu thay đổi không ảnh hưởng trực tiếp đến profile data
      // Có thể cân nhắc logout user ở các thiết bị khác nếu backend hỗ trợ
    },
    onError: (error) => {
      console.error('Password change failed:', error.message);
      toast.error(error.message || 'Đổi mật khẩu thất bại.');
    },
    ...options,
  });
};
