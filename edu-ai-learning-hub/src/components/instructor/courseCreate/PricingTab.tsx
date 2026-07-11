// src/components/instructor/courseCreate/PricingTab.tsx
import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Icons } from '@/components/common/Icons';
import { useSettings } from '@/contexts/SettingsContext';
import { CurrencyInfo } from './CurrencyInfo'; // <-- IMPORT COMPONENT MỚI
import { useLatestRate } from '@/hooks/queries/exchangeRate.queries';

const PricingTab: React.FC = () => {
  const form = useFormContext();
  const { currency, formatPrice } = useSettings();
  const { data, isLoading } = useLatestRate('VND', 'USD');
  const originalPriceVND = parseFloat(
    String(form.watch('originalPrice') || '0')
  );
  const discountedPriceVND =
    form.watch('discountedPrice') != null &&
    form.watch('discountedPrice') !== undefined
      ? parseFloat(String(form.watch('discountedPrice')))
      : null;

  // Projection vẫn tính trên giá VND vì đó là giá trị giảng viên nhập
  const displayPriceVND = discountedPriceVND ?? originalPriceVND;
  const platformFee = displayPriceVND * 0.3;
  const finalRevenue = displayPriceVND - platformFee;
  console.log('PricingTab Data:', {
    originalPriceVND,
    discountedPriceVND,
    displayPriceVND,
    platformFee,
    finalRevenue,
    currency,
    data,
  });
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
      <Card>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <CardTitle>Course Pricing</CardTitle>
            <CurrencyInfo /> {/* <-- THÊM COMPONENT VÀO ĐÂY */}
          </div>
          <CardDescription>
            Set the base price for your course in <strong>VND</strong>. It will
            be converted automatically for users.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <FormField
            control={form.control}
            name='originalPrice'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Regular Price (VND)</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>
                      ₫
                    </span>
                    <Input
                      type='number'
                      placeholder='e.g., 999000'
                      className='pl-8'
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='discountedPrice'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discounted Price (VND) (Optional)</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>
                      ₫
                    </span>
                    <Input
                      type='number'
                      placeholder='e.g., 199000'
                      className='pl-8'
                      {...field}
                      value={field.value ?? ''}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Projection (in VND)</CardTitle>
          <CardDescription>
            An estimate of your earnings per sale based on the VND price.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='rounded-md bg-muted p-4 space-y-3'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Sale Price</span>
              <span className='font-medium'>
                {currency === 'USD'
                  ? isLoading
                    ? '...'
                    : data
                      ? formatPrice(displayPriceVND * data.rate)
                      : 'N/A'
                  : `${displayPriceVND.toLocaleString('vi-VN')} ₫`}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Platform Fee (30%)</span>
              <span className='font-medium text-red-500'>
                -{' '}
                {currency === 'USD'
                  ? isLoading
                    ? '...'
                    : data
                      ? formatPrice(platformFee * data.rate)
                      : 'N/A'
                  : `${platformFee.toLocaleString('vi-VN')} ₫`}
              </span>
            </div>
            <div className='pt-2 border-t flex justify-between font-bold'>
              <span className='text-foreground'>Your Revenue</span>
              <span>
                {currency === 'USD'
                  ? isLoading
                    ? '...'
                    : data
                      ? formatPrice(finalRevenue * data.rate)
                      : 'N/A'
                  : `${finalRevenue.toLocaleString('vi-VN')} ₫`}
              </span>
            </div>
          </div>
          <p className='text-xs text-muted-foreground'>
            This is an estimate. Actual earnings may vary.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingTab;
