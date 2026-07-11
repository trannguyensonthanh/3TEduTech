// src/components/admin/payouts/WithdrawalRequestsTable.tsx
import React from 'react';
import { WithdrawalRequest } from '@/services/financials.service';
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

interface WithdrawalRequestsTableProps {
  requests: WithdrawalRequest[];
  onReview: (request: WithdrawalRequest) => void;
}

const statusConfig = {
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: 'Approved', className: 'bg-blue-100 text-blue-800' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
  PROCESSING: {
    label: 'Processing',
    className: 'bg-purple-100 text-purple-800',
  },
  COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
};

const WithdrawalRequestsTable: React.FC<WithdrawalRequestsTableProps> = ({
  requests,
  onReview,
}) => {
  const { formatPrice } = useSettings();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Request ID</TableHead>
          <TableHead>Instructor</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className='text-right'>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.length > 0 ? (
          requests.map((req) => (
            <TableRow key={req.requestId}>
              <TableCell className='font-mono text-xs'>
                {req.requestId}
              </TableCell>
              <TableCell className='font-medium'>
                {req.instructorName}
              </TableCell>
              <TableCell className='font-semibold'>
                {formatPrice(req.requestedAmount)} {req.requestedCurrencyId}
              </TableCell>
              <TableCell>{req.paymentMethodId}</TableCell>
              <TableCell>
                {format(new Date(req.createdAt), 'dd MMM yyyy')}
              </TableCell>
              <TableCell>
                <Badge className={statusConfig[req.status]?.className}>
                  {statusConfig[req.status]?.label || req.status}
                </Badge>
              </TableCell>
              <TableCell className='text-right'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onReview(req)}
                >
                  <Icons.eye className='mr-2 h-4 w-4' /> Review
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className='h-24 text-center'>
              No pending requests found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default WithdrawalRequestsTable;
