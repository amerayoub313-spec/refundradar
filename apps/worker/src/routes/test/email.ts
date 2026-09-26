import { Hono } from 'hono';
import type { Env } from '../types';
import { sendTestEmail } from '../../services/email';

const test = new Hono<{ Bindings: Env }>();

test.post('/email', async (c) => {
  try {
    const body = await c.req.json();
    const { to, name } = body;
    
    if (!to || typeof to !== 'string') {
      return c.json({ 
        success: false, 
        error: 'Email address is required' 
      }, 400);
    }
    
    const result = await sendTestEmail(c.env, to);
    
    if (!result.success) {
      return c.json({ 
        success: false, 
        error: result.error 
      }, 500);
    }
    
    return c.json({ 
      success: true, 
      data: { message: 'Test email sent successfully', id: result.id } 
    });
  } catch (error) {
    console.error('Test email error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, 500);
  }
});

export default test;