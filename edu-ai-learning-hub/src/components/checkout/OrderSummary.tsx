/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { CartItem, ValidatedPromotionInfo } from '@/services/cart.service';
import { Info, Loader2, ShoppingCart, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCreateOrderFromCart } from '@/hooks/queries/order.queries';
import PayPalButtonsWrapper from '@/components/payment/PayPalButtonsWrapper';
import { Icons } from '@/components/common/Icons';
type OrderSummaryProps = {
  items: CartItem[];
  subtotal: number;
  validatedPromo: ValidatedPromotionInfo | null;
  promoDiscount: number;
  finalTotal: number;
  formatPrice: (amount: number) => string;
  promoCodeInput: string;
  setPromoCodeInput: React.Dispatch<React.SetStateAction<string>>;
  isValidatingPromo: boolean;
  handleApplyPromo: () => void;
  handlePlaceOrder: () => void;
  isProcessingPaymentAction: boolean;
  selectedPaymentMethodId: string | null;
  setCreatedOrder: React.Dispatch<React.SetStateAction<boolean>>;
  createdOrder: boolean;
};

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  validatedPromo,
  promoDiscount,
  finalTotal,
  formatPrice,
  promoCodeInput,
  setPromoCodeInput,
  isValidatingPromo,
  handleApplyPromo,
  handlePlaceOrder,
  isProcessingPaymentAction,
  selectedPaymentMethodId,
  setCreatedOrder,
  createdOrder,
}) => {
  const navigate = useNavigate();

  // Hàm được gọi khi thanh toán PayPal thành công
  const handlePaymentSuccess = (details: any) => {
    console.log('Payment successful details:', details);
    navigate(`/payment-success?orderId=${details.orderId}`);
  };
  return (
    <div className='lg:col-span-1'>
      <div className='border rounded-xl p-5 sm:p-6 bg-card shadow-xl sticky top-24'>
        <h3 className='text-lg font-semibold mb-5 border-b pb-3 flex items-center gap-2'>
          <ShoppingCart size={20} />
          Order Summary
        </h3>
        <ScrollArea className='max-h-64 mb-4 pr-2 -mr-2'>
          {items.map((item: CartItem) => (
            <div
              key={item.cartItemId}
              className='flex items-center gap-3 py-2.5 border-b last:border-b-0'
            >
              <Link to={`/courses/${item.slug}`} className='shrink-0'>
                {item.thumbnailUrl && item.courseName ? (
                  <div className='w-20 h-14 bg-muted rounded flex items-center justify-center'>
                    <img
                      src={item.thumbnailUrl}
                      alt={item.courseName}
                      className='w-full h-full object-cover'
                    />
                  </div>
                ) : (
                  <div className='w-20 h-11 bg-muted rounded flex items-center justify-center'>
                    <span className='text-xs text-muted-foreground'>
                      No Image
                    </span>
                  </div>
                )}
              </Link>
              <div className='flex-grow min-w-0'>
                <Link
                  to={`/courses/${item.slug}`}
                  className='text-sm font-medium line-clamp-2 hover:text-primary'
                  title={item.courseName}
                >
                  {item.courseName}
                </Link>
                <p className='text-sm font-semibold text-muted-foreground'>
                  {formatPrice(
                    item.pricing.display.discountedPrice ??
                      item.pricing.display.originalPrice
                  )}
                </p>
              </div>
            </div>
          ))}
        </ScrollArea>

        <Separator className='my-4' />
        <div className='space-y-2 text-sm mb-4'>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {validatedPromo && (
            <div className='flex justify-between text-green-600 dark:text-green-400 font-semibold'>
              <span>Promo "{validatedPromo.discountCode}"</span>
              <span>-{formatPrice(promoDiscount)}</span>
            </div>
          )}
        </div>
        <Separator className='my-4' />
        <div className='flex justify-between font-bold text-xl mb-6'>
          <span>Order Total</span>
          <span>{formatPrice(finalTotal)}</span>
        </div>

        <div className='space-y-3'>
          <Label htmlFor='checkout-promo-code' className='text-xs font-medium'>
            Apply Promo Code
          </Label>
          <div className='flex space-x-2'>
            <Input
              id='checkout-promo-code'
              placeholder='Enter code'
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
              className='h-9 text-sm'
              disabled={isValidatingPromo}
            />
            <Button
              variant='outline'
              onClick={handleApplyPromo}
              disabled={isValidatingPromo || !promoCodeInput.trim()}
              className='h-9 shrink-0 text-sm px-3'
            >
              {isValidatingPromo ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Apply'
              )}
            </Button>
          </div>
          {validatedPromo?.message && (
            <p
              className={`text-xs mt-1 ${
                validatedPromo.discountAmount > 0
                  ? 'text-green-600'
                  : 'text-amber-600'
              } flex items-center`}
            >
              <Info size={13} className='mr-1' />
              {validatedPromo.message}
            </p>
          )}
          {selectedPaymentMethodId === 'PAYPAL' ? (
            <PayPalButtonsWrapper
              validatedPromo={validatedPromo}
              onPaymentSuccess={handlePaymentSuccess}
              createdOrder={createdOrder}
              setCreatedOrder={setCreatedOrder}
            />
          ) : (
            <Button
              className='w-full h-11 text-base font-semibold mt-4'
              size='lg'
              onClick={handlePlaceOrder}
              disabled={
                isProcessingPaymentAction ||
                items.length === 0 ||
                !selectedPaymentMethodId
              }
            >
              {isProcessingPaymentAction ? (
                <Loader2 className='mr-2 h-5 w-5 animate-spin' />
              ) : (
                <Lock className='mr-2 h-5 w-5' />
              )}
              Place Order & Pay
            </Button>
          )}
        </div>
        <p className='text-xs text-muted-foreground text-center mt-4'>
          By proceeding, you agree to our{' '}
          <Link to='/terms' className='underline hover:text-primary'>
            Terms
          </Link>{' '}
          and{' '}
          <Link to='/privacy' className='underline hover:text-primary'>
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
};
