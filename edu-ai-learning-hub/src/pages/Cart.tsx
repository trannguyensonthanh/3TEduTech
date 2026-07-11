// src/pages/CartPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  useMyCart,
  useRemoveCourseFromCart,
  useClearMyCart,
} from '@/hooks/queries/cart.queries';
import { toast } from 'sonner';

// UI Components & Layout
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import { Skeleton } from '@/components/ui/skeleton';
import CartItemCard from '@/components/cart/CartItemCard';
import OrderSummary from '@/components/cart/OrderSummary';

const CartPage: React.FC = () => {
  const { data: cartData, isLoading, isError, error, refetch } = useMyCart();
  const { mutate: removeItemMutate, isPending: isRemovingItem } =
    useRemoveCourseFromCart();
  const { mutate: clearCartMutate, isPending: isClearingCart } =
    useClearMyCart();

  const items = cartData?.items || [];

  const handleRemoveItem = (courseId: number) => {
    if (isRemovingItem) return;
    removeItemMutate(courseId, {
      onSuccess: (data) =>
        toast.success(data.message || 'Item removed from cart.'),
      onError: (err) => toast.error(err.message || 'Could not remove item.'),
    });
  };

  const handleClearCart = () => {
    if (items.length === 0 || isClearingCart) return;
    toast.warning('Are you sure you want to clear your cart?', {
      action: {
        label: 'Confirm',
        onClick: () =>
          clearCartMutate(undefined, {
            onSuccess: (data) =>
              toast.success(data.message || 'Your cart has been cleared.'),
            onError: (err) =>
              toast.error(err.message || 'Could not clear cart.'),
          }),
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
      duration: 10000,
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className='container mx-auto px-4 py-8 md:py-12'>
          <Skeleton className='h-10 w-1/3 mb-8' />
          <div className='grid lg:grid-cols-3 gap-8 items-start'>
            <div className='lg:col-span-2 space-y-6'>
              <Skeleton className='h-8 w-1/4 mb-3' />
              <Skeleton className='h-28 w-full' />
              <Skeleton className='h-28 w-full' />
              <Skeleton className='h-28 w-full' />
            </div>
            <div className='lg:col-span-1'>
              <Skeleton className='h-96 w-full rounded-lg' />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className='container mx-auto p-12 text-center text-destructive-foreground bg-destructive/90 rounded-lg'>
          <Icons.alertTriangle className='h-12 w-12 mx-auto mb-4' />
          <h2 className='text-2xl font-semibold'>Error Loading Cart</h2>
          <p className='mt-2 text-sm opacity-90'>
            {error?.message || 'Please try refreshing the page.'}
          </p>
          <Button
            onClick={() => refetch()}
            variant='secondary'
            className='mt-6'
          >
            <Icons.refresh className='mr-2 h-4 w-4' />
            Retry
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='container mx-auto px-4 py-8 md:py-12'>
        <h1 className='text-3xl lg:text-4xl font-bold mb-8 tracking-tight'>
          Shopping Cart
        </h1>

        {items.length === 0 ? (
          <div className='text-center py-16 px-4 space-y-6 bg-card border rounded-lg shadow-sm'>
            <Icons.shoppingBag className='h-16 w-16 text-primary mx-auto opacity-70' />
            <h2 className='text-2xl font-semibold'>Your cart is empty!</h2>
            <p className='text-muted-foreground max-w-md mx-auto'>
              Looks like you haven't added any courses yet. Explore our catalog
              to find your next learning adventure.
            </p>
            <Button asChild size='lg' className='mt-4'>
              <Link to='/courses'>Explore Courses</Link>
            </Button>
          </div>
        ) : (
          <div className='grid lg:grid-cols-3 gap-8 xl:gap-12 items-start'>
            {/* Cart Items List */}
            <div className='lg:col-span-2 space-y-6'>
              <div className='flex justify-between items-center border-b pb-3'>
                <h2 className='text-xl font-semibold'>
                  {items.length} Course{items.length !== 1 ? 's' : ''} in Cart
                </h2>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleClearCart}
                  disabled={isClearingCart}
                >
                  {isClearingCart ? (
                    <Icons.loader2 className='h-4 w-4 mr-2 animate-spin' />
                  ) : (
                    <Icons.trash2 className='h-4 w-4 mr-2' />
                  )}
                  Clear Cart
                </Button>
              </div>
              <div className='space-y-4 divide-y divide-border'>
                {items.map((item) => (
                  <CartItemCard
                    key={item.cartItemId}
                    item={item}
                    onRemove={handleRemoveItem}
                    isRemoving={isRemovingItem}
                  />
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className='lg:col-span-1'>
              <OrderSummary cartData={cartData} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CartPage;
