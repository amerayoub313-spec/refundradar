/**
 * Encryption utilities for storing sensitive data (AES-GCM)
 * Used for storing RevenueCat API keys and webhook secrets
 */

const ENCODER = new TextEncoder();

/**
 * Encrypt sensitive data for storage (AES-GCM)
 * 
 * @param plaintext - The plaintext string to encrypt
 * @param encryptionKey - The encryption key (will be padded/truncated to 32 bytes)
 * @returns Base64 encoded string containing IV + ciphertext
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
 * 
 * @param encrypted - Base64 encoded string containing IV + ciphertext
 * @param encryptionKey - The encryption key (will be padded/truncated to 32 bytes)
 * @returns Decrypted plaintext string
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