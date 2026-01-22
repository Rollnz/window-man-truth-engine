/**
 * Persistent Visitor Identity Hook
 * 
 * Manages the `wm_vid` (Window Man Visitor ID) - a first-party cookie with ~400-day TTL.
 * This enables:
 * - Long-term visitor tracking across sessions
 * - Attribution of leads to specific tools/pages
 * - Measurement of tool performance over time
 * - Cross-session behavior analysis
 * 
 * CRITICAL: visitor_id is separate from external_id (lead UUID)
 * - visitor_id: Identifies the person (persistent, 400 days)
 * - external_id: Identifies the lead (one per form submission)
 */

import { useEffect, useState } from 'react';

/**
 * Generate UUID v4 using native crypto API with fallback for older browsers
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const VISITOR_ID_COOKIE_NAME = 'wm_vid';
const VISITOR_ID_TTL_DAYS = 400; // ~13 months

/**
 * Get or create visitor ID from cookie
 */
function getOrCreateVisitorId(): string {
  // Check if cookie exists
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === VISITOR_ID_COOKIE_NAME && value) {
      return decodeURIComponent(value);
    }
  }

  // Create new visitor ID
  const newVisitorId = generateUUID();
  setVisitorIdCookie(newVisitorId);
  return newVisitorId;
}

/**
 * Set visitor ID cookie with 400-day TTL
 */
function setVisitorIdCookie(visitorId: string): void {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + VISITOR_ID_TTL_DAYS);

  document.cookie = `${VISITOR_ID_COOKIE_NAME}=${encodeURIComponent(visitorId)}; path=/; expires=${expirationDate.toUTCString()}; Secure; SameSite=Lax`;
}

/**
 * Hook: useVisitorIdentity
 * 
 * Returns the persistent visitor ID and provides methods to access it.
 * 
 * Usage:
 * ```
 * const { visitorId, getVisitorId } = useVisitorIdentity();
 * 
 * // In event tracking:
 * trackEvent('lead_captured', {
 *   visitor_id: visitorId,
 *   external_id: leadId,
 *   ...
 * });
 * ```
 */
export function useVisitorIdentity() {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get or create visitor ID on mount
    const id = getOrCreateVisitorId();
    setVisitorId(id);
    setIsLoading(false);
  }, []);

  /**
   * Get the current visitor ID
   * Returns null if not yet loaded
   */
  const getVisitorId = (): string | null => visitorId;

  /**
   * Get visitor ID with fallback
   * Safe to use in event tracking even if hook hasn't loaded yet
   */
  const getVisitorIdSafe = (): string => {
    if (visitorId) return visitorId;
    return getOrCreateVisitorId();
  };

  return {
    visitorId,
    getVisitorId,
    getVisitorIdSafe,
    isLoading,
  };
}

/**
 * Standalone function: Get visitor ID without hook
 * Useful for non-React contexts or server-side code
 */
export function getVisitorIdStandalone(): string {
  return getOrCreateVisitorId();
}

/**
 * Standalone function: Set visitor ID cookie
 * Useful for testing or manual cookie management
 */
export function setVisitorIdCookieStandalone(visitorId: string): void {
  setVisitorIdCookie(visitorId);
}

/**
 * Standalone function: Clear visitor ID cookie
 * Useful for testing or user opt-out
 */
export function clearVisitorIdCookie(): void {
  document.cookie = `${VISITOR_ID_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; Secure; SameSite=Lax`;
}

/**
 * Get visitor ID from cookie (synchronous, no hook needed)
 * Returns null if cookie doesn't exist
 */
export function getVisitorIdFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === VISITOR_ID_COOKIE_NAME && value) {
      return decodeURIComponent(value);
    }
  }
  return null;
}
