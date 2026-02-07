/**
 * Golden Thread Identity Module
 * 
 * BROWSER-ONLY: In server/edge contexts, returns a random UUID per call.
 * Edge functions should read client_id from the request payload instead.
 * 
 * This file has ZERO imports to prevent circular dependencies.
 * It provides the canonical visitor identity (FID) for the Window Truth Engine.
 * 
 * Storage Strategy:
 * - Primary: localStorage ('wte-anon-id')
 * - Backup: Cookie ('wte_anon_id', 400-day TTL)
 */

const ANON_ID_KEY = 'wte-anon-id';
const ANON_ID_COOKIE = 'wte_anon_id';
const ANON_ID_TTL_DAYS = 400;

/**
 * Set the Golden Thread ID cookie with 400-day TTL
 */
function setAnonIdCookie(anonId: string): void {
  try {
    const expires = new Date();
    expires.setDate(expires.getDate() + ANON_ID_TTL_DAYS);
    document.cookie = `${ANON_ID_COOKIE}=${encodeURIComponent(anonId)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
  } catch {
    // Silently fail if cookies not available
  }
}

/**
 * Get the Golden Thread ID from cookie if available
 */
function getAnonIdFromCookie(): string | null {
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === ANON_ID_COOKIE && value) {
        return decodeURIComponent(value);
      }
    }
  } catch {
    // Silently fail if cookies not available
  }
  return null;
}

/**
 * Get or create the canonical Golden Thread visitor ID.
 * 
 * Priority:
 * 1. localStorage (primary)
 * 2. Cookie (backup, survives localStorage clear)
 * 3. Generate new UUID (first visit)
 * 
 * This is the SINGLE SOURCE OF TRUTH for visitor identity.
 */
export function getGoldenThreadId(): string {
  if (typeof window === 'undefined') {
    return crypto.randomUUID();
  }

  try {
    // 1. Try localStorage first (primary storage)
    let anonId = localStorage.getItem(ANON_ID_KEY);
    if (anonId) {
      setAnonIdCookie(anonId); // Ensure cookie backup is in sync
      return anonId;
    }
    
    // 2. Try cookie fallback (handles localStorage cleared)
    const cookieId = getAnonIdFromCookie();
    if (cookieId) {
      localStorage.setItem(ANON_ID_KEY, cookieId); // Restore to localStorage
      return cookieId;
    }
    
    // 3. Generate new ID and persist to both
    anonId = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, anonId);
    setAnonIdCookie(anonId);
    return anonId;
  } catch {
    // Fallback for SSR or storage errors
    return crypto.randomUUID();
  }
}

/**
 * Check if a Golden Thread ID already exists (without creating one)
 * Useful for checking if this is a first-time visitor
 */
export function hasGoldenThreadId(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const inLocalStorage = localStorage.getItem(ANON_ID_KEY);
    if (inLocalStorage) return true;
    
    const inCookie = getAnonIdFromCookie();
    return inCookie !== null;
  } catch {
    return false;
  }
}

// Export constants for testing/debugging
export const GOLDEN_THREAD_STORAGE_KEY = ANON_ID_KEY;
export const GOLDEN_THREAD_COOKIE_NAME = ANON_ID_COOKIE;
