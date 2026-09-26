'use client';

import { useState, useCallback } from 'react';
import type { NotificationPreferences } from '@/types';

export function useNotifications() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/notifications');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch preferences');
      }
      
      setPreferences(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update preferences');
      }
      
      setPreferences(prev => prev ? { ...prev, ...prefs } : prefs as NotificationPreferences);
      return result;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendTestEmail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/test-notification', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send test email');
      }
      
      return result;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { preferences, loading, error, fetchPreferences, updatePreferences, sendTestEmail };
}