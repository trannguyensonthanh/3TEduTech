/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/financials/AddPayoutMethodDialog.tsx
import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

// UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Icons } from '@/components/common/Icons';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Logic
import {
  payoutMethodSchema,
  TPayoutMethodSchema,
} from '@/lib/validators/payoutMethodValidator'; // Đổi tên file validator
import { useAddMyPayoutMethod } from '@/hooks/queries/instructor.queries';
import {
  CreateInstructorPayoutMethodData,
  InstructorPayoutMethodItem,
} from '@/services/instructor.service';

// --- Component Props ---
interface AddPayoutMethodDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newMethod: InstructorPayoutMethodItem) => void;
  refetch?: () => void; // Thêm refetch nếu cần
}

type PayoutCurrency = 'VND' | 'USD';
type PayoutMethod = 'VNPAY' | 'MOMO' | 'STRIPE' | 'PAYPAL';

const methodOptions: Record<
  PayoutCurrency,
  { id: PayoutMethod; name: string; icon: React.ReactNode }[]
> = {
  VND: [
    {
      id: 'MOMO',
      name: 'MoMo E-Wallet',
      icon: (
        <img
          src='/images/payment/momo_logo.png'
          alt='MoMo'
          className='h-6 w-6'
        />
      ),
    },
    {
      id: 'VNPAY',
      name: 'VNPay (Bank Transfer)',
      icon: (
        <img
          src='/images/payment/vnpay_logo.jpg'
          alt='VNPAY'
          className='h-6 w-6'
        />
      ),
    },
  ],
  USD: [
    {
      id: 'PAYPAL',
      name: 'PayPal',
      icon: <Icons.paypal className='h-6 w-6 text-blue-600' />,
    },
    {
      id: 'STRIPE',
      name: 'Stripe',
      icon: <Icons.stripe className='h-6 w-6 text-indigo-600' />,
    },
  ],
};

// --- Component ---
export const AddPayoutMethodDialog: React.FC<AddPayoutMethodDialogProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
  refetch,
}) => {
  const [selectedCurrency, setSelectedCurrency] =
    useState<PayoutCurrency | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState<PayoutMethod | null>(
    null
  );

  const { mutate: addMethod, isPending } = useAddMyPayoutMethod();

  const form = useForm<TPayoutMethodSchema>({
    resolver: zodResolver(payoutMethodSchema),
  });

  const { handleSubmit, control, reset } = form;

  useEffect(() => {
    if (!isOpen) {
      // Reset hoàn toàn khi dialog đóng
      setTimeout(() => {
        setSelectedCurrency(null);
        setSelectedMethodId(null);
        reset();
      }, 200); // Đợi animation đóng
    }
  }, [isOpen, reset]);

  const handleMethodSelect = (methodId: PayoutMethod) => {
    setSelectedMethodId(methodId);
    // Reset form với schema tương ứng
    const defaultValues: any = { methodId, details: {} };
    if (methodId === 'PAYPAL') defaultValues.details = { email: '' };
    if (methodId === 'STRIPE') defaultValues.details = { accountId: '' };
    if (methodId === 'MOMO')
      defaultValues.details = { phoneNumber: '', accountName: '' };
    if (methodId === 'VNPAY')
      defaultValues.details = {
        accountNumber: '',
        accountName: '',
        bankName: '',
      };
    reset(defaultValues);
  };

  const onSubmit: SubmitHandler<TPayoutMethodSchema> = (data) => {
    addMethod(data as CreateInstructorPayoutMethodData, {
      onSuccess: (newMethod) => {
        toast.success('Payout method added successfully.');
        onSuccess?.(newMethod);
        onOpenChange(false);
        refetch?.();
      },
      onError: (error) =>
        toast.error((error as Error).message || 'Failed to add method.'),
    });
  };

  const renderFormField = (
    name: string,
    label: string,
    placeholder: string
  ) => (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md dark:bg-slate-800/90 backdrop-blur-sm border-slate-700/70'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-semibold flex items-center'>
            <Icons.plusCircle className='mr-3 h-6 w-6 text-primary' />
            Add New Payout Method
          </DialogTitle>
          <DialogDescription>
            Choose your currency to see available payout options.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* Step 1: Choose Currency */}
            <div className='space-y-2'>
              <Label>Step 1: Choose Payout Currency</Label>
              <div className='grid grid-cols-2 gap-3'>
                <Button
                  type='button'
                  variant={selectedCurrency === 'USD' ? 'default' : 'outline'}
                  onClick={() => {
                    setSelectedCurrency('USD');
                    setSelectedMethodId(null);
                  }}
                >
                  USD
                </Button>
                <Button
                  type='button'
                  variant={selectedCurrency === 'VND' ? 'default' : 'outline'}
                  onClick={() => {
                    setSelectedCurrency('VND');
                    setSelectedMethodId(null);
                  }}
                >
                  VND
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {selectedCurrency && (
                <motion.div
                  key='method-selection'
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className='space-y-2'
                >
                  <Separator />
                  <Label>Step 2: Choose Payout Method</Label>
                  <div className='grid grid-cols-2 gap-3'>
                    {methodOptions[selectedCurrency].map((method) => (
                      <Button
                        key={method.id}
                        type='button'
                        variant={
                          selectedMethodId === method.id
                            ? 'secondary'
                            : 'outline'
                        }
                        className='h-auto py-3 flex flex-col gap-2'
                        onClick={() => handleMethodSelect(method.id)}
                      >
                        {method.icon}
                        <span className='text-xs font-semibold'>
                          {method.name}
                        </span>
                      </Button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {selectedMethodId && (
                <motion.div
                  key={selectedMethodId}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className='space-y-4 pt-4 border-t'
                >
                  <h4 className='font-semibold text-center'>
                    Enter {selectedMethodId} Details
                  </h4>
                  {selectedMethodId === 'PAYPAL' &&
                    renderFormField(
                      'details.email',
                      'PayPal Email',
                      'your.paypal@example.com'
                    )}
                  {selectedMethodId === 'STRIPE' &&
                    renderFormField(
                      'details.accountId',
                      'Stripe Account ID',
                      'acct_...'
                    )}
                  {selectedMethodId === 'MOMO' && (
                    <>
                      {renderFormField(
                        'details.phoneNumber',
                        'MoMo Phone Number',
                        '090...'
                      )}
                      {renderFormField(
                        'details.accountName',
                        'Full Name on MoMo',
                        'NGUYEN VAN A'
                      )}
                    </>
                  )}
                  {selectedMethodId === 'VNPAY' && (
                    <>
                      {renderFormField(
                        'details.accountNumber',
                        'Bank Account Number',
                        '123456789'
                      )}
                      {renderFormField(
                        'details.accountName',
                        'Account Holder Name',
                        'NGUYEN VAN A'
                      )}
                      {renderFormField(
                        'details.bankName',
                        'Bank Name',
                        'e.g., Vietcombank'
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <DialogFooter className='pt-6'>
              <DialogClose asChild>
                <Button type='button' variant='outline' disabled={isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type='submit' disabled={isPending || !selectedMethodId}>
                {isPending && (
                  <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                )}
                Save Method
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};
