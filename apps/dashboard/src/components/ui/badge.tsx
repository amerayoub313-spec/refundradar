import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-bg-tertiary text-text-primary border border-border-default',
        secondary: 'bg-bg-tertiary text-text-secondary border border-border-default',
        destructive: 'bg-risk-red-50 text-risk-red-700 border border-risk-red-200 dark:bg-risk-red-900/20 dark:text-risk-red-400 dark:border-risk-red-800',
        success: 'bg-risk-green-50 text-risk-green-700 border border-risk-green-200 dark:bg-risk-green-900/20 dark:text-risk-green-400 dark:border-risk-green-800',
        warning: 'bg-risk-yellow-50 text-risk-yellow-700 border border-risk-yellow-200 dark:bg-risk-yellow-900/20 dark:text-risk-yellow-400 dark:border-risk-yellow-800',
        outline: 'bg-transparent text-text-secondary border border-border-default',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };