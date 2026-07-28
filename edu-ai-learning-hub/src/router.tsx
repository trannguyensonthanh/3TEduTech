// src/router.tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import các component bảo vệ và tiện ích (giữ nguyên tĩnh để không bị chớp màn hình)
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ScrollToTopHandler from '@/utils/ScrollToTopHandler';
import IntroHandler from '@/components/auth/IntroHandler'; // Component xử lý logic intro

// --- Import Pages (Tối ưu hóa Code Splitting / Lazy Loading) ---

// Public Pages
const Index = lazy(() => import('./pages/Index'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Categories = lazy(() => import('./pages/Categories'));
const CategoryDetail = lazy(() => import('./pages/CategoryDetailPage'));
const Instructors = lazy(() => import('./pages/AllInstructorsPage'));
const InstructorDetail = lazy(() => import('./pages/InstructorProfilePage'));
const About = lazy(() => import('./pages/AboutPage'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const TermsInstructor = lazy(() => import('@/pages/TermsInstructor'));

// Auth Pages
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const ActivateAccount = lazy(() => import('./pages/auth/ActivateAccount'));
const SocialLoginCallback = lazy(() => import('./pages/auth/SocialLoginCallback'));

// Authenticated User Pages
const MyCourses = lazy(() => import('./pages/MyCourses'));
const UserProfile = lazy(() => import('./pages/UserProfilePage'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const CheckoutReturn = lazy(() => import('./pages/CheckoutReturn'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentCanceled = lazy(() => import('./pages/PaymentCanceled'));
const OrderHistory = lazy(() => import('@/pages/OrderHistory'));
const Certificates = lazy(() => import('@/pages/Certificates'));
const Notifications = lazy(() => import('@/pages/user/Notifications'));
const CourseLearningPage = lazy(() => import('@/pages/CourseLearningPage'));
const LearningReportPage = lazy(() => import('@/pages/LearningReportPage'));

// Instructor Pages
const InstructorRegister = lazy(() => import('./pages/instructor/InstructorRegister'));
const InstructorRegisterSuccess = lazy(() => import('./pages/instructor/InstructorRegisterSuccess'));
const InstructorDashboard = lazy(() => import('./pages/instructor/InstructorDashboard'));
const InstructorCourses = lazy(() => import('./pages/instructor/InstructorCourses'));
const CourseCreation = lazy(() => import('./pages/instructor/CourseCreation'));
const CourseEdit = lazy(() => import('@/pages/instructor/CourseEdit'));
const InstructorStudents = lazy(() => import('./pages/instructor/InstructorStudents'));
const InstructorEarnings = lazy(() => import('./pages/instructor/InstructorEarnings'));
const InstructorProfile = lazy(() => import('./pages/instructor/InstructorProfile'));
const InstructorCourseApprovals = lazy(() => import('./pages/instructor/InstructorCourseApprovals'));
const InstructorAnalytics = lazy(() => import('@/pages/instructor/InstructorAnalytics'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UsersManagement = lazy(() => import('./pages/admin/UsersManagement'));
const CoursesManagement = lazy(() => import('./pages/admin/CoursesManagement'));
const CourseApprovals = lazy(() => import('./pages/admin/CourseApprovals'));
const CategoriesManagement = lazy(() => import('./pages/admin/CategoriesManagement'));
const PromotionsManagement = lazy(() => import('./pages/admin/PromotionsManagement'));
const SkillsManagement = lazy(() => import('@/pages/admin/SkillsManagement'));
const LevelsManagement = lazy(() => import('./pages/admin/LevelsManagement'));
const CurrenciesManagement = lazy(() => import('./pages/admin/CurrenciesManagement'));
const PaymentMethodsManagement = lazy(() => import('./pages/admin/PaymentMethodsManagement'));
const ExchangeRatesManagement = lazy(() => import('./pages/admin/ExchangeRatesManagement'));
const FaqsManagement = lazy(() => import('./pages/admin/FaqsManagement'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminReports = lazy(() => import('@/pages/admin/AdminReports'));
const PayoutManagement = lazy(() => import('./pages/admin/PayoutManagement'));

// Utility Pages
// === INTRO VERSION SWITCH ===
// Uncomment dòng dưới để dùng Intro cũ (Cây Tri Thức):
// const IntroPage = lazy(() => import('@/pages/IntroPage'));
// Intro mới (Cuốn Sách Tri Thức):
const IntroPage = lazy(() => import('@/pages/IntroPageV2'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Unauthorized = lazy(() => import('./pages/Unauthorized')); 
const CryptoPaymentPage = lazy(() => import('@/pages/CryptoPaymentPage'));
const AiMasterChat = lazy(() => import('@/pages/AiMasterChat'));

const PageLoader = () => (
  <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 px-4 text-white">
    <div className="relative mb-4 flex items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
      <div className="absolute h-6 w-6 animate-pulse rounded-full bg-indigo-500/40 blur-sm"></div>
    </div>
    <p className="animate-pulse text-sm font-medium text-slate-400">
      Đang chuẩn bị không gian học tập... ✨
    </p>
  </div>
);

const AppRouter = () => {
  return (
    <BrowserRouter>
      <ScrollToTopHandler />
      <Suspense fallback={<PageLoader />}>
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
            element={<Navigate to='/instructor/earnings' replace />}
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
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
