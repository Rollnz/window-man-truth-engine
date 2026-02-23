/**
 * verify-lead-exists — Admin-only endpoint for Client-Server Handshake + Parity Check
 *
 * Supports two modes (can be combined):
 * 1. lead_id: Confirms lead exists in `leads` + checks `wm_event_log` for CAPI events
 * 2. event_ids: Batch parity check — returns which event_ids exist on server with cookie data
 */

import { validateAdminRequest, corsHeaders, errorResponse, successResponse } from "../_shared/adminAuth.ts";

const MAX_EVENT_IDS = 20;

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
  let leadId: string | undefined;
  let eventIds: string[] | undefined;
  try {
    const body = await req.json();
    leadId = body.lead_id;
    eventIds = body.event_ids;

    if (!leadId && !eventIds) {
      return errorResponse(400, "bad_request", "lead_id or event_ids is required");
    }
    if (leadId && typeof leadId !== "string") {
      return errorResponse(400, "bad_request", "lead_id must be a string");
    }
    if (eventIds) {
      if (!Array.isArray(eventIds) || eventIds.length === 0) {
        return errorResponse(400, "bad_request", "event_ids must be a non-empty array");
      }
      if (eventIds.length > MAX_EVENT_IDS) {
        return errorResponse(400, "bad_request", `event_ids max is ${MAX_EVENT_IDS}`);
      }
      if (!eventIds.every((id: unknown) => typeof id === "string")) {
        return errorResponse(400, "bad_request", "event_ids must be strings");
      }
    }
  } catch {
    return errorResponse(400, "bad_request", "Invalid JSON body");
  }

  const result: Record<string, unknown> = { checkedAt: new Date().toISOString() };

  // ── Mode 1: Lead verification ──────────────────────────────────────────
  if (leadId) {
    const { data: leadRow, error: leadErr } = await supabaseAdmin
      .from("leads")
      .select("id, created_at")
      .eq("id", leadId)
      .maybeSingle();

    if (leadErr) {
      console.error("[verify-lead-exists] leads query error:", leadErr.message);
      return errorResponse(500, "db_error", "Failed to query leads table");
    }

    const { data: capiRows, error: capiErr } = await supabaseAdmin
      .from("wm_event_log")
      .select("event_id, event_name, created_at")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (capiErr) {
      console.error("[verify-lead-exists] wm_event_log query error:", capiErr.message);
    }

    const capiEvents = capiRows ?? [];
    result.leadExists = !!leadRow;
    result.leadCreatedAt = leadRow?.created_at ?? null;
    result.capiEvents = capiEvents;
    result.capiEventCount = capiEvents.length;
  }

  // ── Mode 2: Batch parity check ─────────────────────────────────────────
  if (eventIds && eventIds.length > 0) {
    const { data: parityRows, error: parityErr } = await supabaseAdmin
      .from("wm_event_log")
      .select("event_id, event_name, ingested_by, source_system, fbp, fbc")
      .in("event_id", eventIds);

    if (parityErr) {
      console.error("[verify-lead-exists] parity query error:", parityErr.message);
      result.parityResults = [];
    } else {
      // Build a map of server-side events
      const serverMap = new Map<string, Record<string, unknown>>();
      for (const row of (parityRows ?? [])) {
        serverMap.set(row.event_id, row);
      }

      // Return results for every requested event_id
      result.parityResults = eventIds.map((eid: string) => {
        const server = serverMap.get(eid);
        return {
          event_id: eid,
          serverFound: !!server,
          event_name: server?.event_name ?? null,
          ingested_by: server?.ingested_by ?? null,
          source_system: server?.source_system ?? null,
          fbp: server?.fbp ?? null,
          fbc: server?.fbc ?? null,
        };
      });
    }
  }

  return successResponse(result);
});
