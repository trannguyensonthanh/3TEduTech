// src/pages/instructor/InstructorCourseApprovals.tsx
import { useState } from 'react';
import InstructorLayout from '@/components/layout/InstructorLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ApprovalsList from './components/ApprovalsList';
import { useInstructorGetApprovalRequests } from '@/hooks/queries/course.queries';
import { useAuth } from '@/contexts/AuthContext';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';

type StatusTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const TABS_CONFIG: { value: StatusTab; label: string }[] = [
  { value: 'ALL', label: 'All Requests' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const InstructorCourseApprovals = () => {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState<StatusTab>('ALL');
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const queryParams = {
    instructorId: userData?.id ? parseInt(userData.id) : undefined,
    status: activeTab === 'ALL' ? undefined : activeTab,
    page,
    limit: itemsPerPage,
    sortBy: 'requestDate:desc',
  };

  const { data, isLoading, isError, isPlaceholderData } =
    useInstructorGetApprovalRequests(queryParams, {
      enabled: !!userData?.id, // Chỉ fetch khi có instructorId
    });

  const handleTabChange = (value: string) => {
    setActiveTab(value as StatusTab);
    setPage(1); // Reset về trang 1 khi đổi tab
  };

  const totalPages = data?.totalPages || 1;

  return (
    <InstructorLayout>
      <div className='space-y-6 p-4 md:p-6 lg:p-8'>
        <header className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100'>
              Course Approval Requests
            </h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              Track the status of your submitted courses and view feedback from
              administrators.
            </p>
          </div>
        </header>

        <Tabs defaultValue='ALL' onValueChange={handleTabChange}>
          <TabsList className='grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:inline-flex'>
            {TABS_CONFIG.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className='mt-6'>
            <ApprovalsList
              requests={data?.requests}
              isLoading={isLoading}
              isError={isError}
            />
          </div>
        </Tabs>

        {totalPages > 1 && (
          <div className='mt-8 flex items-center justify-center'>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant='outline'
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isPlaceholderData}
                  >
                    <PaginationPrevious
                      href='#'
                      onClick={(e) => e.preventDefault()}
                    />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <span className='px-4 py-2 text-sm font-medium'>
                    Page {page} of {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant='outline'
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isPlaceholderData}
                  >
                    <PaginationNext
                      href='#'
                      onClick={(e) => e.preventDefault()}
                    />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
};

export default InstructorCourseApprovals;
