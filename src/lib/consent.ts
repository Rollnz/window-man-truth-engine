/**
 * Privacy-First Consent Utility
 * 
 * SCOPE: Only governs PII inclusion (hashed email/phone in user_data).
 * Anonymous telemetry events ALWAYS fire regardless of consent.
 * 
 * Consent is granted when:
 * - User explicitly submits a form (email/phone provided)
 * - User explicitly opts in via cookie banner (setMarketingConsent)
 * 
 * NOTE: "Implied consent by interaction" is avoided for legal safety.
 * PII is only included AFTER form submission, not based on tool usage alone.
 */

const CONSENT_KEY = 'wte-marketing-consent';

/**
 * Check if user has consented to PII inclusion in tracking
 * 
 * Returns true ONLY if:
 * - User has explicitly provided email/phone via form submission
 * - User has explicitly opted in via setMarketingConsent()
 * 
 * Tool completions alone do NOT grant consent - this is a legal safety measure.
 */
export function hasMarketingConsent(): boolean {
  try {
    // Check session data for EXPLICIT form submission (email provided)
    const sessionData = localStorage.getItem('impact-windows-session');
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      // Email submission = explicit consent for PII tracking
      if (parsed.email) return true;
    }
    
    // Check explicit consent flag (from cookie banner or direct opt-in)
    const explicit = localStorage.getItem(CONSENT_KEY);
    return explicit === 'true';
  } catch {
    // If storage fails, default to no consent (privacy-first)
    return false;
  }
}

/**
 * Explicitly set marketing consent preference
 * Used when user completes a form or opts in via cookie banner
 */
export function setMarketingConsent(value: boolean): void {
  try {
    localStorage.setItem(CONSENT_KEY, String(value));
  } catch {
    // Silently fail - storage might be full or blocked
  }
}

/**
 * Clear marketing consent (for GDPR opt-out requests)
 */
export function clearMarketingConsent(): void {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    // Silently fail
  }
}

/**
 * Grant consent after form submission
 * Called automatically when user provides email/phone
 */
export function grantConsentOnFormSubmit(): void {
  setMarketingConsent(true);
}
