export interface Developer {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface RevenueCatCredential {
  id: string;
  developer_id: string;
  api_key_encrypted: string;
  webhook_secret_encrypted: string;
  api_key_prefix: string;
  created_at: string;
  updated_at: string;
  is_valid: boolean;
  last_validated_at: string | null;
}

export interface App {
  id: string;
  developer_id: string;
  revenuecat_app_id: string;
  name: string;
  platform: 'ios' | 'android' | 'stripe' | 'web';
  bundle_identifier: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RefundEvent {
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
}

export interface RiskScore {
  id: string;
  refund_event_id: string;
  app_id: string;
  total_score: number;
  duration_score: number;
  frequency_score: number;
  billing_cycle_score: number;
  product_type_score: number;
  risk_level: 'green' | 'yellow' | 'red';
  factor_details: Record<string, unknown>;
  created_at: string;
}

export interface Alert {
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

export interface EntitlementRevocation {
  id: string;
  alert_id: string;
  app_id: string;
  developer_id: string;
  app_user_id: string;
  entitlement_id: string;
  revenuecat_response: Record<string, unknown> | null;
  success: boolean;
  error_message: string | null;
  executed_at: string;
}

// API Response Types
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

// Webhook Payload Types (RevenueCat)
export interface RevenueCatWebhookPayload {
  api_version: string;
  event: RevenueCatEvent;
}

export interface RevenueCatEvent {
  type: 'REFUND' | 'INITIAL_PURCHASE' | 'RENEWAL' | 'CANCELLATION' | 'EXPIRATION' | 'GRACE_PERIOD_EXPIRED' | 'BILLING_ISSUE' | 'PRODUCT_CHANGE' | 'TEST';
  id: string;
  event_timestamp_ms: number;
  app_id: string;
  app_user_id: string;
  product_id: string;
  entitlement_id: string | null;
  price_usd: number;
  currency: string;
  purchased_at_ms: number;
  refunded_at_ms: number | null;
  refund_reason: string | null;
  store: 'app_store' | 'play_store' | 'stripe' | 'amazon';
  environment: 'production' | 'sandbox';
}

// Scoring Types
export interface ScoringFactors {
  duration_hours: number;
  refund_count: number;
  is_last_day_of_cycle: boolean;
  is_consumable: boolean;
}

export interface ScoreBreakdown {
  duration_score: number;
  frequency_score: number;
  billing_cycle_score: number;
  product_type_score: number;
  total_score: number;
  risk_level: 'green' | 'yellow' | 'red';
  factors: ScoringFactors;
}

// Dashboard Types
export interface KPIMetrics {
  total_refunds_inspected: number;
  high_risk_caught: number;
  revenue_saved_usd: number;
  active_apps: number;
}

export interface RefundTrendPoint {
  date: string;
  total_refunds: number;
  high_risk: number;
  revenue_saved: number;
}

export interface RefundEventWithDetails extends RefundEvent {
  risk_score: RiskScore | null;
  alert: Alert | null;
}

export interface EventDetailResponse {
  event: RefundEventWithDetails;
  timeline: TimelineEntry[];
  score_breakdown: ScoreBreakdown;
  history: RefundEvent[];
}

export interface TimelineEntry {
  timestamp: string;
  type: 'purchase' | 'refund' | 'score_calculated' | 'alert_created' | 'email_sent' | 'revoked' | 'dismissed';
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
}

// Settings Types
export interface NotificationPreferences {
  email_alerts_enabled: boolean;
  alert_threshold: 'red' | 'yellow';
  digest_frequency: 'realtime' | 'hourly' | 'daily';
  email_address: string;
}

// Zod-inferred types for validators
export interface PaginationQuery {
  page: number;
  limit: number;
  search?: string;
  risk_level?: 'green' | 'yellow' | 'red';
  status?: 'pending' | 'acknowledged' | 'dismissed' | 'revoked';
  app_id?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: 'created_at' | 'refunded_at' | 'total_score' | 'price_usd';
  sort_order?: 'asc' | 'desc';
}

export interface AlertAction {
  action: 'acknowledge' | 'dismiss' | 'revoke';
}

export interface RevokeEntitlementRequest {
  app_user_id: string;
  entitlement_id: string;
  confirmation: 'REVOKE';
}

export interface RevenueCatCredentials {
  api_key: string;
  webhook_secret: string;
}

export interface AppRegistration {
  revenuecat_app_id: string;
  name: string;
  platform: 'ios' | 'android' | 'stripe' | 'web';
  bundle_identifier?: string;
}

export interface RevenueCatConnectionStatus {
  has_credentials: boolean;
  api_key_prefix: string | null;
  is_valid: boolean;
  last_validated_at: string | null;
  apps_found: number;
}

// Error Codes
export enum ErrorCode {
  INVALID_WEBHOOK_SIGNATURE = 'INVALID_WEBHOOK_SIGNATURE',
  INVALID_WEBHOOK_PAYLOAD = 'INVALID_WEBHOOK_PAYLOAD',
  APP_NOT_FOUND = 'APP_NOT_FOUND',
  DEVELOPER_NOT_FOUND = 'DEVELOPER_NOT_FOUND',
  REVENUECAT_API_ERROR = 'REVENUECAT_API_ERROR',
  REVENUECAT_AUTH_FAILED = 'REVENUECAT_AUTH_FAILED',
  ENTITLEMENT_REVOKE_FAILED = 'ENTITLEMENT_REVOKE_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}