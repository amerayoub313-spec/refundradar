'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RevokeEntitlementRequest, RevokeEntitlementResponse } from '@/types';

export function useRevoke() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revoke = useCallback(async (alertId: string, request: RevokeEntitlementRequest): Promise<RevokeEntitlementResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the current Supabase session for authentication
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required. Please sign in again.');
      }
      
      // For revocation, we call the Worker directly since it has the RevenueCat API key
      const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || 'https://ingest.refundradar.io';
      
      const response = await fetch(`${workerUrl}/api/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          alert_id: alertId,
          ...request,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to revoke entitlement');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { revoke, loading, error };
}