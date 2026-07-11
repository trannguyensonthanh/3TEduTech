// src/pages/instructor/InstructorDashboard.tsx
import React from 'react';
import InstructorLayout from '@/components/layout/InstructorLayout';
import { useMyDashboardOverview } from '@/hooks/queries/instructor.queries';
import { useSettings } from '@/contexts/SettingsContext';
import { StatCard } from './components/StatCard';
import { RecentActivity } from './components/RecentActivity';
import { TopCourses } from './components/TopCourses';
import { Icons } from '@/components/common/Icons';

const InstructorDashboard: React.FC = () => {
  const { data: dashboardData, isLoading } = useMyDashboardOverview();
  const { formatPrice } = useSettings();

  const stats = dashboardData?.stats;

  return (
    <InstructorLayout>
      <div>
        <div className='space-y-8 p-4 md:p-6 lg:p-8'>
          <header className='mb-6 flex flex-col items-start gap-2'>
            <h1 className='text-3xl font-bold tracking-tight text-primary'>
              Instructor Dashboard
            </h1>
            <p className='text-muted-foreground text-base'>
              Welcome back!{' '}
              <span className='font-semibold text-primary'>
                Inspire learners every day.
              </span>
            </p>
          </header>

          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <StatCard
              title='Total Students'
              value={stats?.totalStudents?.toLocaleString() || 0}
              icon={<Icons.users className='h-6 w-6 text-blue-500' />}
              description='Across all your courses'
              isLoading={isLoading}
              className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200'
            />
            <StatCard
              title='Published Courses'
              value={stats?.totalCourses || 0}
              icon={<Icons.bookOpen className='h-6 w-6 text-fuchsia-500' />}
              description='Your live courses'
              isLoading={isLoading}
              className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200'
            />
            <StatCard
              title='Lifetime Earnings'
              value={formatPrice(stats?.totalLifetimeEarnings || 0)}
              icon={<Icons.dollarSign className='h-6 w-6 text-yellow-500' />}
              description='Total revenue generated'
              isLoading={isLoading}
              className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200'
            />
            <StatCard
              title='Available for Payout'
              value={formatPrice(stats?.availableBalance || 0)}
              icon={<Icons.wallet className='h-6 w-6 text-green-500' />}
              description='Your current balance'
              isLoading={isLoading}
              className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200'
            />
          </div>

          <div className='grid gap-6 lg:grid-cols-2'>
            <RecentActivity
              enrollments={dashboardData?.recentEnrollments || []}
              isLoading={isLoading}
              className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl'
            />
            <TopCourses
              courses={dashboardData?.topPerformingCourses || []}
              isLoading={isLoading}
              className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl'
            />
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
};

export default InstructorDashboard;
