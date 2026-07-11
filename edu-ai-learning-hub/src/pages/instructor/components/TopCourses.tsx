// src/pages/instructor/components/TopCourses.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TopPerformingCourse } from '@/services/instructor.service';
import { useSettings } from '@/contexts/SettingsContext';

interface TopCoursesProps {
  courses: TopPerformingCourse[];
  isLoading: boolean;
  className?: string;
}

export const TopCourses: React.FC<TopCoursesProps> = ({
  courses,
  isLoading,
  className,
}) => {
  const { formatPrice } = useSettings();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Top Performing Courses</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='flex items-center gap-4'>
              <div className='flex-1 space-y-1'>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-3 w-1/2' />
              </div>
              <Skeleton className='h-5 w-16' />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Top Performing Courses (Last 30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        {courses.length > 0 ? (
          <div className='space-y-4'>
            {courses.map((c) => (
              <div
                key={c.courseId}
                className='flex justify-between items-center text-sm'
              >
                <Link
                  to={`/instructor/courses/${c.courseSlug}/edit`}
                  className='font-medium hover:text-primary truncate pr-4'
                >
                  {c.courseName}
                </Link>
                <div className='text-right shrink-0'>
                  <p className='font-semibold'>
                    {formatPrice(c.recentRevenue)}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {c.recentEnrollments} new students
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-sm text-muted-foreground text-center py-8'>
            Not enough data to show top courses.
          </p>
        )}
        <Button variant='outline' size='sm' className='w-full mt-6' asChild>
          <Link to='/instructor/courses'>View All Courses</Link>
        </Button>
      </CardContent>
    </Card>
  );
};
