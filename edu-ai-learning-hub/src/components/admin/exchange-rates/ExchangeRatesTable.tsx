// src/components/admin/exchange-rates/ExchangeRatesTable.tsx
import React from 'react';
import { ExchangeRate } from '@/services/exchangeRate.service';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Icons } from '@/components/common/Icons';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface ExchangeRatesTableProps {
  exchangeRates?: ExchangeRate[];
  onEdit: (rate: ExchangeRate) => void;
  onDelete: (rate: ExchangeRate) => void;
  isLoading: boolean;
}

const formatRate = (rate: number) => {
  // Hiển thị nhiều chữ số thập phân cho các tỷ giá nhỏ
  if (rate < 0.001) {
    return rate.toPrecision(6);
  }
  return rate.toLocaleString(undefined, { maximumFractionDigits: 4 });
};

const ExchangeRatesTable: React.FC<ExchangeRatesTableProps> = ({
  exchangeRates,
  onEdit,
  onDelete,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>From → To</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead className='hidden md:table-cell'>
              Effective From
            </TableHead>
            <TableHead className='hidden lg:table-cell'>Source</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className='h-5 w-24' />
              </TableCell>
              <TableCell>
                <Skeleton className='h-5 w-20' />
              </TableCell>
              <TableCell className='hidden md:table-cell'>
                <Skeleton className='h-5 w-32' />
              </TableCell>
              <TableCell className='hidden lg:table-cell'>
                <Skeleton className='h-5 w-28' />
              </TableCell>
              <TableCell className='text-right space-x-2'>
                <Skeleton className='h-8 w-8 inline-block' />
                <Skeleton className='h-8 w-8 inline-block' />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className='border rounded-md'>
      <Table>
        <TableHeader>
          <TableRow className='bg-muted/50'>
            <TableHead className='font-semibold'>From → To</TableHead>
            <TableHead className='font-semibold'>Rate</TableHead>
            <TableHead className='font-semibold hidden md:table-cell'>
              Effective From
            </TableHead>
            <TableHead className='font-semibold hidden lg:table-cell'>
              Source
            </TableHead>
            <TableHead className='text-right font-semibold'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exchangeRates && exchangeRates.length > 0 ? (
            exchangeRates.map((rate) => (
              <TableRow key={rate.rateId} className='hover:bg-muted/50'>
                <TableCell className='font-medium'>
                  <span className='font-mono text-primary'>
                    {rate.fromCurrencyId}
                  </span>
                  <Icons.arrowRight className='inline-block mx-2 h-4 w-4 text-muted-foreground' />
                  <span className='font-mono text-primary'>
                    {rate.toCurrencyId}
                  </span>
                </TableCell>
                <TableCell className='font-mono'>
                  {formatRate(rate.rate)}
                </TableCell>
                <TableCell className='hidden md:table-cell'>
                  {format(
                    new Date(rate.effectiveTimestamp),
                    'dd MMM, yyyy HH:mm'
                  )}
                </TableCell>
                <TableCell className='text-muted-foreground hidden lg:table-cell'>
                  {rate.source || '—'}
                </TableCell>
                <TableCell className='text-right'>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => onEdit(rate)}
                        >
                          <Icons.edit className='h-4 w-4 text-muted-foreground' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit Rate</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => onDelete(rate)}
                        >
                          <Icons.trash className='h-4 w-4 text-destructive' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Rate</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
                className='h-32 text-center text-muted-foreground'
              >
                No exchange rates found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExchangeRatesTable;
