// Scoring Weights Configuration
// MVP Weights (must sum to 100)
export const SCORING_WEIGHTS = {
  duration: 35,           // Duration before refund (hours)
  frequency: 30,          // Refund frequency history
  billing_cycle: 20,      // Proximity to billing cycle renewal
  product_type: 15,       // Consumable vs subscription
} as const;

export const RISK_THRESHOLDS = {
  green_max: 39,
  yellow_max: 69,
  red_min: 70,
} as const;

// Duration scoring: refunded within X hours
export const DURATION_SCORING = [
  { max_hours: 1, score: 35 },
  { max_hours: 6, score: 30 },
  { max_hours: 24, score: 25 },
  { max_hours: 48, score: 20 },
  { max_hours: 72, score: 15 },
  { max_hours: 168, score: 10 }, // 1 week
  { max_hours: Infinity, score: 0 },
] as const;

// Frequency scoring: number of previous refunds
export const FREQUENCY_SCORING = [
  { min_count: 3, score: 30 },
  { min_count: 2, score: 20 },
  { min_count: 1, score: 10 },
  { min_count: 0, score: 0 },
] as const;

// Billing cycle scoring: refunded on last day before renewal
export const BILLING_CYCLE_SCORING = {
  last_day: 20,
  not_last_day: 0,
} as const;

// Product type scoring
export const PRODUCT_TYPE_SCORING = {
  consumable: 15,
  non_consumable: 10,
  subscription: 5,
} as const;

// Consumable product IDs (configure per app in future)
export const CONSUMABLE_PRODUCT_PATTERNS = [
  /coin/i,
  /gem/i,
  /credit/i,
  /token/i,
  /pack/i,
  /bundle/i,
  /consumable/i,
] as const;

// Risk level labels
export const RISK_LABELS = {
  green: 'Low Risk',
  yellow: 'Medium Risk',
  red: 'High Risk',
} as const;

export const RISK_COLORS = {
  green: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400',
  red: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400',
} as const;

// RevenueCat API
export const REVENUECAT_API_BASE = 'https://api.revenuecat.com/v1';
export const REVENUECAT_API_V2_BASE = 'https://api.revenuecat.com/v2';

// Webhook Events to Subscribe
export const REVENUECAT_WEBHOOK_EVENTS = {
  required: ['REFUND'] as const,
  optional: [
    'INITIAL_PURCHASE',
    'RENEWAL',
    'CANCELLATION',
    'EXPIRATION',
    'GRACE_PERIOD_EXPIRED',
    'BILLING_ISSUE',
    'PRODUCT_CHANGE',
    'TEST',
  ] as const,
};

// Data Retention
export const DATA_RETENTION_DAYS = 90;

// Rate Limits
export const RATE_LIMITS = {
  webhook: { requests: 1000, window: '1m' },
  api: { requests: 100, window: '1m' },
  revoke: { requests: 10, window: '1m' },
} as const;

// Pagination Defaults
export const PAGINATION = {
  default_limit: 25,
  max_limit: 100,
} as const;