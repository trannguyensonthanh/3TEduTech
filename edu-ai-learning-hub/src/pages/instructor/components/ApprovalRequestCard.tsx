// src/pages/instructor/components/ApprovalRequestCard.tsx
import { Link } from 'react-router-dom';
import { ApprovalRequestListItem } from '@/services/course.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Icons } from '@/components/common/Icons';
import { format, parseISO } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ApprovalRequestCardProps {
  request: ApprovalRequestListItem;
}

const statusConfig = {
  PENDING: {
    label: 'Pending Review',
    icon: <Icons.clock className='h-4 w-4' />,
    badgeClass:
      'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
    iconClass: 'text-yellow-500',
  },
  APPROVED: {
    label: 'Approved',
    icon: <Icons.checkCircle className='h-4 w-4' />,
    badgeClass:
      'bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
    iconClass: 'text-green-500',
  },
  REJECTED: {
    label: 'Needs Revision',
    icon: <Icons.alertCircle className='h-4 w-4' />,
    badgeClass:
      'bg-red-100 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
    iconClass: 'text-red-500',
  },
  NEEDS_REVISION: {
    // Thêm trạng thái này cho rõ ràng hơn REJECTED
    label: 'Needs Revision',
    icon: <Icons.alertCircle className='h-4 w-4' />,
    badgeClass:
      'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800',
    iconClass: 'text-orange-500',
  },
};

export const ApprovalRequestCard = ({ request }: ApprovalRequestCardProps) => {
  const config = statusConfig[request.status] || statusConfig.PENDING;

  return (
    <Card className='transition-all hover:shadow-md dark:hover:bg-slate-800/50'>
      <CardHeader>
        <div className='flex justify-between items-start gap-4'>
          <CardTitle className='text-lg font-semibold leading-tight'>
            {request.courseName}
          </CardTitle>
          <Badge variant='outline' className={`shrink-0 ${config.badgeClass}`}>
            {config.icon}
            <span className='ml-2'>{config.label}</span>
          </Badge>
        </div>
        <div className='text-sm text-muted-foreground flex items-center gap-4 pt-1'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className='flex items-center gap-1.5'>
                  <Icons.calendar className='h-4 w-4' />
                  <span>
                    {format(parseISO(request.requestDate), 'dd MMM, yyyy')}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Request Date</p>
              </TooltipContent>
            </Tooltip>
            {request.reviewedAt && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className='flex items-center gap-1.5'>
                    <Icons.userCheck className='h-4 w-4' />
                    <span>
                      {format(parseISO(request.reviewedAt), 'dd MMM, yyyy')}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reviewed Date</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        {(request.instructorNotes || request.adminNotes) && (
          <div className='space-y-4'>
            {request.instructorNotes && (
              <div className='bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-900/30'>
                <p className='text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1'>
                  Your Notes:
                </p>
                <p className='text-sm text-gray-700 dark:text-gray-300'>
                  {request.instructorNotes}
                </p>
              </div>
            )}
            {request.adminNotes && (
              <div className='bg-muted dark:bg-slate-800 p-3 rounded-md border dark:border-slate-700'>
                <p className='text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1'>
                  Admin Feedback:
                </p>
                <p className='text-sm text-gray-700 dark:text-gray-300'>
                  {request.adminNotes}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className='bg-slate-50 dark:bg-slate-800/30 px-6 py-4 flex justify-end'>
        <div className='flex space-x-3'>
          {(request.status === 'APPROVED' ||
            request.status === 'REJECTED' ||
            request.status === 'NEEDS_REVISION') && (
            <Link to={`/instructor/courses/${request.courseSlug}/edit`}>
              <Button variant='outline' size='sm'>
                <Icons.edit className='mr-2 h-4 w-4' />
                Edit Course
              </Button>
            </Link>
          )}
          {request.status === 'APPROVED' && (
            <Link to={`/courses/${request.courseSlug}`}>
              <Button variant='default' size='sm'>
                <Icons.eye className='mr-2 h-4 w-4' /> View Published
              </Button>
            </Link>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
