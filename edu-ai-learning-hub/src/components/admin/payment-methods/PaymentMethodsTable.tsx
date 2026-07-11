// src/components/admin/payment-methods/PaymentMethodsTable.tsx
import React from 'react';
import { PaymentMethod } from '@/services/paymentMethod.service';
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

interface PaymentMethodsTableProps {
  paymentMethods?: PaymentMethod[];
  onEdit: (paymentMethod: PaymentMethod) => void;
  onDelete: (paymentMethod: PaymentMethod) => void;
  isLoading: boolean;
}

const PaymentMethodsTable: React.FC<PaymentMethodsTableProps> = ({
  paymentMethods,
  onEdit,
  onDelete,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-40'>Method ID</TableHead>
            <TableHead>Method Name</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className='h-6 w-24 rounded-md' />
              </TableCell>
              <TableCell>
                <Skeleton className='h-5 w-40' />
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
            <TableHead className='w-40 font-semibold'>Method ID</TableHead>
            <TableHead className='font-semibold'>Method Name</TableHead>
            <TableHead className='font-semibold hidden md:table-cell'>
              Description
            </TableHead>
            <TableHead className='text-right font-semibold'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paymentMethods && paymentMethods.length > 0 ? (
            paymentMethods.map((method) => (
              <TableRow key={method.methodId} className='hover:bg-muted/50'>
                <TableCell className='font-mono text-sm'>
                  <Badge variant='outline'>{method.methodId}</Badge>
                </TableCell>
                <TableCell className='font-medium'>
                  {method.methodName}
                </TableCell>
                <TableCell
                  className='text-muted-foreground hidden md:table-cell truncate max-w-xs'
                  title={method.description || ''}
                >
                  {method.description || '—'}
                </TableCell>
                <TableCell className='text-right'>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => onEdit(method)}
                        >
                          <Icons.edit className='h-4 w-4 text-muted-foreground' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit Method</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => onDelete(method)}
                        >
                          <Icons.trash className='h-4 w-4 text-destructive' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Method</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={4}
                className='h-32 text-center text-muted-foreground'
              >
                No payment methods found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PaymentMethodsTable;
