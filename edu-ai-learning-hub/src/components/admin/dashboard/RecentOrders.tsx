// src/components/admin/dashboard/RecentOrders.tsx
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { RecentOrder } from '@/services/admin.service';
import { formatDistanceToNow } from 'date-fns';
import { useSettings } from '@/contexts/SettingsContext';

interface RecentOrdersProps {
  orders: RecentOrder[];
}

export const RecentOrders: React.FC<RecentOrdersProps> = ({ orders }) => {
  const { formatPrice } = useSettings();

  return (
    <Card className='col-span-1 lg:col-span-1'>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
        <CardDescription>
          You made {orders.length} sales recently.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {orders.map((order) => (
          <div key={order.orderId} className='flex items-center gap-4'>
            <Avatar className='h-9 w-9'>
              <AvatarImage
                src={order.userAvatarUrl || undefined}
                alt={order.userFullName}
              />
              <AvatarFallback>
                {order.userFullName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className='flex-1 text-sm'>
              <p className='font-medium leading-none'>{order.userFullName}</p>
              <p
                className='text-xs text-muted-foreground truncate'
                title={order.courseName}
              >
                Enrolled in "{order.courseName}"
              </p>
            </div>
            <div className='text-right'>
              <p className='font-semibold text-sm'>
                {formatPrice(order.amount)}
              </p>
              <p className='text-xs text-muted-foreground'>
                {formatDistanceToNow(new Date(order.orderDate), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
