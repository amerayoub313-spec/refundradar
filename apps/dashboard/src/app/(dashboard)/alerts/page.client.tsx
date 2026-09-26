'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertsTable, FilterBar, EventDetailModal } from '@/components/alerts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AlertsPageClientProps {
  initialData: Awaited<ReturnType<typeof import('@/lib/services/database').getRefundEvents>>['data'];
  initialMeta: Awaited<ReturnType<typeof import('@/lib/services/database').getRefundEvents>>['meta'];
  initialFilters: { riskLevel?: string; status?: string; search?: string; startDate?: string; endDate?: string };
  initialEventId?: string;
}

export function AlertsPageClient({
  initialData,
  initialMeta,
  initialFilters,
  initialEventId,
}: AlertsPageClientProps) {
  const searchParams = useSearchParams();
  const [data, setData] = useState(initialData);
  const [meta, setMeta] = useState(initialMeta);
  const [openEventId, setOpenEventId] = useState<string | null>(initialEventId || null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCloseModal = () => {
    setOpenEventId(null);
    // Update URL to remove eventId
    const params = new URLSearchParams(searchParams.toString());
    params.delete('eventId');
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  const handlePageChange = async (page: number) => {
    setIsLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    window.location.search = params.toString();
    
    try {
      const response = await fetch(`/api/alerts?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setMeta(result.meta);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = async (filters: Record<string, string>) => {
    setIsLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set('page', '1');
    window.location.search = params.toString();
    
    try {
      const response = await fetch(`/api/alerts?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setMeta(result.meta);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (eventId: string) => {
    // Handled by EventDetailModal, but we need to refresh data after
    await handleRefresh();
  };

  const handleDismiss = async (eventId: string) => {
    // Handled by EventDetailModal, but we need to refresh data after
    await handleRefresh();
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/alerts?${searchParams.toString()}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setMeta(result.meta);
      }
    } catch (err) {
      console.error('Failed to refresh alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Refund Alerts</h1>
          <p className="text-text-secondary mt-1">
            Monitor and take action on suspicious refund activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsSidebarOpen(true)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        apps={[]}
        onFiltersChange={handleFilterChange}
      />

      {/* Alerts Table */}
      <AlertsTable
        data={data}
        meta={meta}
        onPageChange={handlePageChange}
        loading={isLoading}
      />

      {/* Event Detail Modal */}
      {openEventId && (
        <EventDetailModal
          eventId={openEventId}
          onClose={handleCloseModal}
          onRefresh={handleRefresh}
        />
      )}

      {/* Mobile Filter Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-bg-primary shadow-xl z-50 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Filters</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <FilterBar
              apps={[]}
              onFiltersChange={handleFilterChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AlertsPageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </div>
      <Card>
        <CardContent className="p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}