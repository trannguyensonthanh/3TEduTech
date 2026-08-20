// src/components/admin/promotions/PromotionsTable.tsx
import React from 'react';
import { Promotion } from '@/services/promotion.service';
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
import { Progress } from '@/components/ui/progress';
import { Icons } from '@/components/common/Icons';
import { format } from 'date-fns';
import { useSettings } from '@/contexts/SettingsContext';

interface PromotionsTableProps {
  promotions: Promotion[];
  onEdit: (promotion: Promotion) => void;
  onDeactivate: (promotion: Promotion) => void;
  onDelete: (promotion: Promotion) => void;
}

/* Trạng thái luôn gồm biểu tượng, nhãn chữ và màu token — màu không đứng
   một mình gánh ý nghĩa. */
const statusConfig: Record<
  string,
  { label: string; className: string; icon: React.ElementType }
> = {
  ACTIVE: {
    label: 'Đang chạy',
    className: 'bg-success-soft text-success border-transparent',
    icon: Icons.checkCircle,
  },
  INACTIVE: {
    label: 'Tạm dừng',
    className: 'bg-muted text-muted-foreground border-transparent',
    icon: Icons.ban,
  },
  EXPIRED: {
    label: 'Hết hạn',
    className: 'bg-danger-soft text-danger border-transparent',
    icon: Icons.xCircle,
  },
};

const PromotionsTable: React.FC<PromotionsTableProps> = ({
  promotions,
  onEdit,
  onDeactivate,
  onDelete,
}) => {
  const { formatPrice } = useSettings();
  console.log('PromotionsTable rendered with promotions:', promotions);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className='min-w-[200px]'>Tên khuyến mãi</TableHead>
          <TableHead>Mã</TableHead>
          <TableHead>Mức giảm</TableHead>
          <TableHead>Thời gian áp dụng</TableHead>
          <TableHead>Lượt dùng</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead className='text-right'>Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {promotions.length > 0 ? (
          promotions.map((p) => {
            const config = statusConfig[p.status] || statusConfig.INACTIVE;
            const StatusIcon = config.icon;
            const usagePercentage =
              p.maxUsageLimit && p.maxUsageLimit > 0
                ? (p.usageCount / p.maxUsageLimit) * 100
                : 0;
            return (
              <TableRow key={p.promotionId}>
                <TableCell className='font-medium'>{p.promotionName}</TableCell>
                <TableCell>
                  <Badge variant='secondary' className='font-mono'>
                    {p.discountCode}
                  </Badge>
                </TableCell>
                <TableCell>
                  {p.discountType === 'PERCENTAGE'
                    ? `${p.discountValue}%`
                    : formatPrice(p.discountValue)}
                </TableCell>
                <TableCell className='text-xs'>
                  {p?.startDate && !isNaN(new Date(p.startDate).getTime())
                    ? format(new Date(p.startDate), 'MMM dd, yyyy')
                    : 'N/A'}{' '}
                  - <br />
                  {p?.endDate && !isNaN(new Date(p.endDate).getTime())
                    ? format(new Date(p.endDate), 'MMM dd, yyyy')
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  <div className='flex flex-col gap-1'>
                    <span className='text-sm'>
                      {p.usageCount} / {p.maxUsageLimit || '∞'}
                    </span>
                    {p.maxUsageLimit && p.maxUsageLimit > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Progress
                              value={usagePercentage}
                              className='h-1.5 w-24'
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Đã dùng {usagePercentage.toFixed(0)}%</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant='outline'
                    className={`gap-1 ${config.className}`}
                  >
                    <StatusIcon className='h-3 w-3' aria-hidden='true' />
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell className='text-right'>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => onEdit(p)}
                        >
                          <Icons.edit className='h-4 w-4 text-muted-foreground' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Sửa khuyến mãi</p>
                      </TooltipContent>
                    </Tooltip>

                    {p.status === 'ACTIVE' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => onDeactivate(p)}
                          >
                            <Icons.rectangleHorizontal className='h-4 w-4 text-muted-foreground' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Tạm dừng khuyến mãi</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => onDelete(p)}
                        >
                          <Icons.trash className='h-4 w-4 text-destructive' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Xóa khuyến mãi</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell
              colSpan={7}
              className='h-32 text-center text-muted-foreground'
            >
              Không có khuyến mãi nào khớp bộ lọc hiện tại.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default PromotionsTable;
