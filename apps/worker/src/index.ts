import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './types';
import webhook from './routes/webhook';
import revoke from './routes/revoke';
import testEmail from './routes/test/email';

// Main Hono app
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['https://app.refundradar.io', 'http://localhost:3000'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-RevenueCat-Signature'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  maxAge: 86400,
}));

// Health check
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '0.0.1',
  });
});

// Webhook routes
app.route('/webhook', webhook);

// Revoke routes
app.route('/api/revoke', revoke);

// Test routes
app.route('/api/test', testEmail);

// 404 handler
app.notFound((c) => {
  return c.json({ 
    success: false, 
    error: 'Not found', 
    code: 404 
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ 
    success: false, 
    error: 'Internal server error', 
    code: 500 
  }, 500);
});

export default app;
export type { Env } from './types';