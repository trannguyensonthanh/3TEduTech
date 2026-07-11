/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/layout/CartDropdown.tsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// UI Components
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/common/Icons';

// Hooks & Contexts
import {
  useMyCart,
  useRemoveCourseFromCart,
} from '@/hooks/queries/cart.queries';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext'; // <-- IMPORT HOOK MỚI
import { toast } from 'sonner';

// Services & Types
import { CartItem } from '@/services/cart.service';

const CartDropdown: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();
  const { formatPrice } = useSettings(); // <-- SỬ DỤNG HOOK MỚI

  const {
    data: cartData,
    isLoading: isLoadingCart,
    isError,
    error,
  } = useMyCart({
    enabled: !!userData,
  });

  const { mutate: removeItemMutate, isPending: isRemovingItem } =
    useRemoveCourseFromCart();

  const items = cartData?.items || [];
  const summary = cartData?.summary;
  const cartItemCount = items.length;

  const handleRemoveItem = (e: React.MouseEvent, courseId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRemovingItem) return;
    removeItemMutate(courseId, {
      onSuccess: (data) => {
        toast.success(data.message || 'Item Removed from cart.');
      },
      onError: (err: any) => {
        toast.error(
          err.response?.data?.message || err.message || 'Could not remove item.'
        );
      },
    });
  };

  const DropdownCartContent = () => {
    if (!userData) {
      return (
        <div className='p-4 text-center'>
          <p className='text-sm text-muted-foreground mb-3'>
            {t('cartDropdown.loginToView')}
          </p>
          <Button
            size='sm'
            onClick={() =>
              navigate('/', { state: { from: location.pathname } })
            }
          >
            {t('cartDropdown.loginBtn')}
          </Button>
        </div>
      );
    }

    if (isLoadingCart && !cartData) {
      // Chỉ hiển thị loading to khi chưa có data cũ
      return (
        <div className='p-4 text-center flex flex-col items-center justify-center h-32'>
          <Icons.loader2 className='h-6 w-6 animate-spin text-primary' />
          <p className='text-xs text-muted-foreground mt-2'>
            {t('cartDropdown.loading')}
          </p>
        </div>
      );
    }

    if (isError) {
      return (
        <div className='p-4 text-center text-destructive-foreground bg-destructive/90 rounded-b-md'>
          <Icons.xCircle size={18} className='mx-auto mb-1' />
          <p className='text-xs font-semibold'>
            {t('cartDropdown.errorLoading')}
          </p>
          <p className='text-xs opacity-80'>{error?.message}</p>
        </div>
      );
    }

    if (cartItemCount === 0) {
      return (
        <div className='p-6 text-center w-64 sm:w-72'>
          <Icons.shoppingBag className='h-10 w-10 mx-auto text-muted-foreground opacity-40 mb-3' />
          <p className='font-semibold text-sm'>
            {t('cartDropdown.cartIsEmpty')}
          </p>
          <p className='text-xs text-muted-foreground mt-1 mb-4'>
            {t('cartDropdown.addCoursesHint')}
          </p>
          {/* Nút Go to Courses vẫn hiển thị */}

          <Button
            variant='secondary'
            size='sm'
            className='w-full'
            onClick={() => {
              navigate('/courses');
            }}
          >
            {t('cartDropdown.browseCourses')}
          </Button>
          {/* Nút View Cart vẫn hiển thị */}
          <Button
            variant='outline'
            size='sm'
            className='w-full'
            onClick={() => {
              navigate('/cart');
            }}
          >
            {t('cartDropdown.viewCart')}
          </Button>
        </div>
      );
    }

    // Giao diện khi có item
    return (
      <>
        <DropdownMenuLabel className='px-3 py-2.5 text-sm font-semibold flex justify-between items-center'>
          <span>{t('cartDropdown.yourCart', { count: cartItemCount })}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className='max-h-[280px] md:max-h-[320px] lg:max-h-[360px] w-full'>
          <div className='divide-y divide-border'>
            {items.map((item: CartItem) => {
              // Sử dụng giá đã được chuyển đổi từ backend
              const displayPrice =
                item.pricing.display.discountedPrice ??
                item.pricing.display.originalPrice;
              const originalPrice = item.pricing.display.originalPrice;

              return (
                <DropdownMenuItem
                  key={item.cartItemId}
                  className='p-0 focus:bg-transparent'
                  asChild
                >
                  <Link
                    to={`/courses/${item.slug}`}
                    className='flex items-start gap-3 p-2.5 hover:bg-muted/50 w-full'
                  >
                    <div className='w-16 h-10 bg-muted rounded overflow-hidden shrink-0'>
                      <img
                        src={
                          item.thumbnailUrl ||
                          `https://via.placeholder.com/160x90?text=${encodeURIComponent(item.courseName.substring(0, 10))}`
                        }
                        alt={item.courseName}
                        className='w-full h-full object-cover'
                      />
                    </div>
                    <div className='flex-grow min-w-0'>
                      <p
                        className='text-xs font-medium truncate leading-snug'
                        title={item.courseName}
                      >
                        {item.courseName}
                      </p>
                      <p className='text-xs text-muted-foreground truncate'>
                        {t('cartDropdown.by')} {item.instructorName}
                      </p>
                      <p className='text-xs font-semibold text-primary mt-0.5'>
                        {formatPrice(displayPrice)}
                        {displayPrice < originalPrice && (
                          <span className='ml-1.5 text-xs text-muted-foreground line-through'>
                            {formatPrice(originalPrice)}
                          </span>
                        )}
                      </p>
                    </div>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-6 w-6 shrink-0 opacity-70 hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
                      onClick={(e) => handleRemoveItem(e, item.courseId)}
                      title={t('cartDropdown.removeFromCart')}
                    >
                      <Icons.trash2 size={14} />
                    </Button>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </div>
        </ScrollArea>
        <DropdownMenuSeparator />
        <div className='p-3 space-y-3'>
          <div className='flex justify-between items-center text-sm'>
            <span className='text-muted-foreground'>
              {t('cartDropdown.subtotal')}
            </span>
            <span className='font-semibold'>
              {formatPrice(summary?.finalPrice || 0)}
            </span>
          </div>
          <Button
            className='w-full h-9'
            size='sm'
            onClick={() => navigate('/checkout')}
          >
            {t('cartDropdown.goToCheckout')}
          </Button>
          <Button
            variant='outline'
            size='sm'
            className='w-full h-9'
            onClick={() => navigate('/cart')}
          >
            {t('cartDropdown.viewCart')}
          </Button>
        </div>
      </>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='relative rounded-full'>
          <Icons.shoppingCart className='h-5 w-5' />
          {userData && cartItemCount > 0 && (
            <Badge className='absolute -top-1.5 -right-1.5 h-5 min-w-[1.25rem] flex items-center justify-center p-0.5 text-xs rounded-full shadow-md'>
              {cartItemCount > 9 ? '9+' : cartItemCount}
            </Badge>
          )}
          {userData && isLoadingCart && !cartData && (
            <Icons.loader2 className='absolute -top-1.5 -right-1.5 h-5 w-5 p-0.5 text-primary animate-spin bg-background rounded-full' />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-72 sm:w-80 md:w-96 p-0 shadow-xl'
        align='end'
        sideOffset={8}
      >
        <DropdownCartContent />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CartDropdown;
