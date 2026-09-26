'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RefundTrendPoint } from '@/types';

interface TrendsChartProps {
  data: RefundTrendPoint[];
  title?: string;
  height?: number;
}

export function TrendsChart({ data, title = 'Refund Trends', height = 300 }: TrendsChartProps) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-text-muted">No data available for the selected period</p>
        </CardContent>
      </Card>
    );
  }

  const COLORS = {
    total: '#0F62FE',
    highRisk: '#DA1E28',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-primary border border-border-default rounded-lg shadow-lg p-3 min-w-[180px]">
          <p className="font-medium text-text-primary mb-2">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-text-secondary">{entry.name}:</span>
              <span className="font-medium text-text-primary">
                {entry.name === 'Revenue Saved' 
                  ? '$' + entry.value.toLocaleString() 
                  : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#8C8C8C' }} />
              <YAxis 
                type="category" 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#8C8C8C' }}
                tickFormatter={formatDate}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="total_refunds" name="Total Refunds" fill={COLORS.total} radius={[0, 4, 4, 0]}>
                {data.map((_, index) => <Cell key={`total-${index}`} fill={COLORS.total} />)}
              </Bar>
              <Bar dataKey="high_risk" name="High Risk" fill={COLORS.highRisk} radius={[0, 4, 4, 0]}>
                {data.map((_, index) => <Cell key={`high-${index}`} fill={COLORS.highRisk} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}