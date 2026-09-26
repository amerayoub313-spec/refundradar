import type { ScoringFactors, ScoreBreakdown } from '@refundradar/shared/types';
import {
  SCORING_WEIGHTS,
  DURATION_SCORING,
  FREQUENCY_SCORING,
  BILLING_CYCLE_SCORING,
  PRODUCT_TYPE_SCORING,
  CONSUMABLE_PRODUCT_PATTERNS,
  RISK_THRESHOLDS,
} from '@refundradar/shared/constants';

/**
 * Determines if a product is consumable based on product ID patterns
 */
export function isConsumableProduct(productId: string): boolean {
  return CONSUMABLE_PRODUCT_PATTERNS.some((pattern: RegExp) => pattern.test(productId));
}

/**
 * Calculates duration score based on hours between purchase and refund
 */
export function calculateDurationScore(hoursBetween: number): number {
  for (const bracket of DURATION_SCORING) {
    if (hoursBetween <= bracket.max_hours) {
      return bracket.score;
    }
  }
  return 0;
}

/**
 * Calculates frequency score based on previous refund count
 */
export function calculateFrequencyScore(refundCount: number): number {
  for (const bracket of FREQUENCY_SCORING) {
    if (refundCount >= bracket.min_count) {
      return bracket.score;
    }
  }
  return 0;
}

/**
 * Calculates billing cycle score (1 if refunded on last day before renewal)
 */
export function calculateBillingCycleScore(isLastDay: boolean): number {
  return isLastDay ? BILLING_CYCLE_SCORING.last_day : BILLING_CYCLE_SCORING.not_last_day;
}

/**
 * Calculates product type score
 */
export function calculateProductTypeScore(productId: string): number {
  return isConsumableProduct(productId)
    ? PRODUCT_TYPE_SCORING.consumable
    : PRODUCT_TYPE_SCORING.subscription;
}

/**
 * Main scoring function - pure, deterministic, no side effects
 * All inputs are pre-computed values, making this easily testable
 */
export function calculateRiskScore(factors: ScoringFactors): ScoreBreakdown {
  const duration_score = calculateDurationScore(factors.duration_hours);
  const frequency_score = calculateFrequencyScore(factors.refund_count);
  const billing_cycle_score = calculateBillingCycleScore(factors.is_last_day_of_cycle);
  const product_type_score = calculateProductTypeScore(''); // Will be overridden by caller

  // Note: product_type_score needs product_id, so we'll compute it separately
  const total_score = duration_score + frequency_score + billing_cycle_score;

  let risk_level: 'green' | 'yellow' | 'red';
  if (total_score >= RISK_THRESHOLDS.red_min) risk_level = 'red';
  else if (total_score > RISK_THRESHOLDS.green_max) risk_level = 'yellow';
  else risk_level = 'green';

  return {
    duration_score,
    frequency_score,
    billing_cycle_score,
    product_type_score: 0, // Placeholder
    total_score,
    risk_level,
    factors,
  };
}

/**
 * Full scoring with product type included
 */
export function calculateFullRiskScore(
  factors: ScoringFactors,
  productId: string
): ScoreBreakdown {
  const baseScore = calculateRiskScore(factors);
  const product_type_score = calculateProductTypeScore(productId);

  const total_score = Math.min(
    100,
    baseScore.duration_score +
      baseScore.frequency_score +
      baseScore.billing_cycle_score +
      product_type_score
  );

  let risk_level: 'green' | 'yellow' | 'red';
  if (total_score >= RISK_THRESHOLDS.red_min) risk_level = 'red';
  else if (total_score > RISK_THRESHOLDS.green_max) risk_level = 'yellow';
  else risk_level = 'green';

  return {
    ...baseScore,
    product_type_score,
    total_score,
    risk_level,
  };
}

/**
 * Compute duration in hours between two timestamps
 */
export function computeDurationHours(purchasedAt: string, refundedAt: string): number {
  const purchased = new Date(purchasedAt).getTime();
  const refunded = new Date(refundedAt).getTime();
  const diffMs = refunded - purchased;
  return Math.max(0, diffMs / (1000 * 60 * 60));
}

/**
 * Determine if refund date is the last day of billing cycle
 * For MVP: simple heuristic - refunded within 24h of next renewal
 * In v2: use actual subscription period from RevenueCat
 */
export function isLastDayOfBillingCycle(
  refundedAt: string,
  purchasedAt: string,
  productId: string
): boolean {
  // Heuristic: if it's a subscription and refunded within 48h of a renewal cycle
  // For MVP, we'll use a simpler approach: check if it's near month boundary
  const refundDate = new Date(refundedAt);
  const purchaseDate = new Date(purchasedAt);

  // If it's likely a monthly subscription, check if refunded in last 2 days of cycle
  const daysSincePurchase = (refundDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);

  // Monthly cycle ~30 days
  const cyclePosition = daysSincePurchase % 30;
  return cyclePosition >= 28; // Last 2 days of cycle
}

/**
 * Get human-readable reason for the risk score
 */
export function getPrimaryRiskReason(breakdown: ScoreBreakdown): string {
  const reasons: string[] = [];

  if (breakdown.duration_score >= 30) {
    reasons.push(`Refunded ${breakdown.factors.duration_hours.toFixed(1)}h after purchase`);
  }
  if (breakdown.frequency_score >= 20) {
    reasons.push(`${breakdown.factors.refund_count} previous refunds`);
  }
  if (breakdown.billing_cycle_score > 0) {
    reasons.push('Refunded on last day of billing cycle');
  }
  if (breakdown.product_type_score >= 15) {
    reasons.push('Consumable product (high risk category)');
  }

  return reasons.join(', ') || 'Standard risk assessment';
}