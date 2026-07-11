// src/components/admin/payment-methods/PaymentMethodDialog.tsx

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  paymentMethodSchema,
  TPaymentMethodSchema,
} from '@/lib/validators/paymentMethodValidator';
import { PaymentMethod } from '@/services/paymentMethod.service';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/common/Icons';

// Import your i18n hook
import { useTranslation } from 'react-i18next';

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethod: PaymentMethod | null;
  onSubmit: (data: TPaymentMethodSchema) => void;
  isEditing: boolean;
  isPending: boolean;
}

const PaymentMethodDialog: React.FC<PaymentMethodDialogProps> = ({
  open,
  onOpenChange,
  paymentMethod,
  onSubmit,
  isEditing,
  isPending,
}) => {
  const { t } = useTranslation();

  const form = useForm<TPaymentMethodSchema>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      methodId: '',
      methodName: '',
      description: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        methodId: paymentMethod?.methodId || '',
        methodName: paymentMethod?.methodName || '',
        description: paymentMethod?.description || '',
      });
    }
  }, [open, paymentMethod, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t('paymentMethodDialog.titleEdit')
              : t('paymentMethodDialog.titleAdd')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? paymentMethod?.methodName
                ? t('paymentMethodDialog.update', {
                    name: paymentMethod.methodName,
                  })
                : t('paymentMethodDialog.titleEdit')
              : t('paymentMethodDialog.titleAdd')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='methodId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('paymentMethodDialog.methodId')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('paymentMethodDialog.placeholderId')}
                      {...field}
                      disabled={isEditing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='methodName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('paymentMethodDialog.methodName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('paymentMethodDialog.placeholderName')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='A short description of the payment method.'
                      {...field}
                      className='resize-y'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className='pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                {t('paymentMethodDialog.cancel')}
              </Button>
              <Button type='submit' disabled={isPending}>
                {isPending && (
                  <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                )}
                {isEditing
                  ? t('paymentMethodDialog.update')
                  : t('paymentMethodDialog.add')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodDialog;
