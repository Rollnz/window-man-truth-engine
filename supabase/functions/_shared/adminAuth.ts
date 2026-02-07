/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ADMIN AUTHENTICATION - Shared module for all admin edge functions
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * SECURITY PATTERN:
 * 1. Use getClaims() for JWT validation (recommended by Supabase)
 * 2. Check email against hardcoded whitelist
 * 3. Return structured error responses
 * 
 * USAGE:
 * ```typescript
 * import { validateAdminRequest, corsHeaders, errorResponse } from "../_shared/adminAuth.ts";
 * 
 * const validation = await validateAdminRequest(req);
 * if (!validation.ok) {
 *   return validation.response;
 * }
 * const { email, supabaseAdmin } = validation;
 * ```
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN ACCESS CONTROL - Database-driven via user_roles table
// ═══════════════════════════════════════════════════════════════════════════
// Admin roles are managed in the `user_roles` table with role='admin'.
// To add/remove admins, modify the user_roles table in the database.

// ═══════════════════════════════════════════════════════════════════════════
// CORS Headers - Standard for all admin endpoints
// ═══════════════════════════════════════════════════════════════════════════
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// ═══════════════════════════════════════════════════════════════════════════
// Response Helpers
// ═══════════════════════════════════════════════════════════════════════════

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      code,
      error: message,
      details: details || null,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

export function successResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      timestamp: new Date().toISOString(),
      ...data,
    }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Admin Role Check - Database-driven via user_roles table
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a user has the admin role in the database.
 * @param supabaseAdmin - Service role client for bypassing RLS
 * @param userId - The user's UUID from auth.users
 * @returns true if user has 'admin' role in user_roles table
 */
export async function hasAdminRole(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    console.error("[adminAuth] Error checking admin role:", error.message);
    return false;
  }

  return !!data;
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation Result Types
// ═══════════════════════════════════════════════════════════════════════════

interface ValidationSuccess {
  ok: true;
  email: string;
  userId: string;
  supabaseAdmin: SupabaseClient;
  supabaseAuth: SupabaseClient;
}

interface ValidationFailure {
  ok: false;
  response: Response;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

// ═══════════════════════════════════════════════════════════════════════════
// Main Validation Function
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validates an admin request using the recommended getClaims() pattern.
 * 
 * @param req - The incoming request
 * @returns ValidationResult with either success data or error response
 */
export async function validateAdminRequest(req: Request): Promise<ValidationResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  // Check environment configuration
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error("[adminAuth] Missing Supabase credentials");
    return {
      ok: false,
      response: errorResponse(500, "config_error", "Server configuration error"),
    };
  }

  // Extract bearer token
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return {
      ok: false,
      response: errorResponse(401, "unauthorized", "Missing or invalid Authorization header"),
    };
  }

  const token = authHeader.slice(7);
  if (!token) {
    return {
      ok: false,
      response: errorResponse(401, "unauthorized", "Missing bearer token"),
    };
  }

  // Create dual clients: auth client for validation, admin for DB operations
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Validate JWT using getClaims() - the recommended approach
  const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

  if (claimsError || !claimsData?.claims) {
    console.error("[adminAuth] JWT validation failed:", claimsError?.message);
    return {
      ok: false,
      response: errorResponse(401, "invalid_token", "Invalid or expired token"),
    };
  }

  const email = claimsData.claims.email as string | undefined;
  const userId = claimsData.claims.sub as string;

  if (!email) {
    return {
      ok: false,
      response: errorResponse(401, "no_email", "Token does not contain email claim"),
    };
  }

  // Check admin role in database
  const isAdmin = await hasAdminRole(supabaseAdmin, userId);
  if (!isAdmin) {
    console.warn("[adminAuth] Non-admin access attempt:", email);
    return {
      ok: false,
      response: errorResponse(403, "forbidden", "Admin access required"),
    };
  }

  return {
    ok: true,
    email: email.toLowerCase(),
    userId,
    supabaseAdmin,
    supabaseAuth,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Hard-fail helper for DB queries (consistent pattern)
// ═══════════════════════════════════════════════════════════════════════════

export function assertNoError(error: unknown, context: string): asserts error is null {
  if (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[adminAuth] HARD-FAIL in ${context}:`, msg);
    throw new Error(`Database query failed in ${context}: ${msg}`);
  }
}
