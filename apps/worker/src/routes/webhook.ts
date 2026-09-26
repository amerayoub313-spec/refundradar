import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, WebhookContext, WebhookProcessingResult, EmailAlertData } from '../types';
import { RevenueCatEventSchema, RevenueCatWebhookSchema } from '@refundradar/shared';
import { verifyRevenueCatSignature, verifyBearerToken } from '../crypto/signature';
import { createDatabaseClient, findAppByRevenueCatId, findDeveloperById, refundEventExists, insertRefundEvent, insertRiskScore, insertAlert, updateAlertEmailStatus, getRevenueCatCredentials } from '../services/database';
import { calculateRiskScoreForEvent, shouldCreateAlert, shouldSendEmail, getRiskReason } from '../services/scoring';
import { sendAlertEmail } from '../services/email';

const webhook = new Hono<{ Bindings: Env }>();

/**
 * POST /webhook/revenuecat
 * Main webhook ingestion endpoint for RevenueCat events
 */
webhook.post('/revenuecat', async (c) => {
  const startTime = Date.now();
  const env = c.env;
  
  try {
    // 1. Get raw body for signature verification
    const rawBody = await c.req.text();
    
    // 2. Parse and validate payload FIRST (to get app_id for per-app secret lookup)
    let payload: z.infer<typeof RevenueCatWebhookSchema>;
    let event: z.infer<typeof RevenueCatEventSchema>;
    try {
      const parsed = JSON.parse(rawBody);
      const result = RevenueCatWebhookSchema.safeParse(parsed);
      if (!result.success) {
        console.warn('Invalid webhook payload', { issues: result.error.issues });
        return c.json({ 
          success: false, 
          error: 'Invalid webhook payload', 
          code: 400,
          details: result.error.issues 
        }, 400);
      }
      payload = result.data;
      event = payload.event;
    } catch (error) {
      console.error('JSON parse error:', error);
      return c.json({ 
        success: false, 
        error: 'Invalid JSON payload', 
        code: 400 
      }, 400);
    }
    
    // 3. Initialize database client
    const db = createDatabaseClient(env);
    
    // 4. Find app by RevenueCat app_id to get per-app webhook secret
    const app = await findAppByRevenueCatId(db, event.app_id);
    if (!app) {
      console.warn('App not found for webhook', { revenuecat_app_id: event.app_id });
      return c.json({ 
        success: false, 
        error: 'App not configured', 
        code: 404 
      }, 404);
    }
    
    // 5. Get per-app webhook secret for signature verification
    const credentials = await getRevenueCatCredentials(db, app.developer_id, env);
    if (!credentials) {
      console.error('Failed to get webhook secret for app', { app_id: app.id });
      return c.json({ 
        success: false, 
        error: 'Webhook secret not configured for this app', 
        code: 500 
      }, 500);
    }
    const webhookSecret = credentials.webhook_secret;
    
    // 6. Verify signature using per-app secret
    const signature = c.req.header('X-RevenueCat-Signature');
    const authHeader = c.req.header('Authorization');
    
    let verified = false;
    
    if (signature && webhookSecret) {
      verified = await verifyRevenueCatSignature(rawBody, signature, webhookSecret);
    } else if (authHeader && webhookSecret) {
      verified = verifyBearerToken(authHeader, webhookSecret);
    }
    
    if (!verified) {
      console.warn('Webhook signature verification failed', {
        hasSignature: !!signature,
        hasAuthHeader: !!authHeader,
        hasSecret: !!webhookSecret,
      });
      return c.json({ 
        success: false, 
        error: 'Invalid webhook signature', 
        code: 401 
      }, 401);
    }
    
    // 7. Only process REFUND events for scoring
    if (event.type !== 'REFUND') {
      // Store other events for history but don't score
      console.info('Non-refund event received, storing for history', { 
        type: event.type, 
        event_id: event.id 
      });
      return c.json({ 
        success: true, 
        status: 'stored', 
        message: 'Non-refund event stored for history' 
      });
    }
    
    // 8. Check idempotency - skip if already processed
    const exists = await refundEventExists(db, event.id);
    if (exists) {
      console.info('Duplicate refund event, skipping', { event_id: event.id });
      return c.json({ 
        success: true, 
        status: 'duplicate', 
        message: 'Event already processed' 
      });
    }
    
    // 9. Get developer info
    const developer = await findDeveloperById(db, app.developer_id);
    if (!developer) {
      console.error('Developer not found for app', { app_id: app.id });
      return c.json({ 
        success: false, 
        error: 'Developer not found', 
        code: 500 
      }, 500);
    }
    
    // 10. Prepare refund event for insertion
    const refundEvent = {
      app_id: app.id,
      revenuecat_event_id: event.id,
      app_user_id: event.app_user_id,
      product_id: event.product_id,
      entitlement_id: event.entitlement_id,
      price_usd: event.price_usd,
      currency: event.currency,
      purchased_at: new Date(event.purchased_at_ms).toISOString(),
      refunded_at: new Date(event.refunded_at_ms!).toISOString(),
      refund_reason: event.refund_reason,
      store: event.store,
      raw_payload: payload as any,
    };
    
    // 11. Insert refund event
    const insertedEvent = await insertRefundEvent(db, refundEvent);
    if (!insertedEvent) {
      return c.json({ 
        success: false, 
        error: 'Failed to persist refund event', 
        code: 500 
      }, 500);
    }
    
    // 12. Calculate risk score
    const scoreBreakdown = await calculateRiskScoreForEvent(db, insertedEvent);
    
    // 13. Insert risk score
    const riskScore = await insertRiskScore(db, {
      refund_event_id: insertedEvent.id,
      app_id: app.id,
      total_score: scoreBreakdown.total_score,
      duration_score: scoreBreakdown.duration_score,
      frequency_score: scoreBreakdown.frequency_score,
      billing_cycle_score: scoreBreakdown.billing_cycle_score,
      product_type_score: scoreBreakdown.product_type_score,
      risk_level: scoreBreakdown.risk_level,
      factor_details: {
        duration_hours: scoreBreakdown.factors.duration_hours,
        refund_count: scoreBreakdown.factors.refund_count,
        is_last_day_of_cycle: scoreBreakdown.factors.is_last_day_of_cycle,
        is_consumable: scoreBreakdown.product_type_score >= 15,
        primary_reason: getRiskReason(scoreBreakdown),
      } as any,
    });
    
    if (!riskScore) {
      console.error('Failed to insert risk score', { event_id: insertedEvent.id });
      // Don't fail the webhook, score can be computed later
    }
    
    // 14. Create alert if needed
    let alert = null;
    if (riskScore && shouldCreateAlert(scoreBreakdown.risk_level)) {
      alert = await insertAlert(db, {
        app_id: app.id,
        risk_score_id: riskScore.id,
        status: 'pending',
        email_sent_status: 'pending',
      });
    }
    
    // 15. Send email alert for Red risk (async, don't block)
    if (alert && shouldSendEmail(scoreBreakdown.risk_level, 'red')) {
      // Send email in background
      c.executionCtx.waitUntil(
        (async () => {
          try {
            const dashboardUrl = `https://app.refundradar.io/alerts?eventId=${insertedEvent.id}`;
            const emailData: EmailAlertData = {
              developer_email: developer.email,
              developer_name: developer.full_name,
              app_name: app.name,
              app_user_id: event.app_user_id,
              product_id: event.product_id,
              price_usd: event.price_usd,
              currency: event.currency,
              risk_score: scoreBreakdown.total_score,
              risk_level: scoreBreakdown.risk_level,
              primary_reason: getRiskReason(scoreBreakdown),
              refunded_at: event.refunded_at_ms ? new Date(event.refunded_at_ms).toISOString() : new Date().toISOString(),
              dashboard_url: dashboardUrl,
            };
            
            const result = await sendAlertEmail(env, emailData);
            await updateAlertEmailStatus(db, alert.id, result.success ? 'sent' : 'failed');
            
            if (!result.success) {
              console.error('Failed to send alert email', { alert_id: alert.id, error: result.error });
            }
          } catch (error) {
            console.error('Email sending error:', error);
            await updateAlertEmailStatus(db, alert.id, 'failed');
          }
        })()
      );
    }
    
    const processingTime = Date.now() - startTime;
    
    console.info('Webhook processed successfully', {
      event_id: event.id,
      app_id: app.id,
      risk_level: scoreBreakdown.risk_level,
      total_score: scoreBreakdown.total_score,
      processing_time_ms: processingTime,
      alert_created: !!alert,
    });
    
    return c.json({
      success: true,
      status: 'processed',
      event_id: event.id,
      refund_event_id: insertedEvent.id,
      risk_score: riskScore ? {
        id: riskScore.id,
        total_score: scoreBreakdown.total_score,
        risk_level: scoreBreakdown.risk_level,
      } : null,
      alert_id: alert?.id || null,
      processing_time_ms: processingTime,
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Webhook processing error:', error);
    
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error', 
      code: 500,
      processing_time_ms: processingTime,
    }, 500);
  }
});

export default webhook;