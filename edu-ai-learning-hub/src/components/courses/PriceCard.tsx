// src/components/courses/PriceCard.tsx
import React, { useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useMyCart, useAddCourseToCart } from '@/hooks/queries/cart.queries';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/common/Icons';
import { AspectRatio } from '@/components/ui/aspect-ratio';

// Utils & Types
import { formatDurationShort } from '@/utils/formatter.util';
import {
  getYoutubeEmbedUrl,
  getVimeoEmbedUrl,
  extractYoutubeId,
  extractVimeoId,
} from '@/utils/video.util';
import { Course } from '@/services/course.service';

interface PriceCardProps {
  course: Course;
  className?: string; // Để có thể tùy chỉnh style từ bên ngoài
}

const PriceCard: React.FC<PriceCardProps> = ({ course, className }) => {
  const { userData } = useAuth();
  const { formatPrice } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: cartData } = useMyCart({ enabled: !!userData });
  const { mutate: addCourseToCart, isPending: isAddingToCart } =
    useAddCourseToCart();

  const isAddedToCart = useMemo(() => {
    if (!cartData || !course) return false;
    return cartData.items.some((item) => item.courseId === course.courseId);
  }, [cartData, course]);

  const handleAddToCart = () => {
    if (!userData) {
      toast.error('Please log in to add courses to your cart.');
      navigate('/', { state: { from: location.pathname } });
      return;
    }
    addCourseToCart(course.courseId, {
      onSuccess: (data) =>
        toast.success(
          data.message || `"${course.courseName}" has been added to your cart.`
        ),
      onError: (error) =>
        toast.error(error.message || 'Could not add course to cart.'),
    });
  };

  const handleBuyNow = () => {
    if (!userData) {
      toast.error('Please log in to enroll in the course.');
      navigate('/', { state: { from: location.pathname } });
      return;
    }
    if (!isAddedToCart) {
      addCourseToCart(course.courseId, {
        onSuccess: () => navigate('/cart'),
        onError: (error) => toast.error(error.message || 'An error occurred.'),
      });
    } else {
      navigate('/cart');
    }
  };

  const firstLesson = course.sections?.[0]?.lessons?.[0];
  const firstLessonLink = firstLesson
    ? `/learn/${course.slug}/sections/${firstLesson.sectionId}/lessons/${firstLesson.lessonId}`
    : '#';

  const displayPricing = course.pricing.display;
  const discountPercent =
    displayPricing.originalPrice > 0 &&
    displayPricing.discountedPrice &&
    displayPricing.discountedPrice < displayPricing.originalPrice
      ? Math.round(
          ((displayPricing.originalPrice - displayPricing.discountedPrice) /
            displayPricing.originalPrice) *
            100
        )
      : 0;

  const originalPrice = displayPricing.originalPrice;
  const discountedPrice = displayPricing.discountedPrice;
  console.log(
    `Course: ${course.courseName}, Original Price: ${originalPrice}, Discounted Price: ${discountedPrice}, Discount Percent: ${discountPercent}%`
  );
  const heroVideoOrImage = () => {
    const videoSource = course.introVideoUrl; // Ưu tiên signed URL nếu có

    if (videoSource) {
      if (
        videoSource.includes('youtube.com') ||
        videoSource.includes('vimeo.com')
      ) {
        const embedUrl = videoSource.includes('youtube.com')
          ? getYoutubeEmbedUrl(extractYoutubeId(videoSource) || '')
          : getVimeoEmbedUrl(extractVimeoId(videoSource) || '');
        return (
          <iframe
            src={embedUrl || undefined} // Handle null case for src
            title={`Intro to ${course.courseName}`}
            className='w-full h-full'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
            allowFullScreen
          ></iframe>
        );
      }
      // Nếu là Cloudinary (hoặc direct link)
      return (
        <video
          src={videoSource}
          controls
          className='w-full h-full object-cover'
          poster={course.thumbnailUrl || undefined}
        />
      );
    }
    if (course.thumbnailUrl) {
      return (
        <img
          src={course.thumbnailUrl}
          alt='Course preview'
          className='w-full h-full object-cover'
        />
      );
    }
    return (
      <div className='w-full h-full flex items-center justify-center bg-muted text-muted-foreground'>
        No preview available
      </div>
    );
  };

  return (
    <div
      className={`bg-card text-card-foreground rounded-lg shadow-xl overflow-hidden ${className}`}
    >
      <AspectRatio ratio={16 / 9} className='bg-muted'>
        {heroVideoOrImage()}
      </AspectRatio>
      <div className='p-5 space-y-4'>
        <div className='flex items-center flex-wrap gap-2'>
          <span className='text-3xl font-bold'>
            {formatPrice(
              displayPricing.discountedPrice ?? displayPricing.originalPrice
            )}
          </span>
          {discountPercent > 0 && (
            <>
              <span className='text-base text-muted-foreground line-through'>
                {formatPrice(displayPricing.originalPrice)}
              </span>
              <Badge variant='destructive'>{discountPercent}% OFF</Badge>
            </>
          )}
        </div>

        {course.isEnrolled ? (
          <Button className='w-full h-12 text-base' size='lg' asChild>
            <Link to={firstLessonLink}>
              <Icons.playCircle className='mr-2 h-5 w-5' /> Go to Course
            </Link>
          </Button>
        ) : (
          <div className='space-y-3'>
            <Button
              className='w-full h-12 text-base'
              size='lg'
              onClick={handleBuyNow}
              disabled={isAddingToCart}
            >
              Enroll Now
            </Button>
            <Button
              variant='outline'
              className='w-full h-11'
              onClick={handleAddToCart}
              disabled={isAddedToCart || isAddingToCart}
            >
              {isAddingToCart ? (
                <Icons.loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : isAddedToCart ? (
                <Icons.checkCircle className='mr-2 h-4 w-4' />
              ) : (
                <Icons.shoppingCart className='mr-2 h-4 w-4' />
              )}
              {isAddingToCart
                ? 'Adding...'
                : isAddedToCart
                  ? 'Already in Cart'
                  : 'Add to Cart'}
            </Button>
          </div>
        )}

        <p className='text-xs text-muted-foreground text-center'>
          30-Day Money-Back Guarantee
        </p>

        <div className='text-sm space-y-2 pt-3 border-t'>
          <h4 className='font-semibold mb-2'>This course includes:</h4>
          {course.totalDuration && (
            <p className='flex items-center gap-2'>
              <Icons.clock size={16} className='text-muted-foreground' />{' '}
              {formatDurationShort(course.totalDuration)} on-demand video
            </p>
          )}
          {course.totalLessons && (
            <p className='flex items-center gap-2'>
              <Icons.bookOpen size={16} className='text-muted-foreground' />{' '}
              {course.totalLessons} lessons & resources
            </p>
          )}
          <p className='flex items-center gap-2'>
            <Icons.zap size={16} className='text-muted-foreground' /> Full
            lifetime access
          </p>
          <p className='flex items-center gap-2'>
            <Icons.certificate size={16} className='text-muted-foreground' />{' '}
            Certificate of completion
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceCard;
