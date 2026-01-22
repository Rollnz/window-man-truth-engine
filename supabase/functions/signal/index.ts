/**
 * /signal Edge Function
 * 
 * Public endpoint (verify_jwt=false) for browser-side event logging to wm_event_log.
 * This provides adblock resilience by allowing the browser to POST scanner events
 * directly to the canonical ledger without exposing WM_LOG_SECRET.
 * 
 * SECURITY:
 * - Only accepts a tight allowlist of event names (scanner events only)
 * - Uses service role internally for writes
 * - Idempotent by event_id (UNIQUE constraint)
 * 
 * CONSTRAINTS:
 * - Does NOT require authentication (verify_jwt=false in config)
 * - Only logs high-value scanner signals (not every click)
 * - wm_event_log is append-only (no UPDATE/DELETE)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =====================================================
// Allowlist of Event Names
// =====================================================

const ALLOWED_EVENT_NAMES = new Set([
  'scanner_upload_completed',
  'scanner_document_upload_completed',
  'scanner_analysis_completed',
]);

// =====================================================
// UUID Validation
// =====================================================

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(id: string | null | undefined): boolean {
  if (!id) return false;
  return UUID_V4_REGEX.test(id);
}

// =====================================================
// Main Handler
// =====================================================

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    
    // Validate required fields
    const {
      event_id,
      event_name,
      lead_id,
      client_id,
      session_id,
      page_path,
      source_tool,
      metadata = {},
    } = body;

    // ─────────────────────────────────────────────────────────────────────
    // Validation: Required fields
    // ─────────────────────────────────────────────────────────────────────
    if (!event_id || !event_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: event_id, event_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    // Validation: event_id must be a valid UUID
    // ─────────────────────────────────────────────────────────────────────
    if (!isValidUUID(event_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid event_id format (must be UUID)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    // Security: Only allow specific event names
    // ─────────────────────────────────────────────────────────────────────
    if (!ALLOWED_EVENT_NAMES.has(event_name)) {
      console.warn(`[signal] Rejected event_name: ${event_name}`);
      return new Response(
        JSON.stringify({ error: "Event name not allowed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    // Create Supabase client with service role for writes
    // ─────────────────────────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ─────────────────────────────────────────────────────────────────────
    // Insert into wm_event_log (append-only)
    // ─────────────────────────────────────────────────────────────────────
    const { error: insertError } = await supabase
      .from("wm_event_log")
      .insert({
        event_id,
        event_name,
        event_type: "signal",
        lead_id: isValidUUID(lead_id) ? lead_id : null,
        client_id: client_id || null,
        session_id: isValidUUID(session_id) ? session_id : null,
        page_path: page_path || null,
        source_tool: source_tool || "scanner",
        source_system: "browser",
        ingested_by: "signal-endpoint",
        event_time: new Date().toISOString(),
        metadata: metadata || {},
      });

    // Handle duplicate event_id (idempotent - return success)
    if (insertError?.code === "23505") {
      console.log("[signal] Duplicate event_id, returning success:", event_id);
      return new Response(
        JSON.stringify({ ok: true, event_id, duplicate: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (insertError) {
      console.error("[signal] Insert error:", insertError);
      throw insertError;
    }

    console.log(`[signal] Logged event: ${event_name} (${event_id})`);

    return new Response(
      JSON.stringify({ ok: true, event_id, duplicate: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[signal] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
