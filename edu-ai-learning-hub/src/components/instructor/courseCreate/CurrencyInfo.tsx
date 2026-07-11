// src/components/instructor/courseCreate/CurrencyInfo.tsx
import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import { useLatestRate } from '@/hooks/queries/exchangeRate.queries';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export const CurrencyInfo = () => {
  const { data, isLoading } = useLatestRate('VND', 'USD');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='sm' className='text-muted-foreground'>
          <Icons.info className='h-4 w-4 mr-2' />
          Pricing Info
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80'>
        <div className='space-y-4'>
          <h4 className='font-medium leading-none'>Pricing & Currency</h4>
          <p className='text-sm text-muted-foreground'>
            All prices are entered in <strong>VND</strong> as the base currency.
            Prices will be automatically converted to <strong>USD</strong> for
            international customers based on the latest exchange rate.
          </p>
          <div className='p-2 bg-muted rounded-md text-sm'>
            {isLoading ? (
              <div className='space-y-2'>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-4 w-1/2' />
              </div>
            ) : data ? (
              <div>
                <p>
                  <strong>Current Rate:</strong>
                </p>
                <p className='font-mono'>
                  1 USD ≈{' '}
                  {(1 / data.rate).toLocaleString('en-US', {
                    maximumFractionDigits: 0,
                  })}{' '}
                  VND
                </p>
                <p className='text-xs text-muted-foreground mt-1'>
                  Source: {data.source} (Updated:{' '}
                  {format(new Date(data.lastUpdated), 'dd MMM, HH:mm')})
                </p>
              </div>
            ) : (
              <p className='text-destructive'>Could not load exchange rate.</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
