import type { 
  Developer, 
  App, 
  RefundEvent, 
  RiskScore, 
  Alert, 
  EntitlementRevocation,
  RevenueCatEvent,
  ScoringFactors,
  ScoreBreakdown
} from '@refundradar/shared';

// Cloudflare Worker Environment
export interface Env {
  // Supabase
  DATABASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // Resend
  RESEND_API_KEY: string;
  
  // RevenueCat
  REVENUECAT_WEBHOOK_SECRET: string;
  
  // Encryption
  ENCRYPTION_KEY: string;
  
  // KV for rate limiting
  RATE_LIMIT_KV?: KVNamespace;
  
  // Environment
  ENVIRONMENT: 'development' | 'staging' | 'production';
}

// Webhook Request Context
export interface WebhookContext {
  app: App;
  developer: Developer;
  rawPayload: RevenueCatEvent;
  verified: boolean;
}

// Database Client Type (using service role)
export interface DatabaseClient {
  from: (table: string) => any;
  rpc: (fn: string, params?: any) => any;
  auth: {
    admin: {
      getUserById: (id: string) => any;
    };
  };
}

// Scoring Input (pre-computed for pure function)
export interface ScoringInput {
  duration_hours: number;
  refund_count: number;
  is_last_day_of_cycle: boolean;
  product_id: string;
}

// Processing Result
export interface WebhookProcessingResult {
  success: boolean;
  refund_event_id?: string;
  risk_score_id?: string;
  alert_id?: string;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

// Email Alert Data
export interface EmailAlertData {
  developer_email: string;
  developer_name: string | null;
  app_name: string;
  app_user_id: string;
  product_id: string;
  price_usd: number;
  currency: string;
  risk_score: number;
  risk_level: 'green' | 'yellow' | 'red';
  primary_reason: string;
  refunded_at: string;
  dashboard_url: string;
}

// RevenueCat API Types
export interface RevenueCatSubscriber {
  subscriber: {
    original_app_user_id: string;
    original_application_version: string;
    first_seen: string;
    original_purchase_date: string;
    other_purchases: Record<string, any>;
    subscriptions: Record<string, any>;
    entitlements: Record<string, any>;
    attributes: Record<string, any>;
  };
}

export interface RevenueCatRevokeResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface RevenueCatErrorResponse {
  code: number;
  message: string;
  errors?: Record<string, string[]>;
}

// Rate Limit Info
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

// Worker Logger
export interface WorkerLogger {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
  debug: (message: string, meta?: Record<string, unknown>) => void;
}