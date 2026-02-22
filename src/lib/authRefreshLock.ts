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
    // Nudge the SDK: getUser() forces a server round-trip which triggers
    // the SDK's internal auto-refresh if the access token is corrupted
    // but the refresh token is still valid. This synchronizes in-memory
    // auth state before we explicitly call refreshSession().
    try {
      await supabase.auth.getUser();
      console.log('[AuthRefreshLock] getUser() nudge succeeded');
    } catch {
      console.log('[AuthRefreshLock] getUser() nudge failed (expected with corrupted token)');
    }

    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session) {
      console.warn('[AuthRefreshLock] Refresh failed:', error?.message ?? 'no session returned');
      await supabase.auth.signOut();
      return false;
    }

    console.log('[AuthRefreshLock] Session refreshed successfully, new token acquired');
    return true;
  } catch (err) {
    console.error('[AuthRefreshLock] Unexpected refresh error:', err);
    await supabase.auth.signOut();
    return false;
  }
}
