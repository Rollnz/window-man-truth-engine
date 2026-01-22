/**
 * Lead Anchor Utility
 * 
 * Persists lead ID across sessions using both localStorage and cookies
 * for 400-day TTL. This enables "Golden Thread" attribution by linking
 * subsequent events back to the original lead.
 * 
 * Storage Strategy:
 * - Primary: localStorage (more reliable, not sent with requests)
 * - Fallback: Cookie (survives incognito, cross-subdomain)
 */

const LEAD_ANCHOR_KEY = 'wm_lead_id';
const TTL_DAYS = 400;
const TTL_SECONDS = TTL_DAYS * 24 * 60 * 60;

// UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate UUID v4 format
 */
export function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/**
 * Read a cookie by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  try {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
}

/**
 * Set a cookie with specified max-age
 */
function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === 'undefined') return;
  
  try {
    // Set cookie with SameSite=Lax for cross-page navigation
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  } catch {
    // Fail silently - cookies might be blocked
  }
}

/**
 * Delete a cookie by setting expired
 */
function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  
  try {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    // Fail silently
  }
}

/**
 * Store lead ID in both localStorage and cookie (400-day TTL)
 * 
 * Call this immediately after successful lead capture.
 * 
 * @param leadId - The UUID of the captured lead
 */
export function setLeadAnchor(leadId: string): void {
  if (typeof window === 'undefined') return;
  
  // Validate UUID format
  if (!isValidUUID(leadId)) {
    console.warn('[leadAnchor] Invalid UUID format, skipping:', String(leadId).slice(0, 8));
    return;
  }
  
  try {
    // Primary: localStorage
    localStorage.setItem(LEAD_ANCHOR_KEY, leadId);
    
    // Fallback: Cookie (400-day TTL)
    setCookie(LEAD_ANCHOR_KEY, leadId, TTL_SECONDS);
    
    console.log('[leadAnchor] Lead anchor set:', leadId.slice(0, 8) + '...');
  } catch (error) {
    // localStorage might be blocked (private browsing)
    // Try cookie-only fallback
    try {
      setCookie(LEAD_ANCHOR_KEY, leadId, TTL_SECONDS);
      console.log('[leadAnchor] Lead anchor set (cookie only):', leadId.slice(0, 8) + '...');
    } catch {
      // Fail silently - both storage methods blocked
    }
  }
}

/**
 * Retrieve the persisted lead ID
 * 
 * Checks localStorage first, then falls back to cookie.
 * Returns null if no valid lead ID is found.
 */
export function getLeadAnchor(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try localStorage first (more reliable)
    const fromStorage = localStorage.getItem(LEAD_ANCHOR_KEY);
    if (fromStorage && isValidUUID(fromStorage)) {
      return fromStorage;
    }
    
    // Fallback to cookie
    const fromCookie = getCookie(LEAD_ANCHOR_KEY);
    if (fromCookie && isValidUUID(fromCookie)) {
      // Sync back to localStorage if it was missing
      try {
        localStorage.setItem(LEAD_ANCHOR_KEY, fromCookie);
      } catch {
        // localStorage blocked, that's okay
      }
      return fromCookie;
    }
    
    return null;
  } catch {
    // Fail silently
    return null;
  }
}

/**
 * Clear the lead anchor from both storage locations
 * 
 * Use sparingly - typically only for testing or explicit user logout.
 */
export function clearLeadAnchor(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(LEAD_ANCHOR_KEY);
    deleteCookie(LEAD_ANCHOR_KEY);
    console.log('[leadAnchor] Lead anchor cleared');
  } catch {
    // Fail silently
  }
}

/**
 * Check if a lead anchor exists
 */
export function hasLeadAnchor(): boolean {
  return getLeadAnchor() !== null;
}
