// ═══════════════════════════════════════════════════════════════════════════
// PHONE CALL OUTCOME - WEBHOOK HANDLER (Hardened B+D+F)
// Receives callbacks from PhoneCall.bot with call outcomes
// - Persists ALL inbound webhooks to webhook_receipts for audit/debugging
// - Progressive signature enforcement (ENFORCE | LOG_ONLY | DISABLED)
// - 4-step correlation fallback with dead-letter persistence
// - Idempotency protection via outcome_timeline_written flag + idempotency_key
// - Deterministic pending_calls state mapping
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PhoneCallOutcomePayload {
  call_id: string; // provider_call_id from PhoneCall.bot
  status: "completed" | "failed" | "no-answer" | "busy" | "voicemail" | "canceled" | "in-progress";
  duration_seconds?: number | string;
  sentiment?: "positive" | "neutral" | "negative";
  ai_notes?: string;
  recording_url?: string;
  ended_at?: string;
  metadata?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// Map provider status to our phone_call_status enum
function mapCallStatus(providerStatus: string): string {
  const statusMap: Record<string, string> = {
    completed: "completed",
    failed: "failed",
    "no-answer": "no_answer",
    busy: "no_answer",
    voicemail: "no_answer",
    canceled: "canceled",
    "in-progress": "in_progress",
  };
  return statusMap[providerStatus] || "failed";
}

// Map phone_call_logs.call_status → pending_calls.status (Item F)
// Enum-safe: verified pending_call_status has all these values
function mapToPendingCallStatus(callStatus: string): { status: string; isTerminal: boolean } {
  const mapping: Record<string, { status: string; isTerminal: boolean }> = {
    completed: { status: "completed", isTerminal: true },
    no_answer: { status: "no_answer", isTerminal: true },
    failed: { status: "failed", isTerminal: true },
    canceled: { status: "suppressed", isTerminal: true }, // canceled → suppressed
    in_progress: { status: "called", isTerminal: false },
    pending: { status: "pending", isTerminal: false },
  };
  return mapping[callStatus] || { status: "failed", isTerminal: true };
}

// Safely parse duration (string/int/null tolerance)
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

// Compute SHA256 hash (for raw_body_sha256 and idempotency_key)
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Compute idempotency key from payload fields
async function computeIdempotencyKey(payload: Record<string, unknown>): Promise<string> {
  const callId = (payload.call_id as string) || "";
  const status = (payload.status as string) || "";
  const recordingUrl = (payload.recording_url as string) || "";
  const durationSeconds = String(payload.duration_seconds ?? "");
  const metadata = payload.metadata as Record<string, unknown> | undefined;
  const callRequestId = (metadata?.call_request_id as string) || "";
  
  const parts = [callId, status, recordingUrl, durationSeconds, callRequestId];
  return sha256(parts.join("|"));
}

// Redact sensitive fields from payload for storage when raw_body is not stored
function redactPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...payload };
  const sensitiveFields = ["phone", "email", "transcript", "phone_number", "to_number", "from_number"];
  
  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = "[REDACTED]";
    }
  }
  
  // Also redact in metadata if present
  if (redacted.metadata && typeof redacted.metadata === "object") {
    const meta = { ...(redacted.metadata as Record<string, unknown>) };
    for (const field of sensitiveFields) {
      if (field in meta) {
        meta[field] = "[REDACTED]";
      }
    }
    redacted.metadata = meta;
  }
  
  return redacted;
}

// Extract headers as JSON object
function headersToJson(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// SIGNATURE VERIFICATION (Item D: Progressive Enforcement)
// ═══════════════════════════════════════════════════════════════════════════

type SignatureMode = "ENFORCE" | "LOG_ONLY" | "DISABLED";

interface SignatureResult {
  ok: boolean;
  mode: string; // e.g., "ENFORCE", "LOG_ONLY", "DISABLED", "NO_SECRET"
  valid: boolean | null; // null when not verified
  error?: string;
}

async function verifySignature(
  req: Request,
  rawBody: string,
  signatureMode: SignatureMode
): Promise<SignatureResult> {
  // Skip verification entirely in DISABLED mode
  if (signatureMode === "DISABLED") {
    return { ok: true, mode: "DISABLED", valid: null };
  }

  const secret = Deno.env.get("PHONECALLBOT_WEBHOOK_SECRET");
  if (!secret) {
    console.warn("[phone-call-outcome] No PHONECALLBOT_WEBHOOK_SECRET configured");
    // In enforce mode without secret, we can't verify - allow with warning
    return { ok: true, mode: "NO_SECRET", valid: null };
  }

  // Try both header variants (PhoneCall.bot may use either)
  const signatureHeader = req.headers.get("x-signature") || req.headers.get("x-phonecallbot-signature");
  const timestampRaw = req.headers.get("x-timestamp") || req.headers.get("x-phonecallbot-timestamp");

  if (!signatureHeader || !timestampRaw) {
    const error = "Missing signature or timestamp header";
    console.error("[phone-call-outcome]", error, {
      has_signature: !!signatureHeader,
      has_timestamp: !!timestampRaw,
    });
    return {
      ok: signatureMode !== "ENFORCE",
      mode: signatureMode,
      valid: false,
      error,
    };
  }

  // Normalize signature: support both "sha256=<hex>" and plain "<hex>" formats
  let signature = signatureHeader;
  if (signature.startsWith("sha256=")) {
    signature = signature.slice(7);
  }

  // Detect timestamp unit (ms vs sec)
  const timestampNum = parseInt(timestampRaw, 10);
  if (isNaN(timestampNum)) {
    const error = "Invalid timestamp format";
    return {
      ok: signatureMode !== "ENFORCE",
      mode: signatureMode,
      valid: false,
      error,
    };
  }

  // Auto-detect: if > 1e12, it's milliseconds; otherwise seconds
  const timestampMs = timestampNum > 1e12 ? timestampNum : timestampNum * 1000;

  // Replay protection: only in LOG_ONLY or ENFORCE mode
  const ageMs = Date.now() - timestampMs;
  if (ageMs > 5 * 60 * 1000) {
    const error = `Timestamp expired (${Math.round(ageMs / 1000)}s old)`;
    console.error("[phone-call-outcome]", error);
    return {
      ok: signatureMode !== "ENFORCE",
      mode: signatureMode,
      valid: false,
      error,
    };
  }
  if (ageMs < -60 * 1000) {
    const error = "Timestamp in future";
    console.error("[phone-call-outcome]", error);
    return {
      ok: signatureMode !== "ENFORCE",
      mode: signatureMode,
      valid: false,
      error,
    };
  }

  // Compute expected signature: HMAC-SHA256 of "{timestamp}.{body}"
  // PhoneCall.bot uses hex encoding
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
    const error = "Signature length mismatch";
    console.error("[phone-call-outcome]", error);
    return {
      ok: signatureMode !== "ENFORCE",
      mode: signatureMode,
      valid: false,
      error,
    };
  }

  let mismatch = 0;
  for (let i = 0; i < expectedSig.length; i++) {
    mismatch |= expectedSig.charCodeAt(i) ^ signature.charCodeAt(i);
  }

  if (mismatch !== 0) {
    const error = "Signature invalid";
    console.error("[phone-call-outcome]", error);
    return {
      ok: signatureMode !== "ENFORCE",
      mode: signatureMode,
      valid: false,
      error,
    };
  }

  console.log(`[phone-call-outcome] Signature verified (mode: ${signatureMode})`);
  return { ok: true, mode: signatureMode, valid: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════

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
  
  // Initialize Supabase client early (needed for receipt persistence)
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

  // Read raw body ONCE
  const rawBody = await req.text();
  const rawBodyHash = await sha256(rawBody);
  const headersJson = headersToJson(req.headers);

  // Get signature mode from env (default LOG_ONLY for safe rollout)
  const signatureMode = (Deno.env.get("PHONECALLBOT_SIGNATURE_MODE") || "LOG_ONLY") as SignatureMode;
  const storeRawBody = Deno.env.get("STORE_WEBHOOK_RAW_BODY") === "true";

  // Receipt tracking
  let receiptId: string | null = null;
  let parsedPayload: Record<string, unknown> | null = null;
  let payload: PhoneCallOutcomePayload | null = null;
  let correlationStatus: string = "unprocessed";
  let correlationStep: string | null = null;
  let matchedPhoneCallLogId: string | null = null;
  let errorCode: string | null = null;
  let errorMessage: string | null = null;
  let signatureResult: SignatureResult = { ok: true, mode: "PENDING", valid: null };

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: Parse JSON (with error handling for invalid JSON)
    // ═══════════════════════════════════════════════════════════════════════
    try {
      parsedPayload = JSON.parse(rawBody) as Record<string, unknown>;
      payload = parsedPayload as unknown as PhoneCallOutcomePayload;
    } catch {
      // Invalid JSON - persist receipt and return 200
      correlationStatus = "invalid";
      errorCode = "INVALID_JSON";
      errorMessage = "Failed to parse request body as JSON";
      
      await supabase.from("webhook_receipts").insert({
        provider: "phonecallbot",
        headers: headersJson,
        raw_body: storeRawBody ? rawBody : null,
        raw_body_sha256: rawBodyHash,
        parsed_payload: null,
        correlation_status: correlationStatus,
        error_code: errorCode,
        error_message: errorMessage,
        signature_mode: signatureMode,
        signature_valid: null,
      });

      console.error("[phone-call-outcome] Invalid JSON received");
      return new Response(
        JSON.stringify({ success: true, warning: "Invalid JSON - recorded", correlation_status: correlationStatus }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: Compute idempotency key and check for duplicate
    // ═══════════════════════════════════════════════════════════════════════
    const idempotencyKey = await computeIdempotencyKey(parsedPayload);
    
    // Check if we've already processed this exact webhook
    const { data: existingReceipt } = await supabase
      .from("webhook_receipts")
      .select("id, correlation_status")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existingReceipt) {
      console.log("[phone-call-outcome] Duplicate webhook detected (idempotency_key match)", {
        existing_receipt_id: existingReceipt.id,
        idempotency_key: idempotencyKey,
      });
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Duplicate webhook - already processed",
          existing_receipt_id: existingReceipt.id,
          correlation_status: "duplicate",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: Verify signature (Progressive Enforcement)
    // ═══════════════════════════════════════════════════════════════════════
    signatureResult = await verifySignature(req, rawBody, signatureMode);

    // In ENFORCE mode with invalid signature, persist and reject
    if (!signatureResult.ok) {
      correlationStatus = "invalid";
      errorCode = "SIGNATURE_INVALID";
      errorMessage = signatureResult.error || "Signature verification failed";

      await supabase.from("webhook_receipts").insert({
        provider: "phonecallbot",
        headers: headersJson,
        raw_body: storeRawBody ? rawBody : null,
        raw_body_sha256: rawBodyHash,
        parsed_payload: storeRawBody ? parsedPayload : redactPayload(parsedPayload),
        provider_call_id: payload?.call_id || null,
        call_request_id: (payload?.metadata?.call_request_id as string) || null,
        idempotency_key: idempotencyKey,
        correlation_status: correlationStatus,
        signature_mode: signatureResult.mode,
        signature_valid: signatureResult.valid,
        signature_error: signatureResult.error,
        error_code: errorCode,
        error_message: errorMessage,
      });

      console.error("[phone-call-outcome] Signature verification failed in ENFORCE mode");
      return new Response(
        JSON.stringify({ error: errorMessage, mode: signatureResult.mode }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 4: Insert receipt (always, before correlation)
    // ═══════════════════════════════════════════════════════════════════════
    const { data: receiptData, error: receiptError } = await supabase
      .from("webhook_receipts")
      .insert({
        provider: "phonecallbot",
        headers: headersJson,
        raw_body: storeRawBody ? rawBody : null,
        raw_body_sha256: rawBodyHash,
        parsed_payload: storeRawBody ? parsedPayload : redactPayload(parsedPayload),
        provider_call_id: payload?.call_id || null,
        call_request_id: (payload?.metadata?.call_request_id as string) || null,
        idempotency_key: idempotencyKey,
        correlation_status: "unprocessed",
        signature_mode: signatureResult.mode,
        signature_valid: signatureResult.valid,
        signature_error: signatureResult.error,
      })
      .select("id")
      .single();

    if (receiptError) {
      // If this is a unique constraint violation on idempotency_key, it's a race condition duplicate
      if (receiptError.code === "23505") {
        console.log("[phone-call-outcome] Race condition duplicate detected");
        return new Response(
          JSON.stringify({ success: true, warning: "Duplicate webhook (race condition)", correlation_status: "duplicate" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("[phone-call-outcome] Failed to insert receipt:", receiptError.message);
      // Continue processing even if receipt fails - don't block the webhook
    } else {
      receiptId = receiptData.id;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 5: Validate required fields
    // ═══════════════════════════════════════════════════════════════════════
    if (!payload?.call_id) {
      correlationStatus = "invalid";
      errorCode = "MISSING_CALL_ID";
      errorMessage = "Missing required field: call_id";
      
      if (receiptId) {
        await supabase.from("webhook_receipts").update({
          correlation_status: correlationStatus,
          error_code: errorCode,
          error_message: errorMessage,
        }).eq("id", receiptId);
      }
      
      console.error("[phone-call-outcome] Missing call_id");
      return new Response(
        JSON.stringify({ success: true, warning: errorMessage, correlation_status: correlationStatus }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payload?.status) {
      correlationStatus = "invalid";
      errorCode = "MISSING_STATUS";
      errorMessage = "Missing required field: status";
      
      if (receiptId) {
        await supabase.from("webhook_receipts").update({
          correlation_status: correlationStatus,
          error_code: errorCode,
          error_message: errorMessage,
        }).eq("id", receiptId);
      }
      
      console.error("[phone-call-outcome] Missing status");
      return new Response(
        JSON.stringify({ success: true, warning: errorMessage, correlation_status: correlationStatus }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // After validation, payload is guaranteed to have call_id and status
    const validPayload = payload as PhoneCallOutcomePayload;

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 6: 4-Step Correlation Algorithm (Item B)
    // ═══════════════════════════════════════════════════════════════════════
    const callRequestId = (validPayload.metadata?.call_request_id as string) || null;
    let existingLog: {
      id: string;
      call_status: string;
      lead_id: string | null;
      source_tool: string;
      outcome_timeline_written: boolean | null;
      call_request_id: string | null;
    } | null = null;

    // Step A: Match by provider_call_id
    const { data: logByProviderId } = await supabase
      .from("phone_call_logs")
      .select("id, call_status, lead_id, source_tool, outcome_timeline_written, call_request_id")
      .eq("provider_call_id", validPayload.call_id)
      .maybeSingle();

    if (logByProviderId) {
      existingLog = logByProviderId;
      correlationStep = "provider_call_id";
      console.log("[phone-call-outcome] Correlated via provider_call_id:", existingLog.id);
    }

    // Step B: Match by call_request_id in phone_call_logs
    if (!existingLog && callRequestId) {
      const { data: logByRequestId } = await supabase
        .from("phone_call_logs")
        .select("id, call_status, lead_id, source_tool, outcome_timeline_written, call_request_id")
        .eq("call_request_id", callRequestId)
        .maybeSingle();

      if (logByRequestId) {
        existingLog = logByRequestId;
        correlationStep = "call_request_id_log";
        console.log("[phone-call-outcome] Correlated via call_request_id in logs:", existingLog.id);
      }
    }

    // Step C: Match via pending_calls.call_request_id, then find/use lead_id
    if (!existingLog && callRequestId) {
      const { data: pendingCall } = await supabase
        .from("pending_calls")
        .select("id, lead_id, source_tool, agent_id")
        .eq("call_request_id", callRequestId)
        .maybeSingle();

      if (pendingCall) {
        // We have a pending call but no phone_call_logs entry - this shouldn't normally happen
        // but we can still proceed by updating pending_calls
        correlationStep = "call_request_id_pending";
        console.log("[phone-call-outcome] Found pending_call but no phone_call_logs - proceeding with partial update", {
          pending_call_id: pendingCall.id,
          call_request_id: callRequestId,
        });
        
        // Create a synthetic existingLog for the rest of the logic
        // Note: We won't have a phone_call_logs.id to update, but we can update pending_calls
        existingLog = null; // Keep as null, handle specially below
      }
    }

    // Step D: No match - dead letter
    if (!existingLog && correlationStep !== "call_request_id_pending") {
      correlationStatus = "unmatched";
      errorMessage = "No matching phone_call_logs or pending_calls found";
      
      if (receiptId) {
        await supabase.from("webhook_receipts").update({
          correlation_status: correlationStatus,
          error_message: errorMessage,
        }).eq("id", receiptId);
      }
      
      console.error("[phone-call-outcome] DEAD-LETTER: No correlation found", {
        provider_call_id: validPayload.call_id,
        call_request_id: callRequestId,
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          warning: "No matching call record found - dead-lettered",
          provider_call_id: validPayload.call_id,
          correlation_status: correlationStatus,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 7: Idempotency Check (existing Item A logic)
    // ═══════════════════════════════════════════════════════════════════════
    const terminalStates = ["completed", "failed", "no_answer", "canceled"];
    
    if (existingLog && terminalStates.includes(existingLog.call_status) && existingLog.outcome_timeline_written === true) {
      correlationStatus = "duplicate";
      
      if (receiptId) {
        await supabase.from("webhook_receipts").update({
          correlation_status: correlationStatus,
          matched_phone_call_log_id: existingLog.id,
          correlation_step: correlationStep,
        }).eq("id", receiptId);
      }
      
      console.log("[phone-call-outcome] IDEMPOTENT SKIP: Call already processed with timeline written", {
        call_id: validPayload.call_id,
        current_status: existingLog.call_status,
        outcome_timeline_written: existingLog.outcome_timeline_written,
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Already processed (idempotent)",
          current_status: existingLog.call_status,
          outcome_timeline_written: existingLog.outcome_timeline_written,
          correlation_status: correlationStatus,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 8: Update phone_call_logs (if we have a match)
    // ═══════════════════════════════════════════════════════════════════════
    const mappedStatus = mapCallStatus(validPayload.status);
    const parsedDuration = parseDuration(validPayload.duration_seconds);

    if (existingLog) {
      matchedPhoneCallLogId = existingLog.id;
      
      const updateData: Record<string, unknown> = {
        call_status: mappedStatus,
        updated_at: new Date().toISOString(),
        raw_outcome_payload: validPayload,
        provider_call_id: validPayload.call_id, // Ensure provider_call_id is set
      };

      if (parsedDuration !== null && parsedDuration >= 0) {
        updateData.call_duration_sec = parsedDuration;
      }

      if (validPayload.sentiment && ["positive", "neutral", "negative"].includes(validPayload.sentiment)) {
        updateData.call_sentiment = validPayload.sentiment;
      }

      if (validPayload.ai_notes) {
        updateData.ai_notes = truncateString(validPayload.ai_notes, 5000);
      }

      if (validPayload.recording_url) {
        try {
          new URL(validPayload.recording_url);
          updateData.recording_url = truncateString(validPayload.recording_url, 2000);
        } catch {
          console.warn("[phone-call-outcome] Invalid recording URL, skipping");
        }
      }

      if (validPayload.ended_at) {
        try {
          const endedDate = new Date(validPayload.ended_at);
          if (!isNaN(endedDate.getTime())) {
            updateData.ended_at = endedDate.toISOString();
          }
        } catch {
          updateData.ended_at = new Date().toISOString();
        }
      } else {
        updateData.ended_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("phone_call_logs")
        .update(updateData)
        .eq("id", existingLog.id);

      if (updateError) {
        console.error("[phone-call-outcome] Error updating call log:", updateError.message);
        errorCode = "UPDATE_FAILED";
        errorMessage = updateError.message;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 9: Update pending_calls (Item F: Deterministic State Mapping)
    // ═══════════════════════════════════════════════════════════════════════
    const pendingStatus = mapToPendingCallStatus(mappedStatus);
    
    // Find pending_calls to update (by provider_call_id or call_request_id)
    const pendingUpdateData: Record<string, unknown> = {
      status: pendingStatus.status,
      updated_at: new Date().toISOString(),
    };

    if (pendingStatus.isTerminal) {
      pendingUpdateData.completed_at = new Date().toISOString();
    }

    // Set last_error for failed calls
    if (mappedStatus === "failed") {
      pendingUpdateData.last_error = validPayload.ai_notes || `Call failed: ${validPayload.status}`;
    }

    // Set provider_call_id if not already set
    pendingUpdateData.provider_call_id = validPayload.call_id;

    // Try to update by provider_call_id first
    const { data: updatedByProvider } = await supabase
      .from("pending_calls")
      .update(pendingUpdateData)
      .eq("provider_call_id", validPayload.call_id)
      .select("id");

    // If no rows updated and we have call_request_id, try that
    if ((!updatedByProvider || updatedByProvider.length === 0) && callRequestId) {
      const { error: pendingUpdateError } = await supabase
        .from("pending_calls")
        .update(pendingUpdateData)
        .eq("call_request_id", callRequestId);

      if (pendingUpdateError) {
        console.warn("[phone-call-outcome] Failed to update pending_calls:", pendingUpdateError.message);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 10: Write timeline events (with idempotency protection)
    // ═══════════════════════════════════════════════════════════════════════
    let timelineWritten = false;

    if (existingLog?.lead_id && !existingLog.outcome_timeline_written) {
      // Find wm_lead to get wm_lead.id and original_session_id
      const { data: wmLead } = await supabase
        .from("wm_leads")
        .select("id, original_session_id")
        .eq("lead_id", existingLog.lead_id)
        .maybeSingle();

      const sentiment = validPayload.sentiment ?? null;
      const recordingUrl = validPayload.recording_url ?? null;

      // Build note with provider_call_id appended for debugging (Item C)
      const outcomeNote = `📞 Call ${mappedStatus}${parsedDuration ? ` (${parsedDuration}s)` : ""}${recordingUrl ? " [Recording available]" : ""}${sentiment ? ` | Sentiment: ${sentiment}` : ""} | provider_call_id: ${validPayload.call_id}`;

      let noteWritten = false;
      let eventWritten = false;

      // Write to lead_notes if wm_lead exists
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

      // Write to wm_events if session exists
      if (wmLead?.original_session_id) {
        const { error: eventError } = await supabase.from("wm_events").insert({
          session_id: wmLead.original_session_id,
          event_name: `call_${mappedStatus}`,
          event_category: "phone",
          page_path: "/admin/lead-detail",
          event_data: {
            provider_call_id: validPayload.call_id,
            call_log_id: existingLog.id,
            duration_seconds: parsedDuration,
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

      timelineWritten = noteWritten || eventWritten;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 11: Set idempotency flag (only after successful timeline writes)
    // ═══════════════════════════════════════════════════════════════════════
    if (timelineWritten && existingLog) {
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

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 12: Update receipt with final status
    // ═══════════════════════════════════════════════════════════════════════
    correlationStatus = "processed";
    
    if (receiptId) {
      await supabase.from("webhook_receipts").update({
        correlation_status: correlationStatus,
        matched_phone_call_log_id: matchedPhoneCallLogId,
        correlation_step: correlationStep,
        error_code: errorCode,
        error_message: errorMessage,
      }).eq("id", receiptId);
    }

    const duration = Date.now() - startTime;
    console.log(`[phone-call-outcome] Successfully processed call in ${duration}ms`, {
      provider_call_id: validPayload.call_id,
      new_status: mappedStatus,
      correlation_step: correlationStep,
      timeline_written: timelineWritten,
      receipt_id: receiptId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        call_log_id: matchedPhoneCallLogId,
        new_status: mappedStatus,
        timeline_written: timelineWritten,
        processing_time_ms: duration,
        signature_mode: signatureResult.mode,
        signature_valid: signatureResult.valid,
        correlation_status: correlationStatus,
        correlation_step: correlationStep,
        receipt_id: receiptId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[phone-call-outcome] Unexpected error:", error);
    
    // Try to update receipt with error
    if (receiptId) {
      await supabase.from("webhook_receipts").update({
        correlation_status: "invalid",
        error_code: "UNEXPECTED_ERROR",
        error_message: error instanceof Error ? error.message : "Unknown error",
      }).eq("id", receiptId);
    }

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
