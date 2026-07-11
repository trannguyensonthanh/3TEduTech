// src/components/cart/CartItemCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { CartItem } from '@/services/cart.service';

// UI Components
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Icons } from '@/components/common/Icons';

interface CartItemCardProps {
  item: CartItem;
  onRemove: (courseId: number) => void;
  isRemoving: boolean;
}

const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  onRemove,
  isRemoving,
}) => {
  const { formatPrice } = useSettings();
  const displayPricing = item.pricing.display;

  return (
    <div className='flex flex-col sm:flex-row gap-4 pt-4 first:pt-0'>
      <Link
        to={`/courses/${item.slug}`}
        className='block w-full sm:w-40 md:w-48 shrink-0'
      >
        <AspectRatio
          ratio={16 / 9}
          className='bg-muted rounded-md overflow-hidden hover:opacity-90 transition-opacity'
        >
          <img
            src={
              item.thumbnailUrl ||
              `https://via.placeholder.com/320x180?text=${encodeURIComponent(item.courseName)}`
            }
            alt={item.courseName}
            className='w-full h-full object-cover'
            loading='lazy'
          />
        </AspectRatio>
      </Link>

      <div className='flex-grow flex flex-col'>
        <div>
          <div className='flex justify-between items-start'>
            <Link
              to={`/courses/${item.slug}`}
              className='text-base md:text-lg font-semibold hover:text-primary transition-colors line-clamp-2 pr-2'
              title={item.courseName}
            >
              {item.courseName}
            </Link>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => onRemove(item.courseId)}
              disabled={isRemoving}
              className='h-8 w-8 shrink-0 -mr-2 -mt-1'
              aria-label={`Remove ${item.courseName} from cart`}
            >
              <Icons.xCircle className='h-5 w-5 text-muted-foreground hover:text-destructive' />
            </Button>
          </div>
          <p className='text-xs text-muted-foreground mt-0.5'>
            By {item.instructorName}
          </p>
        </div>

        <div className='mt-auto pt-2 flex items-baseline justify-start'>
          {displayPricing.discountedPrice &&
          displayPricing.discountedPrice < displayPricing.originalPrice ? (
            <div className='flex items-baseline gap-2'>
              <span className='text-lg font-bold text-primary'>
                {formatPrice(displayPricing.discountedPrice)}
              </span>
              <span className='text-sm text-muted-foreground line-through'>
                {formatPrice(displayPricing.originalPrice)}
              </span>
            </div>
          ) : (
            <span className='text-lg font-bold'>
              {formatPrice(displayPricing.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItemCard;
