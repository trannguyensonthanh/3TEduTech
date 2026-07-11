// src/components/courses/CourseCardv2.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Users, Clock, Zap, BookOpen, Award } from 'lucide-react';
import { formatDurationShort } from '@/utils/formatter.util';
import { CourseListItem } from '@/services/course.service'; // <-- Đảm bảo type này đã có trường pricing
import { useSettings } from '@/contexts/SettingsContext'; // <-- IMPORT HOOK MỚI
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import { cn } from '@/lib/utils';

interface CourseCardProps {
  course: CourseListItem;
  currentInstructorId?: number | string; // Thêm prop này, có thể là optional
  className?: string;
}

const CourseCardv2: React.FC<CourseCardProps> = ({
  course,
  currentInstructorId,
  className,
}) => {
  const { formatPrice } = useSettings();

  const displayPricing = course.pricing.display;
  const displayPrice =
    displayPricing.discountedPrice ?? displayPricing.originalPrice;
  const originalPrice = displayPricing.originalPrice;
  const hasDiscount =
    displayPricing.discountedPrice != null &&
    displayPricing.discountedPrice < originalPrice;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((originalPrice - (displayPricing.discountedPrice || 0)) /
          originalPrice) *
          100
      )
    : 0;

  const placeholderImage = `https://via.placeholder.com/600x338?text=${encodeURIComponent(course.courseName)}`;

  // Xác định xem user hiện tại có phải là chủ của khóa học không
  const isOwner =
    currentInstructorId &&
    Number(course.instructorAccountId) === Number(currentInstructorId);

  return (
    <div className={cn('h-full flex flex-col', className)}>
      <Card className='h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/50 bg-card'>
        {/* Phần ảnh và thông tin trên ảnh */}
        <Link
          to={`/courses/${course.slug}`}
          className='block group outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-t-lg'
        >
          <div className='aspect-[16/9] relative overflow-hidden bg-muted'>
            <img
              src={course.thumbnailUrl || placeholderImage}
              alt={course.courseName}
              className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
              loading='lazy'
              onError={(e) => (e.currentTarget.src = placeholderImage)}
            />
            {/* Các badge trên ảnh */}
            {discountPercentage > 0 && originalPrice > 0 && (
              <div className='absolute top-2 right-2 bg-red-600 text-white rounded-md px-1.5 py-0.5 text-xs font-semibold shadow'>
                -{discountPercentage}%
              </div>
            )}
          </div>
        </Link>

        {/* Phần nội dung text */}
        <div className='p-3 md:p-4 flex flex-col flex-grow'>
          <CardHeader className='p-0 mb-2'>
            <div className='flex justify-between items-start mb-1'>
              <Badge
                variant='outline'
                className='text-xs font-normal truncate max-w-[60%]'
                title={course.categoryName}
              >
                {course.categoryName}
              </Badge>
              {typeof course.averageRating === 'number' &&
                course.averageRating > 0 && (
                  <div className='flex items-center text-xs'>
                    <Icons.star className='h-3.5 w-3.5 text-yellow-400 mr-0.5' />
                    <span className='font-semibold'>
                      {course.averageRating.toFixed(1)}
                    </span>
                    {typeof course.reviewCount === 'number' && (
                      <span className='text-muted-foreground ml-0.5'>
                        ({course.reviewCount})
                      </span>
                    )}
                  </div>
                )}
            </div>
            <Link to={`/courses/${course.slug}`}>
              <CardTitle
                className='text-base font-semibold leading-snug line-clamp-2 h-[3em] hover:text-primary transition-colors'
                title={course.courseName}
              >
                {course.courseName}
              </CardTitle>
            </Link>
            <p
              className='text-xs text-muted-foreground pt-0.5 truncate'
              title={course.instructorName}
            >
              By {course.instructorName}
            </p>
          </CardHeader>

          <CardContent className='p-3 md:p-4 pt-1 text-xs text-muted-foreground flex-grow'>
            <div className='flex items-center gap-x-3 gap-y-1 flex-wrap'>
              {typeof course.totalDurationSeconds === 'number' &&
                course.totalDurationSeconds > 0 && (
                  <span className='flex items-center whitespace-nowrap'>
                    <Clock size={13} className='mr-1' />
                    {formatDurationShort(course.totalDurationSeconds)}
                  </span>
                )}
              {typeof course.lessonsCount === 'number' && (
                <span className='flex items-center whitespace-nowrap'>
                  <BookOpen size={13} className='mr-1' /> {course.lessonsCount}{' '}
                  lessons
                </span>
              )}
              {course.levelName && (
                <span className='capitalize whitespace-nowrap'>
                  • {course.levelName}
                </span>
              )}
            </div>
            {course.hasCertificate && (
              <div className='mt-2 flex items-center text-green-700 dark:text-green-400 text-xs'>
                <Award size={14} className='mr-1' /> Certificate of Completion
              </div>
            )}
          </CardContent>
          {/* Footer sẽ chứa giá và các nút hành động */}
          <CardFooter className='p-0 pt-3 border-t mt-auto flex-col items-start gap-3'>
            <div className='flex justify-between items-center w-full'>
              {displayPrice === 0 ? (
                <span className='text-xl font-bold text-green-600'>FREE</span>
              ) : (
                <div className='flex items-baseline gap-1.5'>
                  <span className='text-xl font-bold'>
                    {formatPrice(displayPrice)}
                  </span>
                  {hasDiscount && (
                    <span className='text-sm text-muted-foreground line-through'>
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                </div>
              )}
              <div className='flex items-center text-xs text-muted-foreground'>
                <Icons.users size={14} className='mr-1' />
                {course.studentCount?.toLocaleString() || 0}
              </div>
            </div>

            {/* PHẦN THÊM MỚI: NÚT HÀNH ĐỘNG */}
            {isOwner && (
              <div className='w-full border-t pt-3'>
                <Link
                  to={`/instructor/courses/${course.slug}/edit`}
                  className='w-full'
                >
                  <Button variant='outline' size='sm' className='w-full'>
                    <Icons.edit className='mr-2 h-4 w-4' /> Manage Course
                  </Button>
                </Link>
              </div>
            )}
          </CardFooter>
        </div>
      </Card>
    </div>
  );
};

export default CourseCardv2;
