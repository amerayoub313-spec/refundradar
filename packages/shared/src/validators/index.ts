import { z } from 'zod';
import type { 
  RevenueCatWebhookPayload, 
  RevenueCatEvent, 
  NotificationPreferences,
  PaginationQuery,
  AlertAction,
  RevokeEntitlementRequest,
  RevenueCatCredentials,
  AppRegistration
} from '../types';

// RevenueCat Event Schema
export const RevenueCatEventSchema: z.ZodType<RevenueCatEvent> = z.object({
  type: z.enum([
    'REFUND',
    'INITIAL_PURCHASE',
    'RENEWAL',
    'CANCELLATION',
    'EXPIRATION',
    'GRACE_PERIOD_EXPIRED',
    'BILLING_ISSUE',
    'PRODUCT_CHANGE',
    'TEST',
  ]),
  id: z.string().min(1),
  event_timestamp_ms: z.number().int().positive(),
  app_id: z.string().min(1),
  app_user_id: z.string().min(1),
  product_id: z.string().min(1),
  entitlement_id: z.string().nullable(),
  price_usd: z.number().nonnegative(),
  currency: z.string().length(3),
  purchased_at_ms: z.number().int().positive(),
  refunded_at_ms: z.number().int().positive().nullable(),
  refund_reason: z.string().nullable(),
  store: z.enum(['app_store', 'play_store', 'stripe', 'amazon']),
  environment: z.enum(['production', 'sandbox']),
});

// Full Webhook Payload Schema
export const RevenueCatWebhookSchema: z.ZodType<RevenueCatWebhookPayload> = z.object({
  api_version: z.string(),
  event: RevenueCatEventSchema,
});

// Dashboard API Schemas
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  search: z.string().optional(),
  risk_level: z.enum(['green', 'yellow', 'red']).optional(),
  status: z.enum(['pending', 'acknowledged', 'dismissed', 'revoked']).optional(),
  app_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  sort_by: z.enum(['created_at', 'refunded_at', 'total_score', 'price_usd']).default('refunded_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const AlertActionSchema = z.object({
  action: z.enum(['acknowledged', 'dismissed', 'revoked']),
});

export const RevokeEntitlementSchema = z.object({
  app_user_id: z.string().min(1),
  entitlement_id: z.string().min(1),
  confirmation: z.literal('REVOKE'),
});

export const NotificationPreferencesSchema = z.object({
  email_alerts_enabled: z.boolean(),
  alert_threshold: z.enum(['red', 'yellow']),
  digest_frequency: z.enum(['realtime', 'hourly', 'daily']),
  email_address: z.string().email(),
});

export const RevenueCatCredentialsSchema = z.object({
  api_key: z.string().min(1).startsWith('rc_'),
  webhook_secret: z.string().min(1),
});

export const AppRegistrationSchema = z.object({
  revenuecat_app_id: z.string().min(1),
  name: z.string().min(1).max(100),
  platform: z.enum(['ios', 'android', 'stripe', 'web']),
  bundle_identifier: z.string().optional(),
});

// Type inference helpers - use types from @refundradar/shared/types
export type { 
  PaginationQuery, 
  AlertAction, 
  RevokeEntitlementRequest, 
  NotificationPreferences,
  RevenueCatCredentials,
  AppRegistration,
} from '../types';

// Validation helper
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; issues: z.ZodIssue[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: 'Validation failed',
    issues: result.error.issues,
  };
}