// Extended types for dashboard with joined data
export interface DashboardApp {
  id: string;
  revenuecat_app_id: string;
  name: string;
  platform: 'ios' | 'android' | 'stripe' | 'web';
  bundle_identifier: string | null;
  is_active: boolean;
  created_at: string;
  webhook_url: string;
  webhook_secret: string | null;
}

export interface RefundEventWithRelations {
  id: string;
  app_id: string;
  revenuecat_event_id: string;
  app_user_id: string;
  product_id: string;
  entitlement_id: string | null;
  price_usd: number;
  currency: string;
  purchased_at: string;
  refunded_at: string;
  refund_reason: string | null;
  store: 'app_store' | 'play_store' | 'stripe' | 'amazon';
  raw_payload: Record<string, unknown>;
  created_at: string;
  risk_score: RiskScoreWithBreakdown | null;
  alert: AlertWithStatus | null;
}

export interface RiskScoreWithBreakdown {
  id: string;
  refund_event_id: string;
  app_id: string;
  total_score: number;
  duration_score: number;
  frequency_score: number;
  billing_cycle_score: number;
  product_type_score: number;
  risk_level: 'green' | 'yellow' | 'red';
  factor_details: {
    duration_hours: number;
    refund_count: number;
    is_last_day_of_cycle: boolean;
    is_consumable: boolean;
    primary_reason: string;
  };
  created_at: string;
}

export interface AlertWithStatus {
  id: string;
  app_id: string;
  risk_score_id: string;
  status: 'pending' | 'acknowledged' | 'dismissed' | 'revoked';
  email_sent_status: 'pending' | 'sent' | 'failed';
  acknowledged_at: string | null;
  dismissed_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface KPIMetrics {
  total_refunds_inspected: number;
  high_risk_caught: number;
  revenue_saved_usd: number;
  active_apps: number;
  period: string;
}

export interface RefundTrendPoint {
  date: string;
  total_refunds: number;
  high_risk: number;
  revenue_saved: number;
}

export interface EventDetailResponse {
  event: RefundEventWithRelations;
  timeline: TimelineEntry[];
  score_breakdown: ScoreBreakdown;
  history: RefundEventWithRelations[];
}

export interface TimelineEntry {
  timestamp: string;
  type: 'purchase' | 'refund' | 'score_calculated' | 'alert_created' | 'email_sent' | 'revoked' | 'dismissed';
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface ScoreBreakdown {
  duration_score: number;
  frequency_score: number;
  billing_cycle_score: number;
  product_type_score: number;
  total_score: number;
  risk_level: 'green' | 'yellow' | 'red';
  factors: {
    duration_hours: number;
    refund_count: number;
    is_last_day_of_cycle: boolean;
    is_consumable: boolean;
  };
  primary_reason: string;
}

export interface RevenueCatConnectionStatus {
  has_credentials: boolean;
  api_key_prefix: string | null;
  is_valid: boolean;
  last_validated_at: string | null;
  apps_found: number;
}

export interface NotificationPreferences {
  email_alerts_enabled: boolean;
  alert_threshold: 'red' | 'yellow';
  digest_frequency: 'realtime' | 'hourly' | 'daily';
  email_address: string;
}

export interface RevokeEntitlementRequest {
  app_user_id: string;
  entitlement_id: string;
  confirmation: 'REVOKE';
}

export interface RevokeEntitlementResponse {
  success: boolean;
  revocation_id?: string;
  error?: string;
  revenuecat_response?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}