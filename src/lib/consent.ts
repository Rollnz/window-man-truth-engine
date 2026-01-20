/**
 * Privacy-First Consent Utility
 * 
 * Uses "implied consent" model:
 * - Tool completion = implied consent (engaged user)
 * - Email provided = explicit consent (form submission)
 * 
 * This approach balances privacy with tracking requirements for
 * Google/Meta Enhanced Conversions.
 */

const CONSENT_KEY = 'wte-marketing-consent';

/**
 * Check if user has marketing consent for PII tracking
 * 
 * Returns true if:
 * - User has completed any tool (implied engagement consent)
 * - User has provided email (explicit form consent)
 * - User has explicitly opted in via setMarketingConsent()
 */
export function hasMarketingConsent(): boolean {
  try {
    // Check session data for engagement signals
    const sessionData = localStorage.getItem('impact-windows-session');
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      // Tool completions = engaged user = implied consent
      if (parsed.toolsCompleted?.length > 0) return true;
      // Email = form submission = explicit consent
      if (parsed.email) return true;
    }
    
    // Check explicit consent flag
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
