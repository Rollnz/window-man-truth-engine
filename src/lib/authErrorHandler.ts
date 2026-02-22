import { refreshWithLock } from '@/lib/authRefreshLock';

/**
 * Result of auth error handling.
 * Callers use this to decide whether to retry, show a toast, or do nothing.
 */
export interface AuthErrorResult {
  /** Whether the error was a 401/Unauthorized */
  was401: boolean;
  /** Whether the session was successfully refreshed (only meaningful if was401) */
  refreshed: boolean;
}

/**
 * Checks if an error is a 401 Unauthorized.
 * If so, attempts to refresh the session via the singleton lock.
 * 
 * - Returns `{ was401: false }` for non-401 errors.
 * - Returns `{ was401: true, refreshed: true }` if session was refreshed.
 * - Returns `{ was401: true, refreshed: false }` if session is dead.
 *   Also dispatches `auth:session-expired` custom event so the overlay
 *   can show without doing a hard redirect (preserving form state).
 * 
 * NEVER redirects directly. The SessionExpiredOverlay handles UI.
 */
export async function handleAuthError(error: unknown): Promise<AuthErrorResult> {
  const is401 = isUnauthorizedError(error);

  if (!is401) {
    return { was401: false, refreshed: false };
  }

  console.warn('[AuthErrorHandler] Detected 401 — attempting session refresh via lock');

  const refreshed = await refreshWithLock();

  if (!refreshed) {
    console.warn('[AuthErrorHandler] Session is dead — dispatching session-expired event');
    // Dispatch event for the overlay instead of hard redirect
    window.dispatchEvent(new CustomEvent('auth:session-expired'));
    return { was401: true, refreshed: false };
  }

  console.log('[AuthErrorHandler] Session refreshed successfully');
  return { was401: true, refreshed: true };
}

/**
 * Detect 401/Unauthorized from various error shapes:
 * - Supabase FunctionsHttpError with status in message
 * - Generic Error with "401" or "Unauthorized" in message
 * - Response-like objects with status property
 */
export function isUnauthorizedError(error: unknown): boolean {
  if (!error) return false;

  // Check for status property (e.g. from fetchEdgeFunction enriched errors)
  if (typeof error === 'object' && 'status' in error) {
    if ((error as any).status === 401) return true;
  }

  // Check FunctionsHttpError from Supabase SDK — the message is a generic
  // "Edge Function returned a non-2xx status code" so we must inspect
  // error.context (a Response object) for the actual HTTP status.
  if (typeof error === 'object' && error !== null && 'context' in error) {
    const ctx = (error as any).context;
    if (ctx && typeof ctx === 'object' && 'status' in ctx) {
      if (ctx.status === 401) return true;
    }
  }

  if (error instanceof Error) {
    const msg = error.message || '';
    return (
      msg.includes('401') ||
      msg.includes('Unauthorized') ||
      msg.includes('Auth session missing') ||
      msg.includes('JWT expired') ||
      msg.includes('invalid claim: missing sub claim')
    );
  }

  return false;
}
