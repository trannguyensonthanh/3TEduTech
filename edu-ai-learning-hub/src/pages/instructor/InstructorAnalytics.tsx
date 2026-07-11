// src/pages/instructor/InstructorAnalytics.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import InstructorLayout from '@/components/layout/InstructorLayout';
import { useInstructorAnalytics } from '@/hooks/queries/admin.queries';
import { useSettings } from '@/contexts/SettingsContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  DollarSign, Users,
  Star, BookOpen,
} from 'lucide-react';

const InstructorAnalytics: React.FC = () => {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const { data, isLoading } = useInstructorAnalytics(period);
  const { formatPrice } = useSettings();

  const stats = data?.stats;
  const timeSeries = data?.timeSeries || [];
  const coursePerformance = data?.coursePerformance || [];

  return (
    <InstructorLayout>
      <div className='min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 -m-6 p-6'>
        {/* Ambient glow */}
        <div className='fixed inset-0 pointer-events-none overflow-hidden'>
          <div className='absolute top-10 left-1/3 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl animate-pulse' />
          <div className='absolute bottom-1/3 right-1/4 w-60 h-60 bg-teal-600/8 rounded-full blur-3xl animate-pulse' style={{ animationDelay: '3s' }} />
        </div>

        <div className='relative z-10 space-y-8'>
          {/* Header */}
          <div>
            <h1 className='text-4xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
              Analytics
            </h1>
            <p className='text-slate-400 mt-1'>Track your teaching performance and revenue</p>
          </div>

          {/* Stat Cards */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {/* Revenue */}
            <div className='relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-900/40 to-slate-900/60 backdrop-blur-xl p-5'>
              <div className='absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none' />
              <div className='relative z-10'>
                <div className='flex items-center justify-between'>
                  <div className='p-2 rounded-xl bg-indigo-500/20'>
                    <DollarSign className='w-5 h-5 text-indigo-400' />
                  </div>
                </div>
                <div className='mt-3'>
                  <p className='text-xs text-slate-400 uppercase tracking-wider'>Total Revenue</p>
                  <p className='text-3xl font-bold text-white mt-1'>
                    {isLoading ? '...' : formatPrice(stats?.totalRevenue || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Students */}
            <div className='relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-900/40 to-slate-900/60 backdrop-blur-xl p-5'>
              <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none' />
              <div className='relative z-10'>
                <div className='p-2 rounded-xl bg-cyan-500/20 w-fit'>
                  <Users className='w-5 h-5 text-cyan-400' />
                </div>
                <div className='mt-3'>
                  <p className='text-xs text-slate-400 uppercase tracking-wider'>Total Students</p>
                  <p className='text-3xl font-bold text-white mt-1'>
                    {isLoading ? '...' : (stats?.totalStudents || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Courses */}
            <div className='relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-900/40 to-slate-900/60 backdrop-blur-xl p-5'>
              <div className='absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none' />
              <div className='relative z-10'>
                <div className='p-2 rounded-xl bg-emerald-500/20 w-fit'>
                  <BookOpen className='w-5 h-5 text-emerald-400' />
                </div>
                <div className='mt-3'>
                  <p className='text-xs text-slate-400 uppercase tracking-wider'>Total Courses</p>
                  <p className='text-3xl font-bold text-white mt-1'>
                    {isLoading ? '...' : stats?.totalCourses || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className='relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-amber-900/40 to-slate-900/60 backdrop-blur-xl p-5'>
              <div className='absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none' />
              <div className='relative z-10'>
                <div className='p-2 rounded-xl bg-amber-500/20 w-fit'>
                  <Star className='w-5 h-5 text-amber-400' />
                </div>
                <div className='mt-3'>
                  <p className='text-xs text-slate-400 uppercase tracking-wider'>Avg Rating</p>
                  <p className='text-3xl font-bold text-white mt-1'>
                    {isLoading ? '...' : stats?.avgRating || '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <Tabs value={period} onValueChange={(v) => setPeriod(v as 'weekly' | 'monthly')} className='space-y-6'>
            <TabsList className='bg-slate-800/60 border border-white/10 p-1 rounded-xl backdrop-blur-sm'>
              <TabsTrigger value='weekly' className='data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-6 text-slate-400'>
                Weekly
              </TabsTrigger>
              <TabsTrigger value='monthly' className='data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-6 text-slate-400'>
                Monthly
              </TabsTrigger>
            </TabsList>

            <TabsContent value={period} className='space-y-6'>
              <div className='grid gap-6 lg:grid-cols-2'>
                {/* Student Enrollments Chart */}
                <div className='rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl p-6 shadow-2xl'>
                  <h3 className='text-lg font-semibold text-white mb-4'>Student Enrollments</h3>
                  {isLoading ? (
                    <Skeleton className='h-72 bg-slate-800/50 rounded-xl' />
                  ) : (
                    <ResponsiveContainer width='100%' height={300}>
                      <AreaChart data={timeSeries}>
                        <defs>
                          <linearGradient id='stuGrad' x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='5%' stopColor='#818cf8' stopOpacity={0.4} />
                            <stop offset='95%' stopColor='#818cf8' stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray='3 3' stroke='rgba(255,255,255,0.05)' />
                        <XAxis dataKey='period' tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#e2e8f0' }}
                        />
                        <Area type='monotone' dataKey='newStudents' stroke='#818cf8' fill='url(#stuGrad)' name='New Students' strokeWidth={2.5} dot={{ fill: '#818cf8', r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Revenue Chart */}
                <div className='rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl p-6 shadow-2xl'>
                  <h3 className='text-lg font-semibold text-white mb-4'>Revenue</h3>
                  {isLoading ? (
                    <Skeleton className='h-72 bg-slate-800/50 rounded-xl' />
                  ) : (
                    <ResponsiveContainer width='100%' height={300}>
                      <AreaChart data={timeSeries}>
                        <defs>
                          <linearGradient id='revGrad' x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='5%' stopColor='#34d399' stopOpacity={0.4} />
                            <stop offset='95%' stopColor='#34d399' stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray='3 3' stroke='rgba(255,255,255,0.05)' />
                        <XAxis dataKey='period' tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#e2e8f0' }}
                          formatter={(value: number) => [formatPrice(value), 'Revenue']}
                        />
                        <Area type='monotone' dataKey='revenue' stroke='#34d399' fill='url(#revGrad)' name='Revenue' strokeWidth={2.5} dot={{ fill: '#34d399', r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Course Performance Table */}
              <div className='rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl p-6 shadow-2xl'>
                <h3 className='text-lg font-semibold text-white mb-6'>Course Performance</h3>
                <div className='space-y-3'>
                  {isLoading ? (
                    [...Array(4)].map((_, i) => <Skeleton key={i} className='h-16 bg-slate-800/50 rounded-xl' />)
                  ) : coursePerformance.length > 0 ? (
                    coursePerformance.map((course, i) => (
                      <div key={course.courseId} className='flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group border border-transparent hover:border-white/10'>
                        <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg'>
                          {i + 1}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <Link to={`/courses/${course.slug}`} className='text-white font-medium hover:text-indigo-400 transition-colors truncate block'>
                            {course.courseName}
                          </Link>
                          <div className='flex items-center gap-4 mt-1 text-xs text-slate-400'>
                            <span className='flex items-center gap-1'>
                              <Users className='w-3 h-3' /> {course.enrollments}
                            </span>
                            {course.averageRating && (
                              <span className='flex items-center gap-1 text-amber-400'>
                                <Star className='w-3 h-3 fill-current' /> {course.averageRating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className='text-right hidden sm:block'>
                          <p className='text-sm font-semibold text-emerald-400'>{formatPrice(course.revenue)}</p>
                          <div className='flex items-center gap-2 mt-1'>
                            <Progress value={course.avgCompletion} className='w-20 h-1.5' />
                            <span className='text-xs text-slate-400'>{course.avgCompletion.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className='text-center text-slate-500 py-12'>No course performance data yet. Publish courses to see analytics!</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </InstructorLayout>
  );
};

export default InstructorAnalytics;
