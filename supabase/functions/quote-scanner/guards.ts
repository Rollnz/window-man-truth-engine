// ═══════════════════════════════════════════════════════════════════════════
// GUARD FUNCTIONS
// Rate limiting, IP detection, request validation
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "./deps.ts";

// CORS Headers (matching project pattern)
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Extract client IP from request headers
 */
export function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

/**
 * Require JSON content-type and parse body
 */
export async function requireJson(req: Request): Promise<unknown> {
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw { status: 415, message: 'Content-Type must be application/json' };
  }
  try {
    return await req.json();
  } catch {
    throw { status: 400, message: 'Invalid JSON body' };
  }
}

/**
 * Cap request body size
 */
export function capBodySize(body: unknown, maxBytes: number): void {
  const size = JSON.stringify(body).length;
  if (size > maxBytes) {
    throw { status: 413, message: `Request body too large (${Math.round(size / 1024 / 1024)}MB exceeds ${Math.round(maxBytes / 1024 / 1024)}MB limit)` };
  }
}

/**
 * Rate limiting result type
 */
export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

/**
 * Check rate limit using project's existing rate_limits table pattern
 */
export async function checkRateLimit(
  identifier: string, 
  endpoint: string, 
  limit: number, 
  windowMs: number
): Promise<RateLimitResult> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const windowStart = new Date(Date.now() - windowMs);

  try {
    const { count } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('created_at', windowStart.toISOString());

    if (count && count >= limit) {
      console.log(`Rate limit exceeded for ${identifier}: ${count} requests in window`);
      return { allowed: false, retryAfter: Math.ceil(windowMs / 1000) };
    }

    // Record this request
    await supabase.from('rate_limits').insert({
      identifier,
      endpoint,
    });

    // Cleanup old records periodically (1 in 100 requests)
    if (Math.random() < 0.01) {
      await supabase.rpc('cleanup_rate_limits');
    }

    return { allowed: true };
  } catch (error) {
    console.error("Rate limit check error:", error);
    return { allowed: true }; // Fail-open for availability
  }
}

/**
 * Handle guard errors and return appropriate Response
 */
export function handleGuardError(error: unknown): Response {
  if (typeof error === 'object' && error !== null && 'status' in error && 'message' in error) {
    const guardErr = error as { status: number; message: string };
    return new Response(
      JSON.stringify({ error: guardErr.message }),
      { status: guardErr.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  throw error;
}
