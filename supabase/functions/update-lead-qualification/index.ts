import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { logAttributionEvent } from "../_shared/attributionLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-csrf-token",
};

// ============= Validation Schema =============

const TIMELINE_VALUES = ["30days", "90days", "6months", "research"] as const;
const HAS_QUOTE_VALUES = ["yes", "getting", "no"] as const;
const WINDOW_SCOPE_VALUES = ["1_5", "6_15", "16_plus", "whole_house"] as const;
const SEGMENT_VALUES = ["HOT", "WARM", "NURTURE", "LOW"] as const;

const qualificationSchema = z.object({
  leadId: z.string().uuid("Invalid lead ID"),
  timeline: z.enum(TIMELINE_VALUES),
  hasQuote: z.enum(HAS_QUOTE_VALUES),
  homeowner: z.boolean(),
  windowScope: z.enum(WINDOW_SCOPE_VALUES),
  leadScore: z.number().int().min(-50).max(200),
  leadSegment: z.enum(SEGMENT_VALUES),
  // Optional context for event logging
  sessionId: z.string().uuid().optional().nullable(),
  clientId: z.string().max(100).optional().nullable(),
  sourceTool: z.string().max(100).optional().nullable(),
});

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { success: false, error: "method_not_allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { success: false, error: "config_error" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { success: false, error: "invalid_json" });
  }

  const parsed = qualificationSchema.safeParse(body);
  if (!parsed.success) {
    return json(400, {
      success: false,
      error: "invalid_input",
      details: parsed.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  const {
    leadId,
    timeline,
    hasQuote,
    homeowner,
    windowScope,
    leadScore,
    leadSegment,
    sessionId,
    clientId,
    sourceTool,
  } = parsed.data;

  const qualificationCompletedAt = new Date().toISOString();

  // ═══════════════════════════════════════════════════════════════════════════
  // Step 1: Update leads table (source of truth)
  // ═══════════════════════════════════════════════════════════════════════════
  const { error: leadsError } = await supabase
    .from("leads")
    .update({
      timeline,
      has_quote: hasQuote,
      homeowner,
      window_scope: windowScope,
      lead_score: leadScore,
      lead_segment: leadSegment,
      qualification_completed_at: qualificationCompletedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (leadsError) {
    console.error("[update-lead-qualification] leads update failed:", leadsError);
    return json(500, {
      success: false,
      error: "leads_update_failed",
      details: leadsError.message,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Step 2: Sync to wm_leads (CRM warehouse) via lead_id FK
  // The trigger only fires on INSERT, so we must update wm_leads directly
  // ═══════════════════════════════════════════════════════════════════════════
  const { error: wmError } = await supabase
    .from("wm_leads")
    .update({
      timeline,
      has_quote: hasQuote,
      homeowner,
      window_scope: windowScope,
      lead_score: leadScore,
      lead_segment: leadSegment,
      qualification_completed_at: qualificationCompletedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("lead_id", leadId);

  if (wmError) {
    // Non-fatal: CRM sync failure should not break the lead update
    console.error("[update-lead-qualification] wm_leads sync failed:", wmError);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Step 3: Write prequote_v2_qualified event to wm_event_log (canonical ledger)
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    // Idempotency: check if event already exists for this lead
    const { data: existingEvent } = await supabase
      .from("wm_event_log")
      .select("event_id")
      .eq("lead_id", leadId)
      .eq("event_name", "prequote_v2_qualified")
      .maybeSingle();

    if (!existingEvent) {
      const { error: eventLogError } = await supabase
        .from("wm_event_log")
        .insert({
          event_id: crypto.randomUUID(),
          event_name: "prequote_v2_qualified",
          event_type: "qualification",
          event_time: qualificationCompletedAt,
          lead_id: leadId,
          session_id: sessionId || null,
          client_id: clientId || null,
          external_id: leadId,
          source_tool: sourceTool || "prequote-v2",
          source_system: "update-lead-qualification",
          ingested_by: "update-lead-qualification",
          funnel_stage: "qualified",
          metadata: {
            timeline,
            has_quote: hasQuote,
            homeowner,
            window_scope: windowScope,
            lead_score: leadScore,
            lead_segment: leadSegment,
          },
        });

      if (eventLogError) {
        // Unique constraint violations are fine (idempotent)
        if (eventLogError.code !== "23505") {
          console.error(
            "[update-lead-qualification] wm_event_log write failed:",
            eventLogError
          );
        }
      } else {
        console.log(
          "[update-lead-qualification] prequote_v2_qualified event written for lead:",
          leadId
        );
      }
    }
  } catch (eventErr) {
    // Non-blocking: event logging should never fail the qualification update
    console.error(
      "[update-lead-qualification] Event logging exception (non-blocking):",
      eventErr
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Step 4: Log to wm_events (legacy, backward compat) if sessionId provided
  // ═══════════════════════════════════════════════════════════════════════════
  if (sessionId) {
    try {
      logAttributionEvent({
        sessionId,
        eventName: "prequote_v2_qualified",
        eventCategory: "qualification",
        pagePath: "/prequote-v2",
        pageTitle: `PreQuote V2 Qualified - ${leadSegment}`,
        leadId,
        eventData: {
          timeline,
          has_quote: hasQuote,
          homeowner,
          window_scope: windowScope,
          lead_score: leadScore,
          lead_segment: leadSegment,
          source_tool: sourceTool,
        },
        anonymousIdFallback: clientId || `lead-${leadId}`,
      });
    } catch (legacyErr) {
      console.error(
        "[update-lead-qualification] Legacy event logging failed (non-blocking):",
        legacyErr
      );
    }
  }

  console.log("[update-lead-qualification] Success:", {
    leadId,
    leadScore,
    leadSegment,
    timeline,
    homeowner,
  });

  return json(200, {
    success: true,
    leadId,
    leadScore,
    leadSegment,
    qualificationCompletedAt,
  });
});
