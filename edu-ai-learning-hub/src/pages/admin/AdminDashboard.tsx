// src/pages/admin/AdminDashboard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAdminDashboardOverview } from '@/hooks/queries/admin.queries';
import { useSettings } from '@/contexts/SettingsContext';

// Import các component con
import { StatCard } from '@/components/admin/dashboard/StatCard';
import { RevenueChart } from '@/components/admin/dashboard/RevenueChart';
import { RecentOrders } from '@/components/admin/dashboard/RecentOrders';

// Import Icons
import { Icons } from '@/components/common/Icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const AdminDashboard: React.FC = () => {
  const { data, isLoading, isError, error } = useAdminDashboardOverview();
  const { formatPrice } = useSettings();

  const stats = data?.stats;
  const monthlyRevenue = data?.monthlyRevenue || [];
  const recentOrders = data?.recentOrders || [];
  const topCourses = data?.topPerformingCourses || [];
  console.log('Admin Dashboard Data:', data);
  return (
    <AdminLayout>
      <div className='space-y-6'>
        <div className='flex flex-col sm:flex-row justify-between sm:items-center gap-2'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
            <p className='text-muted-foreground'>
              An overview of your platform's performance.
            </p>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' asChild>
              <Link to='/admin/reports'>View Reports</Link>
            </Button>
            <Button asChild>
              <Link to='/admin/settings'>Platform Settings</Link>
            </Button>
          </div>
        </div>

        {/* --- Stat Cards --- */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
          <StatCard
            title='Total Revenue'
            value={
              isLoading ? '...' : formatPrice(stats?.totalRevenue.amount || 0)
            }
            icon={<Icons.dollarSign className='h-5 w-5' />}
            description={
              isLoading ? '' : `Base Currency: ${stats?.totalRevenue.currency}`
            }
            isLoading={isLoading}
          />
          <StatCard
            title='Total Students'
            value={
              isLoading ? '...' : (stats?.totalStudents || 0).toLocaleString()
            }
            icon={<Icons.users className='h-5 w-5' />}
            isLoading={isLoading}
          />
          <StatCard
            title='Total Instructors'
            value={
              isLoading
                ? '...'
                : (stats?.totalInstructors || 0).toLocaleString()
            }
            icon={<Icons.userCheck className='h-5 w-5' />}
            isLoading={isLoading}
          />
          <StatCard
            title='Total Courses'
            value={
              isLoading ? '...' : (stats?.totalCourses || 0).toLocaleString()
            }
            icon={<Icons.bookOpen className='h-5 w-5' />}
            isLoading={isLoading}
          />
          <StatCard
            title='Pending Courses'
            value={isLoading ? '...' : stats?.pendingCourseApprovals || 0}
            icon={<Icons.clock className='h-5 w-5 text-yellow-500' />}
            description='Awaiting review'
            isLoading={isLoading}
          />
          <StatCard
            title='Pending Withdrawals'
            value={isLoading ? '...' : stats?.pendingWithdrawals || 0}
            icon={<Icons.creditCard className='h-5 w-5 text-red-500' />}
            description='Awaiting payment'
            isLoading={isLoading}
          />
        </div>

        <div className='gap-6 lg:grid-cols-3'>
          {/* --- Revenue Chart --- */}
          {isLoading ? (
            <Skeleton className='h-[436px] col-span-1 lg:col-span-2' />
          ) : (
            <RevenueChart data={monthlyRevenue} />
          )}
        </div>
        <div className='grid gap-6 lg:grid-cols-2'>
          {/* --- Top Performing Courses --- */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Courses</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className='h-48 w-full' />
              ) : topCourses.length > 0 ? (
                <div className='space-y-4'>
                  {topCourses.map((course) => (
                    <div key={course.courseId} className='flex items-center'>
                      <div className='flex-1'>
                        <Link
                          to={`/courses/${course.slug || course.courseId}`}
                          className='font-medium hover:underline'
                        >
                          {course.courseName}
                        </Link>
                      </div>
                      <div className='font-semibold'>
                        {formatPrice(course.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-muted-foreground text-center py-8'>
                  No revenue data available yet.
                </p>
              )}
            </CardContent>
          </Card>
          {/* --- Recent Sales --- */}
          {isLoading ? (
            <Skeleton className='h-[436px] col-span-1' />
          ) : (
            <RecentOrders orders={recentOrders} />
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
