// src/components/financials/PayoutHistoryTabContent.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/common/Icons'; // AlertTriangle, PackageOpen, Filter, CalendarDays, ListRestart, ChevronDown, CheckCircle, XCircle, Hourglass

import { useDebounce } from '@/hooks/useDebounce';
import PaginationControls from '@/components/admin/PaginationControls';
import { format, parseISO, formatDistanceToNowStrict } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card'; // Để hiển thị empty/error state
import { useAuth } from '@/contexts/AuthContext'; // Để lấy currency nếu cần
import {
  WithdrawalActivityItem,
  WithdrawalActivityQueryParams,
} from '@/services/financials.service';
import { useMyWithdrawalActivities } from '@/hooks/queries/financials.queries';
import { Label } from '@/components/ui/label';

const ITEMS_PER_PAGE_PAYOUTS = 10;

const payoutActivityStatusOptions: {
  value: Exclude<WithdrawalActivityQueryParams['overallStatus'], undefined>; // Ensure value is not ''
  label: string;
}[] = [
  // { value: '', label: 'All Statuses' }, // REMOVED: Placeholder handles this
  { value: 'PENDING', label: 'Pending Review' },
  { value: 'PROCESSING', label: 'Processing Payment' },
  { value: 'COMPLETED', label: 'Completed Payouts' },
  { value: 'REJECTED', label: 'Rejected Requests' },
  { value: 'FAILED', label: 'Failed Payouts' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const payoutActivitySortOptions: {
  value: WithdrawalActivityQueryParams['sortBy'];
  label: string;
}[] = [
  { value: 'requestedAt:desc', label: 'Request Date (Newest)' },
  { value: 'requestedAt:asc', label: 'Request Date (Oldest)' },
  { value: 'paymentCompletedAt:desc', label: 'Completion Date (Newest)' },
  { value: 'paymentCompletedAt:asc', label: 'Completion Date (Oldest)' },
  // Thêm sort theo amount nếu cần
];
type PayoutSortByValue = (typeof payoutActivitySortOptions)[number]['value'];

interface PayoutHistoryTabContentProps {
  currencySymbol: string;
}

export const PayoutHistoryTabContent: React.FC<
  PayoutHistoryTabContentProps
> = ({ currencySymbol }) => {
  const { userData } = useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const [activeStatusFilter, setActiveStatusFilter] = useState<
    WithdrawalActivityQueryParams['overallStatus'] | undefined
  >(undefined);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [sortBy, setSortBy] = useState<PayoutSortByValue>(
    payoutActivitySortOptions[0].value
  );

  const queryParams: WithdrawalActivityQueryParams = useMemo(
    () => ({
      page: currentPage,
      limit: ITEMS_PER_PAGE_PAYOUTS,
      overallStatus: activeStatusFilter,
      dateFrom: dateRange?.from
        ? format(dateRange.from, 'yyyy-MM-dd')
        : undefined,
      dateTo: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      sortBy: sortBy,
    }),
    [currentPage, activeStatusFilter, dateRange, sortBy]
  );

  const {
    data: payoutActivityData,
    isLoading: isLoadingActivities,
    isFetching: isFetchingActivities,
    isError,
    error,
  } = useMyWithdrawalActivities(queryParams);

  const activities = payoutActivityData?.activities || [];
  const totalItems = payoutActivityData?.total || 0;
  const totalPages =
    payoutActivityData?.totalPages ||
    Math.ceil(totalItems / ITEMS_PER_PAGE_PAYOUTS) ||
    1;

  useEffect(() => {
    setCurrentPage(1); // Reset page khi filter thay đổi
  }, [activeStatusFilter, dateRange, sortBy]);

  const getStatusBadge = (
    item: WithdrawalActivityItem
  ): {
    variant: 'default' | 'success' | 'destructive' | 'outline' | 'secondary';
    label: string;
    icon?: React.ReactNode;
  } => {
    // Ưu tiên Payout Status nếu có
    if (item.payoutStatus) {
      switch (item.payoutStatus) {
        case 'PAID':
          return {
            variant: 'success',
            label: 'Paid',
            icon: <Icons.checkCircle className="mr-1.5 h-3.5 w-3.5" />,
          };
        case 'PROCESSING':
          return {
            variant: 'outline',
            label: 'Processing',
            icon: <Icons.spinner className="mr-1.5 h-3.5 w-3.5 animate-spin" />,
          };
        case 'PENDING':
          return {
            variant: 'destructive',
            label: 'Payout Pending',
            icon: <Icons.hourglass className="mr-1.5 h-3.5 w-3.5" />,
          };
        case 'FAILED':
          return {
            variant: 'secondary',
            label: 'Payout Failed',
            icon: <Icons.xCircle className="mr-1.5 h-3.5 w-3.5" />,
          };
        case 'CANCELLED':
          return {
            variant: 'default',
            label: 'Payout Cancelled',
            icon: <Icons.ban className="mr-1.5 h-3.5 w-3.5" />,
          };
      }
    }
    // Nếu không có Payout Status, dựa vào Request Status
    switch (item.requestStatus) {
      case 'APPROVED':
        return {
          variant: 'success',
          label: 'Approved (Awaiting Payout)',
          icon: <Icons.checkCircle className="mr-1.5 h-3.5 w-3.5" />,
        };
      case 'PENDING':
        return {
          variant: 'outline',
          label: 'Request Pending',
          icon: <Icons.hourglass className="mr-1.5 h-3.5 w-3.5" />,
        };
      case 'REJECTED':
        return {
          variant: 'destructive',
          label: 'Request Rejected',
          icon: <Icons.xCircle className="mr-1.5 h-3.5 w-3.5" />,
        };
      case 'PROCESSING_PAYMENT':
        return {
          variant: 'secondary',
          label: 'Processing Payment',
          icon: <Icons.spinner className="mr-1.5 h-3.5 w-3.5 animate-spin" />,
        };
      case 'CANCELLED':
        return {
          variant: 'outline',
          label: 'Request Cancelled',
          icon: <Icons.ban className="mr-1.5 h-3.5 w-3.5" />,
        };
    }
    return {
      variant: 'default',
      label: 'Unknown',
      icon: <Icons.help className="mr-1.5 h-3.5 w-3.5" />,
    };
  };

  const renderTableSkeleton = (rows = ITEMS_PER_PAGE_PAYOUTS) => (
    <div className="border dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {[
              'Request ID',
              'Date',
              'Amount Req.',
              'Method',
              'Status',
              'Amount Paid',
              'Completed Date',
            ].map((h) => (
              <TableHead key={h}>
                <Skeleton className="h-5 w-24 my-1" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(rows)].map((_, i) => (
            <TableRow key={`skel-payout-${i}`}>
              <TableCell colSpan={7}>
                <Skeleton className="h-10 w-full my-1" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <Card className="dark:bg-slate-800/30 shadow-sm border dark:border-slate-700/60">
        <CardContent className="p-4 md:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div>
              <Label
                htmlFor="payout-status-filter"
                className="text-xs font-medium text-muted-foreground"
              >
                Status
              </Label>
              <Select
                value={activeStatusFilter || ''} // Pass '' to Select when activeStatusFilter is undefined to show placeholder
                onValueChange={(val) =>
                  setActiveStatusFilter(
                    val === '' // Radix Select sets value to '' when placeholder is selected
                      ? undefined
                      : (val as WithdrawalActivityQueryParams['overallStatus'])
                  )
                }
              >
                <SelectTrigger className="h-11 text-sm mt-1">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {/* No explicit 'All Statuses' item with empty value needed here */}
                  {payoutActivityStatusOptions.map((opt) => (
                    <SelectItem
                      key={opt.value} // value will not be an empty string
                      value={opt.value} // value will not be an empty string
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="payout-date-filter"
                className="text-xs font-medium text-muted-foreground"
              >
                Date Range
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="payout-date-filter"
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal h-11 text-sm mt-1',
                      !dateRange && 'text-muted-foreground'
                    )}
                  >
                    <Icons.calendar className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, 'LLL dd, y')} - ${format(
                          dateRange.to,
                          'LLL dd, y'
                        )}`
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    initialFocus
                    numberOfMonths={2}
                  />
                  <div className="p-3 border-t flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDateRange(undefined)}
                    >
                      Clear
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label
                htmlFor="sort-payouts"
                className="text-xs font-medium text-muted-foreground"
              >
                Sort By
              </Label>
              <Select
                value={sortBy}
                onValueChange={(val) => setSortBy(val as PayoutSortByValue)}
              >
                <SelectTrigger className="h-11 text-sm mt-1 w-full">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  {payoutActivitySortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <Button
              variant="ghost"
              onClick={() => {
                setActiveStatusFilter(undefined);
                setDateRange(undefined);
                setSortBy(payoutActivitySortOptions[0].value);
              }}
              className="h-10 text-muted-foreground hover:text-primary text-xs"
            >
              <Icons.listRestart className="mr-1.5 h-3.5 w-3.5" /> Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payout Activity Table or Status Messages */}
      <AnimatePresence mode="wait">
        <motion.div
          key={
            isLoadingActivities
              ? 'loading'
              : isError
              ? 'error'
              : activities.length > 0
              ? 'data'
              : 'empty'
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isLoadingActivities && !activities ? (
            renderTableSkeleton()
          ) : isError ? (
            <Card className="text-center py-12 bg-destructive/10 border-destructive/30">
              <CardContent>
                <Icons.alertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h3 className="text-xl font-semibold text-destructive-foreground">
                  Failed to Load Payout History
                </h3>
                <p className="text-destructive/80 mt-1">
                  {error?.message || 'An unexpected error occurred.'}
                </p>
              </CardContent>
            </Card>
          ) : activities.length > 0 ? (
            <div className="border dark:border-slate-700 rounded-lg shadow-sm overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow>
                    <TableHead className="w-[120px]">Request ID</TableHead>
                    <TableHead className="w-[130px]">Requested</TableHead>
                    <TableHead className="text-right w-[140px]">
                      Amount Req.
                    </TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-center w-[180px]">
                      Status
                    </TableHead>
                    <TableHead className="text-right w-[140px]">
                      Amount Paid
                    </TableHead>
                    <TableHead className="w-[130px]">Completed</TableHead>
                    {/* <TableHead>Notes</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((act) => {
                    const statusInfo = getStatusBadge(act);
                    return (
                      <TableRow
                        key={act.requestId}
                        className="dark:hover:bg-slate-800/40"
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          REQ-{act.requestId}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(parseISO(act.requestedAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          {currencySymbol}
                          {act.requestedAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {act.paymentMethodUsed || 'N/A'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={statusInfo.variant}
                            className="text-xs px-2 py-0.5 capitalize whitespace-nowrap"
                          >
                            {statusInfo.icon}
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm text-green-600 dark:text-green-400">
                          {act.actualAmountPaid != null ? (
                            `${currencySymbol}${act.actualAmountPaid.toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}`
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {act.paymentCompletedAt ? (
                            format(
                              parseISO(act.paymentCompletedAt),
                              'MMM dd, yyyy'
                            )
                          ) : (
                            <span className="italic">Pending</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            !isFetchingActivities && (
              <Card className="text-center py-16 col-span-full bg-slate-50 dark:bg-slate-800/30 border-2 border-dashed dark:border-slate-700">
                <CardContent>
                  <Icons.packageOpen className="mx-auto h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                  <h3 className="text-xl font-semibold text-foreground">
                    No Payout Activities Found
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    No withdrawal requests or payouts match your current
                    filters.
                  </p>
                </CardContent>
              </Card>
            )
          )}
        </motion.div>
      </AnimatePresence>

      {!isError && totalItems > 0 && totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          isDisabled={isFetchingActivities}
          className="mt-8"
        />
      )}
    </div>
  );
};
