/**
 * E.164 Phone Number Formatting Utility
 * 
 * Google Enhanced Conversions requires E.164 format (+1XXXXXXXXXX for US).
 * This utility normalizes phone numbers for proper match quality.
 */

/**
 * Normalize phone number to E.164 format for US numbers
 * Returns undefined if the phone number is invalid
 * 
 * @param phone - Raw phone input (e.g., "(555) 123-4567", "5551234567")
 * @returns E.164 formatted phone (e.g., "+15551234567") or undefined if invalid
 */
export function normalizeToE164(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined;
  
  // Strip all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Handle US numbers (10 digits, or 11 with leading 1)
  let normalized: string;
  
  if (digitsOnly.length === 10) {
    // Standard 10-digit US number
    normalized = `+1${digitsOnly}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    // 11 digits with leading 1 (already has country code)
    normalized = `+${digitsOnly}`;
  } else {
    // Invalid length - don't send to avoid match quality issues
    return undefined;
  }
  
  return normalized;
}

/**
 * Validate if a phone number can be formatted to E.164
 */
export function isValidUSPhone(phone: string | undefined | null): boolean {
  return normalizeToE164(phone) !== undefined;
}

/**
 * Format phone for display (e.g., "(555) 123-4567")
 */
export function formatPhoneDisplay(phone: string | undefined | null): string {
  if (!phone) return '';
  
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Handle 10-digit US numbers
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  }
  
  // Handle 11-digit with leading 1
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `(${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
  }
  
  // Return as-is for invalid numbers
  return phone;
}
