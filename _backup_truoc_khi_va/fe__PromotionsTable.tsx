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

const statusConfig = {
  ACTIVE: {
    label: 'Active',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200',
  },
  INACTIVE: {
    label: 'Inactive',
    className:
      'bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-300 border-gray-200',
  },
  EXPIRED: {
    label: 'Expired',
    className:
      'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200',
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
          <TableHead className='min-w-[200px]'>Promotion Name</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Discount</TableHead>
          <TableHead>Period</TableHead>
          <TableHead>Usage</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className='text-right'>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {promotions.length > 0 ? (
          promotions.map((p) => {
            const config = statusConfig[p.status] || statusConfig.INACTIVE;
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
                            <p>{usagePercentage.toFixed(0)}% used</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant='outline' className={config.className}>
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
                        <p>Edit Promotion</p>
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
                            <Icons.rectangleHorizontal className='h-4 w-4 text-amber-600' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Deactivate Promotion</p>
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
                        <p>Delete Promotion</p>
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
              No promotions found for the current filters.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default PromotionsTable;
