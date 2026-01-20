// ═══════════════════════════════════════════════════════════════════════════
// ENQUEUE MANUAL CALL - ADMIN-ONLY DISPATCH
// Allows admins to manually queue calls to leads via the existing call pipeline
// Uses UPSERT to allow re-dispatch after previous calls complete
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin whitelist (case-insensitive) - keep in sync with other admin functions
const ADMIN_EMAILS = ["vansiclenp@gmail.com", "mongoloyd@protonmail.com"];

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// EXACT parity with trigger-phone-call lines 26-56
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[^\\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length === 10) return `+1${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith("1")) return `+${cleaned}`;
  return `+${cleaned}`;
}

async function hashPhone(phone: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(phone);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hourInNY(): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    hour12: false,
  });
  return parseInt(formatter.format(new Date()), 10);
}

function isWithinBusinessHoursNY(): boolean {
  const h = hourInNY();
  return h >= 9 && h < 21; // 9am-9pm NY time
}

interface EnqueueCallRequest {
  wm_lead_id: string;
  reason?: "manual_dispatch" | "recovery_sweep" | "hot_lead_followup";
  override_warnings?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[enqueue-manual-call] Missing Supabase credentials");
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
    console.error("[enqueue-manual-call] Auth error:", userErr?.message);
    return json(401, { error: "Unauthorized" });
  }

  // Check admin whitelist
  const email = (user.email || "").toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    console.warn("[enqueue-manual-call] Non-admin access attempt:", email);
    return json(403, { error: "Access denied" });
  }

  // Parse request body
  let payload: EnqueueCallRequest;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  if (!payload?.wm_lead_id) {
    return json(400, { error: "wm_lead_id is required" });
  }

  const reason = payload.reason || "manual_dispatch";
  const overrideWarnings = !!payload.override_warnings;

  console.log("[enqueue-manual-call] Processing request", {
    wm_lead_id: payload.wm_lead_id,
    reason,
    requested_by: email,
  });

  // Load wm_lead (bridge to leads.id via wm_leads.lead_id)
  const { data: wmLead, error: wmLeadErr } = await supabaseAdmin
    .from("wm_leads")
    .select("id, lead_id, phone, first_name, email, status, lead_quality, original_session_id")
    .eq("id", payload.wm_lead_id)
    .maybeSingle();

  if (wmLeadErr) {
    console.error("[enqueue-manual-call] DB error loading lead:", wmLeadErr.message);
    return json(500, { error: "Database error", details: wmLeadErr.message });
  }

  if (!wmLead) {
    return json(404, { queued: false, blocker: { type: "not_found", message: "Lead not found" } });
  }

  // === HARD BLOCKS ===

  if (!wmLead.phone) {
    return json(200, { queued: false, blocker: { type: "no_phone", message: "No phone number on file" } });
  }

  if (!wmLead.lead_id) {
    return json(200, { queued: false, blocker: { type: "not_found", message: "Lead has no linked contact record" } });
  }

  const terminalStatuses = ["closed_won", "closed_lost", "dead"];
  if (terminalStatuses.includes(wmLead.status)) {
    return json(200, {
      queued: false,
      blocker: { type: "terminal_status", message: `Lead is ${wmLead.status} - cannot dispatch` },
    });
  }

  // === SOFT WARNING: Business hours ===
  if (!isWithinBusinessHoursNY() && !overrideWarnings) {
    return json(200, { queued: false, warning: "Outside business hours (9am-9pm America/New_York)" });
  }

  // === Check for active pending call ===
  const { data: activePending } = await supabaseAdmin
    .from("pending_calls")
    .select("id, status")
    .eq("lead_id", wmLead.lead_id)
    .eq("source_tool", "manual_dispatch")
    .in("status", ["pending", "processing", "called"])
    .limit(1);

  if (activePending && activePending.length > 0) {
    return json(200, {
      queued: false,
      blocker: { type: "already_calling", message: "Call already queued or in progress" },
    });
  }

  // === Check cooldown (60 minutes since last non-failed call) ===
  const sixtyMinAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recentCalls } = await supabaseAdmin
    .from("phone_call_logs")
    .select("id, call_status, triggered_at")
    .eq("lead_id", wmLead.lead_id)
    .gte("triggered_at", sixtyMinAgo)
    .neq("call_status", "failed")
    .order("triggered_at", { ascending: false })
    .limit(1);

  if (recentCalls && recentCalls.length > 0) {
    const lastCall = recentCalls[0];
    const minAgo = Math.round((Date.now() - new Date(lastCall.triggered_at).getTime()) / 60000);
    return json(200, {
      queued: false,
      blocker: { type: "cooldown", message: `Called ${minAgo} min ago. Wait before dispatching again.` },
    });
  }

  // === Agent config ===
  const { data: agent } = await supabaseAdmin
    .from("call_agents")
    .select("source_tool, agent_id, first_message_template, enabled")
    .eq("source_tool", "manual_dispatch")
    .eq("enabled", true)
    .maybeSingle();

  if (!agent?.agent_id) {
    return json(200, {
      queued: false,
      blocker: { type: "no_agent", message: "Call agent not configured for manual_dispatch" },
    });
  }

  // === Prepare call fields ===
  const phoneE164 = normalizePhone(wmLead.phone);
  const phoneHash = await hashPhone(phoneE164);
  const firstName = wmLead.first_name || "there";
  const messageTemplate = agent.first_message_template || "Hi {first_name}, this is WindowMan.";
  const firstMessage = messageTemplate.replaceAll("{first_name}", firstName);

  // UPSERT (Critical): allows re-dispatch despite unique index
  // Also RESET dispatcher fields to clean state
  const scheduledFor = new Date(Date.now() + 2 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();
  const createdDate = new Date().toISOString().slice(0, 10);

  const { data: pendingRow, error: upsertErr } = await supabaseAdmin
    .from("pending_calls")
    .upsert(
      {
        lead_id: wmLead.lead_id, // leads.id (FK)
        source_tool: "manual_dispatch",

        phone_e164: phoneE164,
        phone_hash: phoneHash,
        agent_id: agent.agent_id, // TEXT agent_id, not UUID
        first_message: firstMessage,
        payload: {
          wm_lead_id: wmLead.id,
          email: wmLead.email,
          first_name: wmLead.first_name,
        },

        // RESET all dispatcher fields
        status: "pending",
        scheduled_for: scheduledFor,
        next_attempt_at: nowIso,
        attempt_count: 0,
        provider_call_id: null,
        last_error: null,
        triggered_at: null,
        completed_at: null,
        created_date: createdDate,

        // Manual dispatch metadata
        reason,
        requested_by_user_id: user.id,
      },
      { onConflict: "lead_id,source_tool", ignoreDuplicates: false }
    )
    .select("id, call_request_id, scheduled_for")
    .single();

  if (upsertErr || !pendingRow) {
    console.error("[enqueue-manual-call] UPSERT failed:", upsertErr?.message);
    return json(500, { queued: false, error: "Failed to enqueue call", details: String(upsertErr?.message || upsertErr) });
  }

  console.log("[enqueue-manual-call] Call enqueued successfully", {
    pending_call_id: pendingRow.id,
    call_request_id: pendingRow.call_request_id,
    scheduled_for: pendingRow.scheduled_for,
  });

  // === CALL DISPATCH TRUTH TABLE (Phase 2) ===
  // Comprehensive audit note with all dispatch details for debugging
  const { count: priorDispatchCount } = await supabaseAdmin
    .from("lead_notes")
    .select("*", { count: "exact", head: true })
    .eq("lead_id", wmLead.id)
    .ilike("content", "%Call dispatched%");

  const dispatchSeq = (priorDispatchCount || 0) + 1;
  const maskedPhone = phoneE164.slice(0, 5) + "****" + phoneE164.slice(-2);
  const businessHoursStatus = isWithinBusinessHoursNY() 
    ? "within_hours" 
    : overrideWarnings 
      ? "outside_hours_OVERRIDDEN" 
      : "outside_hours";

  // Truth Table format for maximum debuggability
  const truthTableContent = [
    `📞 DISPATCH TRUTH TABLE [#${dispatchSeq}]`,
    `────────────────────────────`,
    `pending_call_id: ${pendingRow.id}`,
    `call_request_id: ${pendingRow.call_request_id}`,
    `source_tool: manual_dispatch`,
    `agent_id: ${agent.agent_id}`,
    `phone: ${maskedPhone}`,
    `scheduled_for: ${pendingRow.scheduled_for}`,
    `business_hours: ${businessHoursStatus}`,
    `reason: ${reason}`,
    `dispatched_by: ${email}`,
    `lead_id (leads): ${wmLead.lead_id}`,
    `wm_lead_id: ${wmLead.id}`,
    `session_id: ${wmLead.original_session_id || "NONE"}`,
  ].join("\n");

  // ALWAYS write to lead_notes (immutable audit trail + timeline fallback)
  await supabaseAdmin.from("lead_notes").insert({
    lead_id: wmLead.id, // lead_notes expects wm_leads.id
    content: truthTableContent,
    admin_email: email,
  });

  // Golden Thread: write wm_events ONLY if session exists (session_id NOT NULL)
  if (wmLead.original_session_id) {
    await supabaseAdmin.from("wm_events").insert({
      session_id: wmLead.original_session_id,
      event_name: "call_queued",
      event_category: "phone",
      page_path: "/admin/lead-detail",
      event_data: {
        source_tool: "manual_dispatch",
        reason,
        pending_call_id: pendingRow.id,
        call_request_id: pendingRow.call_request_id,
        dispatch_seq: dispatchSeq,
        requested_by: email,
      },
    });
  }

  return json(200, {
    queued: true,
    pending_call_id: pendingRow.id,
    call_request_id: pendingRow.call_request_id,
    scheduled_for: pendingRow.scheduled_for,
  });
});
