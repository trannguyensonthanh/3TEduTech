// src/pages/instructor/components/RecentActivity.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RecentEnrollment } from '@/services/instructor.service';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
  enrollments: RecentEnrollment[];
  isLoading: boolean;
  className?: string;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  enrollments,
  isLoading,
  className,
}) => {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Recent Enrollments</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='flex items-center gap-4'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='flex-1 space-y-1'>
                <Skeleton className='h-4 w-4/5' />
                <Skeleton className='h-3 w-3/5' />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Enrollments</CardTitle>
      </CardHeader>
      <CardContent>
        {enrollments.length > 0 ? (
          <div className='space-y-4'>
            {enrollments.map((e) => (
              <div key={e.studentAccountId} className='flex items-center gap-4'>
                <Avatar className='h-10 w-10'>
                  <AvatarImage
                    src={e.studentAvatarUrl || undefined}
                    alt={e.studentName}
                  />
                  <AvatarFallback>{e.studentName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className='flex-1 text-sm'>
                  <p>
                    <span className='font-semibold'>{e.studentName}</span>{' '}
                    enrolled in{' '}
                    <Link
                      to={`/courses/${e.courseName}`}
                      className='text-primary hover:underline'
                    >
                      {e.courseName}
                    </Link>
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {formatDistanceToNow(new Date(e.enrolledAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-sm text-muted-foreground text-center py-8'>
            No recent enrollments.
          </p>
        )}
        <Button variant='outline' size='sm' className='w-full mt-6' asChild>
          <Link to='/instructor/students'>View All Students</Link>
        </Button>
      </CardContent>
    </Card>
  );
};
