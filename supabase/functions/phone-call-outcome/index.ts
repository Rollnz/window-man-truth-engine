// ═══════════════════════════════════════════════════════════════════════════
// PHONE CALL OUTCOME - WEBHOOK HANDLER
// Receives callbacks from PhoneCall.bot with call outcomes
// Verifies signatures when secret is configured, writes timeline events
// Includes idempotency protection to prevent duplicate timeline entries
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PhoneCallOutcomePayload {
  call_id: string; // provider_call_id from PhoneCall.bot
  status: "completed" | "failed" | "no-answer" | "busy" | "voicemail" | "canceled";
  duration_seconds?: number | string; // Accept both number and string
  sentiment?: "positive" | "neutral" | "negative";
  ai_notes?: string;
  recording_url?: string;
  ended_at?: string;
  metadata?: Record<string, unknown>;
}

// Map provider status to our enum
function mapCallStatus(providerStatus: string): string {
  const statusMap: Record<string, string> = {
    completed: "completed",
    failed: "failed",
    "no-answer": "no_answer",
    busy: "no_answer",
    voicemail: "no_answer",
    canceled: "failed",
  };
  return statusMap[providerStatus] || "failed";
}

// Safely parse duration (Item C: string/int/null tolerance)
function parseDuration(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Math.floor(value);
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : Math.floor(parsed);
  }
  return null;
}

// Truncate string for safety
function truncateString(str: string | undefined, maxLength: number): string | null {
  if (!str) return null;
  return str.length > maxLength ? str.substring(0, maxLength) : str;
}

// COMPAT MODE: Support both header variants and both timestamp units
async function verifyPhonecallbotSignature(
  req: Request,
  rawBody: string
): Promise<{ ok: boolean; mode: string; error?: string }> {
  const secret = Deno.env.get("PHONECALLBOT_WEBHOOK_SECRET");
  if (!secret) {
    console.warn("[phone-call-outcome] No PHONECALLBOT_WEBHOOK_SECRET configured - running in insecure mode");
    return { ok: true, mode: "insecure_no_secret" };
  }

  // Try both header variants
  const signature = req.headers.get("x-signature") || req.headers.get("x-phonecallbot-signature");
  const timestampRaw = req.headers.get("x-timestamp") || req.headers.get("x-phonecallbot-timestamp");

  if (!signature || !timestampRaw) {
    console.error("[phone-call-outcome] Missing signature headers", {
      has_signature: !!signature,
      has_timestamp: !!timestampRaw,
    });
    return { ok: false, mode: "missing_headers", error: "Missing signature or timestamp header" };
  }

  // Detect timestamp unit (ms vs sec)
  const timestampNum = parseInt(timestampRaw, 10);
  if (isNaN(timestampNum)) {
    return { ok: false, mode: "invalid_timestamp", error: "Invalid timestamp format" };
  }

  let timestampMs: number;
  let detectedMode: string;
  if (timestampNum > 1e12) {
    timestampMs = timestampNum;
    detectedMode = "ms_timestamp";
  } else {
    timestampMs = timestampNum * 1000;
    detectedMode = "sec_timestamp";
  }

  // Replay protection: reject timestamps older than 5 minutes
  const ageMs = Date.now() - timestampMs;
  if (ageMs > 5 * 60 * 1000) {
    console.error("[phone-call-outcome] Timestamp too old", { ageMs, maxMs: 5 * 60 * 1000 });
    return { ok: false, mode: "timestamp_expired", error: `Timestamp expired (${Math.round(ageMs / 1000)}s old)` };
  }
  if (ageMs < -60 * 1000) {
    console.error("[phone-call-outcome] Timestamp in future", { ageMs });
    return { ok: false, mode: "timestamp_future", error: "Timestamp in future" };
  }

  // Compute expected signature: HMAC-SHA256 of "{timestamp}.{body}"
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signedData = `${timestampRaw}.${rawBody}`;
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signedData));
  const expectedSig = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (expectedSig.length !== signature.length) {
    console.error("[phone-call-outcome] Signature length mismatch", {
      expected: expectedSig.length,
      received: signature.length,
    });
    return { ok: false, mode: "signature_mismatch", error: "Signature length mismatch" };
  }

  let mismatch = 0;
  for (let i = 0; i < expectedSig.length; i++) {
    mismatch |= expectedSig.charCodeAt(i) ^ signature.charCodeAt(i);
  }

  if (mismatch !== 0) {
    console.error("[phone-call-outcome] Signature mismatch");
    return { ok: false, mode: "signature_mismatch", error: "Signature invalid" };
  }

  console.log(`[phone-call-outcome] Signature verified (mode: ${detectedMode})`);
  return { ok: true, mode: detectedMode };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const startTime = Date.now();

  try {
    // Read raw body ONCE for signature verification
    const rawBody = await req.text();

    // Verify signature (if secret is configured)
    const sigResult = await verifyPhonecallbotSignature(req, rawBody);
    if (!sigResult.ok) {
      return new Response(
        JSON.stringify({ error: sigResult.error, mode: sigResult.mode }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse payload after verification
    let payload: PhoneCallOutcomePayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[phone-call-outcome] Received payload:", JSON.stringify({
      call_id: payload.call_id,
      status: payload.status,
      duration_seconds: payload.duration_seconds,
      sentiment: payload.sentiment,
      has_notes: !!payload.ai_notes,
      has_recording: !!payload.recording_url,
      signature_mode: sigResult.mode,
    }));

    // Validate required fields
    if (!payload.call_id) {
      console.error("[phone-call-outcome] Missing call_id");
      return new Response(
        JSON.stringify({ error: "Missing required field: call_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payload.status) {
      console.error("[phone-call-outcome] Missing status");
      return new Response(
        JSON.stringify({ error: "Missing required field: status" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role for updates
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[phone-call-outcome] Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the call log by provider_call_id - include outcome_timeline_written for idempotency
    const { data: existingLog, error: findError } = await supabase
      .from("phone_call_logs")
      .select("id, call_status, lead_id, source_tool, outcome_timeline_written")
      .eq("provider_call_id", payload.call_id)
      .maybeSingle();

    if (findError) {
      console.error("[phone-call-outcome] Error finding call log:", findError.message);
      return new Response(
        JSON.stringify({ error: "Database error", details: findError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!existingLog) {
      // DEAD LETTER: No matching log found - log full payload for manual review
      console.error("[phone-call-outcome] DEAD-LETTER: No call log found for provider_call_id:", {
        provider_call_id: payload.call_id,
        metadata_call_request_id: payload.metadata?.call_request_id,
        full_payload: rawBody,
      });
      // Return 200 to acknowledge receipt (prevents webhook retries)
      return new Response(
        JSON.stringify({
          success: true,
          warning: "No matching call log found - dead-lettered",
          provider_call_id: payload.call_id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // IDEMPOTENCY CHECK (Item A): Skip if terminal state AND timeline written
    // ═══════════════════════════════════════════════════════════════════════
    const terminalStates = ["completed", "failed", "no_answer"];
    if (terminalStates.includes(existingLog.call_status) && existingLog.outcome_timeline_written === true) {
      console.log("[phone-call-outcome] IDEMPOTENT SKIP: Call already processed with timeline written", {
        call_id: payload.call_id,
        current_status: existingLog.call_status,
        outcome_timeline_written: existingLog.outcome_timeline_written,
      });
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Already processed (idempotent)",
          current_status: existingLog.call_status,
          outcome_timeline_written: existingLog.outcome_timeline_written,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare update data
    const mappedStatus = mapCallStatus(payload.status);
    const updateData: Record<string, unknown> = {
      call_status: mappedStatus,
      updated_at: new Date().toISOString(),
      raw_outcome_payload: payload,
    };

    // Parse duration safely (Item C: string/int/null tolerance)
    const parsedDuration = parseDuration(payload.duration_seconds);
    if (parsedDuration !== null && parsedDuration >= 0) {
      updateData.call_duration_sec = parsedDuration;
    }

    if (payload.sentiment && ["positive", "neutral", "negative"].includes(payload.sentiment)) {
      updateData.call_sentiment = payload.sentiment;
    }

    if (payload.ai_notes) {
      updateData.ai_notes = truncateString(payload.ai_notes, 5000);
    }

    if (payload.recording_url) {
      try {
        new URL(payload.recording_url);
        updateData.recording_url = truncateString(payload.recording_url, 2000);
      } catch {
        console.warn("[phone-call-outcome] Invalid recording URL, skipping");
      }
    }

    if (payload.ended_at) {
      try {
        const endedDate = new Date(payload.ended_at);
        if (!isNaN(endedDate.getTime())) {
          updateData.ended_at = endedDate.toISOString();
        }
      } catch {
        console.warn("[phone-call-outcome] Invalid ended_at date, using now");
        updateData.ended_at = new Date().toISOString();
      }
    } else {
      updateData.ended_at = new Date().toISOString();
    }

    // Update the call log (but NOT outcome_timeline_written yet)
    const { error: updateError } = await supabase
      .from("phone_call_logs")
      .update(updateData)
      .eq("id", existingLog.id);

    if (updateError) {
      console.error("[phone-call-outcome] Error updating call log:", updateError.message);
      return new Response(
        JSON.stringify({ error: "Failed to update call log", details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also update pending_calls if exists
    const { error: pendingUpdateError } = await supabase
      .from("pending_calls")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("provider_call_id", payload.call_id);

    if (pendingUpdateError) {
      console.warn("[phone-call-outcome] Failed to update pending_calls:", pendingUpdateError.message);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TIMELINE EVENTS: Write to lead_notes (always) and wm_events (if session)
    // Only if not already written (checked via outcome_timeline_written flag)
    // ═══════════════════════════════════════════════════════════════════════
    let timelineWritten = false;
    
    if (existingLog.lead_id && !existingLog.outcome_timeline_written) {
      // Find wm_lead to get wm_lead.id and original_session_id
      const { data: wmLead } = await supabase
        .from("wm_leads")
        .select("id, original_session_id")
        .eq("lead_id", existingLog.lead_id)
        .maybeSingle();

      const duration = parsedDuration;
      const sentiment = payload.sentiment ?? null;
      const recordingUrl = payload.recording_url ?? null;

      // Build note with provider_call_id appended for debugging (Item C)
      const outcomeNote = `📞 Call ${mappedStatus}${duration ? ` (${duration}s)` : ""}${recordingUrl ? " [Recording available]" : ""}${sentiment ? ` | Sentiment: ${sentiment}` : ""} | provider_call_id: ${payload.call_id}`;

      // Track timeline write success
      let noteWritten = false;
      let eventWritten = false;

      // ALWAYS write to lead_notes if wm_lead exists
      if (wmLead?.id) {
        const { error: noteError } = await supabase.from("lead_notes").insert({
          lead_id: wmLead.id,
          content: outcomeNote,
          admin_email: "system@windowman.ai",
        });
        
        if (noteError) {
          console.error("[phone-call-outcome] Failed to write lead_note:", noteError.message);
        } else {
          noteWritten = true;
          console.log("[phone-call-outcome] Timeline note written for lead:", wmLead.id);
        }
      }

      // ADDITIONALLY write to wm_events if session exists
      if (wmLead?.original_session_id) {
        const { error: eventError } = await supabase.from("wm_events").insert({
          session_id: wmLead.original_session_id,
          event_name: `call_${mappedStatus}`,
          event_category: "phone",
          page_path: "/admin/lead-detail",
          event_data: {
            provider_call_id: payload.call_id,
            call_log_id: existingLog.id,
            duration_seconds: duration,
            sentiment,
            has_recording: !!recordingUrl,
            source_tool: existingLog.source_tool,
          },
        });
        
        if (eventError) {
          console.error("[phone-call-outcome] Failed to write wm_event:", eventError.message);
        } else {
          eventWritten = true;
          console.log("[phone-call-outcome] Timeline event written for session:", wmLead.original_session_id);
        }
      }

      // Mark as written if EITHER succeeded (safe: we have at least one record)
      timelineWritten = noteWritten || eventWritten;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SET IDEMPOTENCY FLAG: Only after timeline writes succeeded
    // ═══════════════════════════════════════════════════════════════════════
    if (timelineWritten) {
      const { error: flagError } = await supabase
        .from("phone_call_logs")
        .update({ outcome_timeline_written: true })
        .eq("id", existingLog.id);
      
      if (flagError) {
        console.error("[phone-call-outcome] Failed to set outcome_timeline_written flag:", flagError.message);
      } else {
        console.log("[phone-call-outcome] Idempotency flag set for call:", existingLog.id);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[phone-call-outcome] Successfully updated call ${existingLog.id} to ${mappedStatus} in ${duration}ms`, {
      timeline_written: timelineWritten,
      provider_call_id: payload.call_id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        call_log_id: existingLog.id,
        new_status: mappedStatus,
        timeline_written: timelineWritten,
        processing_time_ms: duration,
        signature_mode: sigResult.mode,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[phone-call-outcome] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
