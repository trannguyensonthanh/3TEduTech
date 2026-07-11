// src/components/auth/IntroHandler.tsx

import { Navigate } from 'react-router-dom';
import Index from '@/pages/Index'; // Import trang chủ của bạn

const IntroHandler = () => {
  // Lấy giá trị từ localStorage. `getItem` trả về string hoặc null.
  const hasSeenIntro = localStorage.getItem('hasSeenIntro') === 'true';

  // Dựa vào giá trị đã lấy, render trang chủ hoặc điều hướng đến trang intro.
  return hasSeenIntro ? <Index /> : <Navigate to='/intro' replace />;
};

export default IntroHandler;
