// src/router.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import các component bảo vệ và tiện ích (giữ nguyên tĩnh để không bị chớp màn hình)
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ScrollToTopHandler from '@/utils/ScrollToTopHandler';
import IntroHandler from '@/components/auth/IntroHandler'; // Component xử lý logic intro

// --- Import Pages (Tối ưu hóa Code Splitting / Lazy Loading) ---

// Public Pages
import Index from './pages/Index';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Categories from './pages/Categories';
import CategoryDetail from './pages/CategoryDetailPage';
import Instructors from './pages/AllInstructorsPage';
import InstructorDetail from './pages/InstructorProfilePage';
import About from './pages/AboutPage';
import Privacy from '@/pages/Privacy';
import TermsInstructor from '@/pages/TermsInstructor';

// Auth Pages
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ActivateAccount from './pages/auth/ActivateAccount';
import SocialLoginCallback from './pages/auth/SocialLoginCallback';

// Authenticated User Pages
import MyCourses from './pages/MyCourses';
import UserProfile from './pages/UserProfilePage';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CheckoutReturn from './pages/CheckoutReturn';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCanceled from './pages/PaymentCanceled';
import OrderHistory from '@/pages/OrderHistory';
import Certificates from '@/pages/Certificates';
// [THÊM 17/08/2026 — LEVEL 2] Trang xác minh chứng chỉ CÔNG KHAI (không cần đăng nhập).
import VerifyCertificate from '@/pages/VerifyCertificate';
import Notifications from '@/pages/user/Notifications';
import CourseLearningPage from '@/pages/CourseLearningPage';
import LearningReportPage from '@/pages/LearningReportPage';

// Instructor Pages
import InstructorRegister from './pages/instructor/InstructorRegister';
import InstructorRegisterSuccess from './pages/instructor/InstructorRegisterSuccess';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import InstructorCourses from './pages/instructor/InstructorCourses';
import CourseCreation from './pages/instructor/CourseCreation';
import CourseEdit from '@/pages/instructor/CourseEdit';
// [THÊM 18/08/2026 — COURSE IMPORT] Nhập khóa học từ tệp ZIP.
import CourseImport from '@/pages/instructor/CourseImport';
import InstructorStudents from './pages/instructor/InstructorStudents';
import InstructorEarnings from './pages/instructor/InstructorEarnings';
import InstructorProfile from './pages/instructor/InstructorProfile';
import InstructorCourseApprovals from './pages/instructor/InstructorCourseApprovals';
import InstructorAnalytics from '@/pages/instructor/InstructorAnalytics';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersManagement from './pages/admin/UsersManagement';
import CoursesManagement from './pages/admin/CoursesManagement';
import CourseApprovals from './pages/admin/CourseApprovals';
import CategoriesManagement from './pages/admin/CategoriesManagement';
import PromotionsManagement from './pages/admin/PromotionsManagement';
import SkillsManagement from '@/pages/admin/SkillsManagement';
import LevelsManagement from './pages/admin/LevelsManagement';
import CurrenciesManagement from './pages/admin/CurrenciesManagement';
import PaymentMethodsManagement from './pages/admin/PaymentMethodsManagement';
import ExchangeRatesManagement from './pages/admin/ExchangeRatesManagement';
import FaqsManagement from './pages/admin/FaqsManagement';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminReports from '@/pages/admin/AdminReports';
import PayoutManagement from './pages/admin/PayoutManagement';

// Utility Pages
// === INTRO VERSION SWITCH ===
// Uncomment dòng dưới để dùng Intro cũ (Cây Tri Thức):
import IntroPage from '@/pages/IntroPage';
// Intro mới (Cuốn Sách Tri Thức):
// import IntroPage from '@/pages/IntroPageV2';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized'; 
import CryptoPaymentPage from '@/pages/CryptoPaymentPage';
import AiMasterChat from '@/pages/AiMasterChat';


const AppRouter = () => {
  return (
    <BrowserRouter>
      <ScrollToTopHandler />
      <>
        <Routes>
        {/* //======= 1. Public Routes (Ai cũng có thể truy cập) =======// */}
        <Route path='/' element={<IntroHandler />} />
        <Route path='/intro' element={<IntroPage />} />
        <Route path='/courses' element={<Courses />} />
        <Route path='/courses/:slug' element={<CourseDetail />} />
        <Route path='/categories' element={<Categories />} />
        <Route path='/categories/:slug' element={<CategoryDetail />} />
        <Route path='/instructors' element={<Instructors />} />
        <Route path='/instructors/:idOrSlug' element={<InstructorDetail />} />
        <Route path='/about' element={<About />} />
        <Route path='/privacy' element={<Privacy />} />
        <Route path='/terms-instructor' element={<TermsInstructor />} />
        {/* [THÊM 17/08/2026 — LEVEL 2] Đích đến của mã QR in trên chứng chỉ.
            CỐ Ý đặt ở nhóm Public: nhà tuyển dụng quét mã sẽ không có tài khoản,
            bắt đăng nhập ở đây là phá hỏng đúng mục đích của tính năng.
            Khai báo cả hai dạng: có mã trên URL (quét QR) và không mã (tự nhập). */}
        <Route path='/verify-certificate' element={<VerifyCertificate />} />
        <Route path='/verify-certificate/:code' element={<VerifyCertificate />} />
        <Route path='/ai-master' element={<AiMasterChat />} />
        <Route path='/ai-chat' element={<AiMasterChat />} />

        {/* Auth-related public routes */}
        <Route path='/instructor/register' element={<InstructorRegister />} />
        <Route
          path='/instructor/register/success'
          element={<InstructorRegisterSuccess />}
        />
        <Route path='/verify-email' element={<ActivateAccount />} />
        <Route path='/auth/forgot-password' element={<ForgotPassword />} />
        <Route path='/auth/reset-password/:token' element={<ResetPassword />} />
        <Route path='/auth/social-success' element={<SocialLoginCallback />} />

        {/* Payment callback routes (public) */}
        <Route path='/payment/result' element={<CheckoutReturn />} />
        <Route path='/payment-success' element={<PaymentSuccess />} />
        <Route path='/payment-canceled' element={<PaymentCanceled />} />

        {/* //======= 2. Authenticated User Routes (Cần đăng nhập, mọi vai trò) =======// */}
        <Route element={<ProtectedRoute />}>
          <Route path='/my-courses' element={<MyCourses />} />
          <Route path='/profile' element={<UserProfile />} />
          <Route path='/user/notifications' element={<Notifications />} />
          <Route path='/orders' element={<OrderHistory />} />
          <Route path='/certificates' element={<Certificates />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/checkout' element={<Checkout />} />
          <Route path='/payment/crypto' element={<CryptoPaymentPage />} />
          <Route path='/learn/:courseSlug' element={<CourseLearningPage />} />
          <Route
            path='/learn/:courseSlug/sections/:sectionId/lessons/:lessonId'
            element={<CourseLearningPage />}
          />

          <Route path='/learning-report' element={<LearningReportPage />} />
        </Route>

        {/* //======= 3. Instructor Routes (Chỉ Instructor) =======// */}
        <Route element={<ProtectedRoute allowedRoles={['GV', 'AD', 'SA']} />}>
          <Route
            path='/instructor'
            element={<Navigate to='/instructor/dashboard' replace />}
          />
          <Route
            path='/instructor/dashboard'
            element={<InstructorDashboard />}
          />
          <Route path='/instructor/courses' element={<InstructorCourses />} />
          <Route
            path='/instructor/courses/create'
            element={<CourseCreation />}
          />
          {/* [THÊM 18/08/2026 — COURSE IMPORT]
              Khai báo TRƯỚC '/instructor/courses/:courseSlug/edit'? Không cần —
              hai đường dẫn không đụng nhau vì '/import' chỉ có MỘT đoạn sau
              'courses', còn mẫu kia yêu cầu thêm đoạn '/edit' phía sau. */}
          <Route path='/instructor/courses/import' element={<CourseImport />} />
          <Route
            path='/instructor/courses/:courseSlug/edit'
            element={<CourseEdit />}
          />
          <Route path='/instructor/students' element={<InstructorStudents />} />
          <Route path='/instructor/earnings' element={<InstructorEarnings />} />
          <Route path='/instructor/profile' element={<InstructorProfile />} />
          <Route
            path='/instructor/course-approvals'
            element={<InstructorCourseApprovals />}
          />
          <Route
            path='/instructor/analytics'
            element={<InstructorAnalytics />}
          />
        </Route>

        {/* //======= 4. Admin Routes (Chỉ Admin và Super Admin) =======// */}
        <Route element={<ProtectedRoute allowedRoles={['SA', 'AD']} />}>
          <Route
            path='/admin'
            element={<Navigate to='/admin/dashboard' replace />}
          />
          <Route path='/admin/dashboard' element={<AdminDashboard />} />
          <Route path='/admin/users' element={<UsersManagement />} />
          <Route path='/admin/courses' element={<CoursesManagement />} />
          <Route path='/admin/course-approvals' element={<CourseApprovals />} />
          <Route path='/admin/categories' element={<CategoriesManagement />} />
          <Route path='/admin/promotions' element={<PromotionsManagement />} />
          <Route path='/admin/skills' element={<SkillsManagement />} />
          <Route path='/admin/levels' element={<LevelsManagement />} />
          <Route path='/admin/currencies' element={<CurrenciesManagement />} />
          <Route
            path='/admin/payment-methods'
            element={<PaymentMethodsManagement />}
          />
          <Route
            path='/admin/exchange-rates'
            element={<ExchangeRatesManagement />}
          />
          <Route path='/admin/settings' element={<AdminSettings />} />
          <Route path='/admin/faqs' element={<FaqsManagement />} />
          <Route path='/admin/payouts' element={<PayoutManagement />} />
          <Route path='/admin/reports' element={<AdminReports />} />
        </Route>

        {/* //======= 5. Utility and Fallback Routes =======// */}
        <Route path='/unauthorized' element={<Unauthorized />} />
        <Route path='*' element={<NotFound />} />
      </Routes>
      </>
    </BrowserRouter>
  );
};

export default AppRouter;
