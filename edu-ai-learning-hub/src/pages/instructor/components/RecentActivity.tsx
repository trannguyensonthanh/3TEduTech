// src/pages/instructor/components/RecentActivity.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SectionCard from '@/components/common/SectionCard';
import { RecentEnrollment } from '@/services/instructor.service';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Clock, UserRound } from 'lucide-react';
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
}) => (
  /* Khối này và khối "Khóa học bán chạy" đứng cạnh nhau trên cùng một hàng, nên
     phải cùng một kiểu thẻ. Bản trước mỗi khối tự tô một dải màu ở phần đầu
     (xanh lá và tím) làm hai thẻ trông như thuộc hai trang khác nhau. */
  <SectionCard
    title="Học viên đăng ký gần đây"
    className={cn('flex flex-col', className)}
    bodyClassName="flex flex-1 flex-col justify-between"
  >
    {isLoading ? (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-2">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        ))}
      </div>
    ) : (
      <>
        {enrollments.length > 0 ? (
          <div className="space-y-2">
            {enrollments.map((e, index) => (
              <div
                key={`${e.studentAccountId}-${index}`}
                className="flex items-center gap-4 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/50"
              >
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarImage
                    src={e.studentAvatarUrl || undefined}
                    alt={e.studentName}
                  />
                  <AvatarFallback className="text-sm font-medium">
                    {e.studentName.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate leading-snug">
                    <span className="font-medium text-foreground">
                      {e.studentName}
                    </span>{' '}
                    <span className="text-muted-foreground">đã ghi danh</span>
                  </p>
                  <Link
                    to={`/courses/${e.courseName}`}
                    className="mt-0.5 block truncate text-sm font-medium transition-colors hover:text-primary"
                  >
                    {e.courseName}
                  </Link>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {formatDistanceToNow(new Date(e.enrolledAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 py-12 text-center">
            <UserRound
              className="mx-auto h-10 w-10 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              Chưa có lượt ghi danh mới nào gần đây.
            </p>
          </div>
        )}

        <div className="mt-4">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link
              to="/instructor/students"
              className="flex items-center justify-center gap-2"
            >
              Quản lý danh sách học viên
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </>
    )}
  </SectionCard>
);

export default RecentActivity;
