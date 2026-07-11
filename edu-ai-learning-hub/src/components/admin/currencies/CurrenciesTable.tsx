// src/components/admin/currencies/CurrenciesTable.tsx
import React from 'react';
import { Currency } from '@/services/currency.service';
import { Badge } from '@/components/ui/badge';
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
import { useTranslation } from 'react-i18next';

interface CurrenciesTableProps {
  currencies?: Currency[];
  onEdit: (currency: Currency) => void;
  onDelete: (currency: Currency) => void;
  isLoading: boolean;
}

const CurrenciesTable: React.FC<CurrenciesTableProps> = ({
  currencies,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-24'>
              {t('currenciesTable.headers.id', 'ID')}
            </TableHead>
            <TableHead>{t('currenciesTable.headers.name', 'Name')}</TableHead>
            <TableHead>{t('currenciesTable.headers.type', 'Type')}</TableHead>
            <TableHead>
              {t('currenciesTable.headers.decimals', 'Decimals')}
            </TableHead>
            <TableHead className='text-right'>
              {t('currenciesTable.headers.actions', 'Actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className='h-5 w-16' />
              </TableCell>
              <TableCell>
                <Skeleton className='h-5 w-32' />
              </TableCell>
              <TableCell>
                <Skeleton className='h-6 w-20 rounded-full' />
              </TableCell>
              <TableCell>
                <Skeleton className='h-5 w-8' />
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className='w-24 font-semibold'>
            {t('currenciesTable.headers.id', 'ID')}
          </TableHead>
          <TableHead className='font-semibold'>
            {t('currenciesTable.headers.name', 'Name')}
          </TableHead>
          <TableHead className='w-28 font-semibold'>
            {t('currenciesTable.headers.type', 'Type')}
          </TableHead>
          <TableHead className='w-32 font-semibold'>
            {t('currenciesTable.headers.decimals', 'Decimal Places')}
          </TableHead>
          <TableHead className='text-right font-semibold'>
            {t('currenciesTable.headers.actions', 'Actions')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {currencies && currencies.length > 0 ? (
          currencies.map((currency) => (
            <TableRow key={currency.currencyId} className='hover:bg-muted/50'>
              <TableCell className='font-mono text-sm'>
                {currency.currencyId}
              </TableCell>
              <TableCell className='font-medium'>
                {currency.currencyName}
              </TableCell>
              <TableCell>
                <Badge
                  variant={currency.type === 'FIAT' ? 'secondary' : 'default'}
                  className={
                    currency.type === 'FIAT'
                      ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800'
                      : 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800'
                  }
                >
                  {t(
                    `currenciesTable.type.${currency.type.toLowerCase()}`,
                    currency.type
                  )}
                </Badge>
              </TableCell>
              <TableCell>{currency.decimalPlaces}</TableCell>
              <TableCell className='text-right'>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => onEdit(currency)}
                      >
                        <Icons.edit className='h-4 w-4 text-muted-foreground' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {t('currenciesTable.actions.edit', 'Edit Currency')}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => onDelete(currency)}
                      >
                        <Icons.trash className='h-4 w-4 text-destructive' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {t('currenciesTable.actions.delete', 'Delete Currency')}
                      </p>
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
              {t('currenciesTable.noCurrencies', 'No currencies found.')}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default CurrenciesTable;
