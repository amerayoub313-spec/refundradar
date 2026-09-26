import { createClient } from '@/lib/supabase/server';
import { encryptSecret, decryptSecret } from '@refundradar/shared';
import type { 
  DashboardApp, 
  RefundEventWithRelations, 
  KPIMetrics, 
  RefundTrendPoint,
  EventDetailResponse,
  RevenueCatConnectionStatus,
  NotificationPreferences,
  ApiResponse,
  PaginatedResponse
} from '@/types';

/**
 * Get all apps for current developer
 */
export async function getApps(): Promise<DashboardApp[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('apps')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as DashboardApp[];
}

/**
 * Get single app by ID
 */
export async function getApp(appId: string): Promise<DashboardApp | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('apps')
    .select('*')
    .eq('id', appId)
    .single();
  
  if (error) return null;
  return data as DashboardApp;
}

/**
 * Get KPI metrics for dashboard
 */
export async function getKPIMetrics(appId?: string): Promise<KPIMetrics> {
  const supabase = await createClient();
  
  let refundEventsQuery = supabase.from('refund_events').select('id, price_usd', { count: 'exact' });
  let riskScoresQuery = supabase.from('risk_scores').select('id, total_score', { count: 'exact' });
  let revocationsQuery = supabase.from('entitlement_revocations').select('id', { count: 'exact' });
  let appsQuery = supabase.from('apps').select('id', { count: 'exact' }).eq('is_active', true);
  
  if (appId) {
    refundEventsQuery = refundEventsQuery.eq('app_id', appId);
    riskScoresQuery = riskScoresQuery.eq('app_id', appId);
    revocationsQuery = revocationsQuery.eq('app_id', appId);
  }
  
  const [refundEvents, riskScores, revocations, apps] = await Promise.all([
    refundEventsQuery,
    riskScoresQuery.gte('total_score', 70),
    revocationsQuery.eq('success', true),
    appsQuery,
  ]);
  
  // Calculate revenue saved from successful revocations
  const { data: revokedEvents } = await supabase
    .from('entitlement_revocations')
    .select(`
      refund_events!inner(price_usd)
    `)
    .eq('success', true)
    .eq('app_id', appId || '');
  
  const revenueSaved = revokedEvents?.reduce((sum, r) => sum + (r.refund_events as any)?.price_usd || 0, 0) || 0;
  
  return {
    total_refunds_inspected: refundEvents.count || 0,
    high_risk_caught: riskScores.count || 0,
    revenue_saved_usd: revenueSaved,
    active_apps: apps.count || 0,
    period: '30d',
  };
}

/**
 * Get paginated refund events with risk scores and alerts
 */
export async function getRefundEvents(params: {
  appId?: string;
  page?: number;
  limit?: number;
  riskLevel?: 'green' | 'yellow' | 'red';
  status?: 'pending' | 'acknowledged' | 'dismissed' | 'revoked';
  startDate?: string;
  endDate?: string;
  search?: string;
}): Promise<PaginatedResponse<RefundEventWithRelations>> {
  const supabase = await createClient();
  
  const page = params.page || 1;
  const limit = params.limit || 25;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  let query = supabase
    .from('refund_events')
    .select(`
      *,
      risk_score:risk_scores(*),
      alert:alerts(*)
    `, { count: 'exact' })
    .order('refunded_at', { ascending: false })
    .range(from, to);
  
  if (params.appId) {
    query = query.eq('app_id', params.appId);
  }
  
  if (params.riskLevel) {
    query = query.eq('risk_score.risk_level', params.riskLevel);
  }
  
  if (params.status) {
    query = query.eq('alert.status', params.status);
  }
  
  if (params.startDate) {
    query = query.gte('refunded_at', params.startDate);
  }
  
  if (params.endDate) {
    query = query.lte('refunded_at', params.endDate);
  }
  
  if (params.search) {
    query = query.or(`app_user_id.ilike.%${params.search}%,product_id.ilike.%${params.search}%`);
  }
  
  const { data, error, count } = await query;
  
  if (error) throw error;
  
  return {
    data: (data || []) as RefundEventWithRelations[],
    meta: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
}

/**
 * Get single refund event with full details
 */
export async function getRefundEventDetail(eventId: string): Promise<EventDetailResponse | null> {
  const supabase = await createClient();
  
  // Get event with relations
  const { data: event, error: eventError } = await supabase
    .from('refund_events')
    .select(`
      *,
      risk_score:risk_scores(*),
      alert:alerts(*)
    `)
    .eq('id', eventId)
    .single();
  
  if (eventError || !event) return null;
  
  // Get history for same user
  const { data: history } = await supabase
    .from('refund_events')
    .select(`
      *,
      risk_score:risk_scores(*),
      alert:alerts(*)
    `)
    .eq('app_id', event.app_id)
    .eq('app_user_id', event.app_user_id)
    .neq('id', eventId)
    .order('refunded_at', { ascending: false });
  
  // Build timeline
  const timeline = buildTimeline(event, event.risk_score, event.alert);
  
  // Build score breakdown
  const scoreBreakdown = buildScoreBreakdown(event.risk_score);
  
  return {
    event: event as RefundEventWithRelations,
    timeline,
    score_breakdown: scoreBreakdown,
    history: (history || []) as RefundEventWithRelations[],
  };
}

function buildTimeline(
  event: any,
  riskScore: any,
  alert: any
): EventDetailResponse['timeline'] {
  const entries: EventDetailResponse['timeline'] = [
    {
      timestamp: event.purchased_at,
      type: 'purchase' as const,
      title: 'Purchase Made',
      description: `${event.product_id} purchased for ${event.currency} ${event.price_usd.toFixed(2)}`,
    },
    {
      timestamp: event.refunded_at,
      type: 'refund' as const,
      title: 'Refund Requested',
      description: `Refund requested via ${event.store}. Reason: ${event.refund_reason || 'Not specified'}`,
    },
  ];
  
  if (riskScore) {
    entries.push({
      timestamp: riskScore.created_at,
      type: 'score_calculated' as const,
      title: 'Risk Score Calculated',
      description: `Score: ${riskScore.total_score}/100 (${riskScore.risk_level.toUpperCase()})`,
      metadata: riskScore.factor_details,
    });
  }
  
  if (alert) {
    entries.push({
      timestamp: alert.created_at,
      type: 'alert_created' as const,
      title: 'Alert Created',
      description: `Alert status: ${alert.status}`,
    });
    
    if (alert.email_sent_status === 'sent') {
      entries.push({
        timestamp: alert.acknowledged_at || alert.created_at,
        type: 'email_sent' as const,
        title: 'Email Notification Sent',
        description: 'High-risk alert email sent to developer',
      });
    }
    
    if (alert.status === 'revoked') {
      entries.push({
        timestamp: alert.acknowledged_at || alert.updated_at,
        type: 'revoked' as const,
        title: 'Entitlement Revoked',
        description: 'Developer revoked entitlement for this user',
      });
    } else if (alert.status === 'dismissed') {
      entries.push({
        timestamp: alert.dismissed_at || alert.updated_at,
        type: 'dismissed' as const,
        title: 'Alert Dismissed',
        description: 'Developer dismissed this alert as false positive',
      });
    }
  }
  
  return entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function buildScoreBreakdown(riskScore: any): EventDetailResponse['score_breakdown'] {
  if (!riskScore) {
    return {
      duration_score: 0,
      frequency_score: 0,
      billing_cycle_score: 0,
      product_type_score: 0,
      total_score: 0,
      risk_level: 'green',
      factors: {
        duration_hours: 0,
        refund_count: 0,
        is_last_day_of_cycle: false,
        is_consumable: false,
      },
      primary_reason: 'No score available',
    };
  }
  
  const factors = riskScore.factor_details || {};
  
  return {
    duration_score: riskScore.duration_score,
    frequency_score: riskScore.frequency_score,
    billing_cycle_score: riskScore.billing_cycle_score,
    product_type_score: riskScore.product_type_score,
    total_score: riskScore.total_score,
    risk_level: riskScore.risk_level,
    factors: {
      duration_hours: factors.duration_hours || 0,
      refund_count: factors.refund_count || 0,
      is_last_day_of_cycle: factors.is_last_day_of_cycle || false,
      is_consumable: factors.is_consumable || false,
    },
    primary_reason: factors.primary_reason || 'Standard risk assessment',
  };
}

/**
 * Get refund trends for charts
 */
export async function getRefundTrends(appId?: string, days: number = 30): Promise<RefundTrendPoint[]> {
  const supabase = await createClient();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  let query = supabase
    .from('refund_events')
    .select('refunded_at, price_usd, risk_scores!inner(total_score)')
    .gte('refunded_at', startDate.toISOString())
    .order('refunded_at', { ascending: true });
  
  if (appId) {
    query = query.eq('app_id', appId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Aggregate by date
  const dailyData = new Map<string, { total: number; highRisk: number; revenue: number }>();
  
  (data || []).forEach(event => {
    const date = new Date(event.refunded_at).toISOString().split('T')[0];
    const existing = dailyData.get(date) || { total: 0, highRisk: 0, revenue: 0 };
    
    existing.total += 1;
    existing.revenue += event.price_usd || 0;
    
    const riskScore = event.risk_scores as any;
    if (riskScore && riskScore.total_score >= 70) {
      existing.highRisk += 1;
    }
    
    dailyData.set(date, existing);
  });
  
  // Fill in missing dates
  const results: RefundTrendPoint[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const dateStr = date.toISOString().split('T')[0];
    const dayData = dailyData.get(dateStr) || { total: 0, highRisk: 0, revenue: 0 };
    
    results.push({
      date: dateStr,
      total_refunds: dayData.total,
      high_risk: dayData.highRisk,
      revenue_saved: dayData.revenue,
    });
  }
  
  return results;
}

/**
 * Get RevenueCat connection status
 */
export async function getRevenueCatStatus(): Promise<RevenueCatConnectionStatus> {
  const supabase = await createClient();
  
  const { data: creds, error } = await supabase
    .from('revenuecat_credentials')
    .select('api_key_prefix, is_valid, last_validated_at')
    .single();
  
  if (error || !creds) {
    return {
      has_credentials: false,
      api_key_prefix: null,
      is_valid: false,
      last_validated_at: null,
      apps_found: 0,
    };
  }
  
  // Count apps
  const { count: appsCount } = await supabase
    .from('apps')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);
  
  return {
    has_credentials: true,
    api_key_prefix: creds.api_key_prefix,
    is_valid: creds.is_valid,
    last_validated_at: creds.last_validated_at,
    apps_found: appsCount || 0,
  };
}

/**
 * Get decrypted RevenueCat API key for server-side API calls
 */
export async function getDecryptedRevenueCatApiKey(): Promise<string | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: creds, error } = await supabase
    .from('revenuecat_credentials')
    .select('api_key_encrypted')
    .eq('developer_id', user.id)
    .single();
  
  if (error || !creds) return null;
  
  try {
    const encryptionKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    return await decryptSecret(creds.api_key_encrypted, encryptionKey);
  } catch {
    return null;
  }
}

/**
 * Update RevenueCat credentials (encrypts secrets before storage)
 */
export async function updateRevenueCatCredentials(apiKey: string, webhookSecret: string): Promise<void> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  // Encrypt secrets before storage
  const encryptionKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const apiKeyEncrypted = await encryptSecret(apiKey, encryptionKey);
  const webhookSecretEncrypted = await encryptSecret(webhookSecret, encryptionKey);
  const apiKeyPrefix = apiKey.slice(0, 8) + '...' + apiKey.slice(-4);
  
  const { error } = await supabase
    .from('revenuecat_credentials')
    .upsert({
      developer_id: user.id,
      api_key_encrypted: apiKeyEncrypted,
      webhook_secret_encrypted: webhookSecretEncrypted,
      api_key_prefix: apiKeyPrefix,
      is_valid: true,
      last_validated_at: new Date().toISOString(),
    }, { onConflict: 'developer_id' });
  
  if (error) throw error;
}

/**
 * Validate RevenueCat API key
 */
export async function validateRevenueCatApiKey(apiKey: string): Promise<{ valid: boolean; appsFound: number }> {
  try {
    const response = await fetch('https://api.revenuecat.com/v1/projects', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return { valid: false, appsFound: 0 };
    }
    
    const data = await response.json();
    return { valid: true, appsFound: data.projects?.length || 0 };
  } catch {
    return { valid: false, appsFound: 0 };
  }
}

/**
 * Sync apps from RevenueCat
 */
export async function syncAppsFromRevenueCat(apiKey: string): Promise<DashboardApp[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  const response = await fetch('https://api.revenuecat.com/v1/projects', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch apps from RevenueCat');
  }
  
  const data = await response.json();
  const projects = data.projects || [];
  
  const apps: DashboardApp[] = [];
  
  for (const project of projects) {
    const { data: app, error } = await supabase
      .from('apps')
      .upsert({
        developer_id: user.id,
        revenuecat_app_id: project.id,
        name: project.name,
        platform: project.platform || 'ios',
        bundle_identifier: project.bundle_id,
        is_active: true,
      }, { onConflict: 'revenuecat_app_id' })
      .select()
      .single();
    
    if (!error && app) {
      apps.push(app as DashboardApp);
    }
  }
  
  return apps;
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  // Get from user metadata or use defaults
  const { data: profile } = await supabase
    .from('developers')
    .select('email')
    .eq('id', user.id)
    .single();
  
  return {
    email_alerts_enabled: true,
    alert_threshold: 'red',
    digest_frequency: 'realtime',
    email_address: profile?.email || user.email || '',
  };
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  // Store in user metadata or a preferences table
  // For MVP, we'll use Supabase Auth user metadata
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { notification_preferences: preferences },
  });
  
  if (error) throw error;
}

/**
 * Update alert status
 */
export async function updateAlertStatus(
  alertId: string,
  status: 'acknowledged' | 'dismissed' | 'revoked'
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  
  if (status === 'acknowledged') {
    updates.acknowledged_at = new Date().toISOString();
    updates.acknowledged_by = user.id;
  } else if (status === 'dismissed') {
    updates.dismissed_at = new Date().toISOString();
  }
  
  const { error } = await supabase
    .from('alerts')
    .update(updates)
    .eq('id', alertId);
  
  if (error) throw error;
}

/**
 * Execute entitlement revocation
 */
export async function revokeEntitlement(
  alertId: string,
  appUserId: string,
  entitlementId: string,
  apiKey: string
): Promise<ApiResponse<{ revocationId: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  // Get app and alert details
  const { data: alert, error: alertError } = await supabase
    .from('alerts')
    .select(`
      *,
      app:apps(*),
      risk_score:risk_scores(
        refund_event:refund_events(*)
      )
    `)
    .eq('id', alertId)
    .single();
  
  if (alertError || !alert) {
    return { success: false, error: 'Alert not found', code: 404 };
  }
  
  const app = alert.app as any;
  const riskScore = alert.risk_score as any;
  const refundEvent = riskScore?.refund_event as any;
  
  // Call RevenueCat API
  const revokeResponse = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}/entitlements/${encodeURIComponent(entitlementId)}/revoke`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }
  );
  
  const responseData = await revokeResponse.json().catch(() => ({}));
  const success = revokeResponse.ok;
  
  // Record revocation attempt
  const { data: revocation, error: revError } = await supabase
    .from('entitlement_revocations')
    .insert({
      alert_id: alertId,
      app_id: app.id,
      developer_id: user.id,
      app_user_id: appUserId,
      entitlement_id: entitlementId,
      revenuecat_response: responseData,
      success,
      error_message: success ? null : responseData.message || 'Unknown error',
    })
    .select()
    .single();
  
  if (revError) {
    console.error('Failed to record revocation:', revError);
  }
  
  // Update alert status
  if (success) {
    await supabase
      .from('alerts')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', alertId);
  }
  
  if (!success) {
    return {
      success: false,
      error: responseData.message || 'RevenueCat API error',
      code: revokeResponse.status,
    };
  }
  
  return { success: true, data: { revocationId: revocation?.id } };
}