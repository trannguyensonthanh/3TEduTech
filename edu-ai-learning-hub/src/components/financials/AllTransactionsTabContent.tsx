// src/components/financials/AllTransactionsTabContent.tsx
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
} from '@/components/ui/popover'; // Cho DateRangePicker
import { Calendar } from '@/components/ui/calendar'; // Cho DateRangePicker
import { DateRange } from 'react-day-picker'; // Cho DateRangePicker
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/common/Icons'; // Cần các icon đã liệt kê
import { useMyTransactions } from '@/hooks/queries/financials.queries'; // Đã được cập nhật
import { useDebounce } from '@/hooks/useDebounce';
import PaginationControls from '@/components/admin/PaginationControls';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext'; // Để lấy currency
import {
  InstructorTransactionDetail,
  TransactionHistoryParams,
} from '@/services/financials.service';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const ITEMS_PER_PAGE_TRANSACTIONS = 10;

const transactionTypeOptions = [
  { value: 'CREDIT_SALE', label: 'Course Sales (Credit)' },
  { value: 'DEBIT_WITHDRAWAL', label: 'Withdrawals (Debit)' },
  { value: 'CREDIT_REFUND', label: 'Refunds Issued (Credit to Student)' }, // Ví dụ, nếu có
  { value: 'DEBIT_FEE', label: 'Platform Fees (Debit)' }, // Ví dụ
  // Thêm các type khác từ bảng InstructorBalanceTransactions.Type
];

const transactionSortOptions = [
  { value: 'transactionTimestamp:desc', label: 'Date (Newest First)' },
  { value: 'transactionTimestamp:asc', label: 'Date (Oldest First)' },
  { value: 'amount:desc', label: 'Amount (High to Low)' },
  { value: 'amount:asc', label: 'Amount (Low to High)' },
];
type TransactionSortByValue = (typeof transactionSortOptions)[number]['value'];

interface AllTransactionsTabContentProps {
  currencySymbol: string;
}

export const AllTransactionsTabContent: React.FC<
  AllTransactionsTabContentProps
> = ({ currencySymbol }) => {
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [sortBy, setSortBy] = useState<TransactionSortByValue>(
    transactionSortOptions[0].value
  );

  const queryParams: TransactionHistoryParams = useMemo(
    () => ({
      page: currentPage,
      limit: ITEMS_PER_PAGE_TRANSACTIONS,
      searchTerm: debouncedSearchTerm || undefined,
      type: activeTypeFilter,
      startDate: dateRange?.from
        ? format(dateRange.from, 'yyyy-MM-dd')
        : undefined,
      endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      // sortBy: sortBy as TransactionHistoryParams['sortBy'],
    }),
    [currentPage, debouncedSearchTerm, activeTypeFilter, dateRange]
  );

  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    isFetching: isFetchingTransactions,
    isError,
    error,
  } = useMyTransactions(queryParams);

  const transactions = transactionsData?.transactions || [];
  console.log('transactionsData', transactionsData);
  const totalItems = transactionsData?.total || 0;
  const totalPages =
    transactionsData?.totalPages ||
    Math.ceil(totalItems / ITEMS_PER_PAGE_TRANSACTIONS) ||
    1;

  useEffect(() => {
    setCurrentPage(1); // Reset page khi filter thay đổi
  }, [debouncedSearchTerm, activeTypeFilter, dateRange, sortBy]);

  const getTransactionTypeDetails = (
    type: InstructorTransactionDetail['type']
  ) => {
    switch (type) {
      case 'CREDIT_SALE':
        return {
          label: 'Course Sale',
          icon: <Icons.arrowUpCircle className="text-green-500" />,
          color: 'text-green-600 dark:text-green-400',
        };
      case 'DEBIT_WITHDRAWAL':
        return {
          label: 'Withdrawal',
          icon: <Icons.arrowDownCircle className="text-red-500" />,
          color: 'text-red-600 dark:text-red-400',
        };
      case 'CREDIT_REFUND':
        return {
          label: 'Refund (Credit Back)',
          icon: <Icons.cornerLeftUp className="text-yellow-500" />,
          color: 'text-yellow-600 dark:text-yellow-400',
        };
      case 'DEBIT_FEE':
        return {
          label: 'Platform Fee',
          icon: <Icons.minus className="text-orange-500" />,
          color: 'text-orange-600 dark:text-orange-400',
        };
      default:
        return {
          label: type,
          icon: <Icons.help className="text-muted-foreground" />,
          color: 'text-muted-foreground',
        };
    }
  };

  const renderTableSkeleton = (rows = ITEMS_PER_PAGE_TRANSACTIONS) => (
    <div className="border dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {['ID', 'Date', 'Type', 'Amount', 'Description', 'Status'].map(
              (h) => (
                <TableHead key={h}>
                  <Skeleton className="h-5 w-24 my-1" />
                </TableHead>
              )
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(rows)].map((_, i) => (
            <TableRow key={`skel-trx-${i}`}>
              <TableCell colSpan={6}>
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
      {/* Filters and Search Bar */}
      <Card className="dark:bg-slate-800/30 shadow-sm border dark:border-slate-700/60">
        <CardContent className="p-4 md:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="relative lg:col-span-1">
              {' '}
              {/* Search input sẽ chiếm nhiều hơn nếu cần */}
              <Label
                htmlFor="transaction-search"
                className="text-xs font-medium text-muted-foreground"
              >
                Search Transactions
              </Label>
              <Icons.search className="absolute left-3 bottom-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="transaction-search"
                type="search"
                placeholder="ID, course, student..."
                className="pl-10 h-11 text-sm mt-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label
                htmlFor="transaction-type-filter"
                className="text-xs font-medium text-muted-foreground"
              >
                Transaction Type
              </Label>
              <Select
                value={activeTypeFilter || ''} // This remains, '' signals placeholder to Select
                onValueChange={(val) =>
                  setActiveTypeFilter(val === '' ? null : val)
                } // Ensure null for empty selection
              >
                <SelectTrigger className="h-11 text-sm mt-1">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {/* No explicit 'All Types' item needed here */}
                  {transactionTypeOptions.map((opt) => (
                    <SelectItem
                      key={opt.value} // opt.value will not be null now
                      value={opt.value} // opt.value will not be null now
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="transaction-date-filter"
                className="text-xs font-medium text-muted-foreground"
              >
                Date Range
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="transaction-date-filter"
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
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-grow">
              <Label
                htmlFor="sort-transactions"
                className="text-xs font-medium text-muted-foreground"
              >
                Sort By
              </Label>
              <Select
                value={sortBy}
                onValueChange={(val) =>
                  setSortBy(val as TransactionSortByValue)
                }
              >
                <SelectTrigger className="h-11 text-sm mt-1 w-full sm:w-[250px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  {transactionSortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setSearchTerm('');
                setActiveTypeFilter(null);
                setDateRange(undefined);
                setSortBy(transactionSortOptions[0].value);
              }}
              className="h-11 text-muted-foreground hover:text-primary"
            >
              <Icons.listRestart className="mr-2 h-4 w-4" /> Reset All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Table or Status */}
      {(isLoadingTransactions || isFetchingTransactions) &&
      !transactionsData?.transactions ? (
        renderTableSkeleton()
      ) : isError ? (
        <Card className="text-center py-12 bg-destructive/10 border-destructive/30">
          <CardContent>
            <Icons.alertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h3 className="text-xl font-semibold text-destructive-foreground">
              Failed to Load Transactions
            </h3>
            <p className="text-destructive/80 mt-1">
              {error?.message || 'An unexpected error occurred.'}
            </p>
          </CardContent>
        </Card>
      ) : transactions.length > 0 ? (
        <div className="border dark:border-slate-700 rounded-lg shadow-sm overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="w-[150px]">Transaction ID</TableHead>
                <TableHead className="w-[130px]">Date</TableHead>
                <TableHead className="w-[150px]">Type</TableHead>
                <TableHead className="text-right w-[130px]">Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center w-[120px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((trx) => {
                const typeDetails = getTransactionTypeDetails(trx.type);
                return (
                  <TableRow
                    key={trx.transactionId}
                    className="dark:hover:bg-slate-800/40"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {trx.transactionId}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(
                        parseISO(trx.transactionTimestamp),
                        'MMM dd, yyyy, HH:mm'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {React.cloneElement(typeDetails.icon, {
                          className: cn(
                            'h-4 w-4 mr-2 flex-shrink-0',
                            typeDetails.color
                          ),
                        })}
                        <span
                          className={cn(
                            'text-sm font-medium',
                            typeDetails.color
                          )}
                        >
                          {typeDetails.label}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-semibold text-sm',
                        typeDetails.color
                      )}
                    >
                      {trx.type.startsWith('CREDIT') ? '+' : '-'}
                      {currencySymbol}
                      {trx.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell
                      className="text-sm text-muted-foreground max-w-xs truncate"
                      title={trx.description}
                    >
                      {trx.description}
                    </TableCell>
                    <TableCell className="text-center">
                      {trx.status && (
                        <Badge
                          variant={
                            trx.status === 'COMPLETED'
                              ? 'success'
                              : trx.status === 'PENDING' ||
                                trx.status === 'PROCESSING'
                              ? 'outline'
                              : 'destructive'
                          }
                          className="text-xs px-2 py-0.5 capitalize"
                        >
                          {trx.status.toLowerCase()}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        !isFetchingTransactions && (
          <Card className="text-center py-16 col-span-full bg-slate-50 dark:bg-slate-800/30 border-2 border-dashed dark:border-slate-700">
            <CardContent>
              <Icons.packageOpen className="mx-auto h-16 w-16 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground">
                No Transactions Found
              </h3>
              <p className="mt-2 text-muted-foreground">
                No transactions match your current filters. Try adjusting them
                or check back later.
              </p>
            </CardContent>
          </Card>
        )
      )}

      {!isError && totalItems > 0 && totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          isDisabled={isFetchingTransactions}
          className="mt-8"
        />
      )}
    </div>
  );
};
