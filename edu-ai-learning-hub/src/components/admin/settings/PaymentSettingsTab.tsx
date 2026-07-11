// src/components/admin/settings/PaymentSettingsTab.tsx
import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/common/Icons';

const SwitchField = ({ name, label }: { name: string; label: string }) => {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
          <FormLabel className='font-normal'>{label}</FormLabel>
          <Switch checked={field.value} onCheckedChange={field.onChange} />
        </FormItem>
      )}
    />
  );
};

export const PaymentSettingsTab: React.FC = () => {
  const { control } = useFormContext();
  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Financial Settings</CardTitle>
          <CardDescription>
            Manage commission rates and withdrawal limits.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <FormField
            control={control}
            name='PlatformCommissionRate'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform Commission Rate</FormLabel>
                <div className='relative'>
                  <Input type='number' {...field} className='pr-8' />
                  <span className='absolute inset-y-0 right-3 flex items-center text-muted-foreground'>
                    %
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <FormField
              control={control}
              name='MinWithdrawalAmountVND'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min. Withdrawal (VND)</FormLabel>
                  <FormControl>
                    <Input type='number' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name='MinWithdrawalAmountUSD'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min. Withdrawal (USD)</FormLabel>
                  <FormControl>
                    <Input type='number' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Gateways</CardTitle>
          <CardDescription>
            Enable or disable available payment methods for course checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <SwitchField name='EnableVnPay' label='Enable VNPay' />
          <SwitchField name='EnableMoMo' label='Enable MoMo' />
          <SwitchField name='EnableStripe' label='Enable Stripe' />
          <SwitchField name='EnablePayPal' label='Enable PayPal' />
          <SwitchField name='EnableCrypto' label='Enable Crypto' />
        </CardContent>
      </Card>
    </div>
  );
};
