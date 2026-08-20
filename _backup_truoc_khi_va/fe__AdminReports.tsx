// src/pages/admin/AdminReports.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  useQuizScoreReport,
  useCourseEffectivenessReport,
  useEnrollmentStatsReport,
} from '@/hooks/queries/admin.queries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  BookOpen, Users, TrendingUp,
  Target, BarChart2, GraduationCap, Star, ArrowUpRight,
} from 'lucide-react';

const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  gradient?: string;
}> = ({ children, className = '', gradient }) => (
  <div
    className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${gradient || 'from-slate-900/80 to-slate-800/50'} backdrop-blur-xl shadow-2xl ${className}`}
  >
    <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none' />
    <div className='relative z-10'>{children}</div>
  </div>
);

const StatBadge: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}> = ({ icon, label, value, color = 'text-violet-400' }) => (
  <GlassCard gradient='from-slate-800/60 to-slate-900/40' className='p-5'>
    <div className='flex items-center gap-3'>
      <div className={`p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 ${color}`}>
        {icon}
      </div>
      <div>
        <p className='text-xs text-slate-400 uppercase tracking-wider'>{label}</p>
        <p className='text-2xl font-bold text-white mt-0.5'>{value}</p>
      </div>
    </div>
  </GlassCard>
);

const AdminReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('effectiveness');

  const { data: quizData, isLoading: quizLoading } = useQuizScoreReport();
  const { data: effectivenessData, isLoading: effectivenessLoading } = useCourseEffectivenessReport();
  const { data: enrollmentData, isLoading: enrollmentLoading } = useEnrollmentStatsReport();

  const isLoading = quizLoading || effectivenessLoading || enrollmentLoading;

  // Calculate overview stats
  const totalEnrollments = effectivenessData?.reduce((s, c) => s + c.totalEnrollments, 0) || 0;
  const avgCompletionOverall = effectivenessData?.length
    ? Math.round(effectivenessData.reduce((s, c) => s + c.completionRate, 0) / effectivenessData.length)
    : 0;
  const totalCourses = effectivenessData?.length || 0;
  const avgRatingOverall = effectivenessData?.filter(c => c.averageRating).length
    ? (effectivenessData.filter(c => c.averageRating).reduce((s, c) => s + (c.averageRating || 0), 0) /
       effectivenessData.filter(c => c.averageRating).length).toFixed(1)
    : '0';

  // Pie chart data for completion breakdown
  const completionPieData = [
    { name: 'Completed', value: effectivenessData?.reduce((s, c) => s + c.completedStudents, 0) || 0 },
    { name: 'In Progress', value: totalEnrollments - (effectivenessData?.reduce((s, c) => s + c.completedStudents, 0) || 0) },
  ];

  return (
    <AdminLayout>
      <div className='min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 -m-6 p-6'>
        {/* Ambient glow effects */}
        <div className='fixed inset-0 pointer-events-none overflow-hidden'>
          <div className='absolute top-0 left-1/4 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl animate-pulse' />
          <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-600/8 rounded-full blur-3xl animate-pulse' style={{ animationDelay: '2s' }} />
          <div className='absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-600/6 rounded-full blur-3xl animate-pulse' style={{ animationDelay: '4s' }} />
        </div>

        <div className='relative z-10 space-y-8'>
          {/* Header */}
          <div className='flex flex-col sm:flex-row justify-between sm:items-center gap-4'>
            <div>
              <h1 className='text-4xl font-black bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent'>
                Platform Reports
              </h1>
              <p className='text-slate-400 mt-1'>
                Deep analytics & performance insights for your learning platform
              </p>
            </div>
          </div>

          {/* Overview Stats */} 
          {isLoading ? (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              {[...Array(4)].map((_, i) => <Skeleton key={i} className='h-24 rounded-2xl bg-slate-800/50' />)}
            </div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              <StatBadge
                icon={<Users className='w-5 h-5' />}
                label='Total Enrollments'
                value={totalEnrollments.toLocaleString()}
                color='text-violet-400'
              />
              <StatBadge
                icon={<Target className='w-5 h-5' />}
                label='Avg Completion'
                value={`${avgCompletionOverall}%`}
                color='text-cyan-400'
              />
              <StatBadge
                icon={<BookOpen className='w-5 h-5' />}
                label='Active Courses'
                value={totalCourses}
                color='text-emerald-400'
              />
              <StatBadge
                icon={<Star className='w-5 h-5' />}
                label='Avg Rating'
                value={avgRatingOverall}
                color='text-amber-400'
              />
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
            <TabsList className='bg-slate-800/60 border border-white/10 p-1 rounded-xl backdrop-blur-sm'>
              <TabsTrigger value='effectiveness' className='data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg px-5 text-slate-400'>
                <BarChart2 className='w-4 h-4 mr-2' />
                Course Effectiveness
              </TabsTrigger>
              <TabsTrigger value='enrollments' className='data-[state=active]:bg-cyan-600 data-[state=active]:text-white rounded-lg px-5 text-slate-400'>
                <TrendingUp className='w-4 h-4 mr-2' />
                Enrollment Analytics
              </TabsTrigger>
              <TabsTrigger value='quizzes' className='data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg px-5 text-slate-400'>
                <GraduationCap className='w-4 h-4 mr-2' />
                Quiz Scores
              </TabsTrigger>
            </TabsList>

            {/* ===== TAB 1: Course Effectiveness ===== */}
            <TabsContent value='effectiveness' className='space-y-6'>
              <div className='grid gap-6 lg:grid-cols-3'>
                {/* Completion Pie Chart */}
                <GlassCard className='p-6'>
                  <h3 className='text-lg font-semibold text-white mb-4'>Completion Overview</h3>
                  <ResponsiveContainer width='100%' height={250}>
                    <PieChart>
                      <Pie
                        data={completionPieData}
                        cx='50%' cy='50%'
                        innerRadius={60} outerRadius={90}
                        paddingAngle={5}
                        dataKey='value'
                      >
                        <Cell fill='#10b981' />
                        <Cell fill='#6366f1' />
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#e2e8f0' }}
                      />
                      <Legend
                        wrapperStyle={{ color: '#94a3b8' }}
                        formatter={(value) => <span className='text-slate-300 text-sm'>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </GlassCard>

                {/* Top Rated */}
                <GlassCard className='p-6 lg:col-span-2'>
                  <h3 className='text-lg font-semibold text-white mb-4'>Course Performance Matrix</h3>
                  {effectivenessLoading ? (
                    <Skeleton className='h-64 bg-slate-800/50' />
                  ) : (
                    <ResponsiveContainer width='100%' height={250}>
                      <BarChart data={effectivenessData?.slice(0, 8)} layout='vertical'>
                        <CartesianGrid strokeDasharray='3 3' stroke='rgba(255,255,255,0.05)' />
                        <XAxis type='number' tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis type='category' dataKey='courseName' width={160} tick={{ fill: '#e2e8f0', fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#e2e8f0' }}
                        />
                        <Bar dataKey='totalEnrollments' fill='#8b5cf6' name='Enrollments' radius={[0, 6, 6, 0]} />
                        <Bar dataKey='completionRate' fill='#10b981' name='Completion %' radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </GlassCard>
              </div>

              {/* Course Table */}
              <GlassCard className='p-6'>
                <h3 className='text-lg font-semibold text-white mb-4'>All Courses — Detailed Breakdown</h3>
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='text-slate-400 border-b border-white/10'>
                        <th className='text-left py-3 px-4'>Course</th>
                        <th className='text-center py-3 px-2'>Instructor</th>
                        <th className='text-center py-3 px-2'>Enrollments</th>
                        <th className='text-center py-3 px-2'>Completion</th>
                        <th className='text-center py-3 px-2'>Avg Score</th>
                        <th className='text-center py-3 px-2'>Rating</th>
                        <th className='text-center py-3 px-2'>Lessons</th>
                      </tr>
                    </thead>
                    <tbody>
                      {effectivenessData?.map((course) => (
                        <tr key={course.courseId} className='border-b border-white/5 hover:bg-white/5 transition-colors'>
                          <td className='py-3 px-4'>
                            <Link to={`/courses/${course.slug}`} className='text-white font-medium hover:text-violet-400 transition-colors flex items-center gap-2'>
                              {course.courseName}
                              <ArrowUpRight className='w-3 h-3 opacity-50' />
                            </Link>
                          </td>
                          <td className='text-center py-3 px-2 text-slate-300'>{course.instructorName}</td>
                          <td className='text-center py-3 px-2'>
                            <Badge variant='secondary' className='bg-violet-500/20 text-violet-300 border-0'>
                              {course.totalEnrollments}
                            </Badge>
                          </td>
                          <td className='text-center py-3 px-2'>
                            <div className='flex items-center gap-2 justify-center'>
                              <Progress value={course.completionRate} className='w-16 h-2' />
                              <span className='text-emerald-400 text-xs font-mono'>{course.completionRate}%</span>
                            </div>
                          </td>
                          <td className='text-center py-3 px-2'>
                            <span className={`font-mono text-sm ${course.avgQuizScore >= 70 ? 'text-emerald-400' : course.avgQuizScore > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                              {course.avgQuizScore > 0 ? course.avgQuizScore.toFixed(1) : '—'}
                            </span>
                          </td>
                          <td className='text-center py-3 px-2'>
                            <span className='text-amber-400 flex items-center justify-center gap-1'>
                              <Star className='w-3 h-3 fill-current' />
                              {course.averageRating?.toFixed(1) || '—'}
                            </span>
                          </td>
                          <td className='text-center py-3 px-2 text-slate-300'>{course.totalLessons}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!effectivenessData || effectivenessData.length === 0) && (
                    <p className='text-center text-slate-500 py-12'>No course data available yet.</p>
                  )}
                </div>
              </GlassCard>
            </TabsContent>

            {/* ===== TAB 2: Enrollment Analytics ===== */}
            <TabsContent value='enrollments' className='space-y-6'>
              <div className='grid gap-6 lg:grid-cols-2'>
                {/* Enrollment Trend */}
                <GlassCard className='p-6 lg:col-span-2'>
                  <h3 className='text-lg font-semibold text-white mb-1'>Enrollment Trend</h3>
                  <p className='text-slate-400 text-sm mb-4'>New enrollments over the last 12 months</p>
                  {enrollmentLoading ? (
                    <Skeleton className='h-72 bg-slate-800/50' />
                  ) : (
                    <ResponsiveContainer width='100%' height={300}>
                      <AreaChart data={enrollmentData?.trend}>
                        <defs>
                          <linearGradient id='enrollGrad' x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='5%' stopColor='#8b5cf6' stopOpacity={0.4} />
                            <stop offset='95%' stopColor='#8b5cf6' stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id='studentGrad' x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='5%' stopColor='#06b6d4' stopOpacity={0.4} />
                            <stop offset='95%' stopColor='#06b6d4' stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray='3 3' stroke='rgba(255,255,255,0.05)' />
                        <XAxis dataKey='month' tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#e2e8f0' }}
                        />
                        <Area type='monotone' dataKey='newEnrollments' stroke='#8b5cf6' fill='url(#enrollGrad)' name='New Enrollments' strokeWidth={2} />
                        <Area type='monotone' dataKey='uniqueStudents' stroke='#06b6d4' fill='url(#studentGrad)' name='Unique Students' strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </GlassCard>
              </div>

              {/* Top Courses by Enrollment */}
              <GlassCard className='p-6'>
                <h3 className='text-lg font-semibold text-white mb-4'>Top Courses by Enrollment</h3>
                <div className='grid gap-3'>
                  {enrollmentData?.topCoursesByEnrollment?.map((course, index) => (
                    <div key={course.courseId} className='flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group'>
                      <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm'>
                        {index + 1}
                      </div>
                      {course.thumbnailUrl && (
                        <img src={course.thumbnailUrl} alt='' className='w-12 h-8 rounded-lg object-cover' />
                      )}
                      <div className='flex-1 min-w-0'>
                        <Link to={`/courses/${course.slug}`} className='text-white font-medium hover:text-violet-400 truncate block'>
                          {course.courseName}
                        </Link>
                        <p className='text-xs text-slate-400'>{course.instructorName}</p>
                      </div>
                      <Badge variant='secondary' className='bg-violet-500/20 text-violet-300 border-0'>
                        {course.totalEnrollments} students
                      </Badge>
                      <div className='flex items-center gap-2'>
                        <Progress value={course.avgCompletion} className='w-16 h-2' />
                        <span className='text-xs text-slate-400 w-10 text-right'>{course.avgCompletion.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                  {(!enrollmentData?.topCoursesByEnrollment || enrollmentData.topCoursesByEnrollment.length === 0) && (
                    <p className='text-center text-slate-500 py-12'>No enrollment data available yet.</p>
                  )}
                </div>
              </GlassCard>
            </TabsContent>

            {/* ===== TAB 3: Quiz Scores ===== */}
            <TabsContent value='quizzes' className='space-y-6'>
              {quizLoading ? (
                <div className='space-y-4'>
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className='h-48 rounded-2xl bg-slate-800/50' />)}
                </div>
              ) : quizData && quizData.length > 0 ? (
                quizData.map((courseReport) => (
                  <GlassCard key={courseReport.courseId} className='p-6'>
                    <div className='flex items-center gap-3 mb-6'>
                      <div className='p-2 rounded-xl bg-emerald-500/20'>
                        <GraduationCap className='w-5 h-5 text-emerald-400' />
                      </div>
                      <div>
                        <h3 className='text-lg font-semibold text-white'>{courseReport.courseName}</h3>
                        <p className='text-xs text-slate-400'>{courseReport.quizzes.length} quizzes</p>
                      </div>
                    </div>

                    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                      {courseReport.quizzes.map((quiz) => (
                        <div key={quiz.lessonId} className='rounded-xl bg-white/5 p-4 border border-white/5 hover:border-white/10 transition-all'>
                          <h4 className='text-sm font-semibold text-white mb-3 truncate'>{quiz.lessonName}</h4>
                          <div className='space-y-2'>
                            <div className='flex justify-between text-xs'>
                              <span className='text-slate-400'>Avg Score</span>
                              <span className={`font-mono font-bold ${quiz.avgScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {quiz.avgScore.toFixed(1)}%
                              </span>
                            </div>
                            <Progress value={quiz.avgScore} className='h-1.5' />
                            <div className='grid grid-cols-2 gap-2 mt-3 text-xs'>
                              <div className='text-center p-2 rounded-lg bg-white/5'>
                                <p className='text-slate-400'>Attempts</p>
                                <p className='text-white font-bold'>{quiz.totalAttempts}</p>
                              </div>
                              <div className='text-center p-2 rounded-lg bg-white/5'>
                                <p className='text-slate-400'>Pass Rate</p>
                                <p className='text-emerald-400 font-bold'>{quiz.passRate}%</p>
                              </div>
                              <div className='text-center p-2 rounded-lg bg-white/5'>
                                <p className='text-slate-400'>Highest</p>
                                <p className='text-cyan-400 font-bold'>{quiz.highestScore}</p>
                              </div>
                              <div className='text-center p-2 rounded-lg bg-white/5'>
                                <p className='text-slate-400'>Lowest</p>
                                <p className='text-red-400 font-bold'>{quiz.lowestScore}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                ))
              ) : (
                <GlassCard className='p-12 text-center'>
                  <GraduationCap className='w-12 h-12 text-slate-600 mx-auto mb-4' />
                  <h3 className='text-lg font-semibold text-slate-300'>No Quiz Data Available</h3>
                  <p className='text-slate-500 mt-1'>Quiz score reports will appear here once students start taking quizzes.</p>
                </GlassCard>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
