'use client';

import { useState, useEffect, useCallback } from 'react';
import type { EventDetailResponse } from '@/types';

export function useEventDetail(eventId: string | null) {
  const [data, setData] = useState<EventDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!eventId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/alerts/${eventId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch event detail');
      }
      
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { data, loading, error, refetch: fetchDetail };
}