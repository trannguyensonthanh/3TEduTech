// src/components/admin/payouts/PayoutsTable.tsx
import React from 'react';
import { Payout } from '@/services/financials.service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/common/Icons';
import { format } from 'date-fns';
import { useSettings } from '@/contexts/SettingsContext';

interface PayoutsTableProps {
  payouts: Payout[];
  onProcess: (payout: Payout) => void;
}

const statusConfig = {
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  PROCESSING: { label: 'Processing', className: 'bg-blue-100 text-blue-800' },
  PAID: { label: 'Paid', className: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Failed', className: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
};

const PayoutsTable: React.FC<PayoutsTableProps> = ({ payouts, onProcess }) => {
  const { formatPrice } = useSettings();
  console.log('PayoutsTable rendered with payouts:', payouts);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Payout ID</TableHead>
          <TableHead>Instructor</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className='text-right'>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payouts.length > 0 ? (
          payouts.map((payout) => (
            <TableRow key={payout.payoutId}>
              <TableCell className='font-mono text-xs'>
                {payout.payoutId}
              </TableCell>
              <TableCell className='font-medium'>
                {payout.instructorName}
              </TableCell>
              <TableCell className='font-semibold'>
                {formatPrice(payout.amount)} {payout.currencyId}
              </TableCell>
              <TableCell>{payout.paymentMethodId}</TableCell>
              <TableCell>
                {format(new Date(payout.requestedAt), 'dd MMM yyyy')}
              </TableCell>
              <TableCell>
                <Badge
                  className={statusConfig[payout.payoutStatusId]?.className}
                >
                  {statusConfig[payout.payoutStatusId]?.label ||
                    payout.payoutStatusId}
                </Badge>
              </TableCell>
              <TableCell className='text-right'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onProcess(payout)}
                >
                  {payout.payoutStatusId === 'PENDING' ||
                  payout.payoutStatusId === 'PROCESSING'
                    ? 'Process'
                    : 'View'}
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className='h-24 text-center'>
              No payouts found for this status.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default PayoutsTable;
