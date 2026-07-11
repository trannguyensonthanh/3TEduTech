// src/components/admin/payouts/ProcessPayoutDialog.tsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  processPayoutSchema,
  TProcessPayoutSchema,
} from '@/lib/validators/payoutValidator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/common/Icons';
import { Separator } from '@/components/ui/separator';
import { Payout } from '@/services/financials.service';
import { useProcessPayoutExecution } from '@/hooks/queries/financials.queries';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ProcessPayoutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  payout: Payout | null;
}

export const ProcessPayoutDialog: React.FC<ProcessPayoutDialogProps> = ({
  isOpen,
  onOpenChange,
  payout,
}) => {
  const { mutate: processPayout, isPending } = useProcessPayoutExecution();

  const form = useForm<TProcessPayoutSchema>({
    resolver: zodResolver(processPayoutSchema),
  });

  useEffect(() => {
    if (payout) {
      form.reset({
        status:
          payout.payoutStatusId === 'PAID' || payout.payoutStatusId === 'FAILED'
            ? payout.payoutStatusId
            : undefined,
        completedAt: payout.completedAt
          ? format(new Date(payout.completedAt), "yyyy-MM-dd'T'HH:mm")
          : undefined,
        adminNotes: payout.adminNote || '',

        // Các trường khác có thể điền từ payout nếu có
      });
    }
  }, [payout, form]);

  const onSubmit = (data: TProcessPayoutSchema) => {
    if (!payout) return;
    if (!data.status) {
      toast.error('Status is required.');
      return;
    }
    console.log('Processing payout with data:', data);
    processPayout(
      { payoutId: payout.payoutId, data: { ...data, status: data.status } },
      {
        onSuccess: () => {
          toast.success(`Payout #${payout.payoutId} status updated.`);
          onOpenChange(false);
        },
        onError: (err) =>
          toast.error((err as Error).message || 'Failed to update payout.'),
      }
    );
  };

  if (!payout) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Process Payout #{payout.payoutId}</DialogTitle>
          <DialogDescription>
            Update the status after processing the payment.
          </DialogDescription>
        </DialogHeader>
        <div className='py-4 space-y-4 text-sm'>
          {/* Thông tin chi tiết payout */}
          <p>
            <strong>Instructor:</strong> {payout.instructorName}
          </p>
          <p>
            <strong>Amount:</strong>{' '}
            <span className='font-bold'>
              {payout.amount.toFixed(2)} {payout.currencyId}
            </span>
          </p>
          <p>
            <strong>Method:</strong> {payout.paymentMethodId}
          </p>
          <Separator />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Final Status*</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className='flex gap-4'
                      >
                        <FormItem className='flex items-center space-x-2'>
                          <FormControl>
                            <RadioGroupItem value='PAID' />
                          </FormControl>
                          <FormLabel className='font-normal'>Paid</FormLabel>
                        </FormItem>
                        <FormItem className='flex items-center space-x-2'>
                          <FormControl>
                            <RadioGroupItem value='FAILED' />
                          </FormControl>
                          <FormLabel className='font-normal'>Failed</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='adminNotes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Internal notes about this transaction...'
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={isPending}>
                  {isPending && (
                    <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  Update Status
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
