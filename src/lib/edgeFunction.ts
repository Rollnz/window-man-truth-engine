/**
 * Centralized Edge Function Wrappers
 * 
 * Provides automatic 401 detection, session refresh (via singleton lock),
 * and safe retry logic for all edge function calls.
 * 
 * Key safety features:
 * - Thundering herd prevention (shared refresh lock)
 * - Double-POST prevention (only GET/idempotent calls auto-retry)
 * - Error type preservation (no stripping of Supabase error shapes)
 * - Single retry only (no infinite loops)
 * - Dead session → dispatches event for overlay (no hard redirect)
 */

import { supabase } from '@/integrations/supabase/client';
import { handleAuthError, type AuthErrorResult } from '@/lib/authErrorHandler';
import { SessionRefreshedError } from '@/lib/errors';

// ─── invokeEdgeFunction ───────────────────────────────────────────────────────

interface InvokeOptions {
  body?: unknown;
  headers?: Record<string, string>;
  /**
   * Set to `true` for read-only / idempotent calls (e.g. `get-ticker-stats`).
   * When true, the request will auto-retry silently after a successful
   * session refresh. When false (default), a `SessionRefreshedError` is
   * thrown so the caller can prompt the user to resubmit.
   */
  isIdempotent?: boolean;
}

/**
 * Drop-in replacement for `supabase.functions.invoke()` with automatic
 * 401 recovery.
 * 
 * Returns `{ data, error }` matching the Supabase SDK shape. The original
 * error object is preserved (no type stripping).
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  options: InvokeOptions = {},
): Promise<{ data: T | null; error: Error | null }> {
  const { body, headers, isIdempotent = false } = options;

  const invokeOpts = {
    ...(body !== undefined ? { body } : {}),
    ...(headers ? { headers } : {}),
  };

  // First attempt
  const { data, error } = await supabase.functions.invoke(functionName, invokeOpts);

  if (!error) {
    return { data: data as T, error: null };
  }

  // Check for 401
  const result: AuthErrorResult = await handleAuthError(error);

  if (!result.was401) {
    // Not a 401 — pass the original error through untouched
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }

  if (!result.refreshed) {
    // Session is dead — overlay will show. Return the original error.
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }

  // Session was refreshed. Retry only if safe.
  if (!isIdempotent) {
    return { data: null, error: new SessionRefreshedError() };
  }

  // Safe retry (exactly once — no recursion)
  const retry = await supabase.functions.invoke(functionName, invokeOpts);
  return {
    data: retry.data as T,
    error: retry.error
      ? retry.error instanceof Error
        ? retry.error
        : new Error(String(retry.error))
      : null,
  };
}

// ─── fetchEdgeFunction ────────────────────────────────────────────────────────

interface FetchOptions {
  method?: string;
  body?: unknown;
  params?: URLSearchParams | Record<string, string>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Authenticated fetch to edge functions with automatic 401 recovery.
 * 
 * Replaces the manual `fetch()` + `getSession()` + Authorization header
 * pattern used across admin hooks.
 * 
 * - GET requests auto-retry after successful refresh.
 * - Non-GET requests throw `SessionRefreshedError` so the caller can
 *   prompt the user to resubmit.
 */
export async function fetchEdgeFunction<T = any>(
  functionName: string,
  options: FetchOptions = {},
): Promise<{ data: T; response: Response }> {
  const { method = 'GET', body, params, headers = {}, signal } = options;

  const makeRequest = async (): Promise<{ data: T; response: Response }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('401 Unauthorized: Auth session missing');
    }

    const queryString = params
      ? `?${params instanceof URLSearchParams ? params.toString() : new URLSearchParams(params).toString()}`
      : '';

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const url = `${supabaseUrl}/functions/v1/${functionName}${queryString}`;

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      ...(signal ? { signal } : {}),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const err = new Error(errorData.error || `${res.status} ${res.statusText}`);
      // Attach status for downstream checks
      (err as any).status = res.status;
      throw err;
    }

    const data = await res.json();
    return { data: data as T, response: res };
  };

  try {
    return await makeRequest();
  } catch (error) {
    // Don't attempt auth recovery for abort errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }

    const result: AuthErrorResult = await handleAuthError(error);

    if (!result.was401) {
      throw error; // Not a 401 — rethrow as-is
    }

    if (!result.refreshed) {
      throw error; // Dead session — overlay handles it
    }

    // Session refreshed. Only auto-retry safe methods.
    const isSafeMethod = method.toUpperCase() === 'GET';

    if (!isSafeMethod) {
      throw new SessionRefreshedError();
    }

    // Exactly one retry — if this also 401s, it throws normally (no recursion)
    return await makeRequest();
  }
}
