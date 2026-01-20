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

// Hardcoded admin whitelist (matching existing admin functions)
const ADMIN_EMAILS = new Set(
  ["vansiclenp@gmail.com", "mongoloyd@protonmail.com"].map((s) => s.toLowerCase())
);

function isAdminEmail(email: string | null | undefined) {
  const e = (email || "").toLowerCase();
  return e ? ADMIN_EMAILS.has(e) : false;
}

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
  if (!isAdminEmail(user.email)) return json(403, { error: "Access denied" });

  const url = new URL(req.url);

  // Filters (all optional)
  const receiptId = url.searchParams.get("id");
  const providerCallId = url.searchParams.get("provider_call_id");
  const callRequestId = url.searchParams.get("call_request_id");
  const correlationStatus = url.searchParams.get("correlation_status");
  const signatureValid = url.searchParams.get("signature_valid");
  const errorCode = url.searchParams.get("error_code");
  const since = url.searchParams.get("since");
  const until = url.searchParams.get("until");

  // Pagination
  const limit = safeInt(url.searchParams.get("limit"), 50, 1, 200);
  const offset = safeInt(url.searchParams.get("offset"), 0, 0, 50000);

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

  let q = supabaseAdmin
    .from("webhook_receipts")
    .select(selectFields.join(","), { count: "exact" })
    .order("received_at", { ascending: false });

  if (receiptId) q = q.eq("id", receiptId);
  if (providerCallId) q = q.eq("provider_call_id", providerCallId);
  if (callRequestId) q = q.eq("call_request_id", callRequestId);
  if (correlationStatus) q = q.eq("correlation_status", correlationStatus);
  if (errorCode) q = q.eq("error_code", errorCode);
  if (since) q = q.gte("received_at", since);
  if (until) q = q.lte("received_at", until);
  if (signatureValid === "true") q = q.eq("signature_valid", true);
  if (signatureValid === "false") q = q.eq("signature_valid", false);

  q = q.range(offset, offset + limit - 1);

  const { data, error, count } = await q;

  if (error) {
    console.error("[admin-webhook-receipts] Query failed:", error);
    return json(500, { error: "Query failed", details: error.message });
  }

  // Add preview for raw_body when not including full raw
  const results = (data || []).map((r) => {
    const record = r as unknown as Record<string, unknown>;
    const raw = typeof record.raw_body === "string" ? record.raw_body : "";
    const preview = raw ? raw.slice(0, 500) : null;
    return {
      ...record,
      raw_body_preview: includeRaw ? undefined : preview,
    };
  });

  console.log(`[admin-webhook-receipts] Returned ${results.length} receipts for ${user.email}`);

  return json(200, {
    ok: true,
    meta: {
      limit,
      offset,
      count: count ?? null,
      next_offset: count != null && offset + limit < count ? offset + limit : null,
      include_raw: includeRaw,
      include_headers: includeHeaders,
    },
    results,
  });
});
