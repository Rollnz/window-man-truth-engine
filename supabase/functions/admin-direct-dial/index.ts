import { validateAdminRequest, corsHeaders, errorResponse, jsonResponse, assertNoError } from "../_shared/adminAuth.ts";

const DEFAULT_FIRST_MESSAGE = "Hi, this is a quick call from Window Man. Do you have a moment to discuss your window project?";

// ===== Phone utilities =====
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

// ===== Main handler =====
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse(405, "method_not_allowed", "Method not allowed");
  }

  try {
    const validation = await validateAdminRequest(req);
    if (!validation.ok) {
      return validation.response;
    }
    const { email, supabaseAdmin } = validation;

    const webhookUrl = Deno.env.get("PHONECALL_BOT_WEBHOOK_URL");
    if (!webhookUrl) {
      console.error("[admin-direct-dial] Missing PHONECALL_BOT_WEBHOOK_URL");
      return errorResponse(500, "config_error", "PhoneCall.bot URL not configured");
    }

    // Parse request body
    let body: { wm_lead_id?: string };
    try {
      body = await req.json();
    } catch {
      return errorResponse(400, "invalid_json", "Invalid JSON body");
    }

    const { wm_lead_id } = body;
    if (!wm_lead_id) {
      return errorResponse(400, "missing_wm_lead_id", "wm_lead_id is required");
    }

    // UUID format validation
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(wm_lead_id)) {
      return errorResponse(400, "invalid_uuid", "wm_lead_id must be a valid UUID");
    }

    // A) Load wm_leads by id - HARD FAIL
    const { data: leadData, error: leadErr } = await supabaseAdmin
      .from("wm_leads")
      .select("id, lead_id, phone, status")
      .eq("id", wm_lead_id)
      .single();

    assertNoError(leadErr, "wm_leads.select");

    if (!leadData) {
      return errorResponse(404, "lead_not_found", "Lead not found");
    }

    if (!leadData.phone) {
      return errorResponse(422, "no_phone", "Lead has no phone number");
    }

    // B) Normalize phone
    const normalizedPhone = normalizePhone(leadData.phone);
    if (!normalizedPhone || normalizedPhone.length < 11) {
      return errorResponse(422, "invalid_phone", "Phone number could not be normalized to E.164");
    }

    // C) Determine agent_id - HARD FAIL on errors
    const warnings: string[] = [];
    let agentId: string | null = null;

    // Try manual_dispatch source first
    const { data: manualAgent, error: manualAgentErr } = await supabaseAdmin
      .from("call_agents")
      .select("agent_id")
      .eq("source_tool", "manual_dispatch")
      .eq("enabled", true)
      .single();

    // .single() returns error if 0 or >1 rows - that's expected, so only fail on actual DB errors
    if (manualAgentErr && manualAgentErr.code !== "PGRST116") {
      assertNoError(manualAgentErr, "call_agents.select(manual_dispatch)");
    }

    if (manualAgent?.agent_id) {
      agentId = manualAgent.agent_id;
    } else {
      // Fallback to any enabled agent
      const { data: fallbackAgent, error: fallbackErr } = await supabaseAdmin
        .from("call_agents")
        .select("agent_id, source_tool")
        .eq("enabled", true)
        .limit(1)
        .single();

      if (fallbackErr && fallbackErr.code !== "PGRST116") {
        assertNoError(fallbackErr, "call_agents.select(fallback)");
      }

      if (fallbackAgent?.agent_id) {
        agentId = fallbackAgent.agent_id;
        warnings.push(`No 'manual_dispatch' agent configured. Using fallback agent from source_tool='${fallbackAgent.source_tool}'`);
      }
    }

    if (!agentId) {
      return errorResponse(500, "no_agent", "No enabled call agent found");
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

    // E) Insert lead_notes row ALWAYS - HARD FAIL
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
      // Not a hard-fail since call already made - but log it
    }

    // F) Return response to client
    return jsonResponse(isSuccess ? 200 : 502, {
      ok: isSuccess,
      provider_http_status: providerHttpStatus,
      provider_call_id: providerCallId || null,
      response_preview: providerResponseText.slice(0, 500),
      agent_id_used: agentId,
      warnings: warnings.length > 0 ? warnings : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("[admin-direct-dial] FATAL ERROR:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(500, "internal_error", message, {
      type: error instanceof Error ? error.name : "UnknownError",
    });
  }
});
