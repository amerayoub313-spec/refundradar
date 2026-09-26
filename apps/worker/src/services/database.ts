import { createClient } from '@supabase/supabase-js';
import { decryptSecret } from '@refundradar/shared';
import type { DatabaseClient, Env, RefundEvent, RiskScore, Alert, EntitlementRevocation, Developer, App, ScoringFactors } from '../types';

/**
 * Create Supabase client with service role key (bypasses RLS)
 */
export function createDatabaseClient(env: Env): DatabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as unknown as DatabaseClient;
}

/**
 * Find app by RevenueCat app_id
 */
export async function findAppByRevenueCatId(
  db: DatabaseClient,
  revenuecatAppId: string
): Promise<App | null> {
  const { data, error } = await db
    .from('apps')
    .select('*')
    .eq('revenuecat_app_id', revenuecatAppId)
    .eq('is_active', true)
    .single();
  
  if (error || !data) return null;
  return data as App;
}

/**
 * Find developer by ID
 */
export async function findDeveloperById(
  db: DatabaseClient,
  developerId: string
): Promise<Developer | null> {
  const { data, error } = await db
    .from('developers')
    .select('*')
    .eq('id', developerId)
    .eq('is_active', true)
    .single();
  
  if (error || !data) return null;
  return data as Developer;
}

/**
 * Get RevenueCat credentials for a developer (decrypts webhook secret)
 */
export async function getRevenueCatCredentials(
  db: DatabaseClient,
  developerId: string,
  env: Env
): Promise<{ api_key: string; webhook_secret: string } | null> {
  const { data, error } = await db
    .from('revenuecat_credentials')
    .select('api_key_encrypted, webhook_secret_encrypted')
    .eq('developer_id', developerId)
    .single();
  
  if (error || !data) return null;
  
  // Decrypt webhook secret for verification
  let webhookSecret: string;
  try {
    webhookSecret = await decryptSecret(data.webhook_secret_encrypted, env.ENCRYPTION_KEY);
  } catch {
    console.error('Failed to decrypt webhook secret', { developer_id: developerId });
    return null;
  }
  
  return {
    api_key: data.api_key_encrypted, // Keep encrypted, only dashboard decrypts
    webhook_secret: webhookSecret,
  };
}

/**
 * Check if refund event already exists (idempotency)
 */
export async function refundEventExists(
  db: DatabaseClient,
  revenuecatEventId: string
): Promise<boolean> {
  const { data, error } = await db
    .from('refund_events')
    .select('id')
    .eq('revenuecat_event_id', revenuecatEventId)
    .single();
  
  return !!data && !error;
}

/**
 * Insert refund event
 */
export async function insertRefundEvent(
  db: DatabaseClient,
  event: Omit<RefundEvent, 'id' | 'created_at'>
): Promise<RefundEvent | null> {
  const { data, error } = await db
    .from('refund_events')
    .insert(event)
    .select()
    .single();
  
  if (error || !data) {
    console.error('Insert refund event error:', error);
    return null;
  }
  
  return data as RefundEvent;
}

/**
 * Insert risk score
 */
export async function insertRiskScore(
  db: DatabaseClient,
  score: Omit<RiskScore, 'id' | 'created_at'>
): Promise<RiskScore | null> {
  const { data, error } = await db
    .from('risk_scores')
    .insert(score)
    .select()
    .single();
  
  if (error || !data) {
    console.error('Insert risk score error:', error);
    return null;
  }
  
  return data as RiskScore;
}

/**
 * Insert alert
 */
export async function insertAlert(
  db: DatabaseClient,
  alert: Omit<Alert, 'id' | 'created_at' | 'updated_at'>
): Promise<Alert | null> {
  const { data, error } = await db
    .from('alerts')
    .insert(alert)
    .select()
    .single();
  
  if (error || !data) {
    console.error('Insert alert error:', error);
    return null;
  }
  
  return data as Alert;
}

/**
 * Get refund count for app_user_id (for frequency scoring)
 */
export async function getRefundCountForUser(
  db: DatabaseClient,
  appId: string,
  appUserId: string,
  excludeEventId?: string
): Promise<number> {
  let query = db
    .from('refund_events')
    .select('id', { count: 'exact', head: true })
    .eq('app_id', appId)
    .eq('app_user_id', appUserId);
  
  if (excludeEventId) {
    query = query.neq('id', excludeEventId);
  }
  
  const { count, error } = await query;
  
  if (error) {
    console.error('Get refund count error:', error);
    return 0;
  }
  
  return count || 0;
}

/**
 * Update alert status
 */
export async function updateAlertStatus(
  db: DatabaseClient,
  alertId: string,
  status: Alert['status'],
  acknowledgedBy?: string
): Promise<Alert | null> {
  const updates: Partial<Alert> = { status, updated_at: new Date().toISOString() };
  
  if (status === 'acknowledged') {
    updates.acknowledged_at = new Date().toISOString();
    updates.acknowledged_by = acknowledgedBy;
  } else if (status === 'dismissed') {
    updates.dismissed_at = new Date().toISOString();
  } else if (status === 'revoked') {
    updates.acknowledged_at = new Date().toISOString();
  }
  
  const { data, error } = await db
    .from('alerts')
    .update(updates)
    .eq('id', alertId)
    .select()
    .single();
  
  if (error || !data) {
    console.error('Update alert status error:', error);
    return null;
  }
  
  return data as Alert;
}

/**
 * Update alert email sent status
 */
export async function updateAlertEmailStatus(
  db: DatabaseClient,
  alertId: string,
  emailSentStatus: Alert['email_sent_status']
): Promise<void> {
  await db
    .from('alerts')
    .update({ email_sent_status: emailSentStatus, updated_at: new Date().toISOString() })
    .eq('id', alertId);
}

/**
 * Insert entitlement revocation record
 */
export async function insertEntitlementRevocation(
  db: DatabaseClient,
  revocation: Omit<EntitlementRevocation, 'id' | 'executed_at'>
): Promise<EntitlementRevocation | null> {
  const { data, error } = await db
    .from('entitlement_revocations')
    .insert(revocation)
    .select()
    .single();
  
  if (error || !data) {
    console.error('Insert entitlement revocation error:', error);
    return null;
  }
  
  return data as EntitlementRevocation;
}

/**
 * Get alert with related data for revocation
 */
export async function getAlertForRevocation(
  db: DatabaseClient,
  alertId: string
): Promise<{
  alert: Alert;
  risk_score: RiskScore;
  refund_event: RefundEvent;
  app: App;
  developer: Developer;
} | null> {
  const { data, error } = await db
    .from('alerts')
    .select(`
      *,
      risk_score:risk_scores!inner(
        *,
        refund_event:refund_events!inner(
          *,
          app:apps!inner(
            *,
            developer:developers!inner(*)
          )
        )
      )
    `)
    .eq('id', alertId)
    .single();
  
  if (error || !data) return null;
  
  return data as any;
}