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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

import { useToast } from '@/hooks/use-toast';
import { useMyCart } from '@/hooks/queries/cart.queries';
import { useCreateOrderFromCart, useMyOrderDetail } from '@/hooks/queries/order.queries';
import { useValidatePromotionCode } from '@/hooks/queries/promotion.queries';

import { ChevronLeft, CreditCard, Loader2, XCircle } from 'lucide-react';

import {
  useCreateCryptoInvoice,
  useCreateStripeSession,
  useCreateVnpayUrl,
} from '@/hooks/queries/payment.queries';
import { CartDetails, CartItem, ValidatedPromotionInfo } from '@/services/cart.service';
import apiHelper from '@/services/apiHelper';

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
      ${isSelected ? 'ring-2 ring-primary border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/50'}
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

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const orderIdFromUrl = queryParams.get('orderId');
  const numericOrderId = orderIdFromUrl ? parseInt(orderIdFromUrl, 10) : undefined;

  const { data: orderData, isLoading: isLoadingOrder, isError: isOrderError } = useMyOrderDetail(numericOrderId, { enabled: !!numericOrderId });

  const {
    data: liveCartData,
    isLoading: isLoadingCart,
    isError: isCartError,
    error: cartError,
    refetch: refetchCart,
  } = useMyCart({
    enabled: !initialCartDataFromState && !numericOrderId,
    placeholderData: initialCartDataFromState
      ? () => initialCartDataFromState
      : undefined,
    staleTime: 1000 * 15,
    refetchOnWindowFocus: true,
  });

  const cartToUse = liveCartData || initialCartDataFromState;
  
  const orderItemsAsCartItems = useMemo(() => {
    if (!orderData || !orderData.items) return [];
    return orderData.items.map((item: any) => {
      // API order item uses pricing.display.price, while CartItem expects originalPrice/discountedPrice
      const itemPrice = item.pricing?.display?.price ?? item.priceAtOrder ?? 0;
      return {
        cartItemId: item.orderItemId || item.courseId,
        courseId: item.courseId,
        slug: item.slug || '',
        courseName: item.courseName || '',
        thumbnailUrl: item.thumbnailUrl || '',
        pricing: {
          display: {
            originalPrice: itemPrice,
            discountedPrice: itemPrice,
            currency: item.pricing?.display?.currency ?? currency
          }
        }
      } as unknown as CartItem;
    });
  }, [orderData, currency]);

  const items = useMemo(() => {
    if (numericOrderId && orderData) return orderItemsAsCartItems;
    return cartToUse?.items || [];
  }, [cartToUse, numericOrderId, orderData, orderItemsAsCartItems]);

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
  
  const [isMockPaymentDialogOpen, setIsMockPaymentDialogOpen] = useState(false);
  const [mockOrderId, setMockOrderId] = useState<number | null>(null);
  /* [SỬA 19/08/2026] Trước đây useMemo không có chú thích kiểu, nên TypeScript
     suy ra kiểu phần tử CHÍNH XÁC theo mảng chữ — không có trường `disabled`,
     và dòng `disabled={method.disabled}` bên dưới thành lỗi TS2339. Khai báo
     tường minh vừa chữa lỗi vừa mở sẵn đường: muốn tạm khóa một cổng thanh
     toán thì chỉ cần thêm `disabled: true` vào mục tương ứng. */
  const availablePaymentMethods = useMemo<
    {
      id: string;
      name: string;
      icon: React.ReactNode;
      description?: string;
      disabled?: boolean;
    }[]
  >(() => {
    return [
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
        description: 'Thanh toán thẻ ATM / Visa / Master / QR Code (VNĐ).',
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
        description: 'Thanh toán siêu tốc qua ví điện tử MoMo.',
      },
      {
        id: 'STRIPE',
        name: 'Stripe (Thẻ Quốc Tế)',
        icon: <CreditCard size={22} className='text-primary' />,
        description: 'Thẻ Visa / Master / Amex (Hỗ trợ quy đổi tỷ giá song song).',
      },
      {
        id: 'PAYPAL',
        name: 'PayPal',
        icon: <Icons.paypal className='h-6 w-6 text-primary' />,
        description: 'Thanh toán bảo mật qua tài khoản PayPal (Quy đổi song song).',
      },
      {
        id: 'CRYPTO',
        name: 'Thanh toán bằng tiền mã hóa (Web3)',
        icon: <Icons.bitcoin size={22} className='text-primary' />,
        description: 'Thanh toán tiền điện tử BTC, ETH, USDT (TRC20).',
      },
      {
        id: 'MOCK_TEST',
        name: 'Thanh toán giả lập (Mock Test)',
        icon: <Icons.wallet size={22} className='text-amber-500' />,
        description: 'Dành cho việc test nhanh luồng thanh toán.',
      },
    ];
  }, []);

  useEffect(() => {
    if (availablePaymentMethods.length > 0) {
      const preferred = location.state?.preferredMethod?.toUpperCase();
      const match = availablePaymentMethods.find((m) => m.id === preferred);
      if (match) {
        setSelectedPaymentMethodId(match.id);
      } else {
        setSelectedPaymentMethodId(availablePaymentMethods[0].id);
      }
    }
  }, [availablePaymentMethods, location.state]);

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
    if (!numericOrderId && !isLoadingCart && (!cartToUse || items.length === 0) && !createdOrder) {
      navigate('/cart', { replace: true });
    }
  }, [cartToUse, items, isLoadingCart, navigate, toast, createdOrder, numericOrderId]);

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
                data.discountAmount > 0
                  ? 'Đã áp dụng mã giảm giá'
                  : 'Mã giảm giá hợp lệ',
              description: data.message,
            });
          } else {
            setValidatedPromo(null);
            toast({
              title: 'Mã giảm giá không hợp lệ',
              description: data.message || 'Mã giảm giá này không dùng được.',
              variant: 'destructive',
            });
          }
        },
        onError: (error: any) => {
          setValidatedPromo(null);
          toast({
            title: 'Lỗi khi kiểm tra mã giảm giá',
            description:
              error.response?.data?.message ||
              error.message ||
              'Không kiểm tra được mã giảm giá.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handlePlaceOrder = async () => {
    if (
      (!numericOrderId && (!cartToUse || items.length === 0)) ||
      isProcessingPaymentAction ||
      !selectedPaymentMethodId
    ) {
      return;
    }

    const promotionCodePayload = validatedPromo?.discountCode || null;
    try {
      toast({
        title: numericOrderId ? 'Đang khởi tạo thanh toán…' : 'Đang tạo đơn hàng…',
        duration: 10000,
      });

      let orderIdForPayment = numericOrderId;

      if (!orderIdForPayment) {
        const createdOrderResponse = await createOrderMutateAsync(promotionCodePayload);
        console.log('Order created successfully:', createdOrderResponse);

        if (!createdOrderResponse || !createdOrderResponse.orderId) {
          throw new Error(
            'Tạo đơn hàng không thành công hoặc không nhận được mã đơn hợp lệ.'
          );
        }
        orderIdForPayment = createdOrderResponse.orderId;
        // Update URL so if payment creation fails, the page shows the order details instead of an empty cart
        navigate(`/checkout?orderId=${orderIdForPayment}`, { replace: true });
      }

      toast({
        title: numericOrderId ? 'Sẵn sàng thanh toán' : 'Đã tạo đơn hàng',
        description: 'Đang chuyển sang trang thanh toán…',
        variant: 'default',
      });

      if (selectedPaymentMethodId === 'VNPAY') {
        await createVnpayUrlMutateAsync({ orderId: orderIdForPayment });
      } else if (selectedPaymentMethodId === 'STRIPE') {
        await createStripeSessionMutateAsync({
          orderId: orderIdForPayment,
        });
      } else if (selectedPaymentMethodId === 'CRYPTO') {
        const invoiceInfo = await createCryptoInvoiceMutateAsync({
          orderId: orderIdForPayment,
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
        await createMomoUrlMutateAsync({ orderId: orderIdForPayment });
      } else if (selectedPaymentMethodId === 'MOCK_TEST') {
        // Hiển thị dialog chọn thành công hoặc thất bại
        setIsMockPaymentDialogOpen(true);
        setMockOrderId(orderIdForPayment);
      } else {
        throw new Error('Phương thức thanh toán đã chọn chưa được hỗ trợ.');
      }
    } catch (error: any) {
      console.error('Checkout process error:', error);
      toast({
        title: 'Lỗi',
        description:
          error.message || 'Đã xảy ra lỗi ngoài dự kiến trong lúc thanh toán.',
        variant: 'destructive',
      });
    }
  };

  const subtotal = numericOrderId && orderData ? (orderData.originalTotalPrice ?? (orderData as any).OriginalTotalPrice ?? 0) : (summary?.finalPrice || 0);
  const promoDiscount = numericOrderId && orderData ? (orderData.discountAmount ?? (orderData as any).DiscountAmount ?? 0) : (validatedPromo?.discountAmount || 0);
  const finalTotal = numericOrderId && orderData ? (orderData.finalAmount ?? (orderData as any).FinalAmount ?? 0) : Math.max(0, subtotal - promoDiscount);

  if ((isLoadingCart && !initialCartDataFromState && !numericOrderId) || (numericOrderId && isLoadingOrder)) {
    return (
      <Layout>
        <div className='container mx-auto p-12 text-center'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto' />
          <p className='mt-4 text-muted-foreground'>Đang tải trang thanh toán…</p>
        </div>
      </Layout>
    );
  }
  if (isCartError && !initialCartDataFromState && !numericOrderId) {
    return (
      <Layout>
        <div className='container mx-auto p-12 text-center text-destructive'>
          <XCircle className='h-12 w-12 mx-auto mb-2' />
          <p className='font-semibold'>Không tải được trang thanh toán</p>
          <p className='text-sm'>
            {cartError?.message || 'Bạn thử lại sau nhé.'}
          </p>
        </div>
      </Layout>
    );
  }

  if (numericOrderId && isOrderError) {
    return (
      <Layout>
        <div className='container mx-auto p-12 text-center text-destructive'>
          <XCircle className='h-12 w-12 mx-auto mb-2' />
          <p className='font-semibold'>Không tìm thấy đơn hàng</p>
          <p className='text-sm'>Vui lòng kiểm tra lại mã đơn hàng của bạn.</p>
        </div>
      </Layout>
    );
  }

  if (!numericOrderId && (!cartToUse || items.length === 0) && !createdOrder) {
    return (
      <Layout>
        <div className='container mx-auto flex flex-col items-center justify-center py-20'>
          <img
            src='/images/empty-cart.svg'
            alt='Giỏ hàng trống'
            className='w-40 h-40 mb-6'
          />
          <h2 className='text-2xl font-semibold mb-2'>Giỏ hàng đang trống</h2>
          <p className='text-muted-foreground mb-6'>
            Có vẻ bạn chưa thêm khóa học nào vào giỏ.
          </p>
          <div className='flex gap-4'>
            <Button asChild>
              <Link to='/cart'>Xem giỏ hàng</Link>
            </Button>
            <Button variant='outline' asChild>
              <Link to='/'>Về trang chủ</Link>
            </Button>
          </div>
          <p className='text-xs text-muted-foreground mt-8'>
            Bạn sẽ được chuyển về giỏ hàng sau vài giây…
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
          Quay lại
        </Button>
        <h1 className='mb-8'>Thanh toán an toàn</h1>

        <div className='grid lg:grid-cols-3 gap-8 items-start'>
          <div className='lg:col-span-2 space-y-6'>
            <Card className='rounded-xl border border-border bg-card shadow-none'>
              <CardHeader>
                <CardTitle className='text-xl flex items-center gap-2'>
                  <CreditCard size={24} className='text-primary' /> Chọn
                  phương thức thanh toán
                </CardTitle>
                <CardDescription>
                  Chọn cách thanh toán bạn thấy tiện nhất.
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
                  <CardTitle className='text-lg'>Chọn đồng tiền mã hóa</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground mb-4'>
                    Bạn sẽ thanh toán bằng stablecoin để tránh biến động giá.
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
            existingOrderId={numericOrderId}
          />
        </div>
      </div>

      <Dialog open={isMockPaymentDialogOpen} onOpenChange={setIsMockPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mô phỏng thanh toán (Mock Test)</DialogTitle>
            <DialogDescription>
              Bạn muốn đơn hàng này thanh toán thành công hay thất bại? Việc này sẽ cập nhật trực tiếp vào hệ thống (giả lập webhook từ cổng thanh toán).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end mt-4">
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  setIsMockPaymentDialogOpen(false);
                  toast({ title: 'Đang xử lý...', description: 'Vui lòng đợi' });
                  await apiHelper.post(`/orders/${mockOrderId}/mock-payment`, { status: 'failed' });
                  toast({ title: 'Đã hủy đơn hàng', variant: 'default' });
                  navigate('/my-courses');
                } catch (e: any) {
                  toast({ title: 'Lỗi', description: e.message || 'Lỗi xử lý', variant: 'destructive' });
                }
              }}
            >
              Thất bại (Hủy đơn)
            </Button>
            <Button
              variant="default"
              onClick={async () => {
                try {
                  setIsMockPaymentDialogOpen(false);
                  toast({ title: 'Đang xử lý...', description: 'Vui lòng đợi' });
                  await apiHelper.post(`/orders/${mockOrderId}/mock-payment`, { status: 'success' });
                  toast({ title: 'Thanh toán thành công!', variant: 'default' });
                  navigate('/my-courses');
                } catch (e: any) {
                  toast({ title: 'Lỗi', description: e.message || 'Lỗi xử lý', variant: 'destructive' });
                }
              }}
            >
              Thành công (Kích hoạt)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CheckoutPage;
