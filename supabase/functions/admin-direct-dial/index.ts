import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ===== Config =====
const ADMIN_EMAILS = ["vansiclenp@gmail.com", "mongoloyd@protonmail.com"];
const DEFAULT_FIRST_MESSAGE = "Hi, this is a quick call from Window Man. Do you have a moment to discuss your window project?";

// ===== CORS =====
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== Response helper =====
function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ===== Phone utilities (same as call-dispatcher) =====
function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^\d]/g, "");
  if (cleaned.length === 10) return `+1${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith("1")) return `+${cleaned}`;
  return cleaned ? `+${cleaned}` : "";
}

function maskPhone(phone: string): string {
  if (phone.length < 6) return "******";
  return phone.slice(0, 2) + "******" + phone.slice(-4);
}

function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// ===== Main handler =====
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { ok: false, code: "method_not_allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const webhookUrl = Deno.env.get("PHONECALL_BOT_WEBHOOK_URL");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[admin-direct-dial] Missing Supabase credentials");
    return json(500, { ok: false, code: "config_error", error: "Server configuration error" });
  }

  if (!webhookUrl) {
    console.error("[admin-direct-dial] Missing PHONECALL_BOT_WEBHOOK_URL");
    return json(500, { ok: false, code: "config_error", error: "PhoneCall.bot URL not configured" });
  }

  // Extract bearer token
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return json(401, { ok: false, code: "unauthorized", error: "Missing bearer token" });
  }

  // Dual-client pattern
  const supabaseAuth = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Validate JWT and get user
  const { data: userRes, error: userErr } = await supabaseAuth.auth.getUser(token);
  const user = userRes?.user;

  if (userErr || !user) {
    console.error("[admin-direct-dial] Auth error:", userErr?.message);
    return json(401, { ok: false, code: "unauthorized", error: "Unauthorized" });
  }

  // Check admin whitelist
  const email = (user.email || "").toLowerCase();
  if (!isAdminEmail(email)) {
    console.warn("[admin-direct-dial] Non-admin access attempt:", email);
    return json(403, { ok: false, code: "forbidden", error: "Access denied" });
  }

  // Parse request body
  let body: { wm_lead_id?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, code: "invalid_json", error: "Invalid JSON body" });
  }

  const { wm_lead_id } = body;
  if (!wm_lead_id) {
    return json(400, { ok: false, code: "missing_wm_lead_id", error: "wm_lead_id is required" });
  }

  // A) Load wm_leads by id
  const { data: leadData, error: leadErr } = await supabaseAdmin
    .from("wm_leads")
    .select("id, lead_id, phone, status")
    .eq("id", wm_lead_id)
    .single();

  if (leadErr || !leadData) {
    console.error("[admin-direct-dial] Lead not found:", wm_lead_id, leadErr?.message);
    return json(404, { ok: false, code: "lead_not_found", error: "Lead not found" });
  }

  if (!leadData.phone) {
    return json(422, { ok: false, code: "no_phone", error: "Lead has no phone number" });
  }

  // B) Normalize phone
  const normalizedPhone = normalizePhone(leadData.phone);
  if (!normalizedPhone || normalizedPhone.length < 11) {
    return json(422, { ok: false, code: "invalid_phone", error: "Phone number could not be normalized to E.164" });
  }

  // C) Determine agent_id
  const warnings: string[] = [];
  let agentId: string | null = null;

  // Try manual_dispatch source first
  const { data: manualAgent } = await supabaseAdmin
    .from("call_agents")
    .select("agent_id")
    .eq("source_tool", "manual_dispatch")
    .eq("enabled", true)
    .single();

  if (manualAgent?.agent_id) {
    agentId = manualAgent.agent_id;
  } else {
    // Fallback to any enabled agent
    const { data: fallbackAgent } = await supabaseAdmin
      .from("call_agents")
      .select("agent_id, source_tool")
      .eq("enabled", true)
      .limit(1)
      .single();

    if (fallbackAgent?.agent_id) {
      agentId = fallbackAgent.agent_id;
      warnings.push(`No 'manual_dispatch' agent configured. Using fallback agent from source_tool='${fallbackAgent.source_tool}'`);
    }
  }

  if (!agentId) {
    return json(500, { ok: false, code: "no_agent", error: "No enabled call agent found" });
  }

  // D) Call PhoneCall.bot immediately
  console.log("[admin-direct-dial] Calling PhoneCall.bot", {
    wm_lead_id,
    phone: maskPhone(normalizedPhone),
    agent_id: agentId,
    admin_email: email,
  });

  let providerHttpStatus: number;
  let providerResponseText: string;
  let providerCallId: string | undefined;

  try {
    const providerBody = {
      agent_id: agentId,
      to: normalizedPhone,
      first_message: DEFAULT_FIRST_MESSAGE,
      metadata: {
        source_tool: "direct_dial",
        wm_lead_id: wm_lead_id,
        lead_id: leadData.lead_id || null,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const providerResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(providerBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    providerHttpStatus = providerResponse.status;
    providerResponseText = await providerResponse.text();

    // Try to extract provider_call_id from response
    try {
      const parsed = JSON.parse(providerResponseText);
      providerCallId = parsed?.call_id || parsed?.id || parsed?.provider_call_id;
    } catch {
      // Not JSON, that's okay
    }

    console.log("[admin-direct-dial] PhoneCall.bot response", {
      status: providerHttpStatus,
      provider_call_id: providerCallId,
      response_preview: providerResponseText.slice(0, 100),
    });
  } catch (err) {
    console.error("[admin-direct-dial] PhoneCall.bot error", err);
    providerHttpStatus = 0;
    providerResponseText = err instanceof Error ? err.message : "Unknown error";
    if (err instanceof Error && err.name === "AbortError") {
      providerResponseText = "Request timed out after 15s";
    }
  }

  // E) Insert lead_notes row ALWAYS
  const isSuccess = providerHttpStatus >= 200 && providerHttpStatus < 300;
  const noteContent = [
    `📞 **Direct Dial attempt** by ${email}`,
    `- Phone: ${maskPhone(normalizedPhone)}`,
    `- Agent: ${agentId}`,
    `- HTTP Status: ${providerHttpStatus}`,
    providerCallId ? `- Provider Call ID: ${providerCallId}` : null,
    !isSuccess ? `- Error: ${providerResponseText.slice(0, 200)}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const { error: noteErr } = await supabaseAdmin.from("lead_notes").insert({
    lead_id: wm_lead_id,
    admin_email: email,
    content: noteContent,
  });

  if (noteErr) {
    console.error("[admin-direct-dial] Failed to insert lead_notes:", noteErr.message);
    warnings.push("Audit note failed to save");
  }

  // F) Return response to client
  return json(isSuccess ? 200 : 502, {
    ok: isSuccess,
    provider_http_status: providerHttpStatus,
    provider_call_id: providerCallId || null,
    response_preview: providerResponseText.slice(0, 500),
    agent_id_used: agentId,
    warnings: warnings.length > 0 ? warnings : undefined,
  });
});
