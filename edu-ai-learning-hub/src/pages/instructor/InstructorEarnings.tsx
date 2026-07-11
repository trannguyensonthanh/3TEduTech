/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/instructor/InstructorEarningsPage.tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import InstructorLayout from '@/components/layout/InstructorLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Progress } from '@/components/ui/progress';
import { Icons } from '@/components/common/Icons'; // Đảm bảo có đủ icons (DollarSign, Wallet, Users, Clock, Download, CreditCard, HelpCircle, BarChart3, ListChecks, Settings2, AlertTriangle, ExternalLink)
import { Skeleton } from '@/components/ui/skeleton';
import {
  useMyMonthlyEarnings,
  useMyRevenueByCourse,
} from '@/hooks/queries/financials.queries'; // Gộp các hook financials
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ManagePayoutMethodsDialog } from '@/components/financials/ManagePayoutMethodsDialog';
import { RequestWithdrawalDialog } from '@/components/financials/RequestWithdrawalDialog';
import { AllTransactionsTabContent } from '@/components/financials/AllTransactionsTabContent';
import { PayoutHistoryTabContent } from '@/components/financials/PayoutHistoryTabContent';
import { useQueryClient } from '@tanstack/react-query';
import { useMyFinancialOverview } from '@/hooks/queries/instructor.queries';
import {
  CourseRevenueQueryParams,
  MonthlyEarningsQueryParams,
} from '@/services/financials.service';

// Animation Variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
};

// Time period options
const timePeriodOptions = [
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'last_12_months', label: 'Last 12 Months' },
  { value: 'current_year', label: `Year ${new Date().getFullYear()}` },
  { value: 'all_time', label: 'All Time' },
];
type TimePeriodValue = (typeof timePeriodOptions)[number]['value'];

// StatCard Component
const StatCard: React.FC<{
  title: string;
  value?: number | string;
  icon: React.ReactNode;
  description: string;
  currency?: string;
  isLoading?: boolean;
  colorClass?: string;
  smallerText?: boolean;
}> = ({
  title,
  value,
  icon,
  description,
  currency,
  isLoading,
  colorClass = 'text-primary',
  smallerText = false,
}) => {
  return (
    <Card className='shadow-lg dark:bg-slate-800/60 border dark:border-slate-700/70 hover:shadow-xl transition-shadow duration-300 h-full'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          {title}
        </CardTitle>
        <div className={cn('h-5 w-5 sm:h-6 sm:w-6', colorClass)}>{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            {' '}
            <Skeleton
              className={cn('h-7 w-3/4 mb-1.5', smallerText && 'h-6')}
            />{' '}
            <Skeleton className='h-4 w-1/2' />{' '}
          </>
        ) : (
          <>
            <div
              className={cn(
                'font-bold',
                colorClass,
                smallerText ? 'text-2xl' : 'text-3xl'
              )}
            >
              {typeof value === 'number'
                ? `${currency || ''}${value.toLocaleString(undefined, {
                    minimumFractionDigits:
                      currency === '₫' || currency === 'VND' ? 0 : 2,
                    maximumFractionDigits:
                      currency === '₫' || currency === 'VND' ? 0 : 2,
                  })}`
                : value || 'N/A'}
            </div>
            <p className='text-xs text-muted-foreground pt-1'>{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Custom Tooltip for Recharts
const CustomTooltipMonthlyEarnings = ({
  active,
  payload,
  label,
  currencySymbol,
}: any) => {
  if (active && payload && payload.length) {
    return (
      <div className='bg-popover p-3 rounded-lg shadow-lg border border-border text-popover-foreground'>
        <p className='label font-semibold'>
          {label ? format(parseISO(label + '-01'), 'MMM yyyy') : ''}
        </p>
        {payload.map((entry: any) => (
          <p
            key={entry.name}
            style={{ color: entry.color }}
            className='text-sm'
          >
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
  const queryClient = useQueryClient();

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
  console.log(
    'overviewData?.minWithdrawalAmount',
    overviewData?.minWithdrawalAmount
  );
  return (
    <InstructorLayout
      pageTitle='Earnings & Finances'
      breadcrumbs={[
        { label: 'Dashboard', href: '/instructor/dashboard' },
        { label: 'Earnings' },
      ]}
    >
      <div className='space-y-6 md:space-y-8'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'
        >
          <div>
            <h1 className='text-3xl md:text-4xl font-bold tracking-tight text-foreground'>
              Earnings Dashboard
            </h1>
            <p className='text-muted-foreground mt-1 text-base'>
              Track your revenue, manage payouts, and understand your financial
              performance.
            </p>
          </div>
          <div className='flex flex-col sm:flex-row gap-3 w-full sm:w-auto'>
            <Button
              size='lg'
              className='h-11 px-5 text-base w-full sm:w-auto bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-shadow'
              onClick={() => setShowRequestWithdrawalDialog(true)}
              disabled={
                isLoadingOverview ||
                currentBalance < (overviewData?.minWithdrawalAmount || 10)
              }
            >
              <Icons.wallet className='w-5 h-5 mr-2' /> Request Withdrawal
            </Button>
            {/* <Button
              size='lg'
              variant='outline'
              className='h-11 px-5 text-base w-full sm:w-auto'
            >
              <Icons.download className='w-5 h-5 mr-2' /> Download Report
            </Button> */}
          </div>
        </motion.div>

        <motion.div
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          initial='hidden'
          animate='visible'
          className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'
        >
          {[
            {
              custom: 0,
              title: 'Current Balance',
              value: overviewData?.currentBalance,
              icon: <Icons.wallet className='opacity-80' />,
              description: 'Available for your next payout',
              colorClass: 'text-green-500 dark:text-green-400',
            },
            {
              custom: 1,
              title: 'Lifetime Earnings',
              value: overviewData?.totalLifetimeEarnings,
              icon: <Icons.dollarSign className='opacity-80' />,
              description: 'Total revenue generated',
            },
            {
              custom: 2,
              title: 'Pending Payouts',
              value: overviewData?.pendingPayoutsAmount,
              icon: <Icons.clock className='opacity-80' />,
              description: 'Withdrawals being processed',
              colorClass: 'text-orange-500 dark:text-orange-400',
            },
            {
              custom: 3,
              title: 'Total Students',
              value: overviewData?.totalStudentsLifetime?.toLocaleString(),
              icon: <Icons.users className='opacity-80' />,
              description: 'Across all your courses',
              colorClass: 'text-purple-500 dark:text-purple-400',
            },
          ].map((card) => (
            <motion.div
              key={card.title}
              variants={cardVariants}
              custom={card.custom}
            >
              <StatCard
                {...card}
                currency={currencySymbol}
                isLoading={isLoadingOverview}
              />
            </motion.div>
          ))}
        </motion.div>

        {overviewError && (
          <Card className='bg-destructive/10 border-destructive/30'>
            {' '}
            <CardContent className='p-4 text-center text-sm text-destructive-foreground'>
              <Icons.alertTriangle className='inline-block h-5 w-5 mr-2' />{' '}
              Failed to load financial overview:{' '}
              {(overviewError as Error).message}
            </CardContent>
          </Card>
        )}

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className='w-full pt-2'
        >
          <TabsList className='grid w-full grid-cols-2 sm:grid-cols-3 md:w-auto md:inline-flex h-12 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shadow-sm'>
            <TabsTrigger
              value='overview'
              className='px-4 sm:px-6 py-2.5 text-sm sm:text-base data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md rounded-md'
            >
              <Icons.level className='mr-2 h-5 w-5' />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value='transactions'
              className='px-4 sm:px-6 py-2.5 text-sm sm:text-base data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md rounded-md'
            >
              <Icons.listChecks className='mr-2 h-5 w-5' />
              Transactions
            </TabsTrigger>
            <TabsTrigger
              value='payouts'
              className='px-4 sm:px-6 py-2.5 text-sm sm:text-base data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md rounded-md'
            >
              <Icons.creditCard className='mr-2 h-5 w-5' />
              Payouts
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode='wait'>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className='mt-6'
            >
              <TabsContent
                value='overview'
                forceMount={true}
                className={cn(activeTab !== 'overview' && 'hidden', '!mt-0')}
              >
                <div className='space-y-6 md:space-y-8'>
                  <Card className='shadow-lg dark:bg-slate-800/60 border dark:border-slate-700/70'>
                    <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4'>
                      <div>
                        <CardTitle className='text-xl md:text-2xl font-semibold'>
                          Monthly Earnings
                        </CardTitle>
                        <CardDescription className='text-sm mt-1'>
                          Net earnings trend.
                        </CardDescription>
                      </div>
                      <Select
                        value={monthlyEarningsPeriod}
                        onValueChange={(val) =>
                          setMonthlyEarningsPeriod(val as TimePeriodValue)
                        }
                      >
                        <SelectTrigger className='w-full sm:w-[200px] h-10 mt-3 sm:mt-0 text-sm'>
                          <SelectValue placeholder='Select period' />
                        </SelectTrigger>
                        <SelectContent>
                          {timePeriodOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardHeader>
                    <CardContent className='h-[350px] md:h-[400px] pl-0 pr-2 sm:pr-4 py-6'>
                      {isLoadingMonthly ? (
                        <div className='w-full h-full flex items-center justify-center'>
                          <Skeleton className='w-[95%] h-[90%]' />
                        </div>
                      ) : monthlyError ? (
                        <div className='w-full h-full flex flex-col items-center justify-center text-destructive'>
                          <Icons.alertTriangle className='w-10 h-10 mb-2' />
                          Error loading chart.
                        </div>
                      ) : monthlyEarningsData?.earnings &&
                        monthlyEarningsData.earnings.length > 0 ? (
                        <ResponsiveContainer width='100%' height='100%'>
                          <BarChart
                            data={monthlyEarningsData.earnings}
                            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray='3 3'
                              strokeOpacity={0.2}
                              vertical={false}
                            />
                            <XAxis
                              dataKey='month'
                              tickFormatter={(value) =>
                                format(parseISO(value + '-01'), 'MMM yy')
                              }
                              tick={{ fontSize: 11, fillOpacity: 0.7 }}
                              axisLine={{ strokeOpacity: 0.5 }}
                              tickLine={{ strokeOpacity: 0.5 }}
                            />
                            <YAxis
                              tickFormatter={(value) =>
                                `${currencySymbol}${value / 1000}k`
                              }
                              tick={{ fontSize: 11, fillOpacity: 0.7 }}
                              axisLine={{ strokeOpacity: 0.5 }}
                              tickLine={{ strokeOpacity: 0.5 }}
                              width={55}
                            />
                            <Tooltip
                              content={
                                <CustomTooltipMonthlyEarnings
                                  currencySymbol={currencySymbol}
                                />
                              }
                              cursor={{
                                fill: 'hsl(var(--accent))',
                                fillOpacity: 0.2,
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Bar
                              dataKey='netEarnings'
                              fill='hsl(var(--primary))'
                              name='Net Earnings'
                              radius={[4, 4, 0, 0]}
                              barSize={25}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className='w-full h-full flex flex-col items-center justify-center text-muted-foreground'>
                          <Icons.level className='w-16 h-16 mb-3 opacity-50' />
                          No earnings data for this period.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className='shadow-lg dark:bg-slate-800/60 border dark:border-slate-700/70'>
                    <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4'>
                      <div>
                        <CardTitle className='text-xl md:text-2xl font-semibold'>
                          Revenue by Course
                        </CardTitle>
                        <CardDescription className='text-sm mt-1'>
                          Top performing courses.
                        </CardDescription>
                      </div>
                      <Select
                        value={courseRevenuePeriod}
                        onValueChange={(val) =>
                          setCourseRevenuePeriod(val as TimePeriodValue)
                        }
                      >
                        <SelectTrigger className='w-full sm:w-[200px] h-10 mt-3 sm:mt-0 text-sm'>
                          <SelectValue placeholder='Select period' />
                        </SelectTrigger>
                        <SelectContent>
                          {timePeriodOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardHeader>
                    <CardContent>
                      {isLoadingCourseRevenue ? (
                        <div className='space-y-4'>
                          {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className='h-12 w-full' />
                          ))}
                        </div>
                      ) : courseRevenueError ? (
                        <p className='text-sm text-destructive text-center py-4'>
                          Could not load course revenue.
                        </p>
                      ) : courseRevenueData?.courses &&
                        courseRevenueData.courses.length > 0 ? (
                        <div className='space-y-4'>
                          {courseRevenueData.courses.map((course, index) => (
                            <div key={course.courseId} className='space-y-1.5'>
                              <div className='flex justify-between items-center text-sm'>
                                <Link
                                  to={`/instructor/courses/${
                                    course.courseSlug || course.courseId
                                  }/manage/goals`}
                                  className='font-medium text-foreground hover:text-primary truncate mr-2'
                                  title={course.courseName}
                                >
                                  {index + 1}. {course.courseName}
                                </Link>
                                <div className='flex items-baseline'>
                                  <span className='font-semibold text-foreground'>
                                    {currencySymbol}
                                    {course.netEarnings.toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits:
                                          currencySymbol === '₫' ? 0 : 2,
                                        maximumFractionDigits:
                                          currencySymbol === '₫' ? 0 : 2,
                                      }
                                    )}
                                  </span>
                                  <span className='text-xs text-muted-foreground ml-1.5'>
                                    (
                                    {course.percentageOfTotalEarnings.toFixed(
                                      1
                                    )}
                                    %)
                                  </span>
                                </div>
                              </div>
                              <Progress
                                value={course.percentageOfTotalEarnings}
                                className={cn(
                                  'h-2',
                                  index % 3 === 0
                                    ? 'bg-primary'
                                    : index % 3 === 1
                                      ? 'bg-sky-500'
                                      : 'bg-amber-500'
                                )}
                              />
                            </div>
                          ))}
                          {courseRevenueData.totalCourses > 5 && (
                            <Button
                              variant='link'
                              asChild
                              className='p-0 h-auto text-sm mt-3'
                            >
                              <Link to='?tab=transactions&filter=revenue_by_course&period=all_time'>
                                View All Course Revenue
                              </Link>
                            </Button>
                          )}
                        </div>
                      ) : (
                        <p className='text-sm text-muted-foreground text-center py-4'>
                          No course revenue data for this period.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className='shadow-lg dark:bg-slate-800/60 border dark:border-slate-700/70'>
                    <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4'>
                      <div>
                        <CardTitle className='text-xl md:text-2xl font-semibold flex items-center'>
                          <Icons.creditCard className='mr-3 h-6 w-6 text-sky-500 dark:text-sky-400' />
                          Payout Methods
                        </CardTitle>
                        <CardDescription className='text-sm mt-1'>
                          Manage how you receive your earnings.
                        </CardDescription>
                      </div>
                      <Button
                        variant='outline'
                        onClick={() => setShowManagePayoutMethodsDialog(true)}
                        className='mt-3 sm:mt-0 h-10 text-sm'
                      >
                        <Icons.settings2 className='mr-2 h-4 w-4' /> Manage
                        Methods
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm text-muted-foreground'>
                        Add and manage your payout methods like PayPal or Bank
                        Transfer. Ensure your primary method is correctly set
                        up.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className='shadow-lg dark:bg-slate-800/60 border dark:border-slate-700/70'>
                    <CardHeader>
                      <CardTitle className='text-xl md:text-2xl font-semibold flex items-center'>
                        <Icons.help className='mr-3 h-6 w-6 text-blue-500' />
                        Understanding Your Earnings
                      </CardTitle>
                      <CardDescription className='text-sm mt-1'>
                        Key information about how earnings and payouts work.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='grid md:grid-cols-2 gap-x-8 gap-y-6 text-sm'>
                      <div>
                        <h4 className='font-semibold mb-1.5 text-foreground'>
                          Revenue Share
                        </h4>
                        <p className='text-muted-foreground leading-relaxed'>
                          Our standard model is a{' '}
                          <strong>
                            {overviewData?.revenueSharePercentage || 70}%
                          </strong>{' '}
                          to you on most sales. Rates may vary for platform
                          promotions or affiliate sales.
                        </p>
                      </div>
                      <div>
                        <h4 className='font-semibold mb-1.5 text-foreground'>
                          Payout Schedule
                        </h4>
                        <p className='text-muted-foreground leading-relaxed'>
                          Payouts are processed around the <strong>10th</strong>{' '}
                          of each month for the previous month's earnings,
                          provided your balance exceeds{' '}
                          <strong>
                            {currencySymbol}
                            {(
                              overviewData?.minWithdrawalAmount || 50
                            ).toLocaleString()}
                          </strong>
                          .
                        </p>
                      </div>
                      <div>
                        <h4 className='font-semibold mb-1.5 text-foreground'>
                          Payment Methods
                        </h4>
                        <p className='text-muted-foreground leading-relaxed'>
                          We support payouts via PayPal and direct bank transfer
                          (availability varies). Ensure your details are
                          up-to-date in 'Manage Methods'.
                        </p>
                      </div>
                      <div>
                        <h4 className='font-semibold mb-1.5 text-foreground'>
                          Refunds & Deductions
                        </h4>
                        <p className='text-muted-foreground leading-relaxed'>
                          Refunds and platform fees are deducted before
                          calculating your share. Applicable taxes are also
                          handled as per your region's regulations.
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant='link'
                        asChild
                        className='p-0 h-auto text-sm text-muted-foreground hover:text-primary'
                      >
                        <Link
                          to='/instructor-terms#revenue_share'
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          Read Full Payout Policy{' '}
                          <Icons.externalLink className='ml-1 h-3.5 w-3.5' />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent
                value='transactions'
                forceMount={true}
                className={cn(
                  activeTab !== 'transactions' && 'hidden',
                  '!mt-0'
                )}
              >
                <AllTransactionsTabContent currencySymbol={currencySymbol} />
              </TabsContent>

              <TabsContent
                value='payouts'
                forceMount={true}
                className={cn(activeTab !== 'payouts' && 'hidden', '!mt-0')}
              >
                <PayoutHistoryTabContent currencySymbol={currencySymbol} />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>

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
