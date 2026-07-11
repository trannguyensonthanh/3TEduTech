// src/components/admin/approvals/ApprovalsListContainer.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
// Bỏ Tabs nếu chỉ hiển thị Pending
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ApprovalsTable from './ApprovalsTable';
import PaginationControls from '@/components/admin/PaginationControls';

import { useDebounce } from '@/hooks/useDebounce'; // Giả sử có hook debounce
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminGetApprovalRequests } from '@/hooks/queries/course.queries';
import {
  ApprovalRequestQueryParams,
  ApprovalStatusType,
} from '@/services/course.service';
import { useTranslation } from 'react-i18next';

interface ApprovalsListContainerProps {
  onSelectApproval: (slug: string, requestId: number) => void;
}

const TABS: { value: ApprovalStatusType | 'all'; label: string }[] = [
  { value: 'PENDING', label: 'approvals.tabs.pending' },
  { value: 'APPROVED', label: 'approvals.tabs.approved' },
  { value: 'REJECTED', label: 'approvals.tabs.rejected' },
  { value: 'all', label: 'approvals.tabs.all' },
];

const ApprovalsListContainer: React.FC<ApprovalsListContainerProps> = ({
  onSelectApproval,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<ApprovalStatusType | 'all'>(
    'PENDING'
  ); // State cho tab hiện tại
  const itemsPerPage = 10;

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Query Params dựa trên state và tab hiện tại
  const queryParams: ApprovalRequestQueryParams = useMemo(
    () => ({
      page: currentPage,
      limit: itemsPerPage,
      searchTerm: debouncedSearchTerm || undefined,
      status: activeTab === 'all' ? undefined : activeTab, // Lọc theo status của tab (trừ tab 'all')
      sortBy: 'submittedAt',
      sortDirection: 'desc',
    }),
    [currentPage, itemsPerPage, debouncedSearchTerm, activeTab]
  );

  // Fetch dữ liệu dựa trên queryParams
  const {
    data: approvalData,
    isLoading,
    isFetching,
    isError,
    error,
  } = useAdminGetApprovalRequests(queryParams, {
    placeholderData: (prevData) => prevData,
    staleTime: 1000 * 30, // Cache ngắn hơn để cập nhật thường xuyên hơn
  });

  const approvals = approvalData?.requests || [];
  const totalItems = approvalData?.total || 0;
  const totalPages =
    approvalData?.totalPages || Math.ceil(totalItems / itemsPerPage);
  const isPending = approvals?.some(
    (approval) => approval.status === 'PENDING'
  );

  // Reset về trang 1 khi search term hoặc tab thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, activeTab]);

  const { t } = useTranslation();

  return (
    <div className='space-y-4'>
      {/* Search Bar */}
      <div className='flex items-center gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            type='search'
            placeholder={t(
              'approvals.searchPlaceholder',
              'Search by course or instructor...'
            )}
            className='pl-8'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isFetching && (
            <Loader2 className='absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground' />
          )}
        </div>
        {/* Có thể thêm Filter Dropdown ở đây nếu cần */}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as ApprovalStatusType | 'all')
        }
      >
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {t(tab.label)}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Render Content chung, chỉ cần 1 cái vì data đã được fetch theo tab */}
        <TabsContent value={activeTab} className='mt-6'>
          {isError && (
            <div className='text-red-500 bg-red-50 border border-red-200 rounded-md p-3 text-sm flex items-center mb-4'>
              <AlertCircle className='h-4 w-4 mr-2 shrink-0' />{' '}
              {t('approvals.errorLoading', 'Error loading data')}:{' '}
              {error?.message || t('approvals.unknownError', 'Unknown error')}
            </div>
          )}
          <ApprovalsTable
            approvals={approvals}
            onReview={onSelectApproval}
            isLoading={isLoading && !approvalData}
            itemsPerPage={itemsPerPage}
          />
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && !isError && (
        <div className='flex justify-center pt-4'>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </div>
      )}
      {/* No results message (khi không loading và không lỗi) */}
      {!isLoading && !isError && approvals.length === 0 && (
        <div className='text-center py-10 text-muted-foreground'>
          {t(
            'approvals.noResults',
            'No approval requests found matching your criteria.'
          )}
        </div>
      )}
    </div>
  );
};

export default ApprovalsListContainer;
