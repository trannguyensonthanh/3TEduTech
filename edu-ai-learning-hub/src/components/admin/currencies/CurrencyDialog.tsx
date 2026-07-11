// src/components/admin/currencies/CurrencyDialog.tsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  currencySchema,
  TCurrencySchema,
} from '@/lib/validators/currencyValidator';
import { Currency } from '@/services/currency.service';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Icons } from '@/components/common/Icons';
import { useTranslation } from 'react-i18next';

interface CurrencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: Currency | null;
  onSubmit: (data: TCurrencySchema) => void;
  isEditing: boolean;
  isPending: boolean;
}

const CurrencyDialog: React.FC<CurrencyDialogProps> = ({
  open,
  onOpenChange,
  currency,
  onSubmit,
  isEditing,
  isPending,
}) => {
  const { t } = useTranslation();
  const form = useForm<TCurrencySchema>({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      currencyId: '',
      currencyName: '',
      type: 'FIAT',
      decimalPlaces: 2,
    },
  });

  useEffect(() => {
    if (open && currency) {
      form.reset({
        currencyId: currency.currencyId,
        currencyName: currency.currencyName,
        type: currency.type,
        decimalPlaces: currency.decimalPlaces,
      });
    } else if (open && !currency) {
      form.reset({
        currencyId: '',
        currencyName: '',
        type: 'FIAT',
        decimalPlaces: 2,
      });
    }
  }, [open, currency, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t('currencyDialog.titleEdit', 'Edit Currency')
              : t('currencyDialog.titleAdd', 'Add New Currency')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t(
                  'currencyDialog.descEdit',
                  `Update the details for ${currency?.currencyName}.`,
                  { name: currency?.currencyName }
                )
              : t(
                  'currencyDialog.descAdd',
                  'Add a new currency to the system.'
                )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='currencyId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('currencyDialog.currencyId', 'Currency ID')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'currencyDialog.placeholderId',
                        'e.g. USD, VND, BTC'
                      )}
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
              name='currencyName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('currencyDialog.currencyName', 'Currency Name')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'currencyDialog.placeholderName',
                        'e.g. US Dollar, Bitcoin'
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem className='space-y-3'>
                  <FormLabel>{t('currencyDialog.type', 'Type')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className='flex items-center space-x-4'
                    >
                      <FormItem className='flex items-center space-x-2 space-y-0'>
                        <FormControl>
                          <RadioGroupItem value='FIAT' />
                        </FormControl>
                        <FormLabel className='font-normal cursor-pointer'>
                          {t('currencyDialog.fiat', 'FIAT')}
                        </FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center space-x-2 space-y-0'>
                        <FormControl>
                          <RadioGroupItem value='CRYPTO' />
                        </FormControl>
                        <FormLabel className='font-normal cursor-pointer'>
                          {t('currencyDialog.crypto', 'CRYPTO')}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='decimalPlaces'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('currencyDialog.decimals', 'Decimal Places')}
                  </FormLabel>
                  <FormControl>
                    <Input type='number' min='0' max='18' {...field} />
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
                {t('currencyDialog.cancel', 'Cancel')}
              </Button>
              <Button type='submit' disabled={isPending}>
                {isPending && (
                  <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                )}
                {isEditing
                  ? t('currencyDialog.save', 'Save Changes')
                  : t('currencyDialog.add', 'Add Currency')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CurrencyDialog;
