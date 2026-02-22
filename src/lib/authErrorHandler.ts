import { supabase } from '@/integrations/supabase/client';

/**
 * Checks if an error response from an Edge Function is a 401 Unauthorized.
 * If so, attempts to refresh the session. If refresh fails, signs the user out
 * and redirects to /auth.
 *
 * Returns `true` if the error was a 401 (caller should abort its flow).
 */
export async function handleAuthError(error: unknown): Promise<boolean> {
  const is401 =
    error instanceof Error &&
    (error.message.includes('401') ||
      error.message.includes('Unauthorized') ||
      error.message.includes('Auth session missing'));

  if (!is401) return false;

  console.warn('[AuthErrorHandler] Detected 401 — attempting session refresh');

  try {
    const { error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError) {
      console.warn('[AuthErrorHandler] Refresh failed, signing out:', refreshError.message);
      await supabase.auth.signOut();
      // Redirect to auth (only if not already there)
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = `/auth?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
      return true;
    }

    console.log('[AuthErrorHandler] Session refreshed successfully');
    return true; // Caller can retry if desired
  } catch (err) {
    console.error('[AuthErrorHandler] Unexpected error during refresh:', err);
    await supabase.auth.signOut();
    if (!window.location.pathname.startsWith('/auth')) {
      window.location.href = '/auth';
    }
    return true;
  }
}
