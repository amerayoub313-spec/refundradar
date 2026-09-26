import { useState, useMemo } from 'react';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RiskBadge } from '@/components/dashboard/RiskBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, Filter, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { RefundEventWithRelations, PaginatedResponse } from '@/types';

interface AlertsTableProps {
  data: RefundEventWithRelations[];
  meta?: PaginatedResponse<RefundEventWithRelations>['meta'];
  onPageChange?: (page: number) => void;
  onFilterChange?: (filters: Record<string, string>) => void;
  loading?: boolean;
}

export function AlertsTable({ data, meta, onPageChange, onFilterChange, loading }: AlertsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    riskLevel: searchParams.get('risk_level') || '',
    status: searchParams.get('status') || '',
    search: searchParams.get('search') || '',
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    router.push(`/alerts?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('search', value);
    else params.delete('search');
    params.set('page', '1');
    router.push(`/alerts?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 animate-pulse bg-border-default rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="card p-12 text-center">
        <Filter className="h-12 w-12 mx-auto text-text-muted mb-4" />
        <h3 className="text-lg font-medium text-text-primary mb-2">No alerts found</h3>
        <p className="text-text-muted">Try adjusting your filters or search criteria</p>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Filter Bar */}
      <div className="border-b border-border-default p-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Input
            placeholder="Search user ID, product..."
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        </div>

        <div className="w-[140px]">
          <Select value={filters.riskLevel} onValueChange={(v) => handleFilterChange('risk_level', v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Risk</SelectItem>
              <SelectItem value="red">🔴 High Risk</SelectItem>
              <SelectItem value="yellow">🟡 Medium Risk</SelectItem>
              <SelectItem value="green">🟢 Low Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[140px]">
          <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Store</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-36">Risk Score</TableHead>
              <TableHead className="w-36">Status</TableHead>
              <TableHead className="w-36">Refunded</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((event) => (
              <TableRow key={event.id} className="cursor-pointer hover:bg-bg-secondary/50" onClick={() => window.location.href = `/alerts/${event.id}`}>
                <TableCell className="p-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/alerts/${event.id}`} className="flex items-center gap-2">View Details</Link>
                      </DropdownMenuItem>
                      {event.risk_score && event.risk_score.risk_level !== 'green' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/alerts/${event.id}?action=revoke`} className="flex items-center gap-2 text-risk-red-500">Revoke Entitlement</Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/alerts/${event.id}?action=dismiss`} className="flex items-center gap-2">Dismiss Alert</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-mono text-sm text-text-primary">{event.app_user_id}</p>
                    {event.alert && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {event.alert.status}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-text-primary">{event.product_id}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs capitalize">{event.store.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono font-medium text-text-primary">
                  {formatCurrency(event.price_usd, event.currency)}
                </TableCell>
                <TableCell>
                  {event.risk_score && (
                    <RiskBadge level={event.risk_score.risk_level} score={event.risk_score.total_score} />
                  )}
                </TableCell>
                <TableCell>
                  {event.alert ? (
                    <Badge variant={event.alert.status === 'revoked' ? 'destructive' : event.alert.status === 'dismissed' ? 'secondary' : 'outline'} className="capitalize">
                      {event.alert.status}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-text-muted">No Alert</Badge>
                  )}
                </TableCell>
                <TableCell className="text-text-muted text-sm">
                  {formatRelativeTime(event.refunded_at)}
                </TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); window.location.href = `/alerts/${event.id}`; }} aria-label="View details">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-border-default">
          <div className="text-sm text-text-muted">
            Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} results
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(meta.page - 1)} disabled={meta.page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-text-secondary px-2">
              Page {meta.page} of {meta.totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(meta.page + 1)} disabled={meta.page >= meta.totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}