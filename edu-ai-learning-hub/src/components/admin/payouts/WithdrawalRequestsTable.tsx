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

/* Trạng thái luôn gồm ba phần: biểu tượng, nhãn chữ và màu token.
   Không để riêng màu gánh ý nghĩa. */
const statusConfig: Record<
  string,
  { label: string; className: string; icon: React.ElementType }
> = {
  PENDING: {
    label: 'Chờ duyệt',
    className: 'bg-warning-soft text-warning border-transparent',
    icon: Icons.hourglass,
  },
  APPROVED: {
    label: 'Đã duyệt',
    className: 'bg-muted text-foreground border-transparent',
    icon: Icons.check,
  },
  REJECTED: {
    label: 'Bị từ chối',
    className: 'bg-danger-soft text-danger border-transparent',
    icon: Icons.xCircle,
  },
  PROCESSING: {
    label: 'Đang xử lý',
    className: 'bg-muted text-muted-foreground border-transparent',
    icon: Icons.refresh,
  },
  COMPLETED: {
    label: 'Hoàn tất',
    className: 'bg-success-soft text-success border-transparent',
    icon: Icons.checkCircle,
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-muted text-muted-foreground border-transparent',
    icon: Icons.ban,
  },
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
          <TableHead>Mã yêu cầu</TableHead>
          <TableHead>Giảng viên</TableHead>
          <TableHead>Số tiền</TableHead>
          <TableHead>Phương thức</TableHead>
          <TableHead>Ngày tạo</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead className='text-right'>Thao tác</TableHead>
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
                {(() => {
                  const status = statusConfig[req.status];
                  const StatusIcon = status?.icon ?? Icons.alertCircle;
                  return (
                    <Badge
                      variant='outline'
                      className={`gap-1 ${
                        status?.className ??
                        'bg-muted text-muted-foreground border-transparent'
                      }`}
                    >
                      <StatusIcon className='h-3 w-3' aria-hidden='true' />
                      {status?.label || req.status}
                    </Badge>
                  );
                })()}
              </TableCell>
              <TableCell className='text-right'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onReview(req)}
                >
                  <Icons.eye className='mr-2 h-4 w-4' /> Xem xét
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className='h-24 text-center'>
              Chưa có yêu cầu rút tiền nào.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default WithdrawalRequestsTable;
