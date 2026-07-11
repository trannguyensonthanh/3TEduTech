/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/OrderHistoryPage.tsx
import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  Suspense,
} from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/common/Icons'; // Order (Receipt), ShoppingCart, AlertTriangle, PackageOpen
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import InvoiceViewDialog, {
  InvoiceData,
} from '@/components/orders/InvoiceViewDialog';
import { useMyOrders } from '@/hooks/queries/order.queries';
import { Order, OrderQueryParams, OrderStatus } from '@/services/order.service'; // Chỉ cần Order type vì OrderItem đã được xử lý trong OrderCard
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import PaginationControls from '@/components/admin/PaginationControls';
import { OrderCard } from '@/components/orders/OrderCard'; // Import OrderCard mới
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';

const ITEMS_PER_PAGE_ORDERS = 5; // Số đơn hàng mỗi trang

const TABS_CONFIG: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Orders' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PENDING_PAYMENT', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

// Animation Variants
const headerVariants = {
  hidden: { opacity: 0, y: -30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};
const listContainerVariants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const OrderHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParamsUrl = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const { userData: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>(
    (queryParamsUrl.get('status') as OrderStatus | 'all') || 'all'
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(queryParamsUrl.get('page') || '1', 10)
  );

  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedInvoiceData, setSelectedInvoiceData] =
    useState<InvoiceData | null>(null);

  const orderQueryParams: OrderQueryParams = useMemo(
    () => ({
      page: currentPage,
      limit: ITEMS_PER_PAGE_ORDERS,
      status: activeTab === 'all' ? undefined : activeTab,
      sortBy: 'orderDate:desc', // Mặc định sắp xếp
    }),
    [currentPage, activeTab]
  );

  const {
    data: ordersData,
    isLoading: isLoadingOrdersInitial,
    isFetching: isFetchingOrders,
    error: ordersError,
    refetch: refetchOrders,
  } = useMyOrders(orderQueryParams);

  const orders = ordersData?.orders || [];
  const totalItems = ordersData?.total || 0;
  const totalPages =
    ordersData?.totalPages ||
    Math.ceil(totalItems / ITEMS_PER_PAGE_ORDERS) ||
    1;

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'all') params.set('status', activeTab);
    if (currentPage > 1) params.set('page', currentPage.toString());
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [activeTab, currentPage, location.pathname, navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const getStatusBadgeVariant = (
    status?: OrderStatus
  ): 'success' | 'default' | 'destructive' | 'outline' | 'secondary' => {
    if (!status) return 'outline';
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING_PAYMENT':
        return 'default';
      case 'FAILED':
        return 'destructive';
      case 'CANCELLED':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  const getStatusText = (status?: OrderStatus): string => {
    if (!status) return 'Unknown';
    switch (status) {
      case 'COMPLETED':
        return 'Completed';
      case 'PENDING_PAYMENT':
        return 'Pending Payment';
      case 'FAILED':
        return 'Payment Failed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Unknown Status';
    }
  };

  const handleShowInvoice = useCallback(
    (orderWithItems: Order) => {
      console.log('Selected Order for Invoice:', orderWithItems);
      console.log('Current User:', currentUser);
      if (!currentUser || !orderWithItems.items) {
        console.error(
          'Missing current user or order items for invoice generation'
        );
        // toast({ variant: "destructive", title: "Error", description: "Cannot generate invoice for this order."});
        return;
      }
      const invoiceData: InvoiceData = {
        invoiceId: orderWithItems.orderId.toString(),
        orderId: orderWithItems.orderId.toString(),
        orderDate: orderWithItems.orderDate,
        totalAmount: orderWithItems.finalAmount,
        paymentMethodName: orderWithItems.paymentMethodName || 'N/A',
        items: orderWithItems.items.map((item) => ({
          courseId: item.courseId,
          courseName: item.courseName || 'Unknown Course',
          priceAtOrder: item.priceAtOrder,
          instructorName: (item as any).instructorName,
        })),
        customerInfo: {
          fullName: currentUser.fullName || 'Valued Customer',
          email: currentUser.email,
        },
        companyInfo: {
          name: '3TEduTech Inc.',
          address: '123 Innovation Drive, Tech City, EduLand',
          email: 'billing@3tedutech.com',
          logoUrl: '/images/logo/3telogo.jpeg',
        },
      };
      setSelectedInvoiceData(invoiceData);
      setInvoiceDialogOpen(true);
    },
    [currentUser]
  );

  return (
    <Layout>
      {/* Header Section */}
      <div className='bg-gradient-to-b from-slate-100 via-slate-50 to-background dark:from-slate-900 dark:via-slate-800/70 dark:to-background border-b dark:border-slate-700/50'>
        <motion.div
          variants={headerVariants}
          initial='hidden'
          animate='visible'
          className='container mx-auto px-4 pt-10 pb-8 md:pt-16 md:pb-12 text-center'
        >
          <Icons.shoppingCart className='h-16 w-16 md:h-20 md:w-20 mx-auto mb-4 text-primary dark:text-primary/90' />
          <h1 className='text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-slate-50 mb-4 tracking-tight'>
            My Order History
          </h1>
          <p className='text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto'>
            Review your past purchases, track current orders, and manage your
            invoices all in one place.
          </p>
        </motion.div>
      </div>

      <div className='container mx-auto px-4 py-8 md:py-12'>
        <div className='max-w-5xl mx-auto'>
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as OrderStatus | 'all')
            }
            className='w-full'
          >
            <ScrollArea className='w-full pb-2 mb-6 md:mb-8'>
              <TabsList className='inline-flex h-11 min-w-full sm:min-w-0 sm:w-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shadow-sm'>
                {TABS_CONFIG.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className='px-3.5 py-2 sm:px-5 sm:py-2.5 text-sm font-medium flex-1 sm:flex-none data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md rounded-md h-auto leading-normal'
                  >
                    {tab.label}
                    {/* TODO: Add count for each tab if API supports `countsByStatus` */}
                    {/* ({tab.value === 'all' ? totalItems : ordersData?.countsByStatus?.[tab.value] || 0}) */}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation='horizontal' />
            </ScrollArea>

            <AnimatePresence mode='wait'>
              <motion.div
                key={activeTab + currentPage} // Key thay đổi khi tab hoặc page thay đổi để trigger animation
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {isLoadingOrdersInitial && !orders ? (
                  <div className='space-y-6 mt-4'>
                    {[...Array(3)].map((_, index) => (
                      <Card
                        key={`order-skeleton-${index}`}
                        className='overflow-hidden rounded-xl border dark:border-slate-700/60'
                      >
                        <CardHeader className='p-5 md:p-6 bg-slate-50 dark:bg-slate-800/40 border-b dark:border-slate-700/60'>
                          <div className='flex justify-between items-start'>
                            <Skeleton className='h-6 w-3/5' />
                            <Skeleton className='h-5 w-20' />
                          </div>
                          <Skeleton className='h-4 w-2/5 mt-1.5' />
                        </CardHeader>
                        <CardContent className='p-5 md:p-6 pt-4'>
                          <div className='flex justify-between items-center mb-3'>
                            <Skeleton className='h-5 w-1/2' />
                            <Skeleton className='h-6 w-1/4' />
                          </div>
                          <Skeleton className='h-16 w-full rounded-md' />{' '}
                          {/* For expanded items placeholder */}
                        </CardContent>
                        <CardFooter className='p-5 md:p-6 border-t dark:border-slate-700/60 bg-slate-50/30 dark:bg-slate-800/20'>
                          <Skeleton className='h-9 w-28' />
                          <Skeleton className='h-9 w-24 ml-auto' />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : ordersError ? (
                  <Alert variant='destructive' className='mt-4'>
                    <Icons.alertTriangle className='h-5 w-5' />
                    <AlertTitle>Error Loading Orders</AlertTitle>
                    <AlertDescription>
                      We couldn't fetch your order history.{' '}
                      {ordersError.message || 'Please try again later.'}
                      <Button
                        variant='link'
                        size='sm'
                        onClick={() => refetchOrders()}
                        className='p-0 h-auto ml-1 text-destructive hover:underline'
                      >
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : orders.length > 0 ? (
                  <div className='space-y-6 mt-4'>
                    {orders.map((order) => (
                      <OrderCard
                        key={order.orderId}
                        order={order}
                        onShowInvoice={handleShowInvoice}
                        getStatusBadgeText={getStatusText}
                        getStatusBadgeVariant={getStatusBadgeVariant}
                      />
                    ))}
                  </div>
                ) : (
                  !isFetchingOrders && (
                    <EmptyOrderState
                      status={activeTab !== 'all' ? activeTab : undefined}
                    />
                  )
                )}
              </motion.div>
            </AnimatePresence>

            {!isLoadingOrdersInitial &&
              !ordersError &&
              totalItems > 0 &&
              totalPages > 1 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  setCurrentPage={setCurrentPage}
                  isDisabled={isFetchingOrders}
                  className='mt-10'
                />
              )}
          </Tabs>
        </div>
      </div>

      {/* Invoice View Dialog - Lazy Loaded */}
      <Suspense
        fallback={
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-[100]'>
            <Icons.spinner className='h-10 w-10 animate-spin text-white' />
          </div>
        }
      >
        {invoiceDialogOpen &&
          selectedInvoiceData && ( // Render chỉ khi cần
            <InvoiceViewDialog
              open={invoiceDialogOpen}
              onOpenChange={setInvoiceDialogOpen}
              invoice={selectedInvoiceData}
            />
          )}
      </Suspense>
    </Layout>
  );
};

const EmptyOrderState: React.FC<{ status?: OrderStatus | 'all' }> = ({
  status,
}) => {
  const navigate = useNavigate();
  let title = 'You have no orders yet.';
  let description = 'Once you purchase a course, your orders will appear here.';

  if (status && status !== 'all') {
    const statusText = status.toLowerCase().replace('_', ' ');
    title = `No ${statusText} orders.`;
    description = `You currently don't have any orders with the status: ${statusText}.`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='bg-card dark:bg-slate-800/30 rounded-xl p-8 md:p-12 text-center shadow-lg border-2 border-dashed border-border dark:border-slate-700/60 min-h-[400px] flex flex-col justify-center items-center'
    >
      <Icons.shoppingCart className='w-16 h-16 md:w-20 md:w-20 text-muted-foreground mx-auto mb-6 opacity-60' />
      <h3 className='text-xl md:text-2xl font-semibold text-foreground mb-3'>
        {title}
      </h3>
      <p className='text-muted-foreground mb-8 max-w-md mx-auto'>
        {description}
      </p>
      <Button
        onClick={() => navigate('/courses')}
        size='lg'
        className='h-11 px-6 text-base'
      >
        <Icons.search className='mr-2 h-5 w-5' /> Explore Courses
      </Button>
    </motion.div>
  );
};

export default OrderHistoryPage;
