import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PhoneCallOutcomePayload {
  call_id: string; // provider_call_id from PhoneCall.bot
  status: "completed" | "failed" | "no-answer" | "busy" | "voicemail" | "canceled";
  duration_seconds?: number;
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

// Validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Truncate string for safety
function truncateString(str: string | undefined, maxLength: number): string | null {
  if (!str) return null;
  return str.length > maxLength ? str.substring(0, maxLength) : str;
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
    // Parse payload
    const payload: PhoneCallOutcomePayload = await req.json();
    console.log("[phone-call-outcome] Received payload:", JSON.stringify({
      call_id: payload.call_id,
      status: payload.status,
      duration_seconds: payload.duration_seconds,
      sentiment: payload.sentiment,
      has_notes: !!payload.ai_notes,
      has_recording: !!payload.recording_url,
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

    // Find the call log by provider_call_id
    const { data: existingLog, error: findError } = await supabase
      .from("phone_call_logs")
      .select("id, call_status")
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
      console.warn("[phone-call-outcome] No call log found for provider_call_id:", payload.call_id);
      // Return 200 to acknowledge receipt even if we don't have a matching record
      // This prevents webhook retries for orphaned calls
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: "No matching call log found",
          provider_call_id: payload.call_id 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already in terminal state
    const terminalStates = ["completed", "failed", "no_answer"];
    if (terminalStates.includes(existingLog.call_status)) {
      console.log("[phone-call-outcome] Call already in terminal state:", existingLog.call_status);
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: "Call already in terminal state",
          current_status: existingLog.call_status 
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

    // Add optional fields if present
    if (typeof payload.duration_seconds === "number" && payload.duration_seconds >= 0) {
      updateData.call_duration_sec = Math.floor(payload.duration_seconds);
    }

    if (payload.sentiment && ["positive", "neutral", "negative"].includes(payload.sentiment)) {
      updateData.call_sentiment = payload.sentiment;
    }

    if (payload.ai_notes) {
      updateData.ai_notes = truncateString(payload.ai_notes, 5000);
    }

    if (payload.recording_url) {
      // Basic URL validation
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

    // Update the call log
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
      // Log but don't fail - pending_calls update is optional
      console.warn("[phone-call-outcome] Failed to update pending_calls:", pendingUpdateError.message);
    }

    const duration = Date.now() - startTime;
    console.log(`[phone-call-outcome] Successfully updated call ${existingLog.id} to ${mappedStatus} in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        call_log_id: existingLog.id,
        new_status: mappedStatus,
        processing_time_ms: duration,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[phone-call-outcome] Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
