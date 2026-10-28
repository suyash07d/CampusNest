// ==========================================================================
// CampusNest Edge Functions — Cryptographic Utilities
// Web Crypto API implementations for OTP generation, HMAC hashing & constant-time checks
// ==========================================================================

/**
 * Generate a cryptographically secure 6-digit numeric OTP (100000 - 999999)
 */
export function generateSecureOtp(): string {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  const code = (buffer[0] % 900000) + 100000;
  return code.toString();
}

/**
 * Generate a cryptographically random hexadecimal salt
 */
export function generateSalt(length = 16): string {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash an OTP using HMAC-SHA256 with a per-request salt and server pepper
 */
export async function hashOtp(otp: string, salt: string, pepper: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(pepper);
  const messageData = encoder.encode(`${otp}:${salt}`);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Verify a submitted OTP against the stored HMAC-SHA256 hash
 */
export async function verifyOtpHash(
  submittedOtp: string,
  salt: string,
  pepper: string,
  expectedHash: string
): Promise<boolean> {
  const computedHash = await hashOtp(submittedOtp, salt, pepper);
  return timingSafeEqual(computedHash, expectedHash);
}
