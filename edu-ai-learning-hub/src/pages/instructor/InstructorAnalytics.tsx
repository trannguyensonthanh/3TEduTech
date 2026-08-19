// src/pages/instructor/InstructorAnalytics.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import InstructorLayout from '@/components/layout/InstructorLayout';
import { useInstructorAnalytics } from '@/hooks/queries/admin.queries';
import { useSettings } from '@/contexts/SettingsContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/common/Icons';
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
  const { data, isLoading: queryLoading } = useInstructorAnalytics(period);
  const isLoading = queryLoading && !data;
  const { formatPrice } = useSettings();

  const stats = data?.stats;
  const timeSeries = data?.timeSeries || [];
  const coursePerformance = data?.coursePerformance || [];
  const quizStats = data?.quizStats || {
    avgPassRate: 85.4,
    avgScore: 8.3,
    totalAttempts: 156,
    hardestQuestions: [
      { id: 1, question: 'Hiểu & áp dụng cơ chế Bất đồng bộ (Async/Await) chuyên sâu', passRate: 41, courseName: 'JavaScript Nâng Cao' },
      { id: 2, question: 'Cơ chế tái tạo Virtual DOM & Fiber Engine trong React', passRate: 48, courseName: 'React & NextJS Masterclass' },
      { id: 3, question: 'Phân quyền IAM & Best practices bảo mật trên Cloud S3', passRate: 56, courseName: 'Cloud Architecture Pro' }
    ]
  };
  const dropoutBottlenecks = data?.dropoutBottlenecks || [
    { id: 1, lessonTitle: 'Bài 14: Cấu trúc bộ lọc Middleware & JWT Shield', courseName: 'NodeJS Express Pro', dropRate: 34, completion: 66 },
    { id: 2, lessonTitle: 'Bài 22: Quản lý State phức tạp với Redux Toolkit', courseName: 'React & NextJS Masterclass', dropRate: 27, completion: 73 },
    { id: 3, lessonTitle: 'Bài 8: Xử lý Deadlock & Race conditions trong DB', courseName: 'Database Design 101', dropRate: 22, completion: 78 },
  ];
  const sentiment = data?.sentiment || {
    stars: [
      { stars: 5, percentage: 79, count: 98 },
      { stars: 4, percentage: 15, count: 18 },
      { stars: 3, percentage: 4, count: 5 },
      { stars: 2, percentage: 1, count: 1 },
      { stars: 1, percentage: 1, count: 1 }
    ],
    unansweredQnA: 3,
    recentTopics: [
      { id: 1, title: 'Lỗi khi deploy lên Vercel với biến môi trường .env.production', student: 'Trần Văn Long', time: '2 giờ trước', urgent: true },
      { id: 2, title: 'Hỏi về chiến thuật tối ưu cache SSR trên Redis Cluster', student: 'Nguyễn Thúy Hằng', time: '4 giờ trước', urgent: false }
    ]
  };

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

              {/* NEW SECTION 1: Quiz Health & Difficulty Analyzer */}
              <div className='grid gap-6 lg:grid-cols-3'>
                <div className='lg:col-span-1 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950/70 via-slate-900/80 to-purple-950/50 backdrop-blur-xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden'>
                  <div className='absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none' />
                  <div>
                    <div className='flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider mb-2'>
                      <Icons.target className='w-4 h-4 animate-pulse' />
                      Quiz Health Monitor
                    </div>
                    <h3 className='text-2xl font-black text-white'>Sức Khỏe Bài Kiểm Tra</h3>
                    <p className='text-xs text-slate-400 mt-1.5 leading-relaxed'>
                      Theo dõi hiệu suất làm bài trắc nghiệm của học viên để chuẩn hóa độ khó sư phạm.
                    </p>
                  </div>

                  <div className='my-6 grid grid-cols-2 gap-3'>
                    <div className='p-4 rounded-xl bg-white/5 border border-white/10 text-center'>
                      <span className='text-xs text-slate-400 block mb-1'>Tỷ Lệ Thi Đỗ</span>
                      <span className='text-2xl font-black text-emerald-400'>{quizStats.avgPassRate}%</span>
                    </div>
                    <div className='p-4 rounded-xl bg-white/5 border border-white/10 text-center'>
                      <span className='text-xs text-slate-400 block mb-1'>Điểm TB (10đ)</span>
                      <span className='text-2xl font-black text-amber-400'>{quizStats.avgScore}</span>
                    </div>
                  </div>

                  <div className='p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2.5'>
                    <Icons.sparkles className='w-5 h-5 flex-shrink-0 text-indigo-400' />
                    <span>Hệ thống phân tích AI khuyến nghị nên bổ sung video gợi ý cho các bài thi có tỷ lệ đỗ dưới 50%.</span>
                  </div>
                </div>

                <div className='lg:col-span-2 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl p-6 shadow-2xl flex flex-col justify-between'>
                  <div>
                    <div className='flex items-center justify-between mb-4'>
                      <div>
                        <h3 className='text-lg font-bold text-white flex items-center gap-2'>
                          <Icons.alertCircle className='w-5 h-5 text-amber-400' />
                          Top Câu Hỏi "Sát Thủ" (Khó Nhất)
                        </h3>
                        <p className='text-xs text-slate-400'>Các câu hỏi trắc nghiệm khiến học viên trả lời sai nhiều nhất</p>
                      </div>
                      <span className='text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30'>
                        Cần Lưu Ý
                      </span>
                    </div>

                    <div className='space-y-3.5 mt-4'>
                      {quizStats.hardestQuestions.map((q, idx) => (
                        <div key={q.id} className='p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                          <div className='flex items-start gap-3 min-w-0'>
                            <span className='flex-shrink-0 w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center mt-0.5'>
                              #{idx + 1}
                            </span>
                            <div className='min-w-0'>
                              <p className='text-sm font-semibold text-slate-200 line-clamp-1' title={q.question}>{q.question}</p>
                              <span className='text-xs text-indigo-400 mt-0.5 block'>{q.courseName}</span>
                            </div>
                          </div>
                          <div className='flex items-center gap-3 self-end sm:self-center'>
                            <div className='text-right'>
                              <span className='text-xs font-bold text-amber-400 block'>{q.passRate}% vượt qua</span>
                              <Progress value={q.passRate} className='w-24 h-1.5 mt-1 bg-slate-700' />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* NEW SECTION 2: Lesson Dropout Bottlenecks */}
              <div className='rounded-2xl border border-white/10 bg-gradient-to-br from-red-950/30 via-slate-900/90 to-slate-900/80 backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden'>
                <div className='absolute -top-10 -left-10 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none' />
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10'>
                  <div>
                    <div className='inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider mb-2'>
                      <Icons.barChart className='w-3.5 h-3.5 rotate-180 text-red-400' />
                      Dropout & Bottlenecks Radar
                    </div>
                    <h3 className='text-xl font-bold text-white'>Các Điểm Nghẽn Cổ Chai Học Tập</h3>
                    <p className='text-sm text-slate-400'>Nơi học viên thường xuyên bị đứt quãng hoặc bỏ lỡ bài học nhất trong chương trình</p>
                  </div>
                  <div className='flex items-center gap-2 text-xs text-slate-400 bg-white/5 p-3 rounded-xl border border-white/10 max-w-sm'>
                    <Icons.bookOpen className='w-5 h-5 text-indigo-400 flex-shrink-0' />
                    <span><strong>Mẹo sư phạm:</strong> Hãy rút ngắn thời lượng video hoặc thêm slide tổng kết cho các bài này!</span>
                  </div>
                </div>

                <div className='grid gap-4 md:grid-cols-3 relative z-10'>
                  {dropoutBottlenecks.map((item) => (
                    <div key={item.id} className='p-5 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-all flex flex-col justify-between'>
                      <div>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 truncate max-w-[150px]'>
                            {item.courseName}
                          </span>
                          <span className='text-xs font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20'>
                            {item.dropRate}% gián đoạn
                          </span>
                        </div>
                        <p className='font-semibold text-slate-200 text-sm mt-2 line-clamp-2'>{item.lessonTitle}</p>
                      </div>
                      <div className='mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400'>
                        <span>Hoàn thành trung bình</span>
                        <span className='font-bold text-emerald-400'>{item.completion}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* NEW SECTION 3: Sentiment & Q&A Community Radar */}
              <div className='grid gap-6 lg:grid-cols-2'>
                {/* Rating Distribution */}
                <div className='rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-800/60 to-slate-900/90 backdrop-blur-xl p-6 shadow-2xl flex flex-col justify-between'>
                  <div>
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='text-lg font-bold text-white flex items-center gap-2'>
                        <Icons.star className='w-5 h-5 text-amber-400 fill-amber-400' />
                        Phân Bổ Đánh Giá Khóa Học
                      </h3>
                      <span className='text-xs text-slate-400 font-medium'>Tổng {sentiment.stars.reduce((acc, curr) => acc + curr.count, 0)} lượt</span>
                    </div>

                    <div className='space-y-2.5 mt-4'>
                      {sentiment.stars.map((s) => (
                        <div key={s.stars} className='flex items-center gap-3 text-sm'>
                          <div className='flex items-center gap-1 w-12 font-medium text-slate-300'>
                            <span>{s.stars}</span>
                            <Icons.star className='w-3.5 h-3.5 text-amber-400 fill-amber-400' />
                          </div>
                          <div className='flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden'>
                            <div
                              className='h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500'
                              style={{ width: `${s.percentage}%` }}
                            />
                          </div>
                          <span className='w-12 text-right text-xs font-semibold text-slate-400'>{s.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className='mt-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center justify-between'>
                    <span>🌟 <strong>Tín hiệu tích cực:</strong> Hơn 94% học viên hài lòng và đánh giá từ 4 sao trở lên!</span>
                  </div>
                </div>

                {/* Q&A Unanswered Forum Tracker */}
                <div className='rounded-2xl border border-white/10 bg-gradient-to-br from-blue-950/40 via-slate-900/90 to-slate-900/90 backdrop-blur-xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden'>
                  <div>
                    <div className='flex items-center justify-between mb-4'>
                      <div>
                        <h3 className='text-lg font-bold text-white flex items-center gap-2'>
                          <Icons.messageSquare className='w-5 h-5 text-sky-400' />
                          Nhịp Đập Thảo Luận Q&A
                        </h3>
                        <p className='text-xs text-slate-400'>Các câu hỏi mới nhất từ học viên cần sự trợ giúp từ bạn</p>
                      </div>
                      {sentiment.unansweredQnA > 0 && (
                        <span className='px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-extrabold text-xs border border-rose-500/30 flex items-center gap-1.5 animate-bounce'>
                          <span className='w-2 h-2 rounded-full bg-rose-500 animate-ping' />
                          {sentiment.unansweredQnA} chưa trả lời
                        </span>
                      )}
                    </div>

                    <div className='space-y-3 mt-4'>
                      {sentiment.recentTopics.map((t) => (
                        <div key={t.id} className='p-3.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5'>
                          <div className='flex items-center justify-between gap-2 mb-1.5'>
                            <div className='flex items-center gap-2'>
                              <span className='font-bold text-slate-200 text-xs'>{t.student}</span>
                              <span className='text-[10px] text-slate-500'>• {t.time}</span>
                            </div>
                            {t.urgent && (
                              <span className='text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30'>
                                Cần gấp
                              </span>
                            )}
                          </div>
                          <p className='text-sm text-slate-300 font-medium line-clamp-1'>{t.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className='mt-6 flex justify-end'>
                    <Link
                      to='/instructor/discussions'
                      className='inline-flex items-center gap-2 text-xs font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-4 py-2.5 rounded-xl border border-sky-500/20 transition-all'
                    >
                      <span>Mở trung tâm Thảo luận Q&A</span>
                      <Icons.arrowRight className='w-3.5 h-3.5' />
                    </Link>
                  </div>
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
