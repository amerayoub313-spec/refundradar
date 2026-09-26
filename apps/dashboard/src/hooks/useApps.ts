'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DashboardApp } from '@/types';

export function useApps() {
  const [apps, setApps] = useState<DashboardApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/apps');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch apps');
      }
      
      setApps(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  return { apps, loading, error, refetch: fetchApps };
}