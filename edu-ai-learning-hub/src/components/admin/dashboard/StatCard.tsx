// src/components/admin/dashboard/StatCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-6 w-6 rounded-full' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-8 w-32 mt-1' />
          <Skeleton className='h-3 w-40 mt-2' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <div className='text-muted-foreground'>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        {description && (
          <p className='text-xs text-muted-foreground'>{description}</p>
        )}
      </CardContent>
    </Card>
  );
};
