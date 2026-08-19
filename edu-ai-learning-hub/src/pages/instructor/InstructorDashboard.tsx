// src/pages/instructor/InstructorDashboard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import InstructorLayout from '@/components/layout/InstructorLayout';
import { Button } from '@/components/ui/button';
import { useMyDashboardOverview } from '@/hooks/queries/instructor.queries';
import { useSettings } from '@/contexts/SettingsContext';
import { StatCard } from './components/StatCard';
import { RecentActivity } from './components/RecentActivity';
import { TopCourses } from './components/TopCourses';
import { Icons } from '@/components/common/Icons';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const InstructorDashboard: React.FC = () => {
  const { data: dashboardData, isLoading } = useMyDashboardOverview();
  const { formatPrice } = useSettings();

  const stats = dashboardData?.stats;

  return (
    <InstructorLayout>
      <motion.div
        className='space-y-8 p-4 md:p-6 lg:p-8 max-w-9xl mx-auto'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {/* PRO INSTRUCTOR STUDIO HERO BANNER */}
        <motion.div
          variants={itemVariants}
          className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-2xl p-6 sm:p-8'
        >
          {/* Ambient Floating Orbs */}
          <div className='absolute -right-12 -top-12 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none animate-pulse' />
          <div className='absolute left-1/3 -bottom-16 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none' />
          <div className='absolute right-1/4 top-1/4 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-2xl pointer-events-none' />

          <div className='relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6'>
            <div className='space-y-4 max-w-2xl'>
              <div className='inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-400/30 text-xs font-bold text-indigo-300 backdrop-blur-md shadow-inner'>
                <Icons.sparkles className='w-3.5 h-3.5 text-amber-400 animate-spin' />
                <span className='tracking-wider uppercase'>PRO INSTRUCTOR OVERVIEW HUD</span>
              </div>
              <h1 className='text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-outfit'>
                Chào mừng trở lại,{' '}
                <span className='bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-400 font-black'>
                  Nhà Sáng Tạo!
                </span>
              </h1>
              <p className='text-slate-300 text-sm md:text-base font-normal leading-relaxed opacity-95'>
                Bàn làm việc chỉ huy hằng ngày. Nhanh chóng điểm tin học viên mới gia nhập, theo dõi phong độ bài giảng và truy cập hệ sinh thái AI thần tốc!
              </p>

              {/* QUICK ACTION LAUNCHPAD */}
              <div className='flex flex-wrap items-center gap-3 pt-2'>
                <Link to='/instructor/courses/create'>
                  <Button size='sm' className='h-10 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-extrabold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transform hover:-translate-y-0.5 transition-all duration-200 border border-white/20 text-xs tracking-wide'>
                    <Icons.plus className='mr-1.5 h-4 w-4 stroke-[3]' />
                    Tạo Khóa Học Mới
                  </Button>
                </Link>
                <Link to='/instructor/analytics'>
                  <Button size='sm' variant='outline' className='h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 border-white/20 text-slate-100 hover:text-white font-semibold backdrop-blur-md text-xs transition-all duration-200'>
                    <Icons.barChart className='mr-1.5 h-4 w-4 text-cyan-400 animate-pulse' />
                    Xem Báo Cáo Analytics
                  </Button>
                </Link>
                <Link to='/instructor/earnings'>
                  <Button size='sm' variant='outline' className='h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 border-white/20 text-amber-300 hover:text-amber-200 font-semibold backdrop-blur-md text-xs transition-all duration-200'>
                    <Icons.wallet className='mr-1.5 h-4 w-4 text-amber-400' />
                    Kho Tài Chính & Rút Tiền
                  </Button>
                </Link>
              </div>
            </div>

            <div className='hidden lg:flex flex-col items-end shrink-0 self-center'>
              <div className='p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl text-right space-y-1.5'>
                <p className='text-[11px] font-extrabold tracking-widest text-indigo-300 uppercase flex items-center justify-end gap-1.5'>
                  <span className='w-2 h-2 rounded-full bg-emerald-400 animate-ping' />
                  Hệ Sinh Thái Studio
                </p>
                <p className='text-2xl font-black text-white flex items-center gap-2 mt-1'>
                  <Icons.bot className='w-7 h-7 text-cyan-400 animate-bounce' />
                  AI Hub Live
                </p>
                <p className='text-[11px] text-slate-400 font-medium'>Sẵn sàng hỗ trợ phụ đề & dịch vụ 24/7</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4 VIBRANT STAT CARDS */}
        <motion.div variants={itemVariants} className='grid gap-5 md:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            title='Tổng Học Viên'
            value={stats?.totalStudents?.toLocaleString() || 0}
            icon={<Icons.users className='h-6 w-6 text-cyan-400' />}
            description='Trên tất cả khóa học'
            isLoading={isLoading}
            variant='cyan'
            className='h-full'
          />
          <StatCard
            title='Khóa Học Đã Mở'
            value={stats?.totalCourses || 0}
            icon={<Icons.bookOpen className='h-6 w-6 text-fuchsia-400' />}
            description='Khóa học đang Live'
            isLoading={isLoading}
            variant='fuchsia'
            className='h-full'
          />
          <StatCard
            title='Doanh Thu Cả Đời'
            value={formatPrice(stats?.totalLifetimeEarnings || 0)}
            icon={<Icons.dollarSign className='h-6 w-6 text-amber-400' />}
            description='Tổng doanh số thu về'
            isLoading={isLoading}
            variant='amber'
            className='h-full'
          />
          <StatCard
            title='Khả Dụng Thanh Toán'
            value={formatPrice(stats?.availableBalance || 0)}
            icon={<Icons.wallet className='h-6 w-6 text-emerald-400' />}
            description='Số dư hiện tại của bạn'
            isLoading={isLoading}
            variant='emerald'
            className='h-full'
          />
        </motion.div>

        {/* RECENT ACTIVITY & TOP COURSES */}
        <motion.div variants={itemVariants} className='grid gap-6 lg:grid-cols-2'>
          <RecentActivity
            enrollments={dashboardData?.recentEnrollments || []}
            isLoading={isLoading}
            className='rounded-2xl border border-white/10 dark:border-slate-800/80 bg-card/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300'
          />
          <TopCourses
            courses={dashboardData?.topPerformingCourses || []}
            isLoading={isLoading}
            className='rounded-2xl border border-white/10 dark:border-slate-800/80 bg-card/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300'
          />
        </motion.div>
      </motion.div>
    </InstructorLayout>
  );
};

export default InstructorDashboard;
