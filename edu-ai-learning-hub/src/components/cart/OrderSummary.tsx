// src/components/cart/OrderSummary.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { useValidatePromotionCode } from '@/hooks/queries/promotion.queries';
import { CartDetails, ValidatedPromotionInfo } from '@/services/cart.service';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/common/Icons';
import { toast } from 'sonner';

interface OrderSummaryProps {
  cartData: CartDetails | undefined;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ cartData }) => {
  const navigate = useNavigate();
  const { currency, formatPrice } = useSettings();
  const { mutate: validatePromoMutate, isPending: isApplyingPromo } =
    useValidatePromotionCode();

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [validatedPromo, setValidatedPromo] =
    useState<ValidatedPromotionInfo | null>(null);

  const summary = cartData?.summary;
  const items = cartData?.items || [];

  // Reset promo khi giỏ hàng thay đổi
  useEffect(() => {
    setValidatedPromo(null);
    setPromoCodeInput('');
  }, [cartData?.items.length, summary?.finalPrice]);

  const handleApplyPromo = () => {
    if (!promoCodeInput.trim() || isApplyingPromo) return;
    validatePromoMutate(
      { promotionCode: promoCodeInput.trim(), currency },
      {
        onSuccess: (data) => {
          if (data.isValid) {
            setValidatedPromo({ ...data, discountCode: promoCodeInput.trim() });
            toast.success(data.message || 'Promo code applied successfully!');
          } else {
            setValidatedPromo(null);
            toast.error(data.message || 'This promo code is not valid.');
          }
        },
        onError: (error) => {
          setValidatedPromo(null);
          toast.error(error.message || 'Could not validate promo code.');
        },
      }
    );
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }
    // Logic tạo đơn hàng sẽ được chuyển sang trang Checkout
    // Ở đây chỉ cần điều hướng
    navigate('/checkout');
  };

  const subtotalBeforePromo = summary?.finalPrice || 0;
  const promoDiscountAmount = validatedPromo?.discountAmount || 0;
  const finalTotal = Math.max(0, subtotalBeforePromo - promoDiscountAmount);

  return (
    <div className='border rounded-lg p-6 bg-card shadow-sm sticky top-24'>
      <h3 className='text-xl font-semibold mb-6 border-b pb-3'>
        Order Summary
      </h3>

      <div className='space-y-3 mb-6 text-sm'>
        <div className='flex justify-between'>
          <span className='text-muted-foreground'>Subtotal:</span>
          <span>{formatPrice(subtotalBeforePromo)}</span>
        </div>
        {validatedPromo && (
          <div className='flex justify-between text-green-600 dark:text-green-400 font-medium'>
            <span>Promo "{validatedPromo.discountCode}":</span>
            <span>-{formatPrice(promoDiscountAmount)}</span>
          </div>
        )}
      </div>

      <Separator className='my-4' />

      <div className='flex justify-between font-bold text-2xl mb-6'>
        <span>Total:</span>
        <span>{formatPrice(finalTotal)}</span>
      </div>

      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='promo-code' className='text-sm font-medium'>
            Have a Promo Code?
          </Label>
          <div className='flex space-x-2'>
            <Input
              id='promo-code'
              placeholder='Enter code'
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
              className='h-10'
              disabled={isApplyingPromo}
            />
            <Button
              variant='outline'
              onClick={handleApplyPromo}
              disabled={isApplyingPromo || !promoCodeInput.trim()}
              className='h-10 shrink-0'
            >
              {isApplyingPromo ? (
                <Icons.loader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Apply'
              )}
            </Button>
          </div>
        </div>

        <Button
          className='w-full h-12 text-base font-semibold'
          size='lg'
          onClick={handleCheckout}
          disabled={items.length === 0}
        >
          Proceed to Checkout
        </Button>
        <Button
          asChild
          variant='ghost'
          className='w-full text-primary hover:text-primary'
        >
          <Link to='/courses'>Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
};

export default OrderSummary;
