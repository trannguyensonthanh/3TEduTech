// src/components/admin/exchange-rates/ExchangeRateDialog.tsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  exchangeRateSchema,
  TExchangeRateSchema,
} from '@/lib/validators/exchangeRateValidator';
import { ExchangeRate } from '@/services/exchangeRate.service';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icons } from '@/components/common/Icons';
import { format } from 'date-fns';
import { useFetchExternalRate } from '@/hooks/queries/exchangeRate.queries';
import { toast } from 'sonner';

interface ExchangeRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exchangeRate: ExchangeRate | null;
  onSubmit: (data: TExchangeRateSchema) => void;
  isEditing: boolean;
  isPending: boolean;
  currencies: Currency[];
}

const ExchangeRateDialog: React.FC<ExchangeRateDialogProps> = ({
  open,
  onOpenChange,
  exchangeRate,
  onSubmit,
  isEditing,
  isPending,
  currencies,
}) => {
  const form = useForm<TExchangeRateSchema>({
    resolver: zodResolver(exchangeRateSchema),
    defaultValues: {
      fromCurrencyId: '',
      toCurrencyId: '',
      rate: 0,
      effectiveTimestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      source: '',
    },
  });

  const { mutate: fetchRate, isPending: isFetchingRate } =
    useFetchExternalRate();
  const fromCurrencyId = form.watch('fromCurrencyId');
  const toCurrencyId = form.watch('toCurrencyId');

  useEffect(() => {
    if (open) {
      if (exchangeRate) {
        form.reset({
          fromCurrencyId: exchangeRate.fromCurrencyId,
          toCurrencyId: exchangeRate.toCurrencyId,
          rate: exchangeRate.rate,
          effectiveTimestamp: format(
            new Date(exchangeRate.effectiveTimestamp),
            "yyyy-MM-dd'T'HH:mm"
          ),
          source: exchangeRate.source || '',
        });
      } else {
        form.reset({
          fromCurrencyId: 'USD', // Mặc định là USD
          toCurrencyId: 'VND', // Mặc định là VND
          rate: 0,
          effectiveTimestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          source: '',
        });
      }
    }
  }, [open, exchangeRate, form]);

  const handleFetchRate = () => {
    if (fromCurrencyId && toCurrencyId) {
      fetchRate(
        { from: fromCurrencyId, to: toCurrencyId },
        {
          onSuccess: (data) => {
            form.setValue('rate', data.rate, { shouldValidate: true });
            form.setValue('source', data.source, { shouldValidate: true });
            toast.success(
              `Fetched rate for ${fromCurrencyId} → ${toCurrencyId}: ${data.rate}`
            );
          },
          onError: (error) => {
            toast.error(error.message || 'Failed to fetch rate.');
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Exchange Rate' : 'Add New Exchange Rate'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update the rate from ${exchangeRate?.fromCurrencyId} to ${exchangeRate?.toCurrencyId}.`
              : 'Define a new currency conversion rate.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4 pt-4'
          >
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='fromCurrencyId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Currency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select a currency' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.currencyId} value={c.currencyId}>
                            {c.currencyName} ({c.currencyId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='toCurrencyId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Currency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select a currency' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem
                            key={c.currencyId}
                            value={c.currencyId}
                            disabled={c.currencyId === fromCurrencyId}
                          >
                            {c.currencyName} ({c.currencyId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='rate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exchange Rate</FormLabel>
                  <div className='flex items-center gap-2'>
                    <FormControl>
                      <Input
                        type='number'
                        step='any'
                        placeholder='e.g., 25450.5'
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={handleFetchRate}
                      disabled={
                        isFetchingRate || !fromCurrencyId || !toCurrencyId
                      }
                    >
                      {isFetchingRate ? (
                        <Icons.spinner className='h-4 w-4 animate-spin' />
                      ) : (
                        <Icons.wand className='h-4 w-4' />
                      )}
                      <span className='ml-2 hidden sm:inline'>Fetch Rate</span>
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='effectiveTimestamp'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective From</FormLabel>
                  <FormControl>
                    <Input type='datetime-local' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='source'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g., Vietcombank, CoinMarketCap'
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className='pt-4'>
              <DialogClose asChild>
                <Button type='button' variant='outline'>
                  Cancel
                </Button>
              </DialogClose>
              <Button type='submit' disabled={isPending || isFetchingRate}>
                {isPending && (
                  <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                )}
                {isEditing ? 'Save Changes' : 'Add Rate'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ExchangeRateDialog;
