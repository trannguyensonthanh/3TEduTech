// src/components/admin/payouts/ReviewWithdrawalDialog.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  reviewWithdrawalSchema,
  TReviewWithdrawalSchema,
} from '@/lib/validators/payoutValidator';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/common/Icons';
import { Separator } from '@/components/ui/separator';
import { WithdrawalRequest } from '@/services/financials.service';
import { useReviewWithdrawalRequest } from '@/hooks/queries/financials.queries';
import { toast } from 'sonner';

interface ReviewWithdrawalDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  request: WithdrawalRequest | null;
}

export const ReviewWithdrawalDialog: React.FC<ReviewWithdrawalDialogProps> = ({
  isOpen,
  onOpenChange,
  request,
}) => {
  const { mutate: reviewRequest, isPending } = useReviewWithdrawalRequest();

  const form = useForm<TReviewWithdrawalSchema>({
    resolver: zodResolver(reviewWithdrawalSchema),
    defaultValues: { decision: undefined, adminNotes: '' },
  });

  const onSubmit = (data: TReviewWithdrawalSchema) => {
    if (!request) return;
    if (!data.decision) {
      toast.error('Decision is required.');
      return;
    }
    reviewRequest(
      {
        requestId: request.requestId,
        data: { ...data, decision: data.decision },
      },
      {
        onSuccess: () => {
          toast.success(
            `Request #${request.requestId} has been ${data.decision.toLowerCase()}.`
          );
          onOpenChange(false);
        },
        onError: (err) =>
          toast.error((err as Error).message || 'Failed to process request.'),
      }
    );
  };

  if (!request) return null;
  const payoutDetails = JSON.parse(request.payoutDetailsSnapshot || '{}');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            Review Withdrawal Request #{request.requestId}
          </DialogTitle>
          <DialogDescription>
            Review details and approve or reject the request.
          </DialogDescription>
        </DialogHeader>
        <div className='py-4 space-y-4'>
          {/* Details Section */}
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span>Instructor:</span>
              <span className='font-medium'>{request.instructorName}</span>
            </div>
            <div className='flex justify-between'>
              <span>Amount:</span>
              <span className='font-bold text-lg'>
                {request.requestedAmount.toFixed(2)}{' '}
                {request.requestedCurrencyId}
              </span>
            </div>
            <div className='flex justify-between'>
              <span>Method:</span>
              <span className='font-medium'>{request.paymentMethodId}</span>
            </div>
          </div>
          <Separator />
          {/* Payout Details Snapshot */}
          <div className='space-y-2'>
            <h4 className='font-semibold'>Payout Details</h4>
            <div className='p-3 bg-muted rounded-md text-xs space-y-1'>
              {Object.entries(payoutDetails).map(([key, value]) => (
                <div key={key} className='flex justify-between'>
                  <span className='capitalize text-muted-foreground'>
                    {key.replace(/([A-Z])/g, ' $1')}:
                  </span>
                  <span className='font-mono'>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
          {request.instructorNotes && (
            <div className='space-y-2'>
              <h4 className='font-semibold'>Instructor's Note</h4>
              <p className='text-sm p-3 bg-muted rounded-md'>
                {request.instructorNotes}
              </p>
            </div>
          )}

          {/* Form Section */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 pt-4 border-t'
            >
              <FormField
                control={form.control}
                name='decision'
                render={({ field }) => (
                  <FormItem className='space-y-3'>
                    <FormLabel>Decision*</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className='flex gap-4'
                      >
                        <FormItem className='flex items-center space-x-2'>
                          <FormControl>
                            <RadioGroupItem value='APPROVED' />
                          </FormControl>
                          <FormLabel className='font-normal'>Approve</FormLabel>
                        </FormItem>
                        <FormItem className='flex items-center space-x-2'>
                          <FormControl>
                            <RadioGroupItem value='REJECTED' />
                          </FormControl>
                          <FormLabel className='font-normal'>Reject</FormLabel>
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
                    <FormLabel>
                      Admin Notes{' '}
                      {form.watch('decision') === 'REJECTED' && (
                        <span className='text-destructive'>*</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Add internal notes or feedback for the instructor...'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type='button' variant='outline'>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type='submit' disabled={isPending}>
                  {isPending && (
                    <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                  )}{' '}
                  Submit Decision
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
