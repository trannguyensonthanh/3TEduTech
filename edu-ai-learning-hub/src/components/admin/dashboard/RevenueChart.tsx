// src/components/admin/dashboard/RevenueChart.tsx
import React from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { MonthlyRevenue } from '@/services/admin.service';
import { useSettings } from '@/contexts/SettingsContext';

interface RevenueChartProps {
  data: MonthlyRevenue[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const { formatPrice } = useSettings();

  return (
    <Card className='col-span-1 lg:col-span-2'>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>
          Your total revenue over the last months.
        </CardDescription>
      </CardHeader>
      <CardContent className='pl-2'>
        <ResponsiveContainer width='100%' height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} />
            <XAxis
              dataKey='month'
              stroke='#888888'
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke='#888888'
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                formatPrice(Number(value) / 1000000) + 'M'
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
              }}
              labelStyle={{ color: 'hsl(var(--card-foreground))' }}
              formatter={(value) => [formatPrice(Number(value)), 'Revenue']}
            />
            <Bar
              dataKey='revenue'
              fill='hsl(var(--primary))'
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
