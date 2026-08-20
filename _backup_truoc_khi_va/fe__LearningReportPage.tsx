import React, { useEffect, useState } from 'react';
import { useLearningReport } from '@/hooks/queries/learningReport.queries';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PieChart, Pie, Cell } from 'recharts';
import { BookOpen, CheckCircle2, Clock, Flame, Sparkles, TrendingUp, Target, Lightbulb, AlertTriangle, Trophy, Brain, ChevronRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const AnimatedCounter = ({ from = 0, to, duration = 2 }: { from?: number, to: number, duration?: number }) => {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(from);

  useEffect(() => {
    const controls = animate(count, to, { duration, ease: "easeOut" });
    return controls.stop;
  }, [count, to, duration]);

  useEffect(() => {
    return rounded.on("change", (v) => setDisplayValue(v));
  }, [rounded]);

  return <span>{displayValue}</span>;
};

const CircularProgressRing = ({ score }: { score: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          className="text-white/10"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
        <motion.circle
          className="text-indigo-500"
          strokeWidth="8"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold text-white"><AnimatedCounter to={score} /></span>
        <span className="text-xs text-slate-400">/100</span>
      </div>
    </div>
  );
};

const LearningReportPage = () => {
  const { data, isLoading, isError, refetch } = useLearningReport();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 pt-24 text-white">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-40 w-full rounded-2xl bg-white/5" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl bg-white/5" />)}
          </div>
          <Skeleton className="h-96 w-full rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 pt-24 flex items-center justify-center">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Đã có lỗi xảy ra</h2>
          <p className="text-slate-400 mb-6">Không thể tải báo cáo học tập. Vui lòng thử lại sau.</p>
          <button 
            onClick={() => refetch()}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg mx-auto transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (data.overview.totalCourses === 0) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 pt-24 flex items-center justify-center">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl text-center max-w-lg">
          <Target className="w-16 h-16 text-indigo-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">Bạn chưa tham gia khóa học nào</h2>
          <p className="text-slate-400 mb-8">Hãy bắt đầu hành trình học tập của bạn để xem báo cáo chi tiết và nhận được các phân tích AI từ chúng tôi.</p>
          <Link to="/courses" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]">
            Khám phá khóa học ngay <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const pieData = [
    { name: 'Completed', value: data.overview.averageCompletionPercentage },
    { name: 'Remaining', value: 100 - data.overview.averageCompletionPercentage }
  ];
  const pieColors = ['#6366f1', '#1e1e2d'];

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-slate-200 pb-20">
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden pt-24 pb-16 px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-[#0a0a1a] z-0"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4"
              >
                <Brain className="w-4 h-4" /> <span>Phân tích dữ liệu học tập thông minh</span>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400"
              >
                📊 Báo Cáo Học Tập AI
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-slate-400 mt-2 text-lg"
              >
                Theo dõi tiến độ, hiệu suất và nhận lời khuyên được cá nhân hóa
              </motion.p>
            </div>
            
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="flex items-center gap-3 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 px-5 py-3 rounded-2xl"
            >
              <div className="bg-orange-500/20 p-2 rounded-xl text-orange-400">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-orange-200/70 font-medium">Chuỗi ngày học tập</div>
                <div className="text-xl font-bold text-orange-400">{data.streak} ngày liên tục</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 -mt-8 relative z-20 space-y-8">
        
        {/* STATS CARDS ROW */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-slate-400 font-medium">Khóa học</div>
              <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><BookOpen className="w-5 h-5" /></div>
            </div>
            <div className="text-4xl font-bold text-white"><AnimatedCounter to={data.overview.totalCourses} /></div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-slate-400 font-medium">Bài học hoàn thành</div>
              <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400"><CheckCircle2 className="w-5 h-5" /></div>
            </div>
            <div className="text-4xl font-bold text-white"><AnimatedCounter to={data.overview.totalCompletedLessons} /></div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-slate-400 font-medium">Thời gian học (phút)</div>
              <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400"><Clock className="w-5 h-5" /></div>
            </div>
            <div className="text-4xl font-bold text-white"><AnimatedCounter to={data.overview.totalLearningMinutes} /></div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-slate-400 font-medium">Tiến độ trung bình</div>
              <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400"><TrendingUp className="w-5 h-5" /></div>
            </div>
            <div className="text-4xl font-bold text-white"><AnimatedCounter to={data.overview.averageCompletionPercentage} />%</div>
          </motion.div>
        </motion.div>

        {/* AI ANALYSIS SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500"></div>
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white">Phân Tích AI</h2>
            </div>
            
            {!data.aiAnalysis ? (
              <div className="text-center py-8 text-slate-400 bg-white/5 rounded-xl border border-white/5">
                AI đang xử lý thêm dữ liệu học tập của bạn để đưa ra phân tích chi tiết. Hãy tiếp tục học nhé!
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1 bg-white/5 p-6 rounded-2xl border border-white/5">
                    <p className="text-lg leading-relaxed text-slate-300">
                      "{data.aiAnalysis.overallAssessment}"
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-500/10 to-transparent rounded-2xl border border-indigo-500/20 min-w-[200px]">
                    <div className="text-sm text-indigo-300 font-medium mb-4">ĐIỂM ĐỘNG LỰC</div>
                    <CircularProgressRing score={data.aiAnalysis.motivationScore} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Strengths */}
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4 text-emerald-400">
                      <Trophy className="w-5 h-5" />
                      <h3 className="font-bold">Điểm mạnh</h3>
                    </div>
                    <ul className="space-y-3">
                      {data.aiAnalysis.strengths.map((item, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Improvements */}
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4 text-amber-400">
                      <AlertTriangle className="w-5 h-5" />
                      <h3 className="font-bold">Cần cải thiện</h3>
                    </div>
                    <ul className="space-y-3">
                      {data.aiAnalysis.areasForImprovement.map((item, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-slate-300">
                          <Target className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Recommendations */}
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4 text-blue-400">
                      <Lightbulb className="w-5 h-5" />
                      <h3 className="font-bold">Lời khuyên</h3>
                    </div>
                    <ul className="space-y-3">
                      {data.aiAnalysis.recommendations.map((item, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-slate-300">
                          <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-6">Hoạt động 7 ngày qua</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weeklyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="minutesSpent" name="Phút học" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lessonsCompleted" name="Bài học" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center relative"
          >
            <h3 className="text-xl font-bold text-white mb-2 self-start w-full">Tổng quan tiến trình</h3>
            <div className="h-64 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-bold text-white"><AnimatedCounter to={data.overview.averageCompletionPercentage} />%</span>
                <span className="text-sm text-slate-400">Hoàn thành</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* COURSE PROGRESS TABLE */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-white/10">
            <h3 className="text-xl font-bold text-white">Tiến độ khóa học</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-slate-400 text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Khóa học</th>
                  <th className="px-6 py-4 font-medium">Tiến độ</th>
                  <th className="px-6 py-4 font-medium text-center">Bài học</th>
                  <th className="px-6 py-4 font-medium text-center">Điểm Quiz TB</th>
                  <th className="px-6 py-4 font-medium text-right">Hoạt động gần nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.courseProgress.map((course, idx) => (
                  <tr key={course.courseId} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {course.thumbnailUrl ? (
                          <img src={course.thumbnailUrl} alt={course.courseName} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                          </div>
                        )}
                        <span className="font-medium text-slate-200 line-clamp-1">{course.courseName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 w-48">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${course.progressPercentage}%` }}
                            transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-300">{course.progressPercentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-300">
                      {course.completedLessons} / {course.totalLessons}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {course.avgQuizScore !== null ? (
                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                          course.avgQuizScore >= 80 ? 'bg-emerald-500/10 text-emerald-400' : 
                          course.avgQuizScore >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {course.avgQuizScore}/100
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-400">
                      {course.lastActivityAt ? new Date(course.lastActivityAt).toLocaleDateString('vi-VN') : 'Chưa có'}
                    </td>
                  </tr>
                ))}
                {data.courseProgress.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      Không có dữ liệu khóa học
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* QUIZ PERFORMANCE SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-indigo-400" />
            <h3 className="text-xl font-bold text-white">Hiệu suất bài kiểm tra (Quiz)</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
              <div className="text-2xl font-bold text-white"><AnimatedCounter to={data.quizPerformance.totalAttempts} /></div>
              <div className="text-xs text-slate-400 mt-1">Tổng lượt làm</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
              <div className="text-2xl font-bold text-white"><AnimatedCounter to={data.quizPerformance.averageScore} /></div>
              <div className="text-xs text-slate-400 mt-1">Điểm trung bình</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
              <div className="text-2xl font-bold text-emerald-400">{data.quizPerformance.totalAttempts > 0 ? Math.round((data.quizPerformance.passCount / data.quizPerformance.totalAttempts) * 100) : 0}%</div>
              <div className="text-xs text-slate-400 mt-1">Tỷ lệ qua môn</div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Lượt làm gần đây</h4>
            <div className="space-y-3">
              {data.quizPerformance.recentAttempts.map((attempt, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-10 rounded-full ${attempt.isPassed ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    <div>
                      <div className="font-medium text-slate-200">{attempt.courseName}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Lần thử: {attempt.attemptNumber} • {new Date(attempt.completedAt).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-sm font-bold ${attempt.isPassed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {attempt.score}/100
                  </div>
                </div>
              ))}
              {data.quizPerformance.recentAttempts.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm">
                  Chưa có dữ liệu bài kiểm tra
                </div>
              )}
            </div>
          </div>
        </motion.div>
        
      </div>
    </div>
  );
};

export default LearningReportPage;
