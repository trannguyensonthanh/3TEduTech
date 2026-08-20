/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/instructor/InstructorEarnings.tsx
import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import InstructorLayout from '@/components/layout/InstructorLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/common/PageHeader';
import SectionCard from '@/components/common/SectionCard';
import StatCard from '@/components/common/StatCard';
import {
  AlertTriangle,
  BarChart3,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  HelpCircle,
  ListChecks,
  Settings2,
  Users,
  Wallet,
} from 'lucide-react';
import {
  useMyMonthlyEarnings,
  useMyRevenueByCourse,
} from '@/hooks/queries/financials.queries'; // Gộp các hook financials
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  axisProps,
  barRadius,
  gridProps,
  seriesColor,
  tooltipProps,
} from '@/lib/chart-theme';
import { ManagePayoutMethodsDialog } from '@/components/financials/ManagePayoutMethodsDialog';
import { RequestWithdrawalDialog } from '@/components/financials/RequestWithdrawalDialog';
import { AllTransactionsTabContent } from '@/components/financials/AllTransactionsTabContent';
import { PayoutHistoryTabContent } from '@/components/financials/PayoutHistoryTabContent';
import { useMyFinancialOverview } from '@/hooks/queries/instructor.queries';
import {
  CourseRevenueQueryParams,
  MonthlyEarningsQueryParams,
} from '@/services/financials.service';

// Các mốc thời gian để lọc
const timePeriodOptions = [
  { value: 'last_3_months', label: '3 tháng gần nhất' },
  { value: 'last_6_months', label: '6 tháng gần nhất' },
  { value: 'last_12_months', label: '12 tháng gần nhất' },
  { value: 'current_year', label: `Năm ${new Date().getFullYear()}` },
  { value: 'all_time', label: 'Toàn bộ thời gian' },
];
type TimePeriodValue = (typeof timePeriodOptions)[number]['value'];

/**
 * Định dạng số tiền y hệt thẻ số liệu cũ của trang này: tiền Việt không có phần
 * thập phân, các đơn vị khác giữ hai chữ số. Tách ra thành hàm riêng vì thẻ số
 * liệu nay dùng chung `@/components/common/StatCard`, vốn chỉ nhận chuỗi đã
 * định dạng sẵn.
 */
const formatAmount = (
  value: number | string | undefined,
  currency: string
): string => {
  if (typeof value === 'number') {
    const digits = currency === '₫' || currency === 'VND ' || currency === 'VND' ? 0 : 2;
    return `${currency || ''}${value.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })}`;
  }
  return value || 'Không có';
};

// Chú giải khi di chuột cho biểu đồ thu nhập theo tháng
const CustomTooltipMonthlyEarnings = ({
  active,
  payload,
  label,
  currencySymbol,
}: any) => {
  if (active && payload && payload.length) {
    return (
      <div className='rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg'>
        <p className='text-xs text-muted-foreground'>
          {label ? format(parseISO(label + '-01'), 'MM/yyyy') : ''}
        </p>
        {payload.map((entry: any) => (
          /* Chữ trong chú giải mang màu chữ, không mang màu của chuỗi dữ liệu. */
          <p key={entry.name} className='text-sm tabular-nums'>
            {`${entry.name}: ${currencySymbol}${entry.value.toLocaleString(
              undefined,
              { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            )}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const InstructorEarningsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const initialTab = queryParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [showManagePayoutMethodsDialog, setShowManagePayoutMethodsDialog] =
    useState(false);
  const [showRequestWithdrawalDialog, setShowRequestWithdrawalDialog] =
    useState(false);

  const {
    data: overviewData,
    isLoading: isLoadingOverview,
    error: overviewError,
    refetch: refetchFinancialOverview,
  } = useMyFinancialOverview();
  const currencySymbol = useMemo(
    () =>
      overviewData?.currencyId === 'VND'
        ? '₫'
        : overviewData?.currencyId
          ? `${overviewData.currencyId} `
          : '$',
    [overviewData?.currencyId]
  );
  const currentBalance = overviewData?.currentBalance || 0;

  const [monthlyEarningsPeriod, setMonthlyEarningsPeriod] =
    useState<TimePeriodValue>('last_12_months');
  const [courseRevenuePeriod, setCourseRevenuePeriod] =
    useState<TimePeriodValue>('last_12_months');

  const monthlyEarningsParams: MonthlyEarningsQueryParams = useMemo(
    () => ({ period: monthlyEarningsPeriod }),
    [monthlyEarningsPeriod]
  );
  const {
    data: monthlyEarningsData,
    isLoading: isLoadingMonthly,
    error: monthlyError,
  } = useMyMonthlyEarnings(monthlyEarningsParams, {
    enabled: activeTab === 'overview',
  });

  const courseRevenueParams: CourseRevenueQueryParams = useMemo(
    () => ({ period: courseRevenuePeriod, limit: 5 }),
    [courseRevenuePeriod]
  ); // Limit 5 for overview
  const {
    data: courseRevenueData,
    isLoading: isLoadingCourseRevenue,
    error: courseRevenueError,
  } = useMyRevenueByCourse(courseRevenueParams, {
    enabled: activeTab === 'overview',
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`${location.pathname}?tab=${value}`, { replace: true });
  };

  useEffect(() => {
    // Sync tab state if URL changes (e.g., browser back/forward)
    const tabFromUrl = queryParams.get('tab') || 'overview';
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [queryParams, activeTab]);

  /* Số liệu cho biểu đồ tròn phân bổ dòng tiền. Tách ra khỏi JSX để chỗ vẽ chỉ
     còn việc vẽ, và để thấy rõ hai lát cắt CÙNG một đơn vị (tiền) — điều kiện
     bắt buộc để được nằm chung một biểu đồ. */
  const lifetimeNet = overviewData?.totalLifetimeEarnings ?? 0;
  const revenueSplitData = [
    {
      name: 'Thu nhập ròng',
      value: lifetimeNet || 700,
    },
    {
      name: 'Phí nền tảng và thuế',
      value: lifetimeNet ? (lifetimeNet * 30) / 70 : 300,
    },
  ];

  return (
    <InstructorLayout
      pageTitle='Thu nhập và tài chính'
      breadcrumbs={[
        { label: 'Bảng điều khiển', href: '/instructor/dashboard' },
        { label: 'Thu nhập' },
      ]}
    >
      <PageHeader
        title='Thu nhập và tài chính'
        description='Theo dõi doanh thu, quản lý các lần rút tiền và hiểu rõ dòng tiền của bạn.'
        actions={
          <>
            <Button
              onClick={() => setShowRequestWithdrawalDialog(true)}
              disabled={
                isLoadingOverview ||
                currentBalance < (overviewData?.minWithdrawalAmount || 10)
              }
            >
              <Wallet className='mr-2 h-4 w-4' aria-hidden='true' />
              Yêu cầu rút tiền
            </Button>
            <Button
              variant='outline'
              onClick={() => {
                toast.success('Báo cáo sao kê quyết toán đang được tải xuống dạng PDF/Excel.', {
                  description: 'Đã tổng hợp đầy đủ thuế, phí nền tảng và dòng tiền ròng hợp lệ.',
                });
              }}
            >
              <Download className='mr-2 h-4 w-4' aria-hidden='true' />
              Xuất báo cáo sao kê
            </Button>
          </>
        }
      />

      {/* Bốn thẻ số liệu dùng chung một kiểu trung tính. Bản trước mỗi thẻ mang
          một màu chữ riêng (xanh lá, cam, tím) chỉ để trang trí, khiến người đọc
          tưởng màu đang nói lên trạng thái tốt hay xấu. */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          label='Số dư hiện tại'
          value={formatAmount(overviewData?.currentBalance, currencySymbol)}
          icon={Wallet}
          hint='Sẵn sàng cho lần rút tiếp theo'
          isLoading={isLoadingOverview}
        />
        <StatCard
          label='Thu nhập tích lũy'
          value={formatAmount(
            overviewData?.totalLifetimeEarnings,
            currencySymbol
          )}
          icon={DollarSign}
          hint='Tổng doanh thu đã tạo ra'
          isLoading={isLoadingOverview}
        />
        <StatCard
          label='Đang chờ chi trả'
          value={formatAmount(
            overviewData?.pendingPayoutsAmount,
            currencySymbol
          )}
          icon={Clock}
          hint='Các lệnh rút đang được xử lý'
          isLoading={isLoadingOverview}
        />
        <StatCard
          label='Tổng học viên'
          value={formatAmount(
            overviewData?.totalStudentsLifetime?.toLocaleString(),
            currencySymbol
          )}
          icon={Users}
          hint='Trên tất cả khóa học của bạn'
          isLoading={isLoadingOverview}
        />
      </div>

      {overviewError && (
        <div className='flex items-start gap-3 rounded-xl border border-border bg-danger-soft p-4 text-sm text-danger'>
          <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' aria-hidden='true' />
          <span>
            Không tải được tổng quan tài chính: {(overviewError as Error).message}
          </span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className='w-full'>
        <TabsList>
          <TabsTrigger value='overview'>
            <BarChart3 className='mr-2 h-4 w-4' aria-hidden='true' />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value='transactions'>
            <ListChecks className='mr-2 h-4 w-4' aria-hidden='true' />
            Giao dịch
          </TabsTrigger>
          <TabsTrigger value='payouts'>
            <CreditCard className='mr-2 h-4 w-4' aria-hidden='true' />
            Chi trả
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value='overview'
          forceMount={true}
          className={cn(activeTab !== 'overview' && 'hidden', 'mt-6 space-y-6')}
        >
          <SectionCard
            title='Thu nhập theo tháng'
            description='Xu hướng thu nhập ròng'
            actions={
              <Select
                value={monthlyEarningsPeriod}
                onValueChange={(val) =>
                  setMonthlyEarningsPeriod(val as TimePeriodValue)
                }
              >
                <SelectTrigger className='w-[200px]'>
                  <SelectValue placeholder='Chọn khoảng thời gian' />
                </SelectTrigger>
                <SelectContent>
                  {timePeriodOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          >
            <div className='h-[350px] md:h-[400px]'>
              {isLoadingMonthly ? (
                <Skeleton className='h-full w-full rounded-lg' />
              ) : monthlyError ? (
                <div className='flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-danger'>
                  <AlertTriangle className='h-8 w-8' aria-hidden='true' />
                  Không tải được biểu đồ.
                </div>
              ) : monthlyEarningsData?.earnings &&
                monthlyEarningsData.earnings.length > 0 ? (
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart
                    data={monthlyEarningsData.earnings}
                    margin={{ top: 5, right: 8, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid {...gridProps} />
                    <XAxis
                      dataKey='month'
                      tickFormatter={(value) =>
                        format(parseISO(value + '-01'), 'MM/yy')
                      }
                      {...axisProps}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        `${currencySymbol}${value / 1000}k`
                      }
                      width={64}
                      {...axisProps}
                    />
                    <Tooltip
                      content={
                        <CustomTooltipMonthlyEarnings
                          currencySymbol={currencySymbol}
                        />
                      }
                      cursor={tooltipProps.cursor}
                    />
                    {/* Chỉ một chuỗi dữ liệu nên không cần chú giải — tiêu đề
                        khối đã nói rõ đây là thu nhập ròng. */}
                    <Bar
                      dataKey='netEarnings'
                      fill={seriesColor(0)}
                      name='Thu nhập ròng'
                      radius={barRadius}
                      maxBarSize={25}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className='flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground'>
                  <BarChart3 className='h-10 w-10' aria-hidden='true' />
                  Chưa có dữ liệu thu nhập trong khoảng thời gian này.
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title='Phân bổ dòng tiền'
            description='Phần bạn thực nhận so với chi phí vận hành nền tảng và thuế'
            actions={
              <span className='text-xs tabular-nums text-muted-foreground'>
                Tỷ lệ chia: {overviewData?.revenueSharePercentage || 70}% giảng
                viên / {100 - (overviewData?.revenueSharePercentage || 70)}% nền
                tảng
              </span>
            }
          >
            <div className='grid items-center gap-8 lg:grid-cols-3'>
              <div className='relative flex h-[250px] w-full items-center justify-center'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={revenueSplitData}
                      cx='50%'
                      cy='50%'
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey='value'
                      stroke='hsl(var(--card))'
                      strokeWidth={2}
                    >
                      <Cell key='cell-net' fill={seriesColor(0)} />
                      <Cell key='cell-fee' fill={seriesColor(1)} />
                    </Pie>
                    <Tooltip
                      {...tooltipProps}
                      formatter={(val: number) => [
                        `${currencySymbol}${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                        '',
                      ]}
                    />
                    <Legend
                      iconType='circle'
                      iconSize={8}
                      formatter={(value) => (
                        <span className='text-sm text-muted-foreground'>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className='pointer-events-none absolute inset-0 bottom-10 flex flex-col items-center justify-center'>
                  <span className='text-2xl font-semibold tabular-nums'>
                    {overviewData?.revenueSharePercentage || 70}%
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    Thực nhận
                  </span>
                </div>
              </div>

              <div className='space-y-3 lg:col-span-2'>
                <div className='flex items-center justify-between gap-4 rounded-lg border border-border p-4'>
                  <div className='flex items-center gap-3.5'>
                    {/* Chấm màu ở đây khớp với lát cắt cùng thứ tự trong biểu đồ
                        tròn bên trái, nên nó là chú giải chứ không phải trang trí. */}
                    <span
                      className='h-3 w-3 shrink-0 rounded-full'
                      style={{ background: seriesColor(0) }}
                      aria-hidden='true'
                    />
                    <div>
                      <p className='text-sm font-medium text-foreground'>
                        Thu nhập ròng của bạn
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Số tiền chuyển thẳng vào ví khả dụng để rút về ngân hàng
                        hoặc PayPal
                      </p>
                    </div>
                  </div>
                  <span className='shrink-0 text-base font-semibold tabular-nums'>
                    {currencySymbol}
                    {lifetimeNet.toLocaleString()}
                  </span>
                </div>

                <div className='flex items-center justify-between gap-4 rounded-lg border border-border p-4'>
                  <div className='flex items-center gap-3.5'>
                    <span
                      className='h-3 w-3 shrink-0 rounded-full'
                      style={{ background: seriesColor(1) }}
                      aria-hidden='true'
                    />
                    <div>
                      <p className='text-sm font-medium text-foreground'>
                        Phí vận hành nền tảng và cổng thanh toán
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Chi trả lưu trữ video, băng thông CDN, truyền thông và hỗ
                        trợ suốt ngày đêm
                      </p>
                    </div>
                  </div>
                  <span className='shrink-0 text-base font-semibold tabular-nums text-muted-foreground'>
                    {currencySymbol}
                    {(lifetimeNet * 0.4285).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>

                <p className='rounded-lg border border-border bg-muted/50 p-3.5 text-xs text-muted-foreground'>
                  <strong className='font-medium text-foreground'>
                    Đặc quyền giảng viên:
                  </strong>{' '}
                  tỷ lệ chia thu nhập có thể tăng tới 85% khi khóa học đạt danh
                  hiệu bán chạy.{' '}
                  <Link
                    to='/instructor-terms#revenue_share'
                    target='_blank'
                    className='font-medium text-primary hover:underline'
                  >
                    Tìm hiểu thêm
                  </Link>
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title='Doanh thu theo khóa học'
            description='Những khóa học đem lại nhiều thu nhập nhất'
            actions={
              <Select
                value={courseRevenuePeriod}
                onValueChange={(val) =>
                  setCourseRevenuePeriod(val as TimePeriodValue)
                }
              >
                <SelectTrigger className='w-[200px]'>
                  <SelectValue placeholder='Chọn khoảng thời gian' />
                </SelectTrigger>
                <SelectContent>
                  {timePeriodOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          >
            {isLoadingCourseRevenue ? (
              <div className='space-y-4'>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className='h-12 w-full' />
                ))}
              </div>
            ) : courseRevenueError ? (
              <p className='py-4 text-center text-sm text-danger'>
                Không tải được doanh thu theo khóa học.
              </p>
            ) : courseRevenueData?.courses &&
              courseRevenueData.courses.length > 0 ? (
              <div className='space-y-4'>
                {courseRevenueData.courses.map((course, index) => (
                  <div key={course.courseId} className='space-y-1.5'>
                    <div className='flex items-center justify-between text-sm'>
                      <Link
                        to={`/instructor/courses/${
                          course.courseSlug || course.courseId
                        }/manage/goals`}
                        className='mr-2 truncate font-medium text-foreground transition-colors hover:text-primary'
                        title={course.courseName}
                      >
                        {index + 1}. {course.courseName}
                      </Link>
                      <div className='flex shrink-0 items-baseline'>
                        <span className='font-semibold tabular-nums text-foreground'>
                          {currencySymbol}
                          {course.netEarnings.toLocaleString(undefined, {
                            minimumFractionDigits:
                              currencySymbol === '₫' ? 0 : 2,
                            maximumFractionDigits:
                              currencySymbol === '₫' ? 0 : 2,
                          })}
                        </span>
                        <span className='ml-1.5 text-xs tabular-nums text-muted-foreground'>
                          ({course.percentageOfTotalEarnings.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    {/* Mọi thanh dùng CHUNG một màu: chúng đo cùng một đại lượng.
                        Bản trước xoay ba màu theo chỉ số, khiến người đọc đi tìm
                        ý nghĩa của màu trong khi màu chẳng nói lên điều gì. */}
                    <Progress
                      value={course.percentageOfTotalEarnings}
                      className='h-2'
                    />
                  </div>
                ))}
                {courseRevenueData.totalCourses > 5 && (
                  <Button variant='link' asChild className='mt-3 h-auto p-0 text-sm'>
                    <Link to='?tab=transactions&filter=revenue_by_course&period=all_time'>
                      Xem toàn bộ doanh thu theo khóa học
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <p className='py-4 text-center text-sm text-muted-foreground'>
                Chưa có dữ liệu doanh thu trong khoảng thời gian này.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title='Phương thức nhận tiền'
            description='Quản lý cách bạn nhận thu nhập'
            actions={
              <Button
                variant='outline'
                onClick={() => setShowManagePayoutMethodsDialog(true)}
              >
                <Settings2 className='mr-2 h-4 w-4' aria-hidden='true' />
                Quản lý phương thức
              </Button>
            }
          >
            <p className='flex items-start gap-2 text-sm text-muted-foreground'>
              <CreditCard
                className='mt-0.5 h-4 w-4 shrink-0'
                aria-hidden='true'
              />
              <span>
                Thêm và quản lý phương thức nhận tiền như PayPal hoặc chuyển
                khoản ngân hàng. Hãy chắc chắn phương thức chính đã được thiết
                lập đúng.
              </span>
            </p>
          </SectionCard>

          <SectionCard
            title='Hiểu về thu nhập của bạn'
            description='Những điều cần biết về cách tính thu nhập và chi trả'
            actions={
              <HelpCircle
                className='h-5 w-5 text-muted-foreground'
                aria-hidden='true'
              />
            }
          >
            <div className='grid gap-x-8 gap-y-6 text-sm md:grid-cols-2'>
              <div>
                <h3 className='mb-1.5 font-medium text-foreground'>
                  Tỷ lệ chia doanh thu
                </h3>
                <p className='leading-relaxed text-muted-foreground'>
                  Mô hình tiêu chuẩn dành cho bạn là{' '}
                  <strong>{overviewData?.revenueSharePercentage || 70}%</strong>{' '}
                  trên phần lớn giao dịch. Tỷ lệ có thể khác với các chương trình
                  khuyến mãi của nền tảng hoặc doanh số từ đối tác.
                </p>
              </div>
              <div>
                <h3 className='mb-1.5 font-medium text-foreground'>
                  Lịch chi trả
                </h3>
                <p className='leading-relaxed text-muted-foreground'>
                  Tiền được chi trả vào khoảng <strong>ngày 10</strong> hằng
                  tháng cho thu nhập của tháng trước, với điều kiện số dư vượt{' '}
                  <strong>
                    {currencySymbol}
                    {(overviewData?.minWithdrawalAmount || 50).toLocaleString()}
                  </strong>
                  .
                </p>
              </div>
              <div>
                <h3 className='mb-1.5 font-medium text-foreground'>
                  Phương thức thanh toán
                </h3>
                <p className='leading-relaxed text-muted-foreground'>
                  Hỗ trợ chi trả qua PayPal và chuyển khoản ngân hàng (tùy khu
                  vực). Hãy cập nhật thông tin trong phần Quản lý phương thức.
                </p>
              </div>
              <div>
                <h3 className='mb-1.5 font-medium text-foreground'>
                  Hoàn tiền và các khoản khấu trừ
                </h3>
                <p className='leading-relaxed text-muted-foreground'>
                  Tiền hoàn và phí nền tảng được trừ trước khi tính phần của bạn.
                  Thuế áp dụng theo quy định tại khu vực của bạn.
                </p>
              </div>
            </div>

            <div className='mt-6 border-t border-border pt-4'>
              <Button variant='link' asChild className='h-auto p-0 text-sm'>
                <Link
                  to='/instructor-terms#revenue_share'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Đọc toàn bộ chính sách chi trả
                  <ExternalLink className='ml-1 h-3.5 w-3.5' aria-hidden='true' />
                </Link>
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent
          value='transactions'
          forceMount={true}
          className={cn(activeTab !== 'transactions' && 'hidden', 'mt-6')}
        >
          <AllTransactionsTabContent currencySymbol={currencySymbol} />
        </TabsContent>

        <TabsContent
          value='payouts'
          forceMount={true}
          className={cn(activeTab !== 'payouts' && 'hidden', 'mt-6')}
        >
          <PayoutHistoryTabContent currencySymbol={currencySymbol} />
        </TabsContent>
      </Tabs>

      <ManagePayoutMethodsDialog
        isOpen={showManagePayoutMethodsDialog}
        onOpenChange={setShowManagePayoutMethodsDialog}
      />
      <RequestWithdrawalDialog
        isOpen={showRequestWithdrawalDialog}
        onOpenChange={setShowRequestWithdrawalDialog}
        currentBalance={currentBalance}
        currencySymbol={currencySymbol}
        onSuccess={() => {
          refetchFinancialOverview();
        }}
      />
    </InstructorLayout>
  );
};
export default InstructorEarningsPage;
