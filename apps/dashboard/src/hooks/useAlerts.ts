'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RefundEventWithRelations, PaginatedResponse } from '@/types';
import { PaginationQuery } from '@refundradar/shared';

interface UseAlertsParams extends Partial<PaginationQuery> {
  appId?: string;
}

export function useAlerts(params: UseAlertsParams = {}) {
  const [data, setData] = useState<PaginatedResponse<RefundEventWithRelations> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.set(key, String(value));
        }
      });

      const response = await fetch(`/api/alerts?${searchParams.toString()}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch alerts');
      }
      
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return { 
    data: data?.data || [], 
    meta: data?.meta, 
    loading, 
    error, 
    refetch: fetchAlerts 
  };
}