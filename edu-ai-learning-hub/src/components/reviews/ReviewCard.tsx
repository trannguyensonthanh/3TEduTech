import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/common/Icons';
import { format, parseISO } from 'date-fns';
import { InstructorReviewItem } from '@/services/review.service'; // Import interface
import { Link } from 'react-router-dom'; // Nếu muốn link đến khóa học
import { cn } from '@/lib/utils';

interface ReviewCardProps {
  review: InstructorReviewItem;
}

const renderStars = (rating: number) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5; // Đơn giản hóa: chỉ hiển thị sao đầy
  const emptyStars = 5 - Math.ceil(rating);
  return (
    <>
      {[...Array(Math.ceil(rating))].map((_, i) => (
        <Icons.star
          key={`full-${i}`}
          className="h-4 w-4 text-yellow-400 fill-yellow-400"
        />
      ))}
      {[...Array(emptyStars)].map((_, i) => (
        <Icons.star
          key={`empty-${i}`}
          className="h-4 w-4 text-slate-300 dark:text-slate-600"
        />
      ))}
    </>
  );
};

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const userInitials =
    review.userFullName
      ?.split(' ')
      .map((name) => name[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  return (
    <Card className="bg-background dark:bg-slate-800/50 border dark:border-slate-700/70 shadow-sm">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-start mb-3">
          <Avatar className="h-10 w-10 mr-3 border">
            <AvatarImage
              src={review.userAvatarUrl || undefined}
              alt={review.userFullName || 'User'}
            />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="font-semibold text-foreground text-base">
                  {review.userFullName || 'Anonymous User'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Reviewed course:{' '}
                  <Link
                    to={`/courses/${review.courseId}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {review.courseName}
                  </Link>
                </p>
              </div>
              <div
                className="flex items-center mt-1 sm:mt-0"
                title={`${review.rating} out of 5 stars`}
              >
                {renderStars(review.rating)}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({review.rating.toFixed(1)})
                </span>
              </div>
            </div>
          </div>
        </div>
        {review.comment && (
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2 prose dark:prose-invert prose-sm max-w-none">
            {review.comment}
          </p>
        )}
        <p className="text-xs text-muted-foreground text-right">
          {format(parseISO(review.reviewedAt), 'MMM dd, yyyy')}
        </p>
      </CardContent>
    </Card>
  );
};
export default ReviewCard;
