// src/components/orders/OrderCard.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/common/Icons'; // FileText, ShoppingCart, ChevronDown, ChevronUp, ArrowRight, Spinner
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Order, OrderItem, OrderStatus } from '@/services/order.service';
import { useMyOrderDetail } from '@/hooks/queries/order.queries';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from '@/contexts/SettingsContext';

interface OrderCardProps {
  order: Partial<Order>; // Nhận Partial<Order> từ danh sách
  onShowInvoice: (orderWithItems: Order) => void; // Cần Order đầy đủ để tạo invoice
  getStatusBadgeText: (status: OrderStatus) => string;
  getStatusBadgeVariant: (
    status: OrderStatus
  ) => 'default' | 'destructive' | 'secondary' | 'outline' | 'success'; // Thêm "warning"
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onShowInvoice,
  getStatusBadgeText,
  getStatusBadgeVariant,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const { formatPrice, currency } = useSettings(); // Giả sử bạn có hook này để định dạng giá, v.v.
  const {
    data: detailedOrderData,
    isLoading: isLoadingDetails,
    isError: isDetailsError,
    isSuccess: isDetailsSuccess, // Thêm isSuccess để biết khi nào data đã có
  } = useMyOrderDetail(isExpanded ? order.orderId : undefined, {
    enabled: isExpanded && !!order.orderId,
    staleTime: 1000 * 60 * 5, // Cache chi tiết order 5 phút
  });

  const [pendingInvoiceView, setPendingInvoiceView] = useState(false);
  // useEffect để tự động mở invoice dialog khi details đã load xong và người dùng đã click trước đó
  useEffect(() => {
    if (
      pendingInvoiceView &&
      isDetailsSuccess &&
      detailedOrderData &&
      detailedOrderData.items
    ) {
      onShowInvoice(detailedOrderData as Order);
      setPendingInvoiceView(false); // Reset lại cờ
    }
  }, [pendingInvoiceView, isDetailsSuccess, detailedOrderData, onShowInvoice]);

  const orderItemsToDisplay = detailedOrderData?.items || [];
  // Ưu tiên order đầy đủ từ detailedOrderData cho invoice và các actions
  const fullOrderDataForActions = detailedOrderData || order;

  const itemCountText =
    orderItemsToDisplay.length > 0
      ? orderItemsToDisplay.length === 1
        ? '1 item'
        : `${orderItemsToDisplay.length} items`
      : order.items && order.items.length > 0 // Nếu API list có trả về số lượng items ban đầu
        ? `${order.items.length} item(s)`
        : isExpanded && isLoadingDetails
          ? '' // Sẽ hiển thị spinner ở chỗ khác
          : 'View items';

  const formattedDate = order.orderDate
    ? format(parseISO(order.orderDate), 'MMM dd, yyyy - HH:mm', { locale: vi })
    : 'Date not available';

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
    if (pendingInvoiceView && !isExpanded) {
      // Nếu đang chờ xem invoice mà user lại đóng expand thì reset
      setPendingInvoiceView(false);
    }
  };
  const handleInvoiceButtonClick = () => {
    if (order.orderStatus !== 'COMPLETED') return;

    if (detailedOrderData && detailedOrderData.items) {
      // Đã có chi tiết, hiển thị invoice ngay
      onShowInvoice(detailedOrderData as Order);
    } else if (!isExpanded) {
      // Chưa expand, hãy expand và đánh dấu là đang chờ xem invoice
      setIsExpanded(true);
      setPendingInvoiceView(true);
      toast({
        title: 'Loading Order Details',
        description:
          'Fetching items for this order. The invoice will appear shortly.',
        duration: 3000,
      });
    } else if (isExpanded && isLoadingDetails) {
      // Đã expand nhưng đang tải
      setPendingInvoiceView(true); // Đảm bảo cờ này được set nếu user click nhiều lần
      toast({
        title: 'Still Loading Details',
        description: 'Order items are being fetched. Please wait a moment.',
        duration: 3000,
      });
    } else if (isExpanded && isDetailsError) {
      toast({
        variant: 'destructive',
        title: 'Error Loading Details',
        description:
          'Could not load order items to generate the invoice. Please try again.',
      });
      setPendingInvoiceView(false);
    }
  };
  console.log('OrderCard rendered with order:', order);
  console.log('OrderCard detailedOrderData:', detailedOrderData);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      layout // Cho phép animation mượt mà khi expand/collapse
    >
      <Card className='overflow-hidden rounded-xl shadow-lg border dark:border-slate-700/60 bg-card hover:border-primary/30 dark:hover:border-primary/50 transition-all duration-300'>
        <CardHeader className='p-5 md:p-6 bg-slate-50 dark:bg-slate-800/40 border-b dark:border-slate-700/60'>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3'>
            <div>
              <CardTitle className='text-lg md:text-xl font-semibold text-foreground'>
                Order <span className='text-primary'>#{order.orderId}</span>
              </CardTitle>
              <CardDescription className='mt-1 text-xs md:text-sm'>
                Placed on: {formattedDate}
              </CardDescription>
            </div>
            <div className='flex items-center space-x-3 self-start sm:self-center'>
              {order.orderStatus && (
                <Badge
                  variant={getStatusBadgeVariant(order.orderStatus)}
                  className='text-xs px-2.5 py-1 capitalize shadow-sm'
                >
                  {getStatusBadgeText(order.orderStatus)}
                </Badge>
              )}
              <span className='text-xs md:text-sm text-muted-foreground hidden sm:inline'>
                {itemCountText}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className='p-5 md:p-6'>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm mb-4'>
            <div className='mb-2 sm:mb-0'>
              <span className='font-medium text-muted-foreground'>
                Payment via:
              </span>{' '}
              <span className='font-semibold text-foreground'>
                {order.paymentMethodName || 'Chưa thanh toán'}
              </span>
            </div>
            <div className='font-semibold text-lg text-foreground'>
              Total:{' '}
              <span className='text-primary'>
                ${(order.finalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }} // Thêm marginTop khi expand
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className='overflow-hidden' // Quan trọng cho animation height
              >
                <Separator className='mb-4 dark:bg-slate-700/60' />
                <h4 className='text-base font-semibold mb-3 text-foreground'>
                  Order Items
                </h4>
                {isLoadingDetails ? (
                  <div className='space-y-3'>
                    {[...Array(order.items?.length || 1)].map(
                      (
                        _,
                        i // Skeleton dựa trên số item tóm tắt nếu có
                      ) => (
                        <div
                          key={`item-skeleton-${i}`}
                          className='flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-md'
                        >
                          <Skeleton className='w-20 h-14 rounded' />
                          <div className='flex-1 space-y-1.5'>
                            <Skeleton className='h-4 w-3/4' />
                            <Skeleton className='h-3 w-1/2' />
                          </div>
                          <Skeleton className='h-5 w-12' />
                        </div>
                      )
                    )}
                  </div>
                ) : isDetailsError ? (
                  <p className='text-sm text-destructive p-3 bg-destructive/10 rounded-md'>
                    <Icons.alertTriangle className='inline h-4 w-4 mr-1.5' />
                    Could not load order items. Please try again.
                  </p>
                ) : orderItemsToDisplay.length > 0 ? (
                  <div className='space-y-3'>
                    {orderItemsToDisplay.map((item) => (
                      <div
                        key={item.orderItemId || item.courseId} // Ưu tiên orderItemId nếu có
                        className='flex items-start sm:items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border dark:border-slate-700/50 hover:shadow-sm transition-shadow'
                      >
                        <img
                          src={
                            item.thumbnailUrl ||
                            `https://via.placeholder.com/120x90/e0e0e0/909090?text=${item.courseName
                              ?.substring(0, 1)
                              .toUpperCase()}`
                          }
                          alt={item.courseName}
                          className='w-20 h-[60px] sm:w-24 sm:h-[72px] object-cover rounded-md flex-shrink-0 border dark:border-slate-700'
                        />
                        <div className='flex-1 min-w-0'>
                          <Link
                            to={`/courses/${item.slug}`}
                            className='font-semibold text-sm sm:text-base text-foreground hover:text-primary dark:hover:text-primary/90 line-clamp-2 leading-snug transition-colors'
                          >
                            {item.courseName}
                          </Link>

                          {item.instructorName && (
                            <p className='text-xs text-muted-foreground mt-0.5'>
                              By {item.instructorName}
                            </p>
                          )}
                        </div>
                        <div className='font-semibold text-sm sm:text-base text-foreground whitespace-nowrap'>
                          {currency === 'VND'
                            ? formatPrice(item?.pricing?.display?.price ?? 0)
                            : `$${((item?.pricing?.display?.price ?? 0) / 25000).toFixed(2)}`}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='text-sm text-muted-foreground p-3 bg-slate-50 dark:bg-slate-800/30 rounded-md'>
                    No items found in this order.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        <CardFooter className='flex flex-col sm:flex-row justify-between items-center p-5 md:p-6 border-t dark:border-slate-700/60 bg-slate-50/30 dark:bg-slate-800/20'>
          <Button
            variant='link'
            size='sm'
            onClick={handleToggleExpand}
            className='text-primary dark:text-primary/90 hover:underline px-0 font-medium text-sm'
            aria-expanded={isExpanded}
            disabled={isLoadingDetails && isExpanded}
          >
            {isLoadingDetails && isExpanded ? (
              <>
                {' '}
                <Icons.spinner className='mr-1.5 h-4 w-4 animate-spin' />{' '}
                Loading Details...
              </>
            ) : isExpanded ? (
              'Hide Details'
            ) : (
              'View Details'
            )}
            {!(isLoadingDetails && isExpanded) && (
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <Icons.chevronDown className='ml-1 h-4 w-4' />
              </motion.div>
            )}
          </Button>
          <div className='flex space-x-2 mt-3 sm:mt-0'>
            {fullOrderDataForActions.orderStatus === 'COMPLETED' && (
              <Button
                size='sm'
                variant='outline'
                onClick={handleInvoiceButtonClick}
                disabled={
                  (isExpanded && isLoadingDetails) || pendingInvoiceView
                }
                className='h-9 text-xs sm:text-sm'
              >
                {isExpanded && isLoadingDetails && pendingInvoiceView ? (
                  <Icons.spinner className='mr-1.5 h-4 w-4 animate-spin' />
                ) : (
                  <Icons.fileText className='h-4 w-4 mr-1.5' />
                )}
                View Invoice
              </Button>
            )}
            {fullOrderDataForActions.orderStatus === 'COMPLETED' && (
              <Button
                size='sm'
                onClick={() => navigate('/my-courses')}
                className='h-9 text-xs sm:text-sm'
              >
                My Learning <Icons.arrowRight className='ml-1.5 h-4 w-4' />
              </Button>
            )}
            {(fullOrderDataForActions.orderStatus === 'FAILED' ||
              fullOrderDataForActions.orderStatus === 'PENDING_PAYMENT') && (
              <Button
                size='sm'
                onClick={() =>
                  navigate(
                    `/checkout?orderId=${fullOrderDataForActions.orderId}`
                  )
                }
                className='h-9 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs sm:text-sm'
              >
                {fullOrderDataForActions.orderStatus === 'FAILED'
                  ? 'Retry Payment'
                  : 'Complete Payment'}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
