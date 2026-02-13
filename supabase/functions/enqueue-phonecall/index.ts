import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const reqSchema = z.object({
  leadId: z.string().uuid(),
  sourceTool: z.string().min(1).max(100),
  phoneE164: z.string().min(8).max(20),
  payload: z.record(z.unknown()).optional().nullable(),
});

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// SHA256 hash helper using Web Crypto API
async function sha256Hash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
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

  const parsed = reqSchema.safeParse(body);
  if (!parsed.success) {
    return json(400, {
      success: false,
      error: "invalid_input",
      details: parsed.error.errors,
    });
  }

  const { leadId, sourceTool, phoneE164, payload } = parsed.data;

  // ═══════════════════════════════════════════════════════════════════════════
  // 1) Idempotency: avoid duplicate enqueues within 10 minutes
  // ═══════════════════════════════════════════════════════════════════════════
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data: existing, error: existingErr } = await supabase
    .from("pending_calls")
    .select("call_request_id, status, updated_at, created_at")
    .eq("lead_id", leadId)
    .eq("source_tool", sourceTool)
    .in("status", ["pending", "processing", "called"])
    .gte("created_at", tenMinAgo)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!existingErr && existing && existing.length > 0) {
    return json(200, {
      success: true,
      enqueued: false,
      callRequestId: existing[0].call_request_id,
      status: existing[0].status,
      reason: "idempotent_existing_recent",
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2) Get agent routing config for this source_tool
  // ═══════════════════════════════════════════════════════════════════════════
  const { data: agentRow, error: agentErr } = await supabase
    .from("call_agents")
    .select("agent_id, enabled, first_message_template")
    .eq("source_tool", sourceTool)
    .maybeSingle();

  if (agentErr) {
    return json(500, {
      success: false,
      error: "agent_lookup_failed",
      details: agentErr.message,
    });
  }

  if (!agentRow || !agentRow.agent_id) {
    return json(400, {
      success: false,
      error: "no_agent_config",
      message: `No call_agents row for source_tool=${sourceTool}`,
    });
  }

  // Respect the kill switch
  if (agentRow.enabled === false) {
    return json(200, {
      success: true,
      enqueued: false,
      reason: "agent_disabled",
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3) Build call queue row
  // ═══════════════════════════════════════════════════════════════════════════
  const callRequestId = crypto.randomUUID();
  // Schedule call 2 minutes from now (server-side timestamp, not client)
  const scheduledFor = new Date(Date.now() + 2 * 60 * 1000).toISOString();

  const firstMessage =
    agentRow.first_message_template ||
    "Hi — this is Window Man. Quick question about your window project.";

  // Compute phone_hash (required NOT NULL column)
  const phoneHash = await sha256Hash(phoneE164);

  const insertRow = {
    call_request_id: callRequestId,
    lead_id: leadId,
    source_tool: sourceTool,
    status: "pending",
    scheduled_for: scheduledFor,
    next_attempt_at: scheduledFor,
    attempt_count: 0,
    phone_e164: phoneE164,
    phone_hash: phoneHash,
    agent_id: agentRow.agent_id,
    first_message: firstMessage,
    payload: payload || {},
    last_error: null,
    updated_at: new Date().toISOString(),
  };

  const { error: insErr } = await supabase
    .from("pending_calls")
    .insert(insertRow);

  if (insErr) {
    console.error("[enqueue-phonecall] Insert failed:", insErr);
    return json(500, {
      success: false,
      error: "enqueue_failed",
      details: insErr.message,
    });
  }

  console.log("[enqueue-phonecall] Enqueued:", {
    callRequestId,
    leadId,
    sourceTool,
    scheduledFor,
  });

  return json(200, { success: true, enqueued: true, callRequestId });
});
