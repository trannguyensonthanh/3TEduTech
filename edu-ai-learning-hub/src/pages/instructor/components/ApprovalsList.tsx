// src/pages/instructor/components/ApprovalsList.tsx
import { ApprovalRequestListItem } from '@/services/course.service';
import { Icons } from '@/components/common/Icons';
import { ApprovalRequestCard } from './ApprovalRequestCard';
import { Skeleton } from '@/components/ui/skeleton';

interface ApprovalsListProps {
  requests?: ApprovalRequestListItem[];
  isLoading: boolean;
  isError: boolean;
}

const ApprovalsList = ({
  requests,
  isLoading,
  isError,
}: ApprovalsListProps) => {
  if (isLoading) {
    return (
      <div className='grid gap-6'>
        {[...Array(3)].map((_, i) => (
          <div key={i} className='p-6 border rounded-lg'>
            <div className='flex justify-between items-start'>
              <div className='space-y-2'>
                <Skeleton className='h-6 w-72' />
                <Skeleton className='h-4 w-48' />
              </div>
              <Skeleton className='h-7 w-28 rounded-full' />
            </div>
            <div className='mt-4 space-y-2'>
              <Skeleton className='h-16 w-full' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center bg-red-50 dark:bg-red-900/20 rounded-lg'>
        <Icons.serverCrash className='h-16 w-16 text-red-500 mb-4' />
        <h3 className='text-xl font-semibold text-red-700 dark:text-red-300'>
          Oops! Something went wrong.
        </h3>
        <p className='text-muted-foreground mt-2 max-w-md'>
          We couldn't load your approval requests. Please try again later.
        </p>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center bg-gray-50 dark:bg-slate-800/40 rounded-lg'>
        <Icons.fileSearch className='h-16 w-16 text-muted-foreground mb-4' />
        <h3 className='text-xl font-medium'>No Requests Found</h3>
        <p className='text-muted-foreground mt-2 max-w-md'>
          There are no approval requests matching the current filter.
        </p>
      </div>
    );
  }

  return (
    <div className='grid gap-6'>
      {requests.map((request) => (
        <ApprovalRequestCard key={request.requestId} request={request} />
      ))}
    </div>
  );
};

export default ApprovalsList;
