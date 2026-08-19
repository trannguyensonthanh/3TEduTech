// src/pages/instructor/components/TopCourses.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TopPerformingCourse } from '@/services/instructor.service';
import { useSettings } from '@/contexts/SettingsContext';
import { Icons } from '@/components/common/Icons';
import { cn } from '@/lib/utils';

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
      <Card className={cn('rounded-2xl border p-5 shadow-xl bg-card/80', className)}>
        <CardHeader className='p-0 pb-4 border-b border-border/50'>
          <CardTitle className='text-lg font-extrabold flex items-center gap-2'>
            <Skeleton className='h-6 w-6 rounded-full' />
            <Skeleton className='h-6 w-48' />
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 pt-4 p-0'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='flex items-center gap-4 p-2'>
              <Skeleton className='h-8 w-8 rounded-lg' />
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-3 w-1/2' />
              </div>
              <Skeleton className='h-6 w-20' />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const getBadgeStyle = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-amber-500/40 border-amber-300';
      case 1:
        return 'bg-gradient-to-r from-slate-300 to-slate-200 text-slate-900 font-bold shadow-slate-400/30 border-slate-100';
      case 2:
        return 'bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 text-white font-bold shadow-orange-700/30 border-amber-600';
      default:
        return 'bg-muted/60 text-muted-foreground font-semibold border-border/60';
    }
  };

  return (
    <Card className={cn('rounded-2xl border border-white/10 dark:border-slate-800/80 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col justify-between', className)}>
      <div>
        <CardHeader className='p-5 border-b border-border/40 bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5'>
          <CardTitle className='text-base font-extrabold tracking-tight text-foreground flex items-center justify-between'>
            <span className='flex items-center gap-2.5'>
              <div className='p-1.5 rounded-lg bg-amber-500/20 text-amber-500'>
                <Icons.certificate className='w-5 h-5 animate-pulse' />
              </div>
              Top Khóa Học Buổi Sáng & Bán Chạy
            </span>
            <span className='text-[11px] font-medium text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full'>
              30 ngày qua
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className='p-5'>
          {courses.length > 0 ? (
            <div className='space-y-3'>
              {courses.map((c, index) => (
                <div
                  key={c.courseId}
                  className='group flex justify-between items-center text-sm p-3 rounded-xl border border-transparent hover:border-indigo-500/30 hover:bg-gradient-to-r hover:from-indigo-500/10 hover:via-purple-500/5 hover:to-transparent transition-all duration-300 transform hover:scale-[1.01]'
                >
                  <div className='flex items-center gap-3 min-w-0 pr-3'>
                    <span
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center text-xs border shadow-sm shrink-0 font-outfit',
                        getBadgeStyle(index)
                      )}
                    >
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    <Link
                      to={`/instructor/courses/${c.courseSlug}/edit`}
                      className='font-bold group-hover:text-indigo-500 dark:group-hover:text-indigo-400 truncate transition-colors font-outfit'
                    >
                      {c.courseName}
                    </Link>
                  </div>

                  <div className='text-right shrink-0 flex flex-col items-end'>
                    <span className='font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 font-outfit text-base'>
                      {formatPrice(c.recentRevenue)}
                    </span>
                    <span className='text-[11px] font-medium text-muted-foreground flex items-center gap-1 mt-0.5'>
                      <Icons.users className='w-3 h-3 text-cyan-500' />
                      +{c.recentEnrollments} học viên
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='py-12 text-center text-muted-foreground space-y-2'>
              <Icons.barChart className='w-10 h-10 mx-auto text-muted-foreground/40 stroke-1' />
              <p className='text-sm font-medium'>Chưa có đủ dữ liệu xếp hạng khóa học trong tháng này.</p>
            </div>
          )}
        </CardContent>
      </div>

      <div className='p-4 pt-0'>
        <Button
          variant='outline'
          size='sm'
          className='w-full rounded-xl hover:bg-gradient-to-r hover:from-indigo-600 hover:to-violet-600 hover:text-white hover:border-transparent transition-all duration-300 font-semibold group'
          asChild
        >
          <Link to='/instructor/courses' className='flex items-center justify-center gap-2'>
            Xem Tất Cả Khóa Học Của Bạn
            <Icons.arrowRight className='w-4 h-4 transition-transform group-hover:translate-x-1' />
          </Link>
        </Button>
      </div>
    </Card>
  );
};
