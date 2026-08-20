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
import {
  axisProps,
  barRadius,
  gridProps,
  seriesColor,
  tooltipProps,
} from '@/lib/chart-theme';

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
            {/* Trục, lưới và hộp chú giải lấy từ chart-theme: trước đây trục
                dùng mã xám cứng nên chữ trục biến mất ở chế độ tối. */}
            <CartesianGrid {...gridProps} />
            <XAxis dataKey='month' {...axisProps} />
            <YAxis
              {...axisProps}
              tickFormatter={(value) =>
                formatPrice(Number(value) / 1000000) + 'M'
              }
            />
            <Tooltip
              {...tooltipProps}
              formatter={(value) => [formatPrice(Number(value)), 'Revenue']}
            />
            {/* Một chuỗi duy nhất -> khe màu thứ nhất, không cần chú giải. */}
            <Bar dataKey='revenue' fill={seriesColor(0)} radius={barRadius} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
