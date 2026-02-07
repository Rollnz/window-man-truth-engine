/**
 * Identity Reconciliation
 * 
 * Runs ONCE on app startup to merge all legacy visitor IDs into the canonical
 * Golden Thread ID. Session IDs are intentionally NOT reconciled.
 * 
 * CRITICAL: Only reconciles VISITOR-SCOPED identities, not SESSION-SCOPED.
 * 
 * This module ADOPTS existing legacy IDs before generating new ones,
 * ensuring no history loss for returning users.
 */

import { getGoldenThreadId, GOLDEN_THREAD_STORAGE_KEY, GOLDEN_THREAD_COOKIE_NAME } from './goldenThread';

// VISITOR-SCOPED legacy keys (will be overwritten with canonical ID)
// NOTE: wm-session-id is intentionally EXCLUDED — it's session-scoped
const LEGACY_VISITOR_KEYS = ['wm_client_id', 'wm_vid'];

// Legacy cookies to reconcile
const LEGACY_COOKIES = [
  { name: 'wm_vid', ttlDays: 400 }
];

/**
 * Get an ID from a legacy localStorage key if it exists
 */
function getLegacyLocalStorageId(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Get the canonical Golden Thread ID, adopting from legacy sources if needed.
 * 
 * Adoption order (first non-null wins):
 * 1. wte-anon-id in localStorage (already canonical)
 * 2. wte_anon_id cookie (backup canonical)
 * 3. wm_client_id in localStorage (legacy tracking.ts)
 * 4. wm_vid in localStorage (legacy useVisitorIdentity)
 * 5. Generate new UUID (first visit)
 * 
 * This ensures returning users keep their existing ID.
 */
function getOrAdoptGoldenThreadId(): string {
  if (typeof window === 'undefined') {
    return crypto.randomUUID();
  }

  try {
    // 1. Check if canonical ID already exists
    const existingCanonical = localStorage.getItem(GOLDEN_THREAD_STORAGE_KEY);
    if (existingCanonical) {
      return existingCanonical;
    }

    // 2. Check canonical cookie backup
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === GOLDEN_THREAD_COOKIE_NAME && value) {
        const cookieId = decodeURIComponent(value);
        localStorage.setItem(GOLDEN_THREAD_STORAGE_KEY, cookieId);
        console.log('[Identity] Adopted canonical ID from cookie');
        return cookieId;
      }
    }

    // 3. Check legacy wm_client_id (from tracking.ts)
    const wmClientId = getLegacyLocalStorageId('wm_client_id');
    if (wmClientId) {
      localStorage.setItem(GOLDEN_THREAD_STORAGE_KEY, wmClientId);
      console.log('[Identity] Adopted ID from wm_client_id:', wmClientId.slice(0, 8) + '...');
      return wmClientId;
    }

    // 4. Check legacy wm_vid (from useVisitorIdentity)
    const wmVid = getLegacyLocalStorageId('wm_vid');
    if (wmVid) {
      localStorage.setItem(GOLDEN_THREAD_STORAGE_KEY, wmVid);
      console.log('[Identity] Adopted ID from wm_vid:', wmVid.slice(0, 8) + '...');
      return wmVid;
    }

    // 5. No existing ID found - generate new one via goldenThread.ts
    // getGoldenThreadId() will create and persist a new UUID
    const newId = getGoldenThreadId();
    console.log('[Identity] Generated new Golden Thread ID:', newId.slice(0, 8) + '...');
    return newId;
  } catch (error) {
    console.warn('[Identity] Adoption failed, generating new ID:', error);
    return getGoldenThreadId();
  }
}

/**
 * Reconcile all legacy visitor identities to the canonical Golden Thread ID.
 * 
 * This function:
 * 1. Gets (or adopts) the canonical ID from existing sources
 * 2. Stashes old values for potential rollback
 * 3. Overwrites all legacy localStorage keys with canonical ID
 * 4. Syncs legacy cookies to the canonical value
 * 
 * Returns the canonical Golden Thread ID.
 */
export function reconcileIdentities(): string {
  if (typeof window === 'undefined') {
    return getGoldenThreadId();
  }

  // Get or adopt the canonical ID (this may adopt from legacy sources)
  const canonicalId = getOrAdoptGoldenThreadId();

  // Reconcile localStorage keys
  for (const key of LEGACY_VISITOR_KEYS) {
    try {
      const legacy = localStorage.getItem(key);
      if (legacy && legacy !== canonicalId) {
        // Stash original value for potential rollback (safety net)
        localStorage.setItem(`${key}_pre_migration`, legacy);
        console.log(`[Identity] Stashed ${key}: ${legacy.slice(0, 8)}...`);
      }
      // Always overwrite to ensure consistency
      localStorage.setItem(key, canonicalId);
    } catch (error) {
      console.warn(`[Identity] Failed to reconcile ${key}:`, error);
    }
  }

  // Reconcile cookies (sync all to canonical value)
  for (const { name, ttlDays } of LEGACY_COOKIES) {
    try {
      const expires = new Date();
      expires.setDate(expires.getDate() + ttlDays);
      document.cookie = `${name}=${encodeURIComponent(canonicalId)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
    } catch (error) {
      console.warn(`[Identity] Failed to reconcile cookie ${name}:`, error);
    }
  }

  // Also set the canonical cookie
  try {
    const expires = new Date();
    expires.setDate(expires.getDate() + 400);
    document.cookie = `${GOLDEN_THREAD_COOKIE_NAME}=${encodeURIComponent(canonicalId)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
  } catch (error) {
    console.warn('[Identity] Failed to set canonical cookie:', error);
  }

  return canonicalId;
}

/**
 * Check if pre-migration values exist (for debugging/rollback)
 */
export function getPreMigrationValues(): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  
  for (const key of LEGACY_VISITOR_KEYS) {
    try {
      result[key] = localStorage.getItem(`${key}_pre_migration`);
    } catch {
      result[key] = null;
    }
  }
  
  return result;
}

/**
 * Rollback to pre-migration values (emergency use only)
 */
export function rollbackIdentities(): void {
  if (typeof window === 'undefined') return;

  for (const key of LEGACY_VISITOR_KEYS) {
    try {
      const preMigration = localStorage.getItem(`${key}_pre_migration`);
      if (preMigration) {
        localStorage.setItem(key, preMigration);
        console.log(`[Identity] Rolled back ${key} to:`, preMigration.slice(0, 8) + '...');
      }
    } catch (error) {
      console.warn(`[Identity] Failed to rollback ${key}:`, error);
    }
  }
}
