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
import PageHeader from '@/components/common/PageHeader';
import SectionCard from '@/components/common/SectionCard';
import StatCard from '@/components/common/StatCard';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowUpRight,
  GraduationCap,
  Star,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  axisProps,
  barRadiusHorizontal,
  gridProps,
  seriesColor,
  tooltipProps,
} from '@/lib/chart-theme';

const AdminReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('effectiveness');

  const { data: quizData, isLoading: quizLoading } = useQuizScoreReport();
  const { data: effectivenessData, isLoading: effectivenessLoading } =
    useCourseEffectivenessReport();
  const { data: enrollmentData, isLoading: enrollmentLoading } =
    useEnrollmentStatsReport();

  const isLoading = quizLoading || effectivenessLoading || enrollmentLoading;

  const totalEnrollments =
    effectivenessData?.reduce((s, c) => s + c.totalEnrollments, 0) || 0;
  const completedStudents =
    effectivenessData?.reduce((s, c) => s + c.completedStudents, 0) || 0;
  const avgCompletionOverall = effectivenessData?.length
    ? Math.round(
        effectivenessData.reduce((s, c) => s + c.completionRate, 0) /
          effectivenessData.length
      )
    : 0;
  const totalCourses = effectivenessData?.length || 0;
  const ratedCourses = effectivenessData?.filter((c) => c.averageRating) ?? [];
  const avgRatingOverall = ratedCourses.length
    ? (
        ratedCourses.reduce((s, c) => s + (c.averageRating || 0), 0) /
        ratedCourses.length
      ).toFixed(1)
    : '—';

  const completionPieData = [
    { name: 'Đã hoàn thành', value: completedStudents },
    { name: 'Đang học', value: Math.max(totalEnrollments - completedStudents, 0) },
  ];

  /* Chỉ lấy số lượt ghi danh cho biểu đồ cột.
     Bản trước vẽ chung số lượt ghi danh và tỷ lệ hoàn thành trên CÙNG một trục —
     một bên là số đếm hàng nghìn, một bên là phần trăm từ 0 đến 100, nên cột phần
     trăm luôn dẹp thành một vạch và biểu đồ không đọc được gì. Tỷ lệ hoàn thành
     nay nằm ở cột riêng trong bảng bên dưới, nơi nó so sánh được đúng cách. */
  const topByEnrollment = effectivenessData?.slice(0, 8) ?? [];

  return (
    <AdminLayout pageTitle="Báo cáo thống kê">
      <PageHeader
        title="Báo cáo thống kê"
        description="Phân tích hiệu quả khóa học, xu hướng ghi danh và kết quả bài kiểm tra trên toàn nền tảng."
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Tổng lượt ghi danh"
            value={totalEnrollments.toLocaleString('vi-VN')}
            icon={Users}
          />
          <StatCard
            label="Tỷ lệ hoàn thành trung bình"
            value={`${avgCompletionOverall}%`}
            icon={Target}
            hint={`trên ${totalCourses} khóa học`}
          />
          <StatCard
            label="Số khóa học có dữ liệu"
            value={totalCourses.toLocaleString('vi-VN')}
            icon={TrendingUp}
          />
          <StatCard
            label="Điểm đánh giá trung bình"
            value={avgRatingOverall}
            icon={Star}
            hint={ratedCourses.length ? `từ ${ratedCourses.length} khóa` : undefined}
          />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="effectiveness">Hiệu quả khóa học</TabsTrigger>
          <TabsTrigger value="enrollments">Ghi danh</TabsTrigger>
          <TabsTrigger value="quizzes">Bài kiểm tra</TabsTrigger>
        </TabsList>

        {/* ===== Hiệu quả khóa học ===== */}
        <TabsContent value="effectiveness" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <SectionCard
              title="Tình trạng hoàn thành"
              description="Trên tổng số lượt ghi danh"
            >
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={completionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                  >
                    <Cell fill={seriesColor(0)} />
                    <Cell fill={seriesColor(1)} />
                  </Pie>
                  <Tooltip {...tooltipProps} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-sm text-muted-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard
              title="Tám khóa học có nhiều lượt ghi danh nhất"
              className="lg:col-span-2"
            >
              {effectivenessLoading ? (
                <Skeleton className="h-60" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={topByEnrollment}
                    layout="vertical"
                    margin={{ left: 8, right: 16 }}
                  >
                    <CartesianGrid {...gridProps} vertical horizontal={false} />
                    <XAxis type="number" {...axisProps} />
                    <YAxis
                      type="category"
                      dataKey="courseName"
                      width={170}
                      {...axisProps}
                      tick={{ fill: 'var(--chart-ink)', fontSize: 11 }}
                    />
                    <Tooltip {...tooltipProps} />
                    <Bar
                      dataKey="totalEnrollments"
                      name="Lượt ghi danh"
                      fill={seriesColor(0)}
                      radius={barRadiusHorizontal}
                      maxBarSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Chi tiết theo từng khóa học" bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Khóa học</th>
                    <th className="px-3 py-3 font-medium">Giảng viên</th>
                    <th className="px-3 py-3 text-right font-medium">Ghi danh</th>
                    <th className="px-3 py-3 font-medium">Hoàn thành</th>
                    <th className="px-3 py-3 text-right font-medium">Điểm KT</th>
                    <th className="px-3 py-3 text-right font-medium">Đánh giá</th>
                    <th className="px-5 py-3 text-right font-medium">Bài học</th>
                  </tr>
                </thead>
                <tbody>
                  {effectivenessData?.map((course) => (
                    <tr
                      key={course.courseId}
                      className="border-b border-border last:border-0 transition-colors hover:bg-muted/50"
                    >
                      <td className="px-5 py-3">
                        <Link
                          to={`/courses/${course.slug}`}
                          className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
                        >
                          <span className="truncate">{course.courseName}</span>
                          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {course.instructorName}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {course.totalEnrollments.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={course.completionRate} className="h-1.5 w-16" />
                          <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                            {course.completionRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {course.avgQuizScore > 0
                          ? course.avgQuizScore.toFixed(1)
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex items-center justify-end gap-1 tabular-nums">
                          {course.averageRating ? (
                            <>
                              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                              {course.averageRating.toFixed(1)}
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                        {course.totalLessons}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!effectivenessData || effectivenessData.length === 0) && (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Chưa có dữ liệu khóa học.
                </p>
              )}
            </div>
          </SectionCard>
        </TabsContent>

        {/* ===== Ghi danh ===== */}
        <TabsContent value="enrollments" className="space-y-6">
          <SectionCard
            title="Xu hướng ghi danh"
            description="Số lượt ghi danh mới trong mười hai tháng gần nhất"
          >
            {enrollmentLoading ? (
              <Skeleton className="h-72" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={enrollmentData?.trend} margin={{ left: 0, right: 8 }}>
                  <defs>
                    <linearGradient id="fillEnroll" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={seriesColor(0)} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={seriesColor(0)} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillStudent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={seriesColor(1)} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={seriesColor(1)} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="month" {...axisProps} />
                  <YAxis {...axisProps} />
                  <Tooltip {...tooltipProps} />
                  <Legend
                    iconType="line"
                    formatter={(value) => (
                      <span className="text-sm text-muted-foreground">{value}</span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="newEnrollments"
                    name="Lượt ghi danh mới"
                    stroke={seriesColor(0)}
                    strokeWidth={2}
                    fill="url(#fillEnroll)"
                  />
                  <Area
                    type="monotone"
                    dataKey="uniqueStudents"
                    name="Học viên khác nhau"
                    stroke={seriesColor(1)}
                    strokeWidth={2}
                    fill="url(#fillStudent)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <SectionCard title="Khóa học dẫn đầu về lượt ghi danh">
            <div className="space-y-2">
              {enrollmentData?.topCoursesByEnrollment?.map((course, index) => (
                <div
                  key={course.courseId}
                  className="flex items-center gap-4 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/50"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt=""
                      className="h-9 w-14 shrink-0 rounded object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/courses/${course.slug}`}
                      className="block truncate font-medium transition-colors hover:text-primary"
                    >
                      {course.courseName}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {course.instructorName}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 tabular-nums">
                    {course.totalEnrollments} học viên
                  </Badge>
                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    <Progress value={course.avgCompletion} className="h-1.5 w-16" />
                    <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                      {course.avgCompletion.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
              {(!enrollmentData?.topCoursesByEnrollment ||
                enrollmentData.topCoursesByEnrollment.length === 0) && (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Chưa có dữ liệu ghi danh.
                </p>
              )}
            </div>
          </SectionCard>
        </TabsContent>

        {/* ===== Bài kiểm tra ===== */}
        <TabsContent value="quizzes" className="space-y-6">
          {quizLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : quizData && quizData.length > 0 ? (
            quizData.map((courseReport) => (
              <SectionCard
                key={courseReport.courseId}
                title={courseReport.courseName}
                description={`${courseReport.quizzes.length} bài kiểm tra`}
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {courseReport.quizzes.map((quiz) => (
                    <div
                      key={quiz.lessonId}
                      className="rounded-lg border border-border p-4"
                    >
                      <h4 className="mb-3 truncate text-sm font-medium">
                        {quiz.lessonName}
                      </h4>
                      <div className="mb-1 flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">
                          Điểm trung bình
                        </span>
                        <span className="text-sm font-semibold tabular-nums">
                          {quiz.avgScore.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={quiz.avgScore} className="h-1.5" />

                      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Lượt làm</dt>
                          <dd className="font-medium tabular-nums">
                            {quiz.totalAttempts}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Tỷ lệ đạt</dt>
                          <dd className="font-medium tabular-nums">{quiz.passRate}%</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Cao nhất</dt>
                          <dd className="font-medium tabular-nums">
                            {quiz.highestScore}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Thấp nhất</dt>
                          <dd className="font-medium tabular-nums">
                            {quiz.lowestScore}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              </SectionCard>
            ))
          ) : (
            <SectionCard>
              <div className="py-12 text-center">
                <GraduationCap
                  className="mx-auto mb-3 h-10 w-10 text-muted-foreground"
                  aria-hidden="true"
                />
                <h3 className="text-base font-medium">Chưa có dữ liệu bài kiểm tra</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Báo cáo sẽ xuất hiện khi học viên bắt đầu làm bài.
                </p>
              </div>
            </SectionCard>
          )}
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminReports;
