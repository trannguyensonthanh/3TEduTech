// src/components/admin/payment-methods/DeletePaymentMethodDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import { PaymentMethod } from '@/services/paymentMethod.service';

interface DeletePaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  paymentMethod: PaymentMethod | null;
  isPending: boolean;
}

const DeletePaymentMethodDialog: React.FC<DeletePaymentMethodDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  paymentMethod,
  isPending,
}) => {
  if (!paymentMethod) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-center items-center'>
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-2'>
            <Icons.alertTriangle className='h-6 w-6 text-red-600 dark:text-red-400' />
          </div>
          <DialogTitle className='text-xl font-bold'>
            Delete Payment Method
          </DialogTitle>
          <DialogDescription className='text-balance'>
            Are you sure you want to delete the method{' '}
            <span className='font-bold text-foreground'>
              {paymentMethod.methodName} ({paymentMethod.methodId})
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4'>
          <DialogClose asChild>
            <Button type='button' variant='outline'>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type='button'
            variant='destructive'
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && (
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
            )}
            Yes, Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeletePaymentMethodDialog;
