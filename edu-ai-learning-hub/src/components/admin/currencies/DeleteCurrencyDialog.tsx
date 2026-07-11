// src/components/admin/currencies/DeleteCurrencyDialog.tsx
import React from 'react';
import { Currency } from '@/services/currency.service';
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
import { useTranslation } from 'react-i18next';

interface DeleteCurrencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  currency: Currency | null;
  isPending: boolean;
}

const DeleteCurrencyDialog: React.FC<DeleteCurrencyDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  currency,
  isPending,
}) => {
  const { t } = useTranslation();
  if (!currency) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-center items-center'>
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-2'>
            <Icons.alertTriangle className='h-6 w-6 text-red-600 dark:text-red-400' />
          </div>
          <DialogTitle className='text-xl font-bold'>
            {t('deleteCurrencyDialog.title', 'Delete Currency')}
          </DialogTitle>
          <DialogDescription className='text-balance'>
            {t(
              'deleteCurrencyDialog.desc',
              `Are you absolutely sure you want to delete the currency ${currency.currencyName} (${currency.currencyId})? This action cannot be undone.`,
              {
                name: currency.currencyName,
                id: currency.currencyId,
              }
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4'>
          <DialogClose asChild>
            <Button type='button' variant='outline'>
              {t('deleteCurrencyDialog.cancel', 'Cancel')}
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
            {t('deleteCurrencyDialog.confirm', 'Yes, Delete Currency')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCurrencyDialog;
