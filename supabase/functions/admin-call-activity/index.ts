// ═══════════════════════════════════════════════════════════════════════════
// ADMIN-CALL-ACTIVITY - Live feed of call dispatches with enrichment
// Returns chronological call activity with audio, transcripts, and status
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Database-driven admin check via user_roles table
// deno-lint-ignore no-explicit-any
async function hasAdminRole(supabaseAdmin: any, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) {
    console.error("[admin-call-activity] Error checking admin role:", error.message);
    return false;
  }
  return !!data;
}

// Server-side phone masking - full numbers never leave this function
function maskPhone(phone: string | null): string | null {
  if (!phone) return null;
  if (phone.length < 5) return phone;
  const lastFour = phone.slice(-4);
  const prefix = phone.startsWith("+1") ? "+1" : "+";
  return prefix + "****" + lastFour;
}

const LIMIT = 50;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only GET is supported
  if (req.method !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[admin-call-activity] Missing Supabase credentials");
    return json(500, { error: "Server configuration error" });
  }

  // Extract bearer token
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return json(401, { error: "Missing bearer token" });
  }

  // Dual-client pattern: auth client for JWT validation, admin for DB
  const supabaseAuth = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Validate JWT and get user
  const { data: userRes, error: userErr } = await supabaseAuth.auth.getUser(token);
  const user = userRes?.user;

  if (userErr || !user) {
    console.error("[admin-call-activity] Auth error:", userErr?.message);
    return json(401, { error: "Unauthorized" });
  }

  const email = user.email || 'unknown';

  // Check admin role in database
  const isAdmin = await hasAdminRole(supabaseAdmin, user.id);
  if (!isAdmin) {
    console.warn("[admin-call-activity] Non-admin access attempt:", email);
    return json(403, { error: "Access denied" });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Parse query parameters
  // ═══════════════════════════════════════════════════════════════════════════
  const url = new URL(req.url);
  const source_tool = url.searchParams.get("source_tool");
  const status = url.searchParams.get("status");
  const cursor = url.searchParams.get("cursor");

  // ═══════════════════════════════════════════════════════════════════════════
  // Step 1: Primary query against pending_calls
  // ═══════════════════════════════════════════════════════════════════════════
  let query = supabaseAdmin
    .from("pending_calls")
    .select("*")
    .order("triggered_at", { ascending: false })
    .limit(LIMIT + 1);

  if (source_tool) query = query.eq("source_tool", source_tool);
  if (status) query = query.eq("status", status);
  if (cursor) query = query.lt("triggered_at", cursor);

  const { data: rawCalls, error: primaryError } = await query;

  if (primaryError) {
    console.error("[admin-call-activity] Query error:", primaryError.message);
    return json(500, { error: primaryError.message });
  }

  // Determine pagination
  const hasMore = (rawCalls || []).length > LIMIT;
  const calls = hasMore ? (rawCalls || []).slice(0, LIMIT) : (rawCalls || []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Step 2: Enrichment from phone_call_logs (best-effort)
  // Join key is call_request_id (verified from schema)
  // ═══════════════════════════════════════════════════════════════════════════
  let logMap: Record<string, Record<string, unknown>> = {};
  try {
    const callRequestIds = calls.map(c => c.call_request_id).filter(Boolean);
    
    if (callRequestIds.length > 0) {
      const { data: logs } = await supabaseAdmin
        .from("phone_call_logs")
        .select("call_request_id, recording_url, ai_notes, call_duration_sec, call_sentiment")
        .in("call_request_id", callRequestIds);

      if (logs) {
        for (const log of logs) {
          logMap[log.call_request_id] = log;
        }
      }
    }
  } catch (enrichErr) {
    // Best-effort. Do not fail the request.
    console.warn("[admin-call-activity] Enrichment skipped:", enrichErr);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Step 3: Shape the response
  // ═══════════════════════════════════════════════════════════════════════════
  const shapedCalls = calls.map(call => {
    const log = logMap[call.call_request_id] || {};
    return {
      id: call.id,
      source_tool: call.source_tool,
      status: call.status,
      triggered_at: call.triggered_at,
      phone_masked: maskPhone(call.phone_e164),
      duration_seconds: (log.call_duration_sec as number | null) || null,
      recording_url: (log.recording_url as string | null) || null,
      transcript: (log.ai_notes as string | null) || null,
      error_message: call.last_error || null,
      sentiment: (log.call_sentiment as string | null) || null,
      wm_lead_id: call.lead_id || null,
    };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Step 4: Log and return
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("[admin-call-activity] GET", {
    source_tool,
    status,
    has_cursor: !!cursor,
    returned: shapedCalls.length,
    hasMore,
    requested_by: email,
  });

  return json(200, { calls: shapedCalls, hasMore });
});
