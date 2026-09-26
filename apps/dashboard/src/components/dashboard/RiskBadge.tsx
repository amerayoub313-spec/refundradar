'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';

interface RiskBadgeProps {
  level: 'green' | 'yellow' | 'red';
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const riskStyles = {
  green: 'bg-risk-green-50 text-risk-green-700 border-risk-green-200 dark:bg-risk-green-900/20 dark:text-risk-green-400 dark:border-risk-green-800',
  yellow: 'bg-risk-yellow-50 text-risk-yellow-700 border-risk-yellow-200 dark:bg-risk-yellow-900/20 dark:text-risk-yellow-400 dark:border-risk-yellow-800',
  red: 'bg-risk-red-50 text-risk-red-700 border-risk-red-200 dark:bg-risk-red-900/20 dark:text-risk-red-400 dark:border-risk-red-800',
};

const riskLabels = {
  green: 'Low Risk',
  yellow: 'Medium Risk',
  red: 'High Risk',
};

const dotColors = {
  green: 'bg-risk-green-500',
  yellow: 'bg-risk-yellow-500',
  red: 'bg-risk-red-500',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
};

export function RiskBadge({ level, score, showScore = true, size = 'md' }: RiskBadgeProps) {
  const dotColor = dotColors[level];
  const label = riskLabels[level];
  const badgeStyle = riskStyles[level];
  const sizeClass = sizeClasses[size];

  return (
    <Badge variant="outline" className={cn(badgeStyle, sizeClass)}>
      <Circle className={cn(dotColor, 'h-1.5 w-1.5')} />
      <span className="font-medium">{label}</span>
      {showScore && score !== undefined && (
        <span className="font-mono font-semibold">{score}</span>
      )}
    </Badge>
  );
}