// src/pages/instructor/components/TopCourses.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SectionCard from '@/components/common/SectionCard';
import { TopPerformingCourse } from '@/services/instructor.service';
import { useSettings } from '@/contexts/SettingsContext';
import { ArrowRight, BarChart2, Users } from 'lucide-react';
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

  /* Thứ hạng trước đây được tô bằng huy chương vàng, bạc, đồng — ba nền chuyển
     sắc chỉ để nói lên một con số. Nay dùng chung một ô số trung tính: thứ tự
     đã nằm sẵn trong danh sách, không cần màu nhắc lại. */
  return (
    <SectionCard
      title="Khóa học bán chạy nhất"
      description="Ba mươi ngày gần nhất"
      className={cn('flex flex-col', className)}
      bodyClassName="flex flex-1 flex-col justify-between"
    >
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-2">
              <Skeleton className="h-7 w-7 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {courses.length > 0 ? (
            <div className="space-y-2">
              {courses.map((c, index) => (
                <div
                  key={c.courseId}
                  className="flex items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm transition-colors hover:border-border hover:bg-muted/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <Link
                      to={`/instructor/courses/${c.courseSlug}/edit`}
                      className="truncate font-medium transition-colors hover:text-primary"
                    >
                      {c.courseName}
                    </Link>
                  </div>

                  <div className="flex shrink-0 flex-col items-end text-right">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatPrice(c.recentRevenue)}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
                      <Users className="h-3 w-3" aria-hidden="true" />+
                      {c.recentEnrollments} học viên
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 py-12 text-center">
              <BarChart2
                className="mx-auto h-10 w-10 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground">
                Chưa có đủ dữ liệu xếp hạng khóa học trong tháng này.
              </p>
            </div>
          )}

          <div className="mt-4">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link
                to="/instructor/courses"
                className="flex items-center justify-center gap-2"
              >
                Xem tất cả khóa học của bạn
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </>
      )}
    </SectionCard>
  );
};

export default TopCourses;
