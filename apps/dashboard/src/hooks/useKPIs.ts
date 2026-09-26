'use client';

import { useState, useEffect, useCallback } from 'react';
import type { KPIMetrics, RefundTrendPoint } from '@/types';

export function useKPIs(appId?: string) {
  const [kpis, setKpis] = useState<KPIMetrics | null>(null);
  const [trends, setTrends] = useState<RefundTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams();
      if (appId) searchParams.set('appId', appId);
      searchParams.set('days', '30');

      const response = await fetch(`/api/analytics?${searchParams.toString()}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }
      
      setKpis(result.data.kpis);
      setTrends(result.data.trends);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { kpis, trends, loading, error, refetch: fetchData };
}