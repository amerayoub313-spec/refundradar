// Navigation
export const NAVIGATION_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: 'LayoutDashboard' },
  { href: '/alerts', label: 'Alerts', icon: 'AlertTriangle' },
  { href: '/analytics', label: 'Analytics', icon: 'BarChart3' },
  { href: '/settings', label: 'Settings', icon: 'Settings' },
  { href: '/apps', label: 'Apps', icon: 'Smartphone' },
] as const;

// Risk thresholds
export const RISK_THRESHOLDS = {
  green_max: 39,
  yellow_max: 69,
  red_min: 70,
} as const;

// Risk colors
export const RISK_COLORS = {
  green: 'bg-risk-green-50 text-risk-green-700 border-risk-green-200 dark:bg-risk-green-900/20 dark:text-risk-green-400 dark:border-risk-green-800',
  yellow: 'bg-risk-yellow-50 text-risk-yellow-700 border-risk-yellow-200 dark:bg-risk-yellow-900/20 dark:text-risk-yellow-400 dark:border-risk-yellow-800',
  red: 'bg-risk-red-50 text-risk-red-700 border-risk-red-200 dark:bg-risk-red-900/20 dark:text-risk-red-400 dark:border-risk-red-800',
} as const;

// Risk labels
export const RISK_LABELS = {
  green: 'Low Risk',
  yellow: 'Medium Risk',
  red: 'High Risk',
} as const;

// Alert statuses
export const ALERT_STATUSES = {
  pending: 'Pending',
  acknowledged: 'Acknowledged',
  dismissed: 'Dismissed',
  revoked: 'Revoked',
} as const;

// Alert status colors
export const ALERT_STATUS_COLORS = {
  pending: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  acknowledged: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
  dismissed: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
  revoked: 'bg-risk-red-50 text-risk-red-700 border-risk-red-200 dark:bg-risk-red-900/20 dark:text-risk-red-400 dark:border-risk-red-800',
} as const;

// Platform icons
export const PLATFORM_ICONS = {
  ios: 'Apple',
  android: 'Android',
  stripe: 'CreditCard',
  web: 'Globe',
} as const;

// Store icons
export const STORE_ICONS = {
  app_store: 'Apple',
  play_store: 'Android',
  stripe: 'CreditCard',
  amazon: 'Package',
} as const;

// Date formats
export const DATE_FORMATS = {
  short: 'MMM d, yyyy',
  long: 'MMMM d, yyyy',
  time: 'h:mm a',
  datetime: 'MMM d, yyyy h:mm a',
  relative: 'relative',
} as const;

// Pagination
export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 25,
  maxLimit: 100,
} as const;

// Chart colors
export const CHART_COLORS = {
  total: '#0F62FE',
  highRisk: '#DA1E28',
  revenueSaved: '#007D32',
} as const;

// Email thresholds
export const EMAIL_THRESHOLDS = {
  red: 'Red only (≥70)',
  yellow: 'Yellow & Red (≥40)',
} as const;

// Digest frequencies
export const DIGEST_FREQUENCIES = {
  realtime: 'Real-time',
  hourly: 'Hourly',
  daily: 'Daily at 9 AM UTC',
} as const;

// App statuses
export const APP_STATUSES = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
} as const;

// Default retention days
export const DEFAULT_RETENTION_DAYS = 90;

// Webhook URL base
export const WEBHOOK_BASE_URL = 'https://ingest.refundradar.io/webhook/revenuecat';