import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

// UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icons } from '@/components/common/Icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

// Logic
import {
  withdrawalSchema,
  TWithdrawalSchema,
} from '@/lib/validators/withdrawalValidator';
import {
  useRequestWithdrawal,
  useMyAvailableBalance,
} from '@/hooks/queries/financials.queries';
import { useMyPayoutMethods } from '@/hooks/queries/instructor.queries';
import { InstructorPayoutMethodItem } from '@/services/instructor.service';
import { useSettings } from '@/contexts/SettingsContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
export interface RequestWithdrawalDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  currencySymbol: string;
  onSuccess?: () => void;
}

const getDisplayDetailShort = (method: InstructorPayoutMethodItem): string => {
  if (method.methodId === 'PAYPAL' || method.methodId === 'STRIPE')
    return method.details?.email || method.details?.accountId || 'N/A';
  if (method.methodId === 'MOMO')
    return `MoMo: ${method.details?.phoneNumber || 'N/A'}`;
  if (method.details?.bankName && method.details?.accountNumberLast4)
    return `${method.details.bankName} (...${method.details.accountNumberLast4})`;
  return method.methodName;
};

export const RequestWithdrawalDialog: React.FC<
  RequestWithdrawalDialogProps
> = ({ isOpen, onOpenChange, onSuccess }) => {
  const { data: balanceData, isLoading: isLoadingBalance } =
    useMyAvailableBalance({ enabled: isOpen });
  const { data: payoutMethods = [], isLoading: isLoadingMethods } =
    useMyPayoutMethods({ enabled: isOpen });
  const { formatPrice } = useSettings();

  const { mutate: requestWithdrawal, isPending } = useRequestWithdrawal();

  const form = useForm<TWithdrawalSchema>({
    resolver: zodResolver(withdrawalSchema),
    mode: 'onChange',
  });

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    setError,
    clearErrors,
  } = form;
  const selectedPayoutCurrency = watch('payoutCurrency');
  const amountToWithdraw = watch('amount');

  const selectedPayoutOption = useMemo(
    () =>
      balanceData?.payoutOptions.find(
        (opt) => opt.currencyId === selectedPayoutCurrency
      ),
    [selectedPayoutCurrency, balanceData]
  );

  const filteredPayoutMethods = useMemo(() => {
    if (!selectedPayoutCurrency) return [];
    const methodsForCurrency =
      selectedPayoutCurrency === 'USD'
        ? ['PAYPAL', 'STRIPE']
        : ['MOMO', 'VNPAY'];
    return payoutMethods.filter((m) => methodsForCurrency.includes(m.methodId));
  }, [selectedPayoutCurrency, payoutMethods]);

  useEffect(() => {
    if (isOpen) {
      // Mặc định chọn option đầu tiên có thể rút tiền
      const defaultOption = balanceData?.payoutOptions.find(
        (opt) => opt.maxWithdrawal > 0
      );
      reset({
        payoutCurrency: defaultOption?.currencyId as 'VND' | 'USD',
        amount: undefined,
        instructorPayoutMethodId: undefined,
        notes: '',
      });
    }
  }, [isOpen, balanceData, reset]);

  useEffect(() => {
    // Tự động chọn Payout Method đầu tiên khi thay đổi currency
    setValue(
      'instructorPayoutMethodId',
      filteredPayoutMethods[0]?.payoutMethodId
    );
    clearErrors('amount'); // Xóa lỗi amount khi đổi currency
  }, [selectedPayoutCurrency, filteredPayoutMethods, setValue, clearErrors]);

  const onSubmit: SubmitHandler<TWithdrawalSchema> = (data) => {
    if (!selectedPayoutOption) return;

    // Validation động
    if (data.amount < selectedPayoutOption.minWithdrawal) {
      setError('amount', {
        message: `Minimum withdrawal is ${formatPrice(selectedPayoutOption.minWithdrawal)}.`,
      });
      return;
    }
    if (data.amount > selectedPayoutOption.maxWithdrawal) {
      setError('amount', {
        message: `Amount exceeds your available balance (${formatPrice(selectedPayoutOption.maxWithdrawal)}).`,
      });
      return;
    }

    requestWithdrawal(
      {
        requestedAmount: data.amount,
        requestedCurrencyId: data.payoutCurrency,
        instructorPayoutMethodId: data.instructorPayoutMethodId,
        notes: data.notes,
      },
      {
        onSuccess: () => {
          toast.success('Withdrawal request submitted successfully!');
          onSuccess?.();
          onOpenChange(false);
        },
        onError: (err) =>
          toast.error((err as Error).message || 'Failed to submit request.'),
      }
    );
  };

  const amountInBaseCurrency =
    amountToWithdraw && selectedPayoutOption?.exchangeRate
      ? amountToWithdraw * selectedPayoutOption.exchangeRate
      : amountToWithdraw || 0;
  console.log('amountInBaseCurrency', balanceData);
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-semibold flex items-center'>
            <Icons.wallet className='mr-3 h-6 w-6 text-green-500' />
            Request Payout
          </DialogTitle>
          <DialogDescription>
            Withdraw your earnings. Funds will be sent to your selected payout
            method after processing.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 pt-2'>
            <div className='p-4 rounded-lg bg-primary/10 text-center'>
              <p className='text-sm font-medium text-primary'>
                Available to Withdraw
              </p>
              {isLoadingBalance ? (
                <Skeleton className='h-8 w-32 mx-auto mt-1' />
              ) : (
                <p className='text-3xl font-bold text-primary'>
                  {formatPrice(balanceData?.baseBalance.amount || 0)}
                </p>
              )}
            </div>

            <FormField
              control={control}
              name='payoutCurrency'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>1. Payout Currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select currency...' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {balanceData?.payoutOptions.map((opt) => (
                        <SelectItem
                          key={opt.currencyId}
                          value={opt.currencyId}
                          disabled={opt.maxWithdrawal <= 0}
                        >
                          Withdraw as {opt.currencyId} (Max:{' '}
                          {formatPrice(opt.maxWithdrawal)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AnimatePresence>
              {selectedPayoutOption && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='space-y-6 overflow-hidden'
                >
                  {selectedPayoutOption.exchangeRate && (
                    <Alert variant='default'>
                      <Icons.info className='h-4 w-4' />
                      <AlertDescription className='text-xs'>
                        Applied exchange rate:{' '}
                        {formatPrice(selectedPayoutOption.exchangeRate)} per 1{' '}
                        {selectedPayoutOption.currencyId}. Source:{' '}
                        {selectedPayoutOption.rateSource || 'System'}.
                      </AlertDescription>
                    </Alert>
                  )}

                  <FormField
                    control={control}
                    name='amount'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          2. Amount to Withdraw ({selectedPayoutCurrency})
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='0.00'
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        {amountToWithdraw > 0 && (
                          <FormDescription className='text-xs'>
                            This is equivalent to ~
                            {formatPrice(amountInBaseCurrency)} from your
                            balance.
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name='instructorPayoutMethodId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>3. Payout to</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                          value={field.value?.toString()}
                          disabled={isLoadingMethods}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  isLoadingMethods
                                    ? 'Loading...'
                                    : 'Select a method...'
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredPayoutMethods.length > 0 ? (
                              filteredPayoutMethods.map((method) => (
                                <SelectItem
                                  key={method.payoutMethodId}
                                  value={method.payoutMethodId.toString()}
                                >
                                  <div className='flex items-center gap-2'>
                                    {getDisplayDetailShort(method)}{' '}
                                    {method.isPrimary && (
                                      <Badge variant='secondary'>Primary</Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value='none' disabled>
                                No compatible methods found for{' '}
                                {selectedPayoutCurrency}.
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name='notes'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>4. Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='Any specific instructions?'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <DialogFooter className='pt-4 border-t'>
              <DialogClose asChild>
                <Button type='button' variant='outline' disabled={isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type='submit'
                disabled={isPending || !selectedPayoutOption}
              >
                {isPending && (
                  <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                )}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
