/**
 * Privacy-First Consent & Submission Flag Utility
 * 
 * PHASE 1A: Explicit Submission Flag for PII Gating
 * 
 * PII (hashed email/phone in user_data) is ONLY included when:
 * - explicit_submission_flag === true
 * - This flag is set ONLY after successful lead POST + lead_id persisted
 * 
 * This replaces the old implicit consent logic that inferred consent from
 * email presence in session storage (which was a legal/security risk).
 * 
 * Anonymous telemetry events ALWAYS fire regardless of submission status.
 */

const SUBMISSION_FLAG_KEY = 'wte-explicit-submission';
const SUBMITTED_LEAD_ID_KEY = 'wte-submitted-lead-id';

/**
 * Check if user has explicitly submitted a form with PII
 * 
 * Returns true ONLY if:
 * - setExplicitSubmission() was called after a successful lead POST
 * - A valid lead_id was persisted alongside the flag
 * 
 * This is the ONLY way to gate PII in enhanced conversions.
 */
export function hasExplicitSubmission(): boolean {
  try {
    const flag = localStorage.getItem(SUBMISSION_FLAG_KEY);
    const leadId = localStorage.getItem(SUBMITTED_LEAD_ID_KEY);
    
    // Both flag AND leadId must be present
    return flag === 'true' && !!leadId;
  } catch {
    // If storage fails, default to no submission (privacy-first)
    return false;
  }
}

/**
 * Get the submitted lead ID (if any)
 */
export function getSubmittedLeadId(): string | null {
  try {
    return localStorage.getItem(SUBMITTED_LEAD_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Mark explicit submission after successful lead POST
 * 
 * MUST be called only after:
 * 1. Lead POST to save-lead succeeds
 * 2. A valid lead_id is returned from the server
 * 
 * This is the ONLY way to enable PII in tracking.
 */
export function setExplicitSubmission(leadId: string): void {
  if (!leadId) {
    console.warn('[Consent] Cannot set explicit submission without leadId');
    return;
  }
  
  try {
    localStorage.setItem(SUBMISSION_FLAG_KEY, 'true');
    localStorage.setItem(SUBMITTED_LEAD_ID_KEY, leadId);
    console.log('[Consent] Explicit submission flag set for lead:', leadId.slice(0, 8) + '...');
  } catch {
    // Silently fail - storage might be full or blocked
    console.warn('[Consent] Failed to set explicit submission flag');
  }
}

/**
 * Clear submission flag (for GDPR opt-out or testing)
 */
export function clearExplicitSubmission(): void {
  try {
    localStorage.removeItem(SUBMISSION_FLAG_KEY);
    localStorage.removeItem(SUBMITTED_LEAD_ID_KEY);
  } catch {
    // Silently fail
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEPRECATED: Legacy consent functions (kept for backward compatibility)
// These should NOT be used for PII gating anymore
// ═══════════════════════════════════════════════════════════════════════════

const CONSENT_KEY = 'wte-marketing-consent';

/**
 * @deprecated Use hasExplicitSubmission() instead for PII gating
 * This function is kept only for backward compatibility with non-PII tracking
 */
export function hasMarketingConsent(): boolean {
  // Now delegates to explicit submission check
  return hasExplicitSubmission();
}

/**
 * @deprecated Use setExplicitSubmission(leadId) instead
 */
export function setMarketingConsent(value: boolean): void {
  try {
    localStorage.setItem(CONSENT_KEY, String(value));
  } catch {
    // Silently fail
  }
}

/**
 * @deprecated Use clearExplicitSubmission() instead
 */
export function clearMarketingConsent(): void {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    // Silently fail
  }
}

/**
 * @deprecated Use setExplicitSubmission(leadId) directly in useLeadFormSubmit
 */
export function grantConsentOnFormSubmit(): void {
  // No-op: This should never be called anymore
  // Explicit submission requires a leadId
  console.warn('[Consent] grantConsentOnFormSubmit is deprecated. Use setExplicitSubmission(leadId) instead.');
}
