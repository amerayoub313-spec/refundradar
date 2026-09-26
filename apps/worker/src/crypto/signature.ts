/**
 * RevenueCat Webhook Signature Verification
 * 
 * RevenueCat signs webhooks using HMAC-SHA256.
 * The signature is sent in the X-RevenueCat-Signature header.
 * Format: "v1=<base64_encoded_hmac>"
 * 
 * Reference: https://www.revenuecat.com/docs/webhooks#webhook-signature
 */

const ENCODER = new TextEncoder();

/**
 * Verify RevenueCat webhook signature
 * 
 * @param payload - Raw request body as string
 * @param signature - Value of X-RevenueCat-Signature header
 * @param secret - Webhook secret from RevenueCat dashboard
 * @returns True if signature is valid
 */
export async function verifyRevenueCatSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Parse signature header: "v1=<base64_hmac>"
    const match = signature.match(/^v1=(.+)$/);
    if (!match) {
      return false;
    }
    
    const expectedSignature = match[1];
    
    // Import secret as CryptoKey
    const key = await crypto.subtle.importKey(
      'raw',
      ENCODER.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
    
    // Compute HMAC
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      ENCODER.encode(payload)
    );
    
    // Convert to base64
    const computedSignature = btoa(
      String.fromCharCode(...new Uint8Array(signatureBuffer))
    );
    
    // Timing-safe comparison
    return timingSafeEqual(computedSignature, expectedSignature);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Verify webhook using Bearer token (alternative auth method)
 * RevenueCat can also send a shared secret as Authorization: Bearer <secret>
 */
export function verifyBearerToken(
  authHeader: string | null,
  expectedSecret: string
): boolean {
  if (!authHeader) return false;
  
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  
  return timingSafeEqual(match[1], expectedSecret);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Encrypt sensitive data for storage (AES-GCM)
 * Used for storing RevenueCat API keys and webhook secrets
 */
export async function encryptSecret(
  plaintext: string,
  encryptionKey: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    ENCODER.encode(encryptionKey.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    ENCODER.encode(plaintext)
  );
  
  // Combine IV + ciphertext as base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt sensitive data from storage
 */
export async function decryptSecret(
  encrypted: string,
  encryptionKey: string
): Promise<string> {
  const combined = new Uint8Array(
    atob(encrypted).split('').map(c => c.charCodeAt(0))
  );
  
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  
  const key = await crypto.subtle.importKey(
    'raw',
    ENCODER.encode(encryptionKey.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  
  return new TextDecoder().decode(plaintext);
}

/**
 * Generate a random webhook secret for new apps
 */
export function generateWebhookSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return 'whsec_' + btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}