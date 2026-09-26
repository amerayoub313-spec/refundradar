'use client';

import { useState, useCallback } from 'react';
import type { RevenueCatConnectionStatus } from '@/types';

export function useRevenueCat() {
  const [status, setStatus] = useState<RevenueCatConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/revenuecat');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch RevenueCat status');
      }
      
      setStatus(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const validateAndSave = useCallback(async (apiKey: string, webhookSecret: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/revenuecat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, webhook_secret: webhookSecret }),
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save credentials');
      }
      
      setStatus(result.data);
      return result.data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const validateKey = useCallback(async (apiKey: string) => {
    try {
      const response = await fetch('/api/revenuecat/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey }),
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to validate key');
      }
      
      return result.data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    }
  }, []);

  return { status, loading, error, fetchStatus, validateAndSave, validateKey };
}