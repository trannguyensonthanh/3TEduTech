// src/components/admin/promotions/PromotionDialog.tsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  promotionSchema,
  TPromotionSchema,
} from '@/lib/validators/promotionValidator';
import { Promotion } from '@/services/promotion.service';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icons } from '@/components/common/Icons';
import { format } from 'date-fns';

interface PromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion: Promotion | null;
  onSubmit: (data: TPromotionSchema, promotionId?: number) => void;
  isPending: boolean;
}

const PromotionDialog: React.FC<PromotionDialogProps> = ({
  open,
  onOpenChange,
  promotion,
  onSubmit,
  isPending,
}) => {
  const isEditing = !!promotion;

  const form = useForm<TPromotionSchema>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      promotionName: '',
      discountCode: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 0,
      maxDiscountAmount: undefined,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(
        new Date(new Date().setDate(new Date().getDate() + 30)),
        'yyyy-MM-dd'
      ),
      maxUsageLimit: 100,
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (open && promotion) {
      // Safely parse and format dates, fallback to today if invalid
      let startDate = '';
      let endDate = '';
      try {
        startDate = promotion.startDate
          ? format(new Date(promotion.startDate), 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd');
      } catch {
        startDate = format(new Date(), 'yyyy-MM-dd');
      }
      try {
        endDate = promotion.endDate
          ? format(new Date(promotion.endDate), 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd');
      } catch {
        endDate = format(new Date(), 'yyyy-MM-dd');
      }
      form.reset({
        promotionName: promotion.promotionName ?? '',
        discountCode: promotion.discountCode ?? '',
        description: promotion.description ?? '',
        discountType: promotion.discountType as 'PERCENTAGE' | 'FIXED_AMOUNT',
        discountValue: promotion.discountValue ?? 0,
        minOrderValue: promotion.minOrderValue ?? undefined,
        maxDiscountAmount: promotion.maxDiscountAmount ?? undefined,
        startDate,
        endDate,
        maxUsageLimit: promotion.maxUsageLimit ?? undefined,
        status: (promotion.status === 'ACTIVE' ||
        promotion.status === 'INACTIVE'
          ? promotion.status
          : 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
      });
    } else if (open && !promotion) {
      form.reset(form.formState.defaultValues);
    }
  }, [open, promotion, form]);

  const handleFormSubmit = (data: TPromotionSchema) => {
    onSubmit(data, promotion?.promotionId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Promotion' : 'Create New Promotion'}
          </DialogTitle>
          <DialogDescription>
            Set up a promotional discount for your courses.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className='space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='promotionName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Promotion Name</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g., Summer Sale 2024' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='discountCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coupon Code</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g., SUMMER24' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Internal notes or public description.'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='discountType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='PERCENTAGE'>
                          Percentage (%)
                        </SelectItem>
                        <SelectItem value='FIXED_AMOUNT'>
                          Fixed Amount
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='discountValue'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Value</FormLabel>
                    <FormControl>
                      <Input type='number' min='0' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='startDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='endDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='maxUsageLimit'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage Limit (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        placeholder='Leave blank for unlimited'
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='minOrderValue'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Order Value (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        placeholder='e.g., 50'
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='maxDiscountAmount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Discount Amount (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        placeholder='For percentage discounts'
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select status' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='ACTIVE'>Active</SelectItem>
                        <SelectItem value='INACTIVE'>Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className='pt-6'>
              <DialogClose asChild>
                <Button type='button' variant='outline'>
                  Cancel
                </Button>
              </DialogClose>
              <Button type='submit' disabled={isPending}>
                {isPending && (
                  <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                )}
                {isEditing ? 'Save Changes' : 'Create Promotion'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionDialog;
