import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Icons } from '@/components/common/Icons';
import {
  useMyPayoutMethods,
  useSetMyPrimaryPayoutMethod,
  useDeleteMyPayoutMethod,
} from '@/hooks/queries/instructor.queries';
import { AddPayoutMethodDialog } from './AddPayoutMethodDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ConfirmationDialog from '@/components/instructor/courseCreate/ConfirmationDialog';
import { cn } from '@/lib/utils';
import { InstructorPayoutMethodItem } from '@/services/instructor.service';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ManagePayoutMethodsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper function để hiển thị thông tin chi tiết một cách an toàn
// Helper function để hiển thị thông tin chi tiết một cách an toàn và đầy đủ
const getDisplayDetail = (method: InstructorPayoutMethodItem): string => {
  const details = method.details;
  if (!details) return 'Details not available';

  switch (method.methodId) {
    case 'PAYPAL':
      return details.email || 'No PayPal email provided';

    case 'STRIPE':
      // Backend nên trả về một định danh đã được che giấu cho Stripe account
      // Ví dụ: "Stripe Account: •••• 1234" hoặc email liên kết
      return details.accountId
        ? `Stripe Account ID: ...${details.accountId.slice(-4)}`
        : 'Stripe account linked';

    case 'MOMO':
      // Backend nên trả về số điện thoại đã được che giấu
      // Ví dụ: "090***1234"
      return details.phoneNumber
        ? `MoMo: ${details.phoneNumber}`
        : 'No MoMo phone number provided';

    case 'VNPAY':
      // Backend nên trả về 4 số cuối của tài khoản
      if (details.bankName && details.accountNumber) {
        return `${details.bankName} - ${details.accountNumber}`;
      }
      return 'VNPay/Bank details incomplete';

    // Trường hợp mặc định cho các phương thức không xác định
    default:
      return 'Details not available';
  }
};
export const ManagePayoutMethodsDialog: React.FC<
  ManagePayoutMethodsDialogProps
> = ({ isOpen, onOpenChange }) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [itemToDelete, setItemToDelete] =
    useState<InstructorPayoutMethodItem | null>(null);

  const {
    data: payoutMethods = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useMyPayoutMethods({ enabled: isOpen });

  const [settingPrimaryId, setSettingPrimaryId] = useState<number | null>(null);
  const { mutate: setPrimary, isPending: isSettingPrimary } =
    useSetMyPrimaryPayoutMethod({
      onSuccess: (payoutMethods) => {
        console.log('Primary method set:', payoutMethods);
        toast.success(
          `${payoutMethods.methodName} is now your primary payout method.`
        );
        setSettingPrimaryId(null);
        refetch?.();
      },
      onError: (err) => {
        toast.error((err as Error).message || 'Could not set primary method.');
        setSettingPrimaryId(null);
      },
    });

  const { mutate: deleteMethod, isPending: isDeleting } =
    useDeleteMyPayoutMethod({
      onSuccess: (_, deletedId) => {
        toast.success(`Payout method has been removed.`);
        setItemToDelete(null);
      },
      onError: (err) => {
        toast.error((err as Error).message || 'Could not remove method.');
        setItemToDelete(null);
      },
    });

  const handleAddNewSuccess = () => {
    // Hook useAddMyPayoutMethod đã invalidate query, nên danh sách sẽ tự cập nhật.
    // Chỉ cần đóng dialog thêm.
    setShowAddDialog(false);
  };

  const renderIcon = (methodId: string) => {
    switch (methodId) {
      case 'PAYPAL':
        return (
          <Icons.paypal className='h-6 w-6 text-blue-600 dark:text-blue-400' />
        );
      case 'STRIPE':
        return (
          <Icons.stripe className='h-6 w-6 text-indigo-600 dark:text-indigo-400' />
        );
      case 'MOMO':
        return (
          <img
            src='/images/payment/momo_logo.png'
            alt='MoMo'
            className='h-6 w-6'
          />
        );
      case 'VNPAY':
        return (
          <img
            src='/images/payment/vnpay_logo.jpg'
            alt='VNPAY'
            className='h-6 w-6'
          />
        );
      default:
        return (
          <Icons.landmark className='h-6 w-6 text-green-600 dark:text-green-400' />
        );
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 2 }).map((_, i) => (
        <div
          key={`skel-${i}`}
          className='flex items-center justify-between p-4 border rounded-lg'
        >
          <div className='flex items-center space-x-4'>
            <Skeleton className='h-10 w-10 rounded-full' />
            <div className='space-y-1.5'>
              <Skeleton className='h-4 w-28' />
              <Skeleton className='h-3 w-36' />
            </div>
          </div>
          <Skeleton className='h-9 w-24 rounded-md' />
        </div>
      ));
    }
    if (isError) {
      return (
        <Alert variant='destructive'>
          <Icons.alertTriangle className='h-4 w-4' />
          <AlertTitle>Error Loading Methods</AlertTitle>
          <AlertDescription>
            {(error as Error).message ||
              'Could not retrieve your payout methods.'}
          </AlertDescription>
        </Alert>
      );
    }
    if (payoutMethods.length === 0) {
      return (
        <div className='text-center py-10 text-muted-foreground border border-dashed rounded-lg'>
          <Icons.wallet className='h-12 w-12 mx-auto mb-3 opacity-50' />
          <p className='font-medium'>No Payout Methods Added Yet</p>
          <p className='text-sm'>
            Add a method to start receiving your earnings.
          </p>
        </div>
      );
    }
    console.log('Payout Methods:', payoutMethods);
    return (
      <div className='flex flex-col gap-4'>
        {payoutMethods.map((method) => (
          <Card
            key={method.payoutMethodId}
            className={cn(
              'transition-all',
              method.isPrimary && 'border-primary shadow-lg'
            )}
          >
            <div className='flex items-center justify-between p-4 gap-3'>
              <div className='flex items-center space-x-4'>
                <div className='p-2.5 rounded-full bg-muted'>
                  {renderIcon(method.methodId)}
                </div>
                <div>
                  <p className='font-semibold text-foreground flex items-center'>
                    {method.methodName}
                    {method.isPrimary && (
                      <Badge variant='success' className='ml-2'>
                        Primary
                      </Badge>
                    )}
                  </p>
                  <p className='text-sm text-muted-foreground break-all'>
                    {getDisplayDetail(method)}
                  </p>
                </div>
              </div>
              <div className='flex gap-2 mt-0'>
                {!method.isPrimary && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setSettingPrimaryId(method.payoutMethodId);
                      setPrimary(method.payoutMethodId);
                    }}
                    disabled={isSettingPrimary}
                  >
                    {isSettingPrimary &&
                    settingPrimaryId === method.payoutMethodId ? (
                      <Icons.spinner className='h-4 w-4 animate-spin' />
                    ) : (
                      <Icons.checkCircle className='mr-1.5 h-4 w-4' />
                    )}
                    Set Primary
                  </Button>
                )}
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-9 w-9 text-muted-foreground hover:text-destructive'
                  onClick={() => setItemToDelete(method)}
                  disabled={isDeleting}
                >
                  <Icons.trash className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-lg md:max-w-xl dark:bg-slate-800/80 backdrop-blur-sm'>
          <DialogHeader className='pb-4 border-b'>
            <DialogTitle className='text-2xl font-semibold flex items-center'>
              <Icons.creditCard className='mr-3 h-6 w-6 text-primary' />
              Manage Payout Methods
            </DialogTitle>
            <DialogDescription>
              Add, remove, or set your default method for receiving earnings.
            </DialogDescription>
          </DialogHeader>
          <div className='py-4 max-h-[60vh] overflow-y-auto space-y-4 pr-3 -mr-3'>
            {renderContent()}
          </div>
          <DialogFooter className='pt-5 border-t gap-2 sm:gap-0'>
            <Button
              variant='default'
              className='w-full sm:w-auto'
              onClick={() => setShowAddDialog(true)}
            >
              <Icons.plus className='mr-2 h-4 w-4' /> Add New Method
            </Button>
            <DialogClose asChild>
              <Button
                type='button'
                variant='outline'
                className='w-full sm:w-auto'
              >
                Done
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!itemToDelete}
        onOpenChange={() => setItemToDelete(null)}
        title='Remove Payout Method?'
        description={
          <>
            Are you sure you want to remove this method? <br />
            <strong>
              {itemToDelete?.methodName}:{' '}
              {itemToDelete && getDisplayDetail(itemToDelete)}
            </strong>
          </>
        }
        confirmText='Yes, Remove'
        confirmVariant='destructive'
        onConfirm={() => {
          if (itemToDelete) {
            deleteMethod(itemToDelete.payoutMethodId);
            refetch?.();
          }
        }}
        isConfirming={isDeleting}
      />

      <AddPayoutMethodDialog
        isOpen={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleAddNewSuccess}
        refetch={refetch}
      />
    </>
  );
};
