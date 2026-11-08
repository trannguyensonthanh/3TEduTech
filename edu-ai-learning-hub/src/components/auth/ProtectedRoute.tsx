// src/components/auth/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import TokenService from '@/services/token.service';

interface ProtectedRouteProps {
  allowedRoles?: string[]; // Mảng các vai trò được phép, ví dụ ['SA', 'ADMIN']
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const location = useLocation();

  /* [SỬA] Trước đây gọi thẳng JSON.parse(localStorage.getItem('user')) ngay
     trong thân render, không try/catch. Một giá trị hỏng hoặc bị cắt cụt sẽ ném
     lỗi từ giai đoạn render, mà cây component không có ErrorBoundary nào —
     kết quả là MÀN HÌNH TRẮNG ở mọi route được bảo vệ, kéo dài cho tới khi
     người dùng tự xóa dữ liệu trình duyệt.
     TokenService.getLocalUser() đã bọc try/catch sẵn và trả null khi hỏng.
     Vẫn đọc đồng bộ (không dùng AuthContext) vì AuthContext nạp bất đồng bộ,
     lượt render đầu sẽ là chưa đăng nhập và gây nháy chuyển hướng. */
  const user = TokenService.getLocalUser();
  const isAuthenticated = !!user;
  const userRole = user?.role;

  // 1. Kiểm tra nếu chưa đăng nhập
  if (!isAuthenticated) {
    return <Navigate to='/' state={{ from: location }} replace />;
  }

  // 2. Kiểm tra nếu route yêu cầu vai trò cụ thể
  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(userRole)
  ) {
    return <Navigate to='/unauthorized' replace />;
  }

  // 3. Nếu mọi thứ đều ổn (đã đăng nhập và có quyền) -> render component con
  return <Outlet />;
};

export default ProtectedRoute;
