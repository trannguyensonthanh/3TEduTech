// src/components/courses/CourseCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/common/Icons';
import { formatDurationShort } from '@/utils/formatter.util';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useSettings } from '@/contexts/SettingsContext'; // <-- IMPORT HOOK MỚI
import { PricingDetails } from '@/services/course.service'; // <-- IMPORT TYPE MỚI

// Cập nhật interface để khớp với dữ liệu API
export interface CourseCardType {
  courseId: number;
  slug: string;
  courseName: string;
  instructorName: string;
  thumbnailUrl?: string | null;
  averageRating?: number | null;
  reviewCount?: number;
  levelName?: string;
  lessonsCount?: number;
  totalDurationSeconds?: number;
  pricing: PricingDetails; // <-- SỬ DỤNG TYPE PRICING MỚI
}

interface CourseCardProps {
  course: CourseCardType;
  className?: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

const CourseCard: React.FC<CourseCardProps> = ({ course, className }) => {
  const { formatPrice } = useSettings(); // <-- SỬ DỤNG HOOK MỚI

  // Lấy thông tin giá từ `pricing.display` mà backend đã tính toán sẵn
  const displayPricing = course.pricing.display;
  const displayPrice =
    displayPricing.discountedPrice ?? displayPricing.originalPrice;
  const originalPrice = displayPricing.originalPrice;
  const hasDiscount =
    displayPricing.discountedPrice != null &&
    displayPricing.discountedPrice < originalPrice;
  const discountPercent = hasDiscount
    ? Math.round(
        ((originalPrice - (displayPricing.discountedPrice || 0)) /
          originalPrice) *
          100
      )
    : 0;

  const renderStars = (rating?: number | null) => {
    if (rating == null || rating === 0) {
      return null; // Không hiển thị gì nếu chưa có review
    }
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
      <>
        {[...Array(fullStars)].map((_, i) => (
          <Icons.star
            key={`full-${i}`}
            className='h-4 w-4 text-yellow-400 fill-yellow-400'
          />
        ))}
        {halfStar && (
          // Placeholder cho half-star, bạn có thể thay bằng icon thật
          <div className='relative h-4 w-4'>
            <Icons.star className='absolute inset-0 h-4 w-4 text-yellow-400 fill-yellow-200' />
            <div
              className='absolute inset-0 w-1/2 h-full bg-background'
              style={{ clipPath: 'inset(0 50% 0 0)' }}
            >
              <Icons.star className='h-4 w-4 text-yellow-400 fill-transparent' />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Icons.star
            key={`empty-${i}`}
            className='h-4 w-4 text-gray-300 fill-gray-300 dark:text-gray-600 dark:fill-gray-600'
          />
        ))}
      </>
    );
  };

  return (
    <motion.div
      variants={cardVariants}
      className={cn(
        'group bg-card border border-border/60 rounded-lg overflow-hidden shadow-sm hover:shadow-lg dark:hover:shadow-primary/10 transition-shadow duration-300 flex flex-col h-full',
        className
      )}
    >
      <Link
        to={`/courses/${course.slug}`}
        className='block aspect-[16/9] overflow-hidden relative'
      >
        <img
          src={
            course.thumbnailUrl ||
            'https://via.placeholder.com/400x225/e0e0e0/909090?text=Course+Image'
          }
          alt={course.courseName}
          className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
          loading='lazy'
        />
        {hasDiscount && (
          <Badge
            variant='destructive'
            className='absolute top-2.5 right-2.5 shadow-md text-xs px-2 py-0.5'
          >
            {discountPercent}% OFF
          </Badge>
        )}
      </Link>

      <div className='p-4 flex flex-col flex-grow'>
        <div className='flex items-center justify-between mb-2'>
          {course.levelName && (
            <Badge
              variant='outline'
              className='self-start text-xs py-0.5 px-1.5 border-primary/50 text-primary dark:border-primary/40 dark:text-primary/90'
            >
              {course.levelName}
            </Badge>
          )}
          <div className='flex items-center gap-1.5'>
            {renderStars(course.averageRating)}
            {course.reviewCount != null && course.reviewCount > 0 && (
              <span className='text-xs text-muted-foreground'>
                ({course.reviewCount})
              </span>
            )}
          </div>
        </div>

        <Link to={`/courses/${course.slug}`} className='block mb-1.5 flex-grow'>
          <h3 className='text-base font-semibold leading-snug line-clamp-2 h-[48px] text-card-foreground group-hover:text-primary transition-colors dark:group-hover:text-primary/90'>
            {course.courseName}
          </h3>
        </Link>
        <p className='text-xs text-muted-foreground mb-3 line-clamp-1'>
          By {course.instructorName}
        </p>

        <div className='flex items-center text-xs text-muted-foreground space-x-3 mb-4 mt-auto pt-3 border-t'>
          {course.lessonsCount != null && (
            <div
              className='flex items-center'
              title={`${course.lessonsCount} lessons`}
            >
              <Icons.lessons className='w-3.5 h-3.5 mr-1' />
              <span>{course.lessonsCount}</span>
            </div>
          )}
          {course.totalDurationSeconds != null &&
            course.totalDurationSeconds > 0 && (
              <div
                className='flex items-center'
                title={`Total duration: ${formatDurationShort(course.totalDurationSeconds)}`}
              >
                <Icons.clock className='w-3.5 h-3.5 mr-1' />
                <span>{formatDurationShort(course.totalDurationSeconds)}</span>
              </div>
            )}
        </div>

        <div className='flex items-baseline justify-between'>
          {originalPrice > 0 ? (
            <div className='flex items-baseline gap-2'>
              <p className='text-xl font-bold text-primary dark:text-primary/90'>
                {formatPrice(displayPrice)}
              </p>
              {hasDiscount && (
                <p className='text-sm text-muted-foreground line-through'>
                  {formatPrice(originalPrice)}
                </p>
              )}
            </div>
          ) : (
            <Badge
              variant='success'
              className='text-lg font-semibold px-3 py-1'
            >
              Free
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;
