// src/pages/instructor/InstructorAnalytics.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import InstructorLayout from '@/components/layout/InstructorLayout';
import { useInstructorAnalytics } from '@/hooks/queries/admin.queries';
import { useSettings } from '@/contexts/SettingsContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/common/PageHeader';
import SectionCard from '@/components/common/SectionCard';
import StatCard from '@/components/common/StatCard';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  DollarSign, Users,
  Star, BookOpen,
  AlertCircle, ArrowRight, MessageSquare, Sparkles, TrendingDown,
} from 'lucide-react';
import { axisProps, gridProps, seriesColor, tooltipProps } from '@/lib/chart-theme';

const InstructorAnalytics: React.FC = () => {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const { data, isLoading: queryLoading } = useInstructorAnalytics(period);
  const isLoading = queryLoading && !data;
  const { formatPrice } = useSettings();

  const stats = data?.stats;
  const timeSeries = data?.timeSeries || [];
  const coursePerformance = data?.coursePerformance || [];
  /* [SỬA 19/08/2026] GỠ TOÀN BỘ DỮ LIỆU MẪU GHI CỨNG.

     Trước đây ba khối dưới đây có sẵn số liệu bịa làm giá trị dự phòng: tỷ lệ
     đỗ 85.4%, ba câu hỏi khó bịa, ba điểm nghẽn bịa, và hai chủ đề thảo luận
     kèm TÊN HỌC VIÊN BỊA. Máy chủ nay không còn trả về những số này nữa, nên
     giữ lại phần dự phòng đồng nghĩa với việc mọi giảng viên đều nhìn thấy
     cùng một bộ số không có thật.

     Nay hiển thị đúng những gì máy chủ trả về, và khi chưa có dữ liệu thì nói
     thẳng là chưa có. */
  const quizStats = data?.quizStats;
  const hardestQuestions = quizStats?.hardestQuestions ?? [];
  const hasQuizStats = Number(quizStats?.totalAttempts ?? 0) > 0;

  const dropoutBottlenecks = data?.dropoutBottlenecks ?? [];
  const sentiment = data?.sentiment;
  const starBreakdown = sentiment?.stars ?? [];
  const recentTopics = sentiment?.recentTopics ?? [];
  const unansweredQnA = Number(sentiment?.unansweredQnA ?? 0);

  const totalRatingCount = starBreakdown.reduce((acc, curr) => acc + curr.count, 0);
  /* Tỷ lệ đánh giá tích cực tính từ dữ liệu thật thay vì ghi cứng "hơn 94%". */
  const positiveRatingPercent = totalRatingCount
    ? Math.round(
        (starBreakdown
          .filter((s) => s.stars >= 4)
          .reduce((acc, curr) => acc + curr.count, 0) /
          totalRatingCount) *
          100
      )
    : 0;

  return (
    <InstructorLayout pageTitle="Phân tích">
      <PageHeader
        title="Phân tích"
        description="Theo dõi hiệu quả giảng dạy, doanh thu và sức khỏe nội dung của bạn."
      />

      {/* Hàng thẻ số liệu: dùng StatCard chung nên bốn thẻ luôn cùng cỡ, cùng nền
          trung tính — bản trước mỗi thẻ tự tô một màu nên hàng này ra bốn màu. */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng doanh thu"
          value={formatPrice(stats?.totalRevenue || 0)}
          icon={DollarSign}
          isLoading={isLoading}
        />
        <StatCard
          label="Tổng học viên"
          value={(stats?.totalStudents || 0).toLocaleString('vi-VN')}
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          label="Tổng khóa học"
          value={stats?.totalCourses || 0}
          icon={BookOpen}
          isLoading={isLoading}
        />
        <StatCard
          label="Điểm đánh giá trung bình"
          value={stats?.avgRating || '0'}
          icon={Star}
          isLoading={isLoading}
        />
      </div>

      <Tabs
        value={period}
        onValueChange={(v) => setPeriod(v as 'weekly' | 'monthly')}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="weekly">Theo tuần</TabsTrigger>
          <TabsTrigger value="monthly">Theo tháng</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="space-y-6">
          {/* Học viên và doanh thu nằm ở HAI biểu đồ riêng: một bên là số người,
              một bên là tiền. Gộp chung một trục thì đường học viên bị ép dẹp. */}
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Học viên ghi danh mới">
              {isLoading ? (
                <Skeleton className="h-72 rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeries} margin={{ left: 0, right: 8 }}>
                    <defs>
                      <linearGradient id="fillNewStudents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={seriesColor(0)} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={seriesColor(0)} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="period" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip {...tooltipProps} />
                    <Area
                      type="monotone"
                      dataKey="newStudents"
                      name="Học viên mới"
                      stroke={seriesColor(0)}
                      strokeWidth={2}
                      fill="url(#fillNewStudents)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

            <SectionCard title="Doanh thu">
              {isLoading ? (
                <Skeleton className="h-72 rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeries} margin={{ left: 0, right: 8 }}>
                    <defs>
                      <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={seriesColor(1)} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={seriesColor(1)} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="period" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip
                      {...tooltipProps}
                      formatter={(value: number) => [formatPrice(value), 'Doanh thu']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Doanh thu"
                      stroke={seriesColor(1)}
                      strokeWidth={2}
                      fill="url(#fillRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          </div>

          <SectionCard
            title="Hiệu quả từng khóa học"
            description="Xếp theo thứ tự trả về từ hệ thống"
          >
            <div className="space-y-2">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))
              ) : coursePerformance.length > 0 ? (
                coursePerformance.map((course, i) => (
                  <div
                    key={course.courseId}
                    className="flex items-center gap-4 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/50"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/courses/${course.slug}`}
                        className="block truncate font-medium transition-colors hover:text-primary"
                      >
                        {course.courseName}
                      </Link>
                      <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 tabular-nums">
                          <Users className="h-3 w-3" aria-hidden="true" />
                          {course.enrollments}
                        </span>
                        {course.averageRating && (
                          <span className="flex items-center gap-1 tabular-nums">
                            <Star
                              className="h-3 w-3 fill-warning text-warning"
                              aria-hidden="true"
                            />
                            {course.averageRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatPrice(course.revenue)}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Progress value={course.avgCompletion} className="h-1.5 w-20" />
                        <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                          {course.avgCompletion.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Chưa có dữ liệu hiệu quả khóa học. Hãy xuất bản khóa học để bắt đầu
                  theo dõi.
                </p>
              )}
            </div>
          </SectionCard>

          {/* ===== Sức khỏe bài kiểm tra ===== */}
          <div className="grid gap-6 lg:grid-cols-3">
            <SectionCard
              title="Sức khỏe bài kiểm tra"
              description="Theo dõi hiệu suất làm bài trắc nghiệm để chuẩn hóa độ khó sư phạm."
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-4 text-center">
                  <span className="mb-1 block text-xs text-muted-foreground">
                    Tỷ lệ thi đỗ
                  </span>
                  <span className="text-2xl font-semibold tabular-nums">
                    {hasQuizStats ? `${quizStats?.avgPassRate ?? 0}%` : '—'}
                  </span>
                </div>
                <div className="rounded-lg border border-border p-4 text-center">
                  <span className="mb-1 block text-xs text-muted-foreground">
                    Điểm trung bình (thang 10)
                  </span>
                  <span className="text-2xl font-semibold tabular-nums">
                    {hasQuizStats ? (quizStats?.avgScore ?? 0) : '—'}
                  </span>
                </div>
              </div>

              {!hasQuizStats && (
                <p className="mt-4 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                  Chưa có lượt làm bài kiểm tra nào trong các khóa học của bạn. Số liệu
                  sẽ xuất hiện khi học viên bắt đầu làm bài.
                </p>
              )}
            </SectionCard>

            <SectionCard
              title="Câu hỏi khó nhất"
              description="Những câu khiến học viên trả lời sai nhiều nhất"
              className="lg:col-span-2"
              actions={
                <Badge variant="outline" className="gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
                  Cần lưu ý
                </Badge>
              }
            >
              <div className="space-y-2">
                {hardestQuestions.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Chưa đủ dữ liệu để xác định câu hỏi khó.
                  </p>
                )}
                {hardestQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="flex flex-col justify-between gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold tabular-nums text-muted-foreground">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p
                          className="line-clamp-1 text-sm font-medium text-foreground"
                          title={q.question}
                        >
                          {q.question}
                        </p>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {q.courseName}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 self-end text-right sm:self-center">
                      <span className="block text-xs font-medium tabular-nums text-muted-foreground">
                        {q.passRate}% vượt qua
                      </span>
                      <Progress value={q.passRate} className="mt-1 h-1.5 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* ===== Điểm nghẽn học tập ===== */}
          <SectionCard
            title="Các điểm nghẽn học tập"
            description="Nơi học viên thường bị đứt quãng hoặc bỏ lỡ bài học nhất"
            actions={
              <span className="hidden max-w-sm items-center gap-2 text-xs text-muted-foreground md:flex">
                <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="font-medium text-foreground">Mẹo sư phạm:</strong>{' '}
                  rút ngắn thời lượng video hoặc thêm slide tổng kết cho các bài này.
                </span>
              </span>
            }
          >
            <div className="grid gap-4 md:grid-cols-3">
              {dropoutBottlenecks.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground md:col-span-3">
                  Chưa đủ dữ liệu tiến độ để xác định điểm nghẽn.
                </p>
              )}
              {dropoutBottlenecks.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-lg border border-border p-5"
                >
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-muted-foreground">
                        {item.courseName}
                      </span>
                      {/* Màu cảnh báo luôn đi kèm biểu tượng và nhãn chữ,
                          không để riêng màu gánh ý nghĩa. */}
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium tabular-nums text-danger">
                        <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                        {item.dropRate}% gián đoạn
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-medium text-foreground">
                      {item.lessonTitle}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>Hoàn thành trung bình</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {item.completion}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ===== Đánh giá và thảo luận ===== */}
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              title="Phân bổ đánh giá khóa học"
              actions={
                <span className="text-xs tabular-nums text-muted-foreground">
                  Tổng {totalRatingCount} lượt
                </span>
              }
            >
              <div className="space-y-2.5">
                {starBreakdown.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Khóa học của bạn chưa có lượt đánh giá nào.
                  </p>
                )}
                {starBreakdown.map((s) => (
                  <div key={s.stars} className="flex items-center gap-3 text-sm">
                    <div className="flex w-12 items-center gap-1 text-muted-foreground">
                      <span className="tabular-nums">{s.stars}</span>
                      <Star
                        className="h-3.5 w-3.5 fill-warning text-warning"
                        aria-hidden="true"
                      />
                    </div>
                    <Progress value={s.percentage} className="h-2 flex-1" />
                    <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                      {s.percentage}%
                    </span>
                  </div>
                ))}
              </div>

              {totalRatingCount > 0 && (
                <p className="mt-6 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                  <strong className="font-medium text-foreground">Tín hiệu:</strong>{' '}
                  {positiveRatingPercent}% học viên đánh giá từ 4 sao trở lên.
                </p>
              )}
            </SectionCard>

            <SectionCard
              title="Thảo luận hỏi đáp"
              description="Các câu hỏi mới nhất từ học viên đang chờ bạn trả lời"
              actions={
                unansweredQnA > 0 ? (
                  <Badge variant="outline" className="gap-1.5 tabular-nums">
                    <MessageSquare
                      className="h-3.5 w-3.5 text-warning"
                      aria-hidden="true"
                    />
                    {unansweredQnA} chưa trả lời
                  </Badge>
                ) : undefined
              }
            >
              <div className="space-y-2">
                {recentTopics.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Không có câu hỏi nào đang chờ trả lời.
                  </p>
                )}
                {recentTopics.map((t) => (
                  <div key={t.id} className="rounded-lg border border-border p-3.5">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-xs font-medium text-foreground">
                          {t.student}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          • {t.time}
                        </span>
                      </div>
                      {t.urgent && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-danger">
                          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          Cần gấp
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {t.title}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <Link
                  to="/instructor/discussions"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:underline"
                >
                  <span>Mở trung tâm thảo luận hỏi đáp</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>
    </InstructorLayout>
  );
};

export default InstructorAnalytics;
