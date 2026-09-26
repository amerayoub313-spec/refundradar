'use client';

import { useState } from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, Filter, X, ChevronDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface FilterBarProps {
  apps: Array<{ id: string; name: string }>;
  onFiltersChange?: (filters: Record<string, string>) => void;
}

export function FilterBar({ apps, onFiltersChange }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: searchParams.get('start_date') ? new Date(searchParams.get('start_date')!) : undefined,
    to: searchParams.get('end_date') ? new Date(searchParams.get('end_date')!) : undefined,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFilters = [
    searchParams.get('risk_level') && `Risk: ${searchParams.get('risk_level')}`,
    searchParams.get('status') && `Status: ${searchParams.get('status')}`,
    searchParams.get('app_id') && `App: ${apps.find(a => a.id === searchParams.get('app_id'))?.name}`,
    dateRange.from && `From: ${format(dateRange.from, 'MMM d, yyyy')}`,
    dateRange.to && `To: ${format(dateRange.to, 'MMM d, yyyy')}`,
    searchParams.get('search') && `Search: "${searchParams.get('search')}"`,
  ].filter(Boolean);

  const clearAllFilters = () => {
    router.push('/alerts');
  };

  const clearFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.set('page', '1');
    router.push(`/alerts?${params.toString()}`);
  };

  return (
    <div className="card">
      {/* Main Filter Row */}
      <div className="p-4 border-b border-border-default flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Input
            placeholder="Search user ID, product..."
            value={searchParams.get('search') || ''}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) params.set('search', e.target.value);
              else params.delete('search');
              params.set('page', '1');
              router.push(`/alerts?${params.toString()}`);
            }}
            className="pl-9"
          />
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        </div>

        <div className="w-[140px]">
          <Select value={searchParams.get('risk_level') || ''} onValueChange={(v) => {
            const params = new URLSearchParams(searchParams.toString());
            if (v) params.set('risk_level', v);
            else params.delete('risk_level');
            params.set('page', '1');
            router.push(`/alerts?${params.toString()}`);
          }}>
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
          <Select value={searchParams.get('status') || ''} onValueChange={(v) => {
            const params = new URLSearchParams(searchParams.toString());
            if (v) params.set('status', v);
            else params.delete('status');
            params.set('page', '1');
            router.push(`/alerts?${params.toString()}`);
          }}>
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

        {apps.length > 1 && (
          <div className="w-[160px]">
            <Select value={searchParams.get('app_id') || ''} onValueChange={(v) => {
              const params = new URLSearchParams(searchParams.toString());
              if (v) params.set('app_id', v);
              else params.delete('app_id');
              params.set('page', '1');
              router.push(`/alerts?${params.toString()}`);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="All Apps" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Apps</SelectItem>
                {apps.map(app => (
                  <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)} className="gap-2">
          <ChevronDown className={cn('h-4 w-4 transition-transform', showAdvanced && 'rotate-180')} />
          Advanced
        </Button>

        {activeFilters.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1 text-text-muted hover:text-risk-red-500">
            <X className="h-3.5 w-3.5" />
            Clear all
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="p-4 border-b border-border-default animate-slide-down">
          <div className="flex flex-wrap items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 w-[280px] justify-between">
                  <Calendar className="h-4 w-4" />
                  <span>{dateRange.from ? format(dateRange.from, 'MMM d, yyyy') : 'From date'}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                {/* Date picker would go here - simplified for MVP */}
                <div className="p-4 text-center text-text-muted">Date picker component needed</div>
              </PopoverContent>
            </Popover>

            <span className="text-text-muted">to</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 w-[280px] justify-between">
                  <Calendar className="h-4 w-4" />
                  <span>{dateRange.to ? format(dateRange.to, 'MMM d, yyyy') : 'To date'}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4 text-center text-text-muted">Date picker component needed</div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap items-center gap-2">
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {filter}
              <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={() => {
                // Determine which filter to clear based on index
                const keys = ['risk_level', 'status', 'app_id', 'start_date', 'end_date', 'search'];
                clearFilter(keys[index] || '');
              }}>
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}