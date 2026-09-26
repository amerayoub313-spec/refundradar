import type { Env, EmailAlertData } from '../types';

const RESEND_API_URL = 'https://api.resend.com/emails';

interface ResendSendResponse {
  id: string;
}

interface ResendErrorResponse {
  message: string;
  name: string;
}

/**
 * Send email via Resend API
 */
export async function sendEmail(
  env: Env,
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RefundRadar Alerts <alerts@refundradar.io>',
        to: [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      }),
    });

    const data = await response.json() as ResendSendResponse | ResendErrorResponse;

    if (!response.ok) {
      const error = data as ResendErrorResponse;
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: (data as ResendSendResponse).id };
  } catch (error) {
    console.error('Email send error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Generate Red Alert Email HTML
 */
export function generateRedAlertEmail(data: EmailAlertData): { subject: string; html: string; text: string } {
  const riskColor = '#DA1E28';
  const dashboardUrl = data.dashboard_url;
  
  const subject = `🔴 High Risk Refund Alert: ${data.app_name} - $${data.price_usd.toFixed(2)}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>High Risk Refund Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <tr>
      <td style="padding: 20px 0; text-align: center;">
        <div style="display: inline-block; background: linear-gradient(135deg, #0F62FE 0%, #0043CE 100%); color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 18px;">
          RefundRadar
        </div>
      </td>
    </tr>
    
    <!-- Alert Banner -->
    <tr>
      <td style="background: ${riskColor}; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700;">🔴 HIGH RISK REFUND DETECTED</h1>
        <p style="margin: 8px 0 0; font-size: 16px; opacity: 0.9;">Risk Score: ${data.risk_score}/100</p>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <!-- Primary Reason -->
        <div style="background: #FDEDEC; border-left: 4px solid ${riskColor}; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-size: 14px; color: #DA1E28; font-weight: 600;">Primary Trigger</p>
          <p style="margin: 8px 0 0; font-size: 16px; color: #161616;">${data.primary_reason}</p>
        </div>
        
        <!-- Details Table -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #E0E0E0; color: #525252; font-size: 14px;">App</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #E0E0E0; text-align: right; font-weight: 600; color: #161616;">${data.app_name}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #E0E0E0; color: #525252; font-size: 14px;">User ID</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #E0E0E0; text-align: right; font-weight: 600; color: #161616; font-family: monospace;">${data.app_user_id}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #E0E0E0; color: #525252; font-size: 14px;">Product</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #E0E0E0; text-align: right; font-weight: 600; color: #161616;">${data.product_id}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #E0E0E0; color: #525252; font-size: 14px;">Amount</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #E0E0E0; text-align: right; font-weight: 600; color: #161616;">${data.currency} ${data.price_usd.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #E0E0E0; color: #525252; font-size: 14px;">Refunded</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #E0E0E0; text-align: right; font-weight: 600; color: #161616;">${new Date(data.refunded_at).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #525252; font-size: 14px;">Risk Score</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 700; color: ${riskColor}; font-size: 18px;">${data.risk_score}/100</td>
          </tr>
        </table>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin-top: 30px;">
          <a href="${dashboardUrl}" 
             style="display: inline-block; background: ${riskColor}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            View in Dashboard →
          </a>
        </div>
        
        <!-- Quick Action -->
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #E0E0E0; text-align: center;">
          <p style="margin: 0 0 12px; font-size: 14px; color: #525252;">Quick Action:</p>
          <a href="${dashboardUrl}/alerts?action=revoke&user=${encodeURIComponent(data.app_user_id)}"
             style="display: inline-block; background: white; color: ${riskColor}; border: 2px solid ${riskColor}; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Revoke Entitlement
          </a>
        </div>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="padding: 20px; text-align: center; color: #8C8C8C; font-size: 12px;">
        <p style="margin: 0;">You received this because you enabled high-risk refund alerts.</p>
        <p style="margin: 8px 0 0;">
          <a href="${dashboardUrl}/settings/notifications" style="color: #0F62FE; text-decoration: none;">Manage notifications</a> •
          <a href="${dashboardUrl}" style="color: #0F62FE; text-decoration: none;">Open Dashboard</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
RefundRadar - HIGH RISK REFUND ALERT

App: ${data.app_name}
User ID: ${data.app_user_id}
Product: ${data.product_id}
Amount: ${data.currency} ${data.price_usd.toFixed(2)}
Refunded: ${new Date(data.refunded_at).toLocaleString()}
Risk Score: ${data.risk_score}/100 (${data.risk_level.toUpperCase()})

Primary Trigger: ${data.primary_reason}

View in Dashboard: ${dashboardUrl}
Quick Action - Revoke Entitlement: ${dashboardUrl}/alerts?action=revoke&user=${encodeURIComponent(data.app_user_id)}

---
Manage notifications: ${dashboardUrl}/settings/notifications
  `.trim();

  return { subject, html, text };
}

/**
 * Generate Yellow Alert Email (less urgent)
 */
export function generateYellowAlertEmail(data: EmailAlertData): { subject: string; html: string; text: string } {
  const riskColor = '#B96B00';
  const dashboardUrl = data.dashboard_url;
  
  const subject = `🟡 Medium Risk Refund: ${data.app_name} - $${data.price_usd.toFixed(2)}`;
  
  const html = generateRedAlertEmail(data).html
    .replace(/🔴 HIGH RISK REFUND DETECTED/g, '🟡 MEDIUM RISK REFUND DETECTED')
    .replace(/background: #DA1E28/g, `background: ${riskColor}`)
    .replace(/border-left: 4px solid #DA1E28/g, `border-left: 4px solid ${riskColor}`)
    .replace(/color: #DA1E28/g, `color: ${riskColor}`)
    .replace(/background: #FDEDEC/g, 'background: #FFF8E1')
    .replace(/color: #DA1E28/g, `color: ${riskColor}`)
    .replace(/background: #DA1E28/g, `background: ${riskColor}`)
    .replace(/border: 2px solid #DA1E28/g, `border: 2px solid ${riskColor}`)
    .replace(/color: #DA1E28/g, `color: ${riskColor}`);

  const text = generateRedAlertEmail(data).text
    .replace('HIGH RISK REFUND ALERT', 'MEDIUM RISK REFUND ALERT')
    .replace('HIGH RISK', 'MEDIUM RISK');

  return { subject, html, text };
}

/**
 * Send alert email based on risk level
 */
export async function sendAlertEmail(
  env: Env,
  data: EmailAlertData
): Promise<{ success: boolean; id?: string; error?: string }> {
  const { subject, html, text } = data.risk_level === 'red'
    ? generateRedAlertEmail(data)
    : generateYellowAlertEmail(data);
  
  return sendEmail(env, data.developer_email, subject, html, text);
}

/**
 * Send test email
 */
export async function sendTestEmail(
  env: Env,
  to: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const subject = 'RefundRadar - Test Notification';
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h1 style="color: #0F62FE;">Test Email from RefundRadar</h1>
    <p>This is a test email to verify your notification settings are working correctly.</p>
    <p>If you received this, your email integration is properly configured!</p>
    <hr style="margin: 24px 0;">
    <p style="color: #8C8C8C; font-size: 14px;">RefundRadar - Automated refund abuse detection</p>
  </div>
</body>
</html>
  `.trim();
  
  return sendEmail(env, to, subject, html);
}