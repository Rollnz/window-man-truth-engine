// ═══════════════════════════════════════════════════════════════════════════
// ADMIN-WEBHOOK-RECEIPTS - Debug/Diagnostics Endpoint (Phase 1)
// Provides admin-only access to webhook_receipts with explain=true mode
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

function safeInt(value: string | null, def: number, min: number, max: number) {
  const n = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

// Database-driven admin check via user_roles table
async function hasAdminRole(supabaseAdmin: ReturnType<typeof createClient>, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) {
    console.error("[admin-webhook-receipts] Error checking admin role:", error.message);
    return false;
  }
  return !!data;
}

// Mask PII (phone/email) unless explicitly requested
function maskPhone(phone: string | null): string | null {
  if (!phone) return null;
  if (phone.length < 6) return "***";
  return phone.slice(0, 3) + "****" + phone.slice(-2);
}

function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const atIndex = email.indexOf("@");
  if (atIndex < 2) return "***@***";
  return email.slice(0, 2) + "***@***";
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPLAIN MODE: Correlation Debugging (Phase 1 Core)
// ═══════════════════════════════════════════════════════════════════════════

interface ExplanationStep {
  step: string;
  table: string;
  condition: string;
  found: boolean;
}

interface CandidateMatch {
  id: string;
  [key: string]: unknown;
}

interface Explanation {
  present_keys: {
    provider_call_id: boolean;
    call_request_id: boolean;
    has_metadata: boolean;
  };
  attempted_matches: ExplanationStep[];
  result: string;
  root_cause: string;
  recommended_fix: string;
  candidate_matches: {
    step_a?: CandidateMatch[];
    step_b?: CandidateMatch[];
    step_c?: CandidateMatch[];
  };
}

// deno-lint-ignore no-explicit-any
async function buildExplanation(
  supabaseAdmin: any,
  receipt: Record<string, unknown>
): Promise<Explanation> {
  const providerCallId = receipt.provider_call_id as string | null;
  const callRequestId = receipt.call_request_id as string | null;
  const parsedPayload = receipt.parsed_payload as Record<string, unknown> | null;
  const hasMetadata = !!(parsedPayload?.metadata && typeof parsedPayload.metadata === "object");
  const correlationStatus = receipt.correlation_status as string;

  const presentKeys = {
    provider_call_id: !!providerCallId,
    call_request_id: !!callRequestId,
    has_metadata: hasMetadata,
  };

  const attemptedMatches: ExplanationStep[] = [];
  const candidateMatches: Explanation["candidate_matches"] = {};

  // Step A: phone_call_logs.provider_call_id == provider_call_id
  let stepAFound = false;
  if (providerCallId) {
    const { data: logsA, error: logsAError } = await supabaseAdmin
      .from("phone_call_logs")
      .select("id, call_request_id, call_status, source_tool, triggered_at")
      .eq("provider_call_id", providerCallId)
      .limit(3);

    if (logsAError) {
      console.error("[admin-webhook-receipts] Step A query error:", logsAError);
      throw new Error("Failed to query phone_call_logs by provider_call_id");
    }

    const logsAData = logsA as Array<{
      id: string;
      call_request_id: string | null;
      call_status: string;
      source_tool: string;
    }> | null;

    stepAFound = !!(logsAData && logsAData.length > 0);
    attemptedMatches.push({
      step: "A",
      table: "phone_call_logs",
      condition: `provider_call_id = '${providerCallId}'`,
      found: stepAFound,
    });
    if (logsAData && logsAData.length > 0) {
      candidateMatches.step_a = logsAData.map((r) => ({
        id: r.id,
        call_request_id: r.call_request_id,
        call_status: r.call_status,
        source_tool: r.source_tool,
      }));
    }
  } else {
    attemptedMatches.push({
      step: "A",
      table: "phone_call_logs",
      condition: "(skipped: no provider_call_id)",
      found: false,
    });
  }

  // Step B: phone_call_logs.call_request_id == call_request_id
  let stepBFound = false;
  if (callRequestId) {
    const { data: logsB, error: logsBError } = await supabaseAdmin
      .from("phone_call_logs")
      .select("id, provider_call_id, call_status, source_tool, triggered_at")
      .eq("call_request_id", callRequestId)
      .limit(3);

    if (logsBError) {
      console.error("[admin-webhook-receipts] Step B query error:", logsBError);
      throw new Error("Failed to query phone_call_logs by call_request_id");
    }

    const logsBData = logsB as Array<{
      id: string;
      provider_call_id: string | null;
      call_status: string;
      source_tool: string;
    }> | null;

    stepBFound = !!(logsBData && logsBData.length > 0);
    attemptedMatches.push({
      step: "B",
      table: "phone_call_logs",
      condition: `call_request_id = '${callRequestId}'`,
      found: stepBFound,
    });
    if (logsBData && logsBData.length > 0) {
      candidateMatches.step_b = logsBData.map((r) => ({
        id: r.id,
        provider_call_id: r.provider_call_id,
        call_status: r.call_status,
        source_tool: r.source_tool,
      }));
    }
  } else {
    attemptedMatches.push({
      step: "B",
      table: "phone_call_logs",
      condition: "(skipped: no call_request_id in metadata)",
      found: false,
    });
  }

  // Step C: pending_calls.call_request_id == call_request_id
  let stepCFound = false;
  if (callRequestId) {
    const { data: pendingC, error: pendingCError } = await supabaseAdmin
      .from("pending_calls")
      .select("id, call_request_id, lead_id, source_tool, status, scheduled_for")
      .eq("call_request_id", callRequestId)
      .limit(3);

    if (pendingCError) {
      console.error("[admin-webhook-receipts] Step C query error:", pendingCError);
      throw new Error("Failed to query pending_calls by call_request_id");
    }

    const pendingCData = pendingC as Array<{
      id: string;
      call_request_id: string;
      lead_id: string | null;
      source_tool: string;
      status: string;
    }> | null;

    stepCFound = !!(pendingCData && pendingCData.length > 0);
    attemptedMatches.push({
      step: "C",
      table: "pending_calls",
      condition: `call_request_id = '${callRequestId}'`,
      found: stepCFound,
    });
    if (pendingCData && pendingCData.length > 0) {
      candidateMatches.step_c = pendingCData.map((r) => ({
        id: r.id,
        call_request_id: r.call_request_id,
        lead_id: r.lead_id,
        source_tool: r.source_tool,
        status: r.status,
      }));
    }
  } else {
    attemptedMatches.push({
      step: "C",
      table: "pending_calls",
      condition: "(skipped: no call_request_id in metadata)",
      found: false,
    });
  }

  // Build root_cause and recommended_fix
  let rootCause: string;
  let recommendedFix: string;

  if (correlationStatus === "matched" || correlationStatus === "processed") {
    rootCause = "Webhook successfully correlated with call record.";
    recommendedFix = "No action needed.";
  } else if (correlationStatus === "duplicate") {
    rootCause = "Duplicate webhook (idempotency key match or terminal state).";
    recommendedFix = "No action needed - already processed.";
  } else if (correlationStatus === "invalid") {
    const errorCode = receipt.error_code as string | null;
    if (errorCode === "SIGNATURE_INVALID") {
      rootCause = "Signature verification failed (ENFORCE mode).";
      recommendedFix = "Check PHONECALLBOT_WEBHOOK_SECRET matches provider config.";
    } else if (errorCode === "INVALID_JSON") {
      rootCause = "Request body was not valid JSON.";
      recommendedFix = "Check provider payload format.";
    } else if (errorCode === "MISSING_CALL_ID") {
      rootCause = "Payload missing required call_id field.";
      recommendedFix = "Check provider is sending call_id.";
    } else {
      rootCause = `Invalid webhook: ${errorCode || "unknown reason"}.`;
      recommendedFix = "Review error_message for details.";
    }
  } else if (correlationStatus === "unmatched") {
    // Determine why unmatched
    if (!presentKeys.provider_call_id && !presentKeys.call_request_id) {
      rootCause = "No provider_call_id or call_request_id in payload - cannot correlate.";
      recommendedFix = "Ensure provider sends call_id and metadata.call_request_id.";
    } else if (!presentKeys.call_request_id) {
      rootCause = `provider_call_id '${providerCallId}' not found in phone_call_logs.`;
      recommendedFix = "Call may not have been dispatched yet, or dispatcher failed before writing log.";
    } else if (stepCFound && !stepBFound) {
      rootCause = `pending_calls found for call_request_id but no phone_call_logs entry exists (Step C gap).`;
      recommendedFix = "Dispatcher may have failed between enqueue and trigger. Check call-dispatcher logs.";
    } else {
      rootCause = `No matching records for provider_call_id='${providerCallId}' or call_request_id='${callRequestId}'.`;
      recommendedFix = "Check if call was ever enqueued or if IDs are mismatched.";
    }
  } else {
    rootCause = `Unknown correlation status: ${correlationStatus}.`;
    recommendedFix = "Investigate webhook_receipts manually.";
  }

  return {
    present_keys: presentKeys,
    attempted_matches: attemptedMatches,
    result: correlationStatus,
    root_cause: rootCause,
    recommended_fix: recommendedFix,
    candidate_matches: candidateMatches,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(500, { error: "Missing Supabase env vars" });
  }

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return json(401, { error: "Missing bearer token" });

  // Dual-client pattern: anon validates JWT, service role queries DB
  const supabaseAuth = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  });
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: userRes, error: userErr } = await supabaseAuth.auth.getUser(token);
  if (userErr || !userRes?.user) return json(401, { error: "Invalid token" });

  const user = userRes.user;
  const isAdmin = await hasAdminRole(supabaseAdmin, user.id);
  if (!isAdmin) return json(403, { error: "Access denied" });

  const url = new URL(req.url);

  // ═══════════════════════════════════════════════════════════════════════
  // EXPLAIN MODE: Single receipt with full correlation analysis
  // ═══════════════════════════════════════════════════════════════════════
  const explainMode = url.searchParams.get("explain") === "true";
  const receiptId = url.searchParams.get("id");

  if (explainMode && receiptId) {
    // Fetch single receipt for explain mode
    const { data: receipt, error: receiptErr } = await supabaseAdmin
      .from("webhook_receipts")
      .select("*")
      .eq("id", receiptId)
      .maybeSingle();

    if (receiptErr) {
      return json(500, { error: "Failed to fetch receipt", details: receiptErr.message });
    }
    if (!receipt) {
      return json(404, { error: "Receipt not found" });
    }

    const explanation = await buildExplanation(supabaseAdmin, receipt as Record<string, unknown>);

    // PII redaction for explain mode
    const includePii = url.searchParams.get("include_pii") === "true";
    const includeRaw = url.searchParams.get("include_raw") === "true";

    const receiptData = receipt as Record<string, unknown>;
    const safeReceipt: Record<string, unknown> = {
      id: receiptData.id,
      received_at: receiptData.received_at,
      provider: receiptData.provider,
      provider_call_id: receiptData.provider_call_id,
      call_request_id: receiptData.call_request_id,
      correlation_status: receiptData.correlation_status,
      correlation_step: receiptData.correlation_step,
      signature_valid: receiptData.signature_valid,
      signature_mode: receiptData.signature_mode,
      signature_error: receiptData.signature_error,
      error_code: receiptData.error_code,
      error_message: receiptData.error_message,
      matched_phone_call_log_id: receiptData.matched_phone_call_log_id,
      idempotency_key: receiptData.idempotency_key,
      retention_until: receiptData.retention_until,
    };

    // Include parsed_payload (with optional PII redaction)
    if (receiptData.parsed_payload) {
      const payload = { ...(receiptData.parsed_payload as Record<string, unknown>) };
      if (!includePii) {
        // Redact common PII fields
        const piiFields = ["phone", "email", "phone_number", "to_number", "from_number"];
        for (const field of piiFields) {
          if (field in payload) {
            if (field.includes("phone") || field.includes("number")) {
              payload[field] = maskPhone(payload[field] as string);
            } else if (field.includes("email")) {
              payload[field] = maskEmail(payload[field] as string);
            }
          }
        }
        // Also redact in metadata
        if (payload.metadata && typeof payload.metadata === "object") {
          const meta = { ...(payload.metadata as Record<string, unknown>) };
          for (const field of piiFields) {
            if (field in meta) {
              if (field.includes("phone") || field.includes("number")) {
                meta[field] = maskPhone(meta[field] as string);
              } else if (field.includes("email")) {
                meta[field] = maskEmail(meta[field] as string);
              }
            }
          }
          payload.metadata = meta;
        }
      }
      safeReceipt.parsed_payload = payload;
    }

    // Include headers (safe by default, no PII typically)
    safeReceipt.headers = receiptData.headers;

    // Include raw_body only if explicitly requested
    if (includeRaw) {
      safeReceipt.raw_body = receiptData.raw_body;
    }

    console.log(`[admin-webhook-receipts] Explain mode for receipt ${receiptId} by ${user.email}`);

    return json(200, {
      ok: true,
      receipt: safeReceipt,
      explanation,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LIST MODE: Paginated query with filters
  // ═══════════════════════════════════════════════════════════════════════

  // Filters (all optional)
  const providerCallId = url.searchParams.get("provider_call_id");
  const callRequestIdFilter = url.searchParams.get("call_request_id");
  const correlationStatus = url.searchParams.get("status") || url.searchParams.get("correlation_status");
  const signatureValid = url.searchParams.get("signature_valid");
  const errorCode = url.searchParams.get("error_code");
  const since = url.searchParams.get("since");
  const until = url.searchParams.get("until");

  // Pagination: cursor-based (preferred) or offset-based (backwards compat)
  const limit = safeInt(url.searchParams.get("limit"), 50, 1, 200);
  const cursor = url.searchParams.get("cursor"); // ISO timestamp for cursor-based
  const offset = url.searchParams.has("offset") ? safeInt(url.searchParams.get("offset"), 0, 0, 50000) : null;

  // Safety switches
  const includeRaw = url.searchParams.get("include_raw") === "true";
  const includeHeaders = url.searchParams.get("include_headers") === "true";

  const baseSelect = [
    "id",
    "provider",
    "received_at",
    "provider_call_id",
    "call_request_id",
    "signature_valid",
    "signature_mode",
    "correlation_status",
    "correlation_step",
    "matched_phone_call_log_id",
    "error_code",
    "error_message",
    "idempotency_key",
    "retention_until",
  ];

  const selectFields = [...baseSelect];
  if (includeHeaders) selectFields.push("headers");
  if (includeRaw) selectFields.push("raw_body", "parsed_payload");
  else selectFields.push("parsed_payload");

  // deno-lint-ignore no-explicit-any
  let q: any = supabaseAdmin
    .from("webhook_receipts")
    .select(selectFields.join(","), { count: "exact" })
    .order("received_at", { ascending: false });

  // Apply filters
  if (receiptId) q = q.eq("id", receiptId);
  if (providerCallId) q = q.eq("provider_call_id", providerCallId);
  if (callRequestIdFilter) q = q.eq("call_request_id", callRequestIdFilter);
  if (correlationStatus) q = q.eq("correlation_status", correlationStatus);
  if (errorCode) q = q.eq("error_code", errorCode);
  if (since) q = q.gte("received_at", since);
  if (until) q = q.lte("received_at", until);
  if (signatureValid === "true") q = q.eq("signature_valid", true);
  if (signatureValid === "false") q = q.eq("signature_valid", false);

  // Cursor-based pagination (preferred)
  if (cursor) {
    q = q.lt("received_at", cursor);
  }

  // Apply limit (fetch one extra to determine next_cursor)
  if (offset !== null) {
    // Offset-based (backwards compat)
    q = q.range(offset, offset + limit - 1);
  } else {
    // Cursor-based: fetch limit+1 to detect if more exist
    q = q.limit(limit + 1);
  }

  const { data, error, count } = await q;

  if (error) {
    console.error("[admin-webhook-receipts] Query failed:", error);
    return json(500, { error: "Query failed", details: error.message });
  }

  // Process results
  const rawItems = (data || []) as Array<Record<string, unknown>>;
  const hasMore = offset === null && rawItems.length > limit;
  const items = hasMore ? rawItems.slice(0, limit) : rawItems;

  // Build next_cursor from last item's received_at
  const nextCursor = hasMore && items.length > 0 
    ? (items[items.length - 1].received_at as string) 
    : null;

  // Add raw_body_preview when not including full raw
  const results = items.map((r) => {
    const raw = typeof r.raw_body === "string" ? r.raw_body : "";
    const preview = raw && !includeRaw ? raw.slice(0, 500) : undefined;
    return {
      ...r,
      raw_body: includeRaw ? r.raw_body : undefined,
      raw_body_preview: preview || undefined,
    };
  });

  console.log(`[admin-webhook-receipts] Returned ${results.length} receipts for ${user.email}`);

  return json(200, {
    ok: true,
    meta: {
      limit,
      cursor: cursor || null,
      offset: offset ?? undefined,
      count: count ?? null,
      next_cursor: nextCursor,
      // Backwards compat: also include next_offset if using offset mode
      next_offset: offset !== null && count != null && offset + limit < count ? offset + limit : undefined,
      include_raw: includeRaw,
      include_headers: includeHeaders,
    },
    items: results,
  });
});
