// src/components/auth/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext'; // Giả sử bạn đã tạo AuthContext

interface ProtectedRouteProps {
  allowedRoles?: string[]; // Mảng các vai trò được phép, ví dụ ['SA', 'ADMIN']
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const location = useLocation();

  // Lấy user từ localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
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
