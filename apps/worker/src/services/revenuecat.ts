import type { Env, RevenueCatSubscriber, RevenueCatRevokeResponse, RevenueCatErrorResponse } from '../types';

const REVENUECAT_API_BASE = 'https://api.revenuecat.com/v1';

/**
 * RevenueCat API Client for Cloudflare Worker
 */
export class RevenueCatClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = REVENUECAT_API_BASE) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({})) as T | RevenueCatErrorResponse;

    if (!response.ok) {
      const error = data as RevenueCatErrorResponse;
      throw new Error(`RevenueCat API Error (${response.status}): ${error.message || 'Unknown error'}`);
    }

    return data as T;
  }

  /**
   * Get subscriber info (for investigation)
   */
  async getSubscriber(appUserId: string): Promise<RevenueCatSubscriber> {
    return this.request<RevenueCatSubscriber>(`/subscribers/${encodeURIComponent(appUserId)}`);
  }

  /**
   * Revoke entitlement for a user
   * POST /v1/subscribers/{app_user_id}/entitlements/{entitlement_id}/revoke
   */
  async revokeEntitlement(appUserId: string, entitlementId: string): Promise<RevenueCatRevokeResponse> {
    return this.request<RevenueCatRevokeResponse>(
      `/subscribers/${encodeURIComponent(appUserId)}/entitlements/${encodeURIComponent(entitlementId)}/revoke`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );
  }

  /**
   * Validate API key by making a test request
   */
  async validateApiKey(): Promise<boolean> {
    try {
      // Try to get a non-existent subscriber - should return 404 if key is valid
      await this.getSubscriber('__validation_test__');
      return true; // If no error thrown, key works
    } catch (error) {
      // 404 is expected for non-existent user, means key is valid
      if (error instanceof Error && error.message.includes('404')) {
        return true;
      }
      // 401/403 means invalid key
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
        return false;
      }
      // Other errors might be network issues
      return false;
    }
  }

  /**
   * Get project apps (for syncing apps during setup)
   * Note: This requires the v2 API or project-level access
   */
  async getProjects(): Promise<any> {
    return this.request('/projects');
  }
}

/**
 * Create RevenueCat client from environment (for Worker)
 */
export function createRevenueCatClient(env: Env, apiKey?: string): RevenueCatClient {
  // In production, apiKey would be decrypted from database
  // For Worker, we might pass it from the dashboard API
  const key = apiKey || env.REVENUECAT_API_KEY || '';
  return new RevenueCatClient(key);
}

/**
 * Decrypt API key for RevenueCat client
 * In production, use Supabase Vault or proper key management
 */
export async function getDecryptedApiKey(
  env: Env,
  developerId: string
): Promise<string | null> {
  // This would integrate with Supabase Vault or encryption
  // For MVP, we'll store the key in the dashboard and pass it to the worker
  // The worker doesn't store API keys long-term
  return null;
}