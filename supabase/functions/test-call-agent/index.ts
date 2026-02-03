// ═══════════════════════════════════════════════════════════════════════════
// TEST CALL AGENT - Admin-only direct PhoneCall.bot API trigger
// ═══════════════════════════════════════════════════════════════════════════
// Bypasses pending_calls queue for admin testing purposes.
// Security: Requires valid JWT + admin email whitelist.
// ═══════════════════════════════════════════════════════════════════════════

import {
  validateAdminRequest,
  corsHeaders,
  errorResponse,
  successResponse,
} from "../_shared/adminAuth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ═══════════════════════════════════════════════════════════════════════════
// Phone Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalize phone to E.164 format (US-centric).
 * Strips all non-digit characters, then prepends +1 for US numbers.
 */
function normalizeToE164(phone: string): string | null {
  if (!phone) return null;

  // Strip all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, "");

  // If starts with +, validate and return
  if (cleaned.startsWith("+")) {
    // Validate E.164: + followed by 1-15 digits, first digit not 0
    if (/^\+[1-9]\d{1,14}$/.test(cleaned)) {
      return cleaned;
    }
    // Strip + and try to normalize
    cleaned = cleaned.slice(1);
  }

  // US number handling
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned}`;
  }

  // If it's a valid international format without +, add it
  if (cleaned.length >= 10 && cleaned.length <= 15 && !cleaned.startsWith("0")) {
    return `+${cleaned}`;
  }

  return null;
}

/**
 * Mask phone for logging (show only last 4 digits).
 */
function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return "******";
  return phone.slice(0, 2) + "******" + phone.slice(-4);
}

// ═══════════════════════════════════════════════════════════════════════════
// Request/Response Types
// ═══════════════════════════════════════════════════════════════════════════

interface TestCallRequest {
  agent_source_tool: string;
  phone_number: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Handler
// ═══════════════════════════════════════════════════════════════════════════

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return errorResponse(405, "method_not_allowed", "Only POST method is allowed");
  }

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // Step 1: Admin Authentication (JWT + email whitelist)
    // ─────────────────────────────────────────────────────────────────────────
    const validation = await validateAdminRequest(req);
    if (!validation.ok) {
      return validation.response;
    }
    const { email: adminEmail, supabaseAdmin } = validation;

    console.log("[test-call-agent] Admin authenticated:", adminEmail);

    // ─────────────────────────────────────────────────────────────────────────
    // Step 2: Parse and Validate Request Body
    // ─────────────────────────────────────────────────────────────────────────
    let body: TestCallRequest;
    try {
      body = await req.json();
    } catch {
      return errorResponse(400, "invalid_json", "Invalid JSON body");
    }

    const { agent_source_tool, phone_number } = body;

    if (!agent_source_tool || typeof agent_source_tool !== "string") {
      return errorResponse(400, "missing_source_tool", "agent_source_tool is required");
    }

    if (!phone_number || typeof phone_number !== "string") {
      return errorResponse(400, "missing_phone", "phone_number is required");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 3: Normalize Phone to E.164
    // ─────────────────────────────────────────────────────────────────────────
    const normalizedPhone = normalizeToE164(phone_number);
    if (!normalizedPhone) {
      return errorResponse(
        422,
        "invalid_phone",
        "Phone number could not be normalized to E.164 format. Expected format: +1XXXXXXXXXX"
      );
    }

    console.log("[test-call-agent] Phone normalized:", {
      input: maskPhone(phone_number),
      normalized: maskPhone(normalizedPhone),
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Step 4: Look Up Agent from call_agents Table
    // ─────────────────────────────────────────────────────────────────────────
    const { data: agentData, error: agentError } = await supabaseAdmin
      .from("call_agents")
      .select("id, source_tool, agent_id, enabled, first_message_template")
      .eq("source_tool", agent_source_tool)
      .single();

    if (agentError) {
      if (agentError.code === "PGRST116") {
        return errorResponse(
          404,
          "agent_not_found",
          `No call agent configured for source_tool: ${agent_source_tool}`
        );
      }
      console.error("[test-call-agent] DB error fetching agent:", agentError);
      return errorResponse(500, "db_error", "Failed to fetch agent configuration");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 5: Validate Agent Configuration
    // ─────────────────────────────────────────────────────────────────────────

    // Check if agent is enabled
    if (!agentData.enabled) {
      return errorResponse(
        422,
        "agent_disabled",
        `Agent for ${agent_source_tool} is currently disabled. Enable it first.`
      );
    }

    // Check for placeholder agent ID
    const PLACEHOLDER_PATTERNS = [
      "PLACEHOLDER",
      "placeholder",
      "TODO",
      "CHANGEME",
      "agent_placeholder",
      "test_agent",
    ];

    const isPlaceholder = PLACEHOLDER_PATTERNS.some(
      (pattern) =>
        agentData.agent_id.includes(pattern) ||
        agentData.agent_id === pattern
    );

    if (isPlaceholder) {
      return errorResponse(
        422,
        "agent_not_configured",
        `Agent for ${agent_source_tool} has a placeholder ID ("${agentData.agent_id.slice(0, 20)}..."). Configure a real PhoneCall.bot agent ID first.`
      );
    }

    // Validate agent_id format (PhoneCall.bot uses agent_[a-z0-9]+ pattern)
    if (!agentData.agent_id.startsWith("agent_")) {
      return errorResponse(
        422,
        "invalid_agent_id",
        `Agent ID "${agentData.agent_id.slice(0, 20)}..." doesn't match expected PhoneCall.bot format (agent_xxxxx).`
      );
    }

    console.log("[test-call-agent] Agent validated:", {
      source_tool: agentData.source_tool,
      agent_id: agentData.agent_id.slice(0, 12) + "...",
      enabled: agentData.enabled,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Step 6: Get PhoneCall.bot Webhook URL
    // ─────────────────────────────────────────────────────────────────────────
    const webhookUrl = Deno.env.get("PHONECALL_BOT_WEBHOOK_URL");
    if (!webhookUrl) {
      console.error("[test-call-agent] Missing PHONECALL_BOT_WEBHOOK_URL");
      return errorResponse(500, "config_error", "PhoneCall.bot webhook URL not configured");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 7: Call PhoneCall.bot API
    // ─────────────────────────────────────────────────────────────────────────
    const testCallId = crypto.randomUUID();
    const firstMessage = agentData.first_message_template.replace(
      /\{first_name\}/gi,
      "Test User"
    );

    const requestBody = {
      agent_id: agentData.agent_id,
      to: normalizedPhone,
      first_message: firstMessage,
      metadata: {
        test_call_id: testCallId,
        source_tool: agent_source_tool,
        admin_email: adminEmail,
        is_test_call: true,
      },
    };

    console.log("[test-call-agent] Calling PhoneCall.bot:", {
      test_call_id: testCallId,
      agent_id: agentData.agent_id,
      phone: maskPhone(normalizedPhone),
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    let providerResponse: Response;
    let providerStatus: number;
    let providerBody: string;
    let providerCallId: string | null = null;

    try {
      providerResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      providerStatus = providerResponse.status;
      providerBody = await providerResponse.text();

      // Try to extract provider call ID
      try {
        const parsed = JSON.parse(providerBody);
        providerCallId = parsed?.call_id || parsed?.id || parsed?.provider_call_id || null;
      } catch {
        // Response might not be JSON
      }

      console.log("[test-call-agent] PhoneCall.bot response:", {
        status: providerStatus,
        provider_call_id: providerCallId,
        body_preview: providerBody.slice(0, 100),
      });
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        console.error("[test-call-agent] PhoneCall.bot request timed out");
        return errorResponse(504, "timeout", "PhoneCall.bot request timed out after 15 seconds");
      }

      console.error("[test-call-agent] PhoneCall.bot network error:", error);
      return errorResponse(
        502,
        "provider_error",
        error instanceof Error ? error.message : "Failed to reach PhoneCall.bot"
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 8: Return Result
    // ─────────────────────────────────────────────────────────────────────────
    const isSuccess = providerStatus >= 200 && providerStatus < 300;

    if (!isSuccess) {
      return errorResponse(
        502,
        "provider_rejected",
        `PhoneCall.bot returned HTTP ${providerStatus}: ${providerBody.slice(0, 200)}`
      );
    }

    return successResponse({
      test_call_id: testCallId,
      provider_call_id: providerCallId,
      agent_source_tool: agent_source_tool,
      agent_id_used: agentData.agent_id,
      phone_normalized: maskPhone(normalizedPhone),
      provider_status: providerStatus,
      message: "Test call dispatched successfully",
    });
  } catch (error) {
    console.error("[test-call-agent] Unexpected error:", error);
    return errorResponse(
      500,
      "internal_error",
      error instanceof Error ? error.message : "Internal server error"
    );
  }
});
