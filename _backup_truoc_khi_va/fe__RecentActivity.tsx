// src/pages/instructor/components/RecentActivity.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RecentEnrollment } from '@/services/instructor.service';
import { formatDistanceToNow } from 'date-fns';
import { Icons } from '@/components/common/Icons';
import { cn } from '@/lib/utils';

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
              <Skeleton className='h-11 w-11 rounded-full' />
              <div className='flex-1 space-y-2'>
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
    <Card className={cn('rounded-2xl border border-white/10 dark:border-slate-800/80 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col justify-between', className)}>
      <div>
        <CardHeader className='p-5 border-b border-border/40 bg-gradient-to-r from-emerald-500/5 via-transparent to-teal-500/5'>
          <CardTitle className='text-base font-extrabold tracking-tight text-foreground flex items-center justify-between'>
            <span className='flex items-center gap-2.5'>
              <div className='p-1.5 rounded-lg bg-emerald-500/20 text-emerald-500'>
                <Icons.users className='w-5 h-5' />
              </div>
              Học Viên Đăng Ký Gần Đây
            </span>
            <span className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[11px] font-bold tracking-wide border border-emerald-500/20'>
              <span className='w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block' />
              Live Feed
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className='p-5'>
          {enrollments.length > 0 ? (
            <div className='space-y-3'>
              {enrollments.map((e, index) => (
                <div
                  key={`${e.studentAccountId}-${index}`}
                  className='group flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-emerald-500/30 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:via-teal-500/5 hover:to-transparent transition-all duration-300 transform hover:scale-[1.01]'
                >
                  <div className='relative'>
                    <Avatar className='h-11 w-11 border-2 border-indigo-500/30 group-hover:border-emerald-500 transition-colors shadow-sm'>
                      <AvatarImage
                        src={e.studentAvatarUrl || undefined}
                        alt={e.studentName}
                      />
                      <AvatarFallback className='bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold'>
                        {e.studentName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className='absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full' />
                  </div>

                  <div className='flex-1 text-sm min-w-0'>
                    <p className='truncate leading-snug'>
                      <span className='font-extrabold text-foreground font-outfit text-base mr-1'>
                        {e.studentName}
                      </span>{' '}
                      <span className='text-muted-foreground'>đã gia nhập</span>{' '}
                      <Link
                        to={`/courses/${e.courseName}`}
                        className='font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline block truncate mt-0.5'
                      >
                        🎓 {e.courseName}
                      </Link>
                    </p>
                    <p className='text-[11px] font-medium text-muted-foreground flex items-center gap-1 mt-1 opacity-90'>
                      <Icons.clock className='w-3 h-3 text-emerald-500' />
                      {formatDistanceToNow(new Date(e.enrolledAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='py-12 text-center text-muted-foreground space-y-2'>
              <Icons.user className='w-10 h-10 mx-auto text-muted-foreground/40 stroke-1' />
              <p className='text-sm font-medium'>Chưa có lượt gia nhập mới nào gần đây.</p>
            </div>
          )}
        </CardContent>
      </div>

      <div className='p-4 pt-0'>
        <Button
          variant='outline'
          size='sm'
          className='w-full rounded-xl hover:bg-gradient-to-r hover:from-emerald-600 hover:to-teal-600 hover:text-white hover:border-transparent transition-all duration-300 font-semibold group'
          asChild
        >
          <Link to='/instructor/students' className='flex items-center justify-center gap-2'>
            Quản Lý Danh Sách Học Viên
            <Icons.arrowRight className='w-4 h-4 transition-transform group-hover:translate-x-1' />
          </Link>
        </Button>
      </div>
    </Card>
  );
};
