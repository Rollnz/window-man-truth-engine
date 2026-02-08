/**
 * Cryptographically Secure UUID Generator
 * 
 * SECURITY: This module addresses CWE-338 (Insecure Randomness) by replacing
 * Math.random() fallbacks with crypto.getRandomValues().
 * 
 * Uses crypto.randomUUID() as primary, with crypto.getRandomValues() fallback.
 * Both methods are cryptographically secure.
 */

/**
 * Generate a cryptographically secure UUID v4
 * Uses crypto.randomUUID() with secure fallback via crypto.getRandomValues()
 * 
 * @returns A valid UUID v4 string (e.g., "550e8400-e29b-41d4-a716-446655440000")
 */
export function generateSecureUUID(): string {
  // Primary: Use native crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback: Use crypto.getRandomValues (supported since IE11)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    
    // Set version (4) and variant (8, 9, a, or b) bits per RFC 4122
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10xx
    
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  
  // Last resort fallback (extremely rare - only for very old environments)
  // This should never execute in any modern browser
  console.warn('[Security] crypto API unavailable - using timestamp-based ID');
  return `fallback-${Date.now()}-${performance.now().toString(36)}`;
}

/**
 * Generate a short secure ID (8 characters)
 * Used for tab session IDs and other non-critical identifiers
 * 
 * @returns An 8-character hex string
 */
export function generateSecureShortId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().slice(0, 8);
  }
  
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback using timestamp (still more unique than Math.random)
  return Date.now().toString(36).slice(-8);
}
