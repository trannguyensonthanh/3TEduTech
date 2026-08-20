// src/pages/LearningReportPage.tsx
//
/* ============================================================================
   [VIẾT LẠI GIAO DIỆN 20/08/2026 — theo src/DESIGN-SYSTEM.md]

   Bản cũ tự dựng một "sản phẩm" riêng: nền tối cứng, thẻ kính mờ, chữ chuyển
   sắc, khối phát sáng trang trí, và hai mươi hai chỗ viết thẳng mã màu. Mở
   trang này ngay sau một trang khác của hệ thống là thấy như đổi sang phần
   mềm khác.

   Bản mới chỉ dùng token (bg-background / bg-card / text-foreground …) nên tự
   đúng ở cả chế độ sáng lẫn tối, và mượn đúng ba thành phần dùng chung
   PageHeader / SectionCard / StatCard như các trang đã chuẩn hóa.

   Một thay đổi đáng chú ý về BIỂU ĐỒ: bản cũ vẽ "phút học" và "số bài học" lên
   CÙNG một biểu đồ cột. Hai đại lượng khác đơn vị (hàng trăm phút so với vài
   bài) nên cột bài học luôn dẹp thành một vạch sát trục. Nay tách thành hai
   biểu đồ riêng, mỗi biểu đồ một trục.

   Toàn bộ logic giữ nguyên: vẫn `useLearningReport`, vẫn hiệu ứng đếm số và
   vòng tiến độ bằng framer-motion, vẫn cùng các nhánh trạng thái.
============================================================================ */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react';

import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import SectionCard from '@/components/common/SectionCard';
import StatCard from '@/components/common/StatCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useLearningReport } from '@/hooks/queries/learningReport.queries';
import {
  axisProps,
  barRadius,
  gridProps,
  seriesColor,
  tooltipProps,
} from '@/lib/chart-theme';

/** Số đếm tăng dần. Giữ nguyên cách chạy của bản cũ, chỉ bỏ phần tô màu. */
const AnimatedCounter = ({
  from = 0,
  to,
  duration = 2,
}: {
  from?: number;
  to: number;
  duration?: number;
}) => {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(from);

  useEffect(() => {
    const controls = animate(count, to, { duration, ease: 'easeOut' });
    return controls.stop;
  }, [count, to, duration]);

  useEffect(() => {
    return rounded.on('change', (v) => setDisplayValue(v));
  }, [rounded]);

  return <span>{displayValue}</span>;
};

/** Vòng tròn điểm động lực. Rãnh dùng màu đường viền, phần chạy dùng màu chính. */
const CircularProgressRing = ({ score }: { score: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle
          className="text-border"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
        <motion.circle
          className="text-primary"
          strokeWidth="8"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-semibold tabular-nums text-foreground">
          <AnimatedCounter to={score} />
        </span>
        <span className="text-xs text-muted-foreground">trên 100</span>
      </div>
    </div>
  );
};

const LearningReportPage = () => {
  const { data, isLoading, isError, refetch } = useLearningReport();

  /* ------------------------------- Đang tải ------------------------------- */
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto max-w-7xl space-y-6 px-4 py-10">
          <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </Layout>
    );
  }

  /* --------------------------------- Lỗi --------------------------------- */
  if (isError || !data) {
    return (
      <Layout>
        <div className="container mx-auto max-w-md px-4 py-20 text-center">
          <AlertTriangle
            className="mx-auto mb-4 h-12 w-12 text-danger"
            aria-hidden="true"
          />
          <h2 className="mb-2 text-xl font-semibold">Đã có lỗi xảy ra</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Không tải được báo cáo học tập. Vui lòng thử lại sau.
          </p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Thử lại
          </Button>
        </div>
      </Layout>
    );
  }

  /* --------------------------- Chưa học khóa nào -------------------------- */
  if (data.overview.totalCourses === 0) {
    return (
      <Layout>
        <div className="container mx-auto max-w-lg px-4 py-20 text-center">
          <Target
            className="mx-auto mb-6 h-14 w-14 text-muted-foreground"
            aria-hidden="true"
          />
          <h2 className="mb-3 text-2xl font-semibold tracking-tight">
            Bạn chưa tham gia khóa học nào
          </h2>
          <p className="mb-8 text-sm text-muted-foreground">
            Hãy bắt đầu hành trình học tập để xem báo cáo chi tiết và nhận phân
            tích riêng cho bạn.
          </p>
          <Link to="/courses">
            <Button size="lg">Khám phá khóa học</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const completion = data.overview.averageCompletionPercentage;
  const progressPieData = [
    { name: 'Đã hoàn thành', value: completion },
    { name: 'Còn lại', value: Math.max(100 - completion, 0) },
  ];

  const passRate =
    data.quizPerformance.totalAttempts > 0
      ? Math.round(
          (data.quizPerformance.passCount / data.quizPerformance.totalAttempts) *
            100
        )
      : 0;

  return (
    <Layout>
      <div className="container mx-auto max-w-7xl space-y-6 px-4 py-10">
        <PageHeader
          title="Báo cáo học tập"
          description="Theo dõi tiến độ, hiệu suất và nhận lời khuyên được cá nhân hóa."
          actions={
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <Flame className="h-4 w-4 text-warning" aria-hidden="true" />
              <span className="text-sm">
                Chuỗi ngày học:{' '}
                <strong className="tabular-nums">{data.streak}</strong> ngày
              </span>
            </div>
          }
        />

        {/* ===== Bốn số liệu tổng quan ===== */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Khóa học đang theo"
            value={<AnimatedCounter to={data.overview.totalCourses} />}
            icon={BookOpen}
          />
          <StatCard
            label="Bài học đã hoàn thành"
            value={<AnimatedCounter to={data.overview.totalCompletedLessons} />}
            icon={CheckCircle2}
          />
          <StatCard
            label="Thời gian học"
            value={<AnimatedCounter to={data.overview.totalLearningMinutes} />}
            icon={Clock}
            hint="phút"
          />
          <StatCard
            label="Tiến độ trung bình"
            value={
              <>
                <AnimatedCounter to={completion} />%
              </>
            }
            icon={TrendingUp}
          />
        </div>

        {/* ===== Phân tích của trợ lý AI ===== */}
        <SectionCard
          title="Phân tích của trợ lý AI"
          description="Nhận xét dựa trên dữ liệu học tập của riêng bạn"
        >
          {!data.aiAnalysis ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Trợ lý đang cần thêm dữ liệu học tập để đưa ra nhận xét. Hãy tiếp
              tục học nhé.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-stretch gap-6 md:flex-row">
                <div className="flex-1 rounded-lg border border-border p-5">
                  <p className="text-sm leading-relaxed text-foreground">
                    {data.aiAnalysis.overallAssessment}
                  </p>
                </div>
                <div className="flex min-w-[200px] flex-col items-center justify-center rounded-lg border border-border p-5">
                  <span className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Điểm động lực
                  </span>
                  <CircularProgressRing
                    score={data.aiAnalysis.motivationScore}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Trophy
                      className="h-4 w-4 text-success"
                      aria-hidden="true"
                    />
                    Điểm mạnh
                  </h3>
                  <ul className="space-y-2.5">
                    {data.aiAnalysis.strengths.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex gap-2.5 text-sm text-muted-foreground"
                      >
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0 text-success"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-border p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle
                      className="h-4 w-4 text-warning"
                      aria-hidden="true"
                    />
                    Cần cải thiện
                  </h3>
                  <ul className="space-y-2.5">
                    {data.aiAnalysis.areasForImprovement.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex gap-2.5 text-sm text-muted-foreground"
                      >
                        <Target
                          className="mt-0.5 h-4 w-4 shrink-0 text-warning"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-border p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Lightbulb
                      className="h-4 w-4 text-primary"
                      aria-hidden="true"
                    />
                    Lời khuyên
                  </h3>
                  <ul className="space-y-2.5">
                    {data.aiAnalysis.recommendations.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex gap-2.5 text-sm text-muted-foreground"
                      >
                        <Sparkles
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        {/* ===== Hai biểu đồ hoạt động, mỗi biểu đồ MỘT đơn vị ===== */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Thời gian học bảy ngày qua"
            description="Đơn vị: phút"
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data.weeklyActivity}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip {...tooltipProps} />
                <Bar
                  dataKey="minutesSpent"
                  name="Phút học"
                  fill={seriesColor(0)}
                  radius={barRadius}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard
            title="Bài học hoàn thành bảy ngày qua"
            description="Đơn vị: bài học"
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data.weeklyActivity}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" {...axisProps} />
                <YAxis {...axisProps} allowDecimals={false} />
                <Tooltip {...tooltipProps} />
                <Bar
                  dataKey="lessonsCompleted"
                  name="Bài học"
                  fill={seriesColor(0)}
                  radius={barRadius}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>

        {/* ===== Tiến độ chung + hiệu suất bài kiểm tra ===== */}
        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard
            title="Tiến độ trung bình"
            description="Trên tất cả khóa học đang theo"
          >
            <div className="relative">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={progressPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={92}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                  >
                    <Cell fill={seriesColor(0)} />
                    <Cell fill="hsl(var(--muted))" />
                  </Pie>
                  <Tooltip {...tooltipProps} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold tabular-nums">
                  <AnimatedCounter to={completion} />%
                </span>
                <span className="text-xs text-muted-foreground">
                  Đã hoàn thành
                </span>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Hiệu suất bài kiểm tra"
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-2xl font-semibold tabular-nums">
                  <AnimatedCounter to={data.quizPerformance.totalAttempts} />
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tổng lượt làm
                </p>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-2xl font-semibold tabular-nums">
                  <AnimatedCounter to={data.quizPerformance.averageScore} />
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Điểm trung bình
                </p>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-2xl font-semibold tabular-nums">
                  {passRate}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Tỷ lệ đạt</p>
              </div>
            </div>

            <h3 className="mb-3 mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Lượt làm gần đây
            </h3>
            <div className="space-y-2">
              {data.quizPerformance.recentAttempts.map((attempt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {attempt.courseName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Lần thử {attempt.attemptNumber} ·{' '}
                      {new Date(attempt.completedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium tabular-nums ${
                      attempt.isPassed
                        ? 'bg-success-soft text-success'
                        : 'bg-danger-soft text-danger'
                    }`}
                  >
                    {attempt.isPassed ? (
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {attempt.isPassed ? 'Đạt' : 'Chưa đạt'} · {attempt.score}/100
                  </span>
                </div>
              ))}
              {data.quizPerformance.recentAttempts.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Chưa có dữ liệu bài kiểm tra.
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        {/* ===== Bảng tiến độ từng khóa học ===== */}
        <SectionCard title="Tiến độ theo từng khóa học" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Khóa học</th>
                  <th className="px-3 py-3 font-medium">Tiến độ</th>
                  <th className="px-3 py-3 text-center font-medium">Bài học</th>
                  <th className="px-3 py-3 text-center font-medium">
                    Điểm kiểm tra
                  </th>
                  <th className="px-5 py-3 text-right font-medium">
                    Hoạt động gần nhất
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.courseProgress.map((course) => (
                  <tr
                    key={course.courseId}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <BookOpen className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                        <span className="line-clamp-1 font-medium">
                          {course.courseName}
                        </span>
                      </div>
                    </td>
                    <td className="w-48 px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={course.progressPercentage}
                          className="h-1.5 w-20"
                        />
                        <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                          {course.progressPercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums text-muted-foreground">
                      {course.completedLessons} / {course.totalLessons}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {course.avgQuizScore !== null ? (
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium tabular-nums ${
                            course.avgQuizScore >= 80
                              ? 'bg-success-soft text-success'
                              : course.avgQuizScore >= 50
                                ? 'bg-warning-soft text-warning'
                                : 'bg-danger-soft text-danger'
                          }`}
                        >
                          {course.avgQuizScore}/100
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground">
                      {course.lastActivityAt
                        ? new Date(course.lastActivityAt).toLocaleDateString(
                            'vi-VN'
                          )
                        : 'Chưa có'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.courseProgress.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Chưa có dữ liệu khóa học.
              </p>
            )}
          </div>
        </SectionCard>
      </div>
    </Layout>
  );
};

export default LearningReportPage;
