'use client';

import Link from 'next/link';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RiskBadge } from './RiskBadge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { RefundEventWithRelations } from '@/types';

interface RecentAlertsTableProps {
  alerts: RefundEventWithRelations[];
  onViewAll?: () => void;
}

export function RecentAlertsTable({ alerts, onViewAll }: RecentAlertsTableProps) {
  if (!alerts.length) {
    return (
      <div className="card p-6 text-center">
        <p className="text-text-muted">No recent alerts</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between p-4 border-b border-border-default">
        <h3 className="font-semibold text-text-primary">Recent High-Risk Alerts</h3>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All
          </Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>User</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-36">Risk</TableHead>
            <TableHead className="w-36">Time</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.slice(0, 5).map((event) => (
            <TableRow key={event.id} className="cursor-pointer hover:bg-bg-secondary/50" onClick={() => window.location.href = `/alerts/${event.id}`}>
              <TableCell className="p-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/alerts/${event.id}`} className="flex items-center gap-2">
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    {event.risk_score && event.risk_score.risk_level !== 'green' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/alerts/${event.id}?action=revoke`} className="flex items-center gap-2 text-risk-red-500">
                            Revoke Entitlement
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-mono text-sm text-text-primary">{event.app_user_id}</p>
                  <p className="text-xs text-text-muted">{event.store}</p>
                </div>
              </TableCell>
              <TableCell>
                <p className="font-medium text-text-primary">{event.product_id}</p>
              </TableCell>
              <TableCell className="text-right font-mono font-medium text-text-primary">
                {formatCurrency(event.price_usd, event.currency)}
              </TableCell>
              <TableCell>
                {event.risk_score && (
                  <RiskBadge level={event.risk_score.risk_level} score={event.risk_score.total_score} size="sm" />
                )}
              </TableCell>
              <TableCell className="text-text-muted text-sm">
                {formatRelativeTime(event.refunded_at)}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); window.location.href = `/alerts/${event.id}`; }} aria-label="View details">
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}