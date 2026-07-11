/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/CheckoutPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

import { useToast } from '@/hooks/use-toast';
import { useMyCart } from '@/hooks/queries/cart.queries';
import { useCreateOrderFromCart } from '@/hooks/queries/order.queries';
import { useValidatePromotionCode } from '@/hooks/queries/promotion.queries';
import { ValidatedPromotionInfo } from '@/types/cart.types';
import { ChevronLeft, CreditCard, Loader2, XCircle } from 'lucide-react';

import {
  useCreateCryptoInvoice,
  useCreateStripeSession,
  useCreateVnpayUrl,
} from '@/hooks/queries/payment.queries';
import { CartDetails } from '@/services/cart.service';

import { Icons } from '@/components/common/Icons';
import { useSettings } from '@/contexts/SettingsContext';

import { OrderSummary } from '@/components/checkout/OrderSummary';
import { Order } from '@/services/order.service';
import { useCreateMomoUrl } from '@/services/payment.service';

const PaymentMethodItem: React.FC<{
  id: string;
  name: string;
  icon: React.ReactNode;
  description?: string;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}> = ({ id, name, icon, description, isSelected, onSelect, disabled }) => (
  <button
    type='button'
    role='radio'
    aria-checked={isSelected}
    onClick={onSelect}
    disabled={disabled}
    className={`w-full p-3 sm:p-4 border rounded-lg flex items-center space-x-3 transition-all text-left
      ${isSelected ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-md' : 'hover:border-foreground/30 bg-card hover:bg-muted/50'}
      ${disabled ? 'opacity-50 cursor-not-allowed bg-muted/30' : 'cursor-pointer'}`}
  >
    <div
      className={`p-2 rounded-full ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
    >
      {icon}
    </div>
    <div>
      <span
        className={`font-semibold ${isSelected ? 'text-primary' : 'text-card-foreground'}`}
      >
        {name}
      </span>
      {description && (
        <p className='text-xs text-muted-foreground mt-0.5'>{description}</p>
      )}
    </div>
  </button>
);

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const SESSION_STORAGE_KEY = 'cryptoPaymentInfo';
  const { currency, formatPrice } = useSettings();
  useEffect(() => {
    console.log('CheckoutPage MOUNTED');
    return () => {
      console.log('CheckoutPage UNMOUNTED');
    };
  }, []);
  const [initialCartDataFromState] = useState<CartDetails | undefined>(
    location.state?.cartData
  );
  const [initialValidatedPromoFromState] =
    useState<ValidatedPromotionInfo | null>(
      location.state?.validatedPromoInfo || null
    );

  const {
    data: liveCartData,
    isLoading: isLoadingCart,
    isError: isCartError,
    error: cartError,
    refetch: refetchCart,
  } = useMyCart({
    enabled: !initialCartDataFromState,
    placeholderData: initialCartDataFromState
      ? () => initialCartDataFromState
      : undefined,
    staleTime: 1000 * 15,
    refetchOnWindowFocus: true,
  });

  const cartToUse = liveCartData || initialCartDataFromState;
  const items = useMemo(() => cartToUse?.items || [], [cartToUse]);
  const summary = cartToUse?.summary;

  const [promoCodeInput, setPromoCodeInput] = useState(
    initialValidatedPromoFromState?.discountCode || ''
  );
  const [validatedPromo, setValidatedPromo] =
    useState<ValidatedPromotionInfo | null>(initialValidatedPromoFromState);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | null
  >('null');
  const [selectedCrypto, setSelectedCrypto] = useState<string>('usdttrc20');
  const [createdOrder, setCreatedOrder] = useState<boolean>(true);
  const availablePaymentMethods = useMemo(() => {
    const methods = [];
    if (currency === 'VND') {
      methods.push(
        {
          id: 'VNPAY',
          name: 'VNPAY Gateway',
          icon: (
            <img
              src='/images/payment/vnpay_logo.jpg'
              alt='VNPAY'
              className='h-6 w-auto'
            />
          ),
          description: 'ATM, Visa/Master, QR Code.',
          // disabled: true,
        },
        {
          id: 'MOMO',
          name: 'MoMo E-Wallet',
          icon: (
            <img
              src='/images/payment/momo_logo.png'
              alt='MoMo'
              className='h-6 w-auto'
            />
          ),
          description: 'Pay with your MoMo wallet.',
          // disabled: true, // Disable MoMo for now
        }
      );
    }
    if (currency === 'USD') {
      methods.push(
        {
          id: 'STRIPE',
          name: 'Stripe',
          icon: <CreditCard size={22} />,
          description: 'Pay with your Credit/Debit Card.',
        },
        {
          id: 'PAYPAL',
          name: 'PayPal',
          icon: <Icons.paypal className='h-6 w-6 text-blue-600' />,
          description: 'Pay with your PayPal account.',
        }
      );
    }
    methods.push({
      id: 'CRYPTO',
      name: 'Pay with Crypto',
      icon: <Icons.bitcoin size={22} className='text-amber-500' />,
      description: 'BTC, ETH, USDT, and more.',
    });
    return methods;
  }, [currency]);

  useEffect(() => {
    if (availablePaymentMethods.length > 0) {
      setSelectedPaymentMethodId(availablePaymentMethods[0].id);
    }
  }, [availablePaymentMethods]);

  const { mutateAsync: createOrderMutateAsync, isPending: isCreatingOrder } =
    useCreateOrderFromCart();
  const {
    mutateAsync: createVnpayUrlMutateAsync,
    isPending: isCreatingVnpayUrl,
  } = useCreateVnpayUrl();
  const { mutate: validatePromoMutate, isPending: isValidatingPromo } =
    useValidatePromotionCode();
  const {
    mutateAsync: createStripeSessionMutateAsync,
    isPending: isCreatingStripeUrl,
  } = useCreateStripeSession();

  const {
    mutateAsync: createCryptoInvoiceMutateAsync,
    isPending: isCreatingCryptoInvoice,
  } = useCreateCryptoInvoice();
  const {
    mutateAsync: createMomoUrlMutateAsync,
    isPending: isCreatingMomoUrl,
  } = useCreateMomoUrl();
  const isProcessingPaymentAction =
    isCreatingOrder ||
    isCreatingVnpayUrl ||
    isCreatingStripeUrl ||
    isCreatingCryptoInvoice ||
    isCreatingMomoUrl;

  useEffect(() => {
    if (!isLoadingCart && (!cartToUse || items.length === 0) && !createdOrder) {
      navigate('/cart', { replace: true });
    }
  }, [cartToUse, items, isLoadingCart, navigate, toast, createdOrder]);

  const handleApplyPromo = () => {
    if (!promoCodeInput.trim() || isValidatingPromo) return;
    validatePromoMutate(
      { promotionCode: promoCodeInput.trim(), currency },
      {
        onSuccess: (data) => {
          if (data.isValid && data.discountAmount >= 0) {
            setValidatedPromo({
              promotionId: data.promotionId,
              discountCode: promoCodeInput.trim(),
              discountAmount: data.discountAmount,
              message: data.message,
            });
            toast({
              title:
                data.discountAmount > 0 ? 'Promo Applied' : 'Promo Code Valid',
              description: data.message,
            });
          } else {
            setValidatedPromo(null);
            toast({
              title: 'Invalid Promo',
              description: data.message || 'This promo code is not valid.',
              variant: 'destructive',
            });
          }
        },
        onError: (error: any) => {
          setValidatedPromo(null);
          toast({
            title: 'Error Validating Promo',
            description:
              error.response?.data?.message ||
              error.message ||
              'Could not validate promo code.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handlePlaceOrder = async () => {
    if (
      !cartToUse ||
      items.length === 0 ||
      isProcessingPaymentAction ||
      !selectedPaymentMethodId
    ) {
      return;
    }

    const promotionCodePayload = validatedPromo?.discountCode || null;
    try {
      toast({
        title: 'Placing your order...',
        duration: 10000,
      });

      const createdOrder = await createOrderMutateAsync(promotionCodePayload);
      console.log('Order created successfully:', createdOrder);

      if (!createdOrder || !createdOrder.orderId) {
        throw new Error(
          'Order creation failed or did not return a valid order ID.'
        );
      }

      toast({
        title: 'Order placed!',
        description: 'Redirecting to payment...',
        variant: 'default',
      });

      if (selectedPaymentMethodId === 'VNPAY') {
        await createVnpayUrlMutateAsync({ orderId: createdOrder.orderId });
      } else if (selectedPaymentMethodId === 'STRIPE') {
        await createStripeSessionMutateAsync({
          orderId: createdOrder.orderId,
        });
      } else if (selectedPaymentMethodId === 'CRYPTO') {
        const invoiceInfo = await createCryptoInvoiceMutateAsync({
          orderId: createdOrder.orderId,
          cryptoCurrency: selectedCrypto,
        });

        // 1. Lưu thông tin vào sessionStorage
        sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify(invoiceInfo)
        );

        // 2. Điều hướng đến trang thanh toán crypto
        navigate('/payment/crypto');
      } else if (selectedPaymentMethodId === 'MOMO') {
        await createMomoUrlMutateAsync({ orderId: createdOrder.orderId });
      } else {
        throw new Error('Selected payment method is not supported.');
      }
    } catch (error: any) {
      console.error('Checkout process error:', error);
      toast({
        title: 'Error',
        description:
          error.message || 'An unexpected error occurred during checkout.',
        variant: 'destructive',
      });
    }
  };

  const subtotal = summary?.finalPrice || 0;
  const promoDiscount = validatedPromo?.discountAmount || 0;
  const finalTotal = Math.max(0, subtotal - promoDiscount);

  if (isLoadingCart && !initialCartDataFromState) {
    return (
      <Layout>
        <div className='container mx-auto p-12 text-center'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto' />
          <p className='mt-4 text-muted-foreground'>Loading checkout...</p>
        </div>
      </Layout>
    );
  }
  if (isCartError && !initialCartDataFromState) {
    return (
      <Layout>
        <div className='container mx-auto p-12 text-center text-destructive'>
          <XCircle className='h-12 w-12 mx-auto mb-2' />
          <p className='font-semibold'>Error loading checkout</p>
          <p className='text-sm'>
            {cartError?.message || 'Please try again later.'}
          </p>
        </div>
      </Layout>
    );
  }

  if ((!cartToUse || items.length === 0) && !createdOrder) {
    return (
      <Layout>
        <div className='container mx-auto flex flex-col items-center justify-center py-20'>
          <img
            src='/images/empty-cart.svg'
            alt='Empty cart'
            className='w-40 h-40 mb-6'
          />
          <h2 className='text-2xl font-semibold mb-2'>Your cart is empty</h2>
          <p className='text-muted-foreground mb-6'>
            Looks like you have no items in your cart.
          </p>
          <div className='flex gap-4'>
            <Button asChild>
              <Link to='/cart'>Go to Cart</Link>
            </Button>
            <Button variant='outline' asChild>
              <Link to='/'>Back to Home</Link>
            </Button>
          </div>
          <p className='text-xs text-muted-foreground mt-8'>
            You will be redirected to your cart in a few seconds...
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='container mx-auto px-4 py-8 md:py-12'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => navigate(-1)}
          className='mb-6 text-sm group'
        >
          <ChevronLeft className='h-4 w-4 mr-1.5 group-hover:-translate-x-1 transition-transform' />{' '}
          Back
        </Button>
        <h1 className='text-3xl lg:text-4xl font-bold mb-8 tracking-tight'>
          Secure Checkout
        </h1>

        <div className='grid lg:grid-cols-3 gap-8 items-start'>
          <div className='lg:col-span-2 space-y-6'>
            <Card className='shadow-lg border-border/60'>
              <CardHeader>
                <CardTitle className='text-xl flex items-center gap-2'>
                  <CreditCard size={24} className='text-primary' /> Select
                  Payment Method
                </CardTitle>
                <CardDescription>
                  Choose your preferred way to pay.
                </CardDescription>
              </CardHeader>
              <CardContent className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {availablePaymentMethods.map((method) => (
                  <PaymentMethodItem
                    key={method.id}
                    {...method}
                    isSelected={selectedPaymentMethodId === method.id}
                    onSelect={() => setSelectedPaymentMethodId(method.id)}
                    disabled={method.disabled}
                  />
                ))}
              </CardContent>
            </Card>

            {selectedPaymentMethodId === 'CRYPTO' && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Choose your coin</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground mb-4'>
                    You will pay with a stablecoin to avoid price volatility.
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      variant={
                        selectedCrypto === 'usdttrc20' ? 'default' : 'outline'
                      }
                      onClick={() => setSelectedCrypto('usdttrc20')}
                    >
                      USDT (TRC20)
                    </Button>
                    <Button
                      disabled={true}
                      variant={
                        selectedCrypto === 'usdterc20' ? 'default' : 'outline'
                      }
                      onClick={() => setSelectedCrypto('usdterc20')}
                    >
                      USDT (ERC20)
                    </Button>
                    <Button
                      variant={selectedCrypto === 'trx' ? 'default' : 'outline'}
                      onClick={() => setSelectedCrypto('trx')}
                    >
                      TRX (TRON)
                    </Button>
                    <Button
                      disabled={true}
                      variant={selectedCrypto === 'dgb' ? 'default' : 'outline'}
                      onClick={() => setSelectedCrypto('dgb')}
                    >
                      DGB
                    </Button>
                    <Button
                      disabled={true}
                      variant={selectedCrypto === 'gas' ? 'default' : 'outline'}
                      onClick={() => setSelectedCrypto('gas')}
                    >
                      GAS
                    </Button>
                    <Button
                      disabled={true}
                      variant={selectedCrypto === 'ltc' ? 'default' : 'outline'}
                      onClick={() => setSelectedCrypto('ltc')}
                    >
                      LTC
                    </Button>
                    <Button
                      disabled={true}
                      variant={selectedCrypto === 'xlm' ? 'default' : 'outline'}
                      onClick={() => setSelectedCrypto('xlm')}
                    >
                      XLM
                    </Button>
                    <Button
                      disabled={true}
                      variant={selectedCrypto === 'xrp' ? 'default' : 'outline'}
                      onClick={() => setSelectedCrypto('xrp')}
                    >
                      XRP
                    </Button>
                    <Button
                      disabled={true}
                      variant={selectedCrypto === 'zec' ? 'default' : 'outline'}
                      onClick={() => setSelectedCrypto('zec')}
                    >
                      ZEC
                    </Button>
                    <Button
                      disabled={true}
                      variant={
                        selectedCrypto === 'bnbmainnet' ? 'default' : 'outline'
                      }
                      onClick={() => setSelectedCrypto('bnbmainnet')}
                    >
                      BNBMAINNET
                    </Button>
                    <Button
                      disabled={true}
                      variant={
                        selectedCrypto === 'dash' ? 'default' : 'outline'
                      }
                      onClick={() => setSelectedCrypto('dash')}
                    >
                      DASH
                    </Button>
                    <Button
                      disabled={true}
                      variant={selectedCrypto === 'dgd' ? 'default' : 'outline'}
                      onClick={() => setSelectedCrypto('dgd')}
                    >
                      DGD
                    </Button>
                    <Button
                      disabled={true}
                      variant={selectedCrypto === 'eos' ? 'default' : 'outline'}
                      onClick={() => setSelectedCrypto('eos')}
                    >
                      EOS
                    </Button>
                    <Button
                      disabled={true}
                      variant={selectedCrypto === 'xmr' ? 'default' : 'outline'}
                      onClick={() => setSelectedCrypto('xmr')}
                    >
                      XMR
                    </Button>
                    <Button
                      disabled={true}
                      variant={selectedCrypto === 'bch' ? 'default' : 'outline'}
                      onClick={() => setSelectedCrypto('bch')}
                    >
                      BCH
                    </Button>
                    <Button
                      disabled={true}
                      variant={selectedCrypto === 'zen' ? 'default' : 'outline'}
                      onClick={() => setSelectedCrypto('zen')}
                    >
                      ZEN
                    </Button>
                    <Button
                      disabled={true}
                      variant={selectedCrypto === 'xzc' ? 'default' : 'outline'}
                      onClick={() => setSelectedCrypto('xzc')}
                    >
                      XZC
                    </Button>
                    <Button
                      disabled={true}
                      variant={selectedCrypto === 'xvg' ? 'default' : 'outline'}
                      onClick={() => setSelectedCrypto('xvg')}
                    >
                      XVG
                    </Button>
                    <Button
                      disabled={true}
                      variant={
                        selectedCrypto === 'tusd' ? 'default' : 'outline'
                      }
                      onClick={() => setSelectedCrypto('tusd')}
                    >
                      TUSD
                    </Button>
                    <Button
                      disabled={true}
                      variant={
                        selectedCrypto === 'qtum' ? 'default' : 'outline'
                      }
                      onClick={() => setSelectedCrypto('qtum')}
                    >
                      QTUM
                    </Button>
                    <Button
                      disabled={true}
                      variant={selectedCrypto === 'fun' ? 'default' : 'outline'}
                      onClick={() => setSelectedCrypto('fun')}
                    >
                      FUN
                    </Button>
                    <Button
                      disabled={true}
                      variant={selectedCrypto === 'btg' ? 'default' : 'outline'}
                      onClick={() => setSelectedCrypto('btg')}
                    >
                      BTG
                    </Button>
                    <Button
                      disabled={true}
                      variant={selectedCrypto === 'bcd' ? 'default' : 'outline'}
                      onClick={() => setSelectedCrypto('bcd')}
                    >
                      BCD
                    </Button>
                    <Button
                      disabled={true}
                      variant={selectedCrypto === 'bat' ? 'default' : 'outline'}
                      onClick={() => setSelectedCrypto('bat')}
                    >
                      BAT
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <OrderSummary
            items={items}
            subtotal={subtotal}
            validatedPromo={validatedPromo}
            promoDiscount={promoDiscount}
            finalTotal={finalTotal}
            formatPrice={formatPrice}
            promoCodeInput={promoCodeInput}
            setPromoCodeInput={setPromoCodeInput}
            isValidatingPromo={isValidatingPromo}
            handleApplyPromo={handleApplyPromo}
            handlePlaceOrder={handlePlaceOrder}
            isProcessingPaymentAction={isProcessingPaymentAction}
            selectedPaymentMethodId={selectedPaymentMethodId}
            setCreatedOrder={setCreatedOrder}
            createdOrder={createdOrder}
          />
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
