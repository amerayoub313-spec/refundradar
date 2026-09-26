import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, ApiResponse } from '../types';
import { createDatabaseClient, getAlertForRevocation } from '../services/database';
import { decryptSecret } from '../crypto/signature';
import { RevenueCatClient } from '../services/revenuecat';

const revoke = new Hono<{ Bindings: Env }>();

// Revoke request schema
const RevokeRequestSchema = z.object({
  alert_id: z.string().uuid(),
  app_user_id: z.string().min(1),
  entitlement_id: z.string().min(1),
  confirmation: z.literal('REVOKE'),
});

type RevokeRequest = z.infer<typeof RevokeRequestSchema>;

/**
 * POST /api/revoke
 * Execute entitlement revocation via RevenueCat API
 * Requires Supabase Auth session token in Authorization header
 */
revoke.post('/', async (c) => {
  const startTime = Date.now();
  const env = c.env;

  try {
    // 1. Get and validate Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Missing or invalid Authorization header',
        code: 401,
      }, 401);
    }

    const sessionToken = authHeader.slice(7); // Remove "Bearer "

    // 2. Parse and validate request body
    let body: RevokeRequest;
    try {
      const parsed = await c.req.json();
      const result = RevokeRequestSchema.safeParse(parsed);
      if (!result.success) {
        return c.json<ApiResponse>({
          success: false,
          error: 'Invalid request body',
          code: 400,
          details: result.error.issues,
        }, 400);
      }
      body = result.data;
    } catch {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid JSON payload',
        code: 400,
      }, 400);
    }

    // 3. Create Supabase client with user's session token (for RLS)
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseAnonKey = env.SUPABASE_ANON_KEY;
    
    const { createClient } = await import('@supabase/supabase-js');
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 4. Get current user from session
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid or expired session',
        code: 401,
      }, 401);
    }

    // 5. Get alert with full context (verifies ownership via RLS)
    const db = createDatabaseClient(env);
    const alertData = await getAlertForRevocation(db, body.alert_id);
    
    if (!alertData) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Alert not found or access denied',
        code: 404,
      }, 404);
    }

    // 6. Verify the alert belongs to the current developer
    if (alertData.developer.id !== user.id) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Access denied: alert belongs to different developer',
        code: 403,
      }, 403);
    }

    // 7. Verify the app_user_id matches
    const refundEvent = alertData.refund_event;
    if (refundEvent.app_user_id !== body.app_user_id) {
      return c.json<ApiResponse>({
        success: false,
        error: 'app_user_id does not match alert',
        code: 400,
      }, 400);
    }

    // 8. Verify the entitlement_id matches
    if (refundEvent.entitlement_id !== body.entitlement_id) {
      return c.json<ApiResponse>({
        success: false,
        error: 'entitlement_id does not match alert',
        code: 400,
      }, 400);
    }

    // 9. Get and decrypt RevenueCat API key
    const { data: creds, error: credsError } = await db
      .from('revenuecat_credentials')
      .select('api_key_encrypted')
      .eq('developer_id', user.id)
      .single();

    if (credsError || !creds) {
      console.error('Failed to fetch RevenueCat credentials', { developer_id: user.id, error: credsError });
      return c.json<ApiResponse>({
        success: false,
        error: 'RevenueCat credentials not configured',
        code: 400,
      }, 400);
    }

    // Decrypt the API key
    const encryptionKey = env.ENCRYPTION_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
    let apiKey: string;
    try {
      apiKey = await decryptSecret(creds.api_key_encrypted, encryptionKey);
    } catch (decryptError) {
      console.error('Failed to decrypt API key', { error: decryptError });
      return c.json<ApiResponse>({
        success: false,
        error: 'Failed to decrypt RevenueCat API key',
        code: 500,
      }, 500);
    }

    // 10. Call RevenueCat API to revoke entitlement
    const revenueCatClient = new RevenueCatClient(apiKey);
    let revokeResponse: any;
    
    try {
      revokeResponse = await revenueCatClient.revokeEntitlement(body.app_user_id, body.entitlement_id);
    } catch (rcError) {
      const errorMessage = rcError instanceof Error ? rcError.message : 'RevenueCat API error';
      console.error('RevenueCat revoke failed', { 
        alert_id: body.alert_id, 
        app_user_id: body.app_user_id, 
        entitlement_id: body.entitlement_id,
        error: errorMessage 
      });

      // Record failed revocation attempt
      await db.from('entitlement_revocations').insert({
        alert_id: body.alert_id,
        app_id: alertData.app.id,
        developer_id: user.id,
        app_user_id: body.app_user_id,
        entitlement_id: body.entitlement_id,
        revenuecat_response: { error: errorMessage },
        success: false,
        error_message: errorMessage,
      });

      return c.json<ApiResponse>({
        success: false,
        error: `RevenueCat API error: ${errorMessage}`,
        code: 502,
      }, 502);
    }

    // 11. Record successful revocation
    const { data: revocation, error: revError } = await db
      .from('entitlement_revocations')
      .insert({
        alert_id: body.alert_id,
        app_id: alertData.app.id,
        developer_id: user.id,
        app_user_id: body.app_user_id,
        entitlement_id: body.entitlement_id,
        revenuecat_response: revokeResponse,
        success: true,
        error_message: null,
      })
      .select()
      .single();

    if (revError) {
      console.error('Failed to record revocation', { error: revError });
      // Don't fail the request, revocation succeeded
    }

    // 12. Update alert status to 'revoked'
    await db
      .from('alerts')
      .update({ 
        status: 'revoked', 
        updated_at: new Date().toISOString(),
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user.id,
      })
      .eq('id', body.alert_id);

    const processingTime = Date.now() - startTime;

    console.info('Entitlement revoked successfully', {
      alert_id: body.alert_id,
      app_user_id: body.app_user_id,
      entitlement_id: body.entitlement_id,
      revocation_id: revocation?.id,
      processing_time_ms: processingTime,
    });

    return c.json<ApiResponse<{ revocation_id: string }>>({
      success: true,
      data: { revocation_id: revocation?.id },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Revoke endpoint error:', error);
    
    return c.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 500,
      processing_time_ms: processingTime,
    }, 500);
  }
});

export default revoke;