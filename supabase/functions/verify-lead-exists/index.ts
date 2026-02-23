/**
 * verify-lead-exists — Admin-only endpoint for Client-Server Handshake
 *
 * Confirms that a lead_id exists in the `leads` table AND checks
 * `wm_event_log` for matching CAPI events (deep event verification).
 */

import { validateAdminRequest, corsHeaders, errorResponse, successResponse } from "../_shared/adminAuth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse(405, "method_not_allowed", "POST only");
  }

  // Admin auth
  const validation = await validateAdminRequest(req);
  if (!validation.ok) {
    return validation.response;
  }
  const { supabaseAdmin } = validation;

  // Parse body
  let leadId: string;
  try {
    const body = await req.json();
    leadId = body.lead_id;
    if (!leadId || typeof leadId !== "string") {
      return errorResponse(400, "bad_request", "lead_id is required");
    }
  } catch {
    return errorResponse(400, "bad_request", "Invalid JSON body");
  }

  // Check leads table
  const { data: leadRow, error: leadErr } = await supabaseAdmin
    .from("leads")
    .select("id, created_at")
    .eq("id", leadId)
    .maybeSingle();

  if (leadErr) {
    console.error("[verify-lead-exists] leads query error:", leadErr.message);
    return errorResponse(500, "db_error", "Failed to query leads table");
  }

  // Check wm_event_log for CAPI events
  const { data: capiRows, error: capiErr } = await supabaseAdmin
    .from("wm_event_log")
    .select("event_id, event_name, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (capiErr) {
    console.error("[verify-lead-exists] wm_event_log query error:", capiErr.message);
    // Non-fatal: still return lead status
  }

  const capiEvents = capiRows ?? [];

  return successResponse({
    leadExists: !!leadRow,
    leadCreatedAt: leadRow?.created_at ?? null,
    capiEvents,
    capiEventCount: capiEvents.length,
    checkedAt: new Date().toISOString(),
  });
});
