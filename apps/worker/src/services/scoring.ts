import type { ScoringFactors, ScoreBreakdown } from '@refundradar/shared';
import {
  calculateFullRiskScore,
  computeDurationHours,
  isLastDayOfBillingCycle,
  getPrimaryRiskReason,
} from '@refundradar/shared';
import type { DatabaseClient, RefundEvent } from '../types';
import { getRefundCountForUser } from './database';

/**
 * Compute scoring factors from refund event and historical data
 */
export async function computeScoringFactors(
  db: DatabaseClient,
  event: RefundEvent
): Promise<ScoringFactors> {
  // Duration in hours between purchase and refund
  const duration_hours = computeDurationHours(event.purchased_at, event.refunded_at);
  
  // Count of previous refunds by same user (excluding current)
  const refund_count = await getRefundCountForUser(db, event.app_id, event.app_user_id, event.id);
  
  // Check if refunded on last day of billing cycle
  const is_last_day_of_cycle = isLastDayOfBillingCycle(
    event.refunded_at,
    event.purchased_at,
    event.product_id
  );
  
  return {
    duration_hours,
    refund_count,
    is_last_day_of_cycle,
    product_id: event.product_id,
  };
}

/**
 * Calculate complete risk score for a refund event
 */
export async function calculateRiskScoreForEvent(
  db: DatabaseClient,
  event: RefundEvent
): Promise<ScoreBreakdown> {
  const factors = await computeScoringFactors(db, event);
  return calculateFullRiskScore(factors, event.product_id);
}

/**
 * Get human-readable primary reason for the risk score
 */
export function getRiskReason(breakdown: ScoreBreakdown): string {
  return getPrimaryRiskReason(breakdown);
}

/**
 * Determine if alert should be created based on risk level
 */
export function shouldCreateAlert(riskLevel: 'green' | 'yellow' | 'red'): boolean {
  return riskLevel === 'yellow' || riskLevel === 'red';
}

/**
 * Determine if email should be sent (only for red by default)
 */
export function shouldSendEmail(riskLevel: 'green' | 'yellow' | 'red', threshold: 'red' | 'yellow' = 'red'): boolean {
  if (threshold === 'red') return riskLevel === 'red';
  return riskLevel === 'red' || riskLevel === 'yellow';
}