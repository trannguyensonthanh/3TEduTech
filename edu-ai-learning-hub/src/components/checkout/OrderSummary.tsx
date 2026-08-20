/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CartItem, ValidatedPromotionInfo } from '@/services/cart.service';
import { AlertTriangle, CheckCircle2, Loader2, ShoppingCart, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PayPalButtonsWrapper from '@/components/payment/PayPalButtonsWrapper';
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
      <div className='rounded-xl border border-border bg-card p-5 sm:p-6 sticky top-24'>
        <h3 className='text-lg font-semibold mb-5 border-b border-border pb-3 flex items-center gap-2'>
          <ShoppingCart size={20} />
          Tóm tắt đơn hàng
        </h3>
        <ScrollArea className='max-h-64 mb-4 pr-2 -mr-2'>
          {items.map((item: CartItem) => (
            <div
              key={item.cartItemId}
              className='flex items-center gap-3 py-2.5 border-b border-border last:border-b-0'
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
                      Chưa có ảnh
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
            <span className='text-muted-foreground'>Tạm tính</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {validatedPromo && (
            <div className='flex justify-between font-semibold text-success'>
              <span className='flex items-center gap-1.5'>
                <CheckCircle2 size={14} aria-hidden='true' />
                Mã giảm giá "{validatedPromo.discountCode}"
              </span>
              <span>-{formatPrice(promoDiscount)}</span>
            </div>
          )}
        </div>
        <Separator className='my-4' />
        <div className='flex justify-between font-bold text-xl mb-6'>
          <span>Tổng thanh toán</span>
          <span>{formatPrice(finalTotal)}</span>
        </div>

        <div className='space-y-3'>
          <Label htmlFor='checkout-promo-code' className='text-xs font-medium'>
            Áp dụng mã giảm giá
          </Label>
          <div className='flex space-x-2'>
            <Input
              id='checkout-promo-code'
              placeholder='Nhập mã'
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
                'Áp dụng'
              )}
            </Button>
          </div>
          {validatedPromo?.message && (
            <p
              className={`mt-1 flex items-center gap-1 text-xs ${
                validatedPromo.discountAmount > 0
                  ? 'text-success'
                  : 'text-warning'
              }`}
            >
              {validatedPromo.discountAmount > 0 ? (
                <CheckCircle2 size={13} aria-hidden='true' />
              ) : (
                <AlertTriangle size={13} aria-hidden='true' />
              )}
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
              Đặt hàng và thanh toán
            </Button>
          )}
        </div>
        <p className='text-xs text-muted-foreground text-center mt-4'>
          Khi tiếp tục, bạn đồng ý với{' '}
          <Link to='/terms' className='underline hover:text-primary'>
            Điều khoản sử dụng
          </Link>{' '}
          và{' '}
          <Link to='/privacy' className='underline hover:text-primary'>
            Chính sách bảo mật
          </Link>{' '}
          của chúng tôi.
        </p>
      </div>
    </div>
  );
};
