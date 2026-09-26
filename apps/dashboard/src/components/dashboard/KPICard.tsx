'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function KPICard({ title, value, change, changeLabel, icon, iconColor = 'text-primary-500', trend = 'neutral' }: KPICardProps) {
  const trendIcon = trend === 'up' ? <TrendingUp className="h-4 w-4 text-risk-green-500" /> : 
                    trend === 'down' ? <TrendingDown className="h-4 w-4 text-risk-red-500" /> : 
                    <Minus className="h-4 w-4 text-text-muted" />;
  
  const trendColor = trend === 'up' ? 'text-risk-green-500' : 
                     trend === 'down' ? 'text-risk-red-500' : 
                     'text-text-muted';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-secondary">{title}</p>
            <p className="mt-1 text-3xl font-bold text-text-primary">{value}</p>
            {change !== undefined && (
              <div className="mt-2 flex items-center gap-1">
                <span className={cn('text-sm font-medium', trendColor)}>
                  {trendIcon}
                  {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
                <span className="text-sm text-text-muted">{changeLabel || 'vs last period'}</span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', iconColor)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}