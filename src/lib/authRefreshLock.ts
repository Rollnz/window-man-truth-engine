import { supabase } from '@/integrations/supabase/client';

/**
 * Singleton promise lock for session refresh.
 * 
 * Prevents the "thundering herd" problem: when multiple hooks detect 401
 * simultaneously, only ONE refresh request is made. All others piggyback
 * on the same promise.
 */
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to refresh the Supabase session with deduplication.
 * 
 * - If no refresh is in flight, starts one and returns the result.
 * - If a refresh is already in flight, waits for it and returns the same result.
 * - Returns `true` if session was successfully refreshed.
 * - Returns `false` if session is dead (refresh token expired/invalid).
 */
export async function refreshWithLock(): Promise<boolean> {
  // Piggyback on existing refresh if one is in-flight
  if (refreshPromise) {
    console.log('[AuthRefreshLock] Piggybacking on existing refresh');
    return refreshPromise;
  }

  refreshPromise = doRefresh();

  try {
    return await refreshPromise;
  } finally {
    // Clear the lock so the next 401 can trigger a fresh attempt
    refreshPromise = null;
  }
}

async function doRefresh(): Promise<boolean> {
  console.log('[AuthRefreshLock] Starting session refresh');

  try {
    const { error } = await supabase.auth.refreshSession();

    if (error) {
      console.warn('[AuthRefreshLock] Refresh failed:', error.message);
      await supabase.auth.signOut();
      return false;
    }

    console.log('[AuthRefreshLock] Session refreshed successfully');
    return true;
  } catch (err) {
    console.error('[AuthRefreshLock] Unexpected refresh error:', err);
    await supabase.auth.signOut();
    return false;
  }
}
