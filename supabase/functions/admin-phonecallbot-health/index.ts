import { validateAdminRequest, corsHeaders, errorResponse, jsonResponse } from "../_shared/adminAuth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return errorResponse(405, "method_not_allowed", "Method not allowed");
  }

  try {
    const validation = await validateAdminRequest(req);
    if (!validation.ok) {
      return validation.response;
    }

    const webhookUrl = Deno.env.get("PHONECALL_BOT_WEBHOOK_URL");
    if (!webhookUrl) {
      return errorResponse(500, "config_error", "PHONECALL_BOT_WEBHOOK_URL not configured", {
        response_preview: "Missing environment variable",
      });
    }

    // Perform health check using the same webhook URL
    // We'll make a minimal OPTIONS/HEAD request first, then try a GET to the base
    // PhoneCall.bot typically expects POST for calls, but base URL may respond to GET
    let healthStatus: number;
    let healthResponseText: string;

    try {
      // Try extracting base URL from webhook URL for a health check
      const baseUrl = new URL(webhookUrl);
      // Many providers have /health or respond to base URL
      const healthEndpoint = `${baseUrl.origin}/`;

      console.log("[admin-phonecallbot-health] Checking health at:", healthEndpoint);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // First try a simple GET to the origin
      const response = await fetch(healthEndpoint, {
        method: "GET",
        headers: { "Accept": "application/json" },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      healthStatus = response.status;
      healthResponseText = await response.text();

      console.log("[admin-phonecallbot-health] Health response", {
        status: healthStatus,
        response_preview: healthResponseText.slice(0, 100),
      });
    } catch (err) {
      console.error("[admin-phonecallbot-health] Health check error", err);
      healthStatus = 0;
      healthResponseText = err instanceof Error ? err.message : "Unknown error";
      if (err instanceof Error && err.name === "AbortError") {
        healthResponseText = "Request timed out after 10s";
      }
    }

    // Also verify we have the webhook URL configured (proves creds are set)
    const isHealthy = healthStatus > 0;

    return jsonResponse(200, {
      ok: isHealthy,
      webhook_url_configured: !!webhookUrl,
      health_status: healthStatus,
      response_preview: healthResponseText.slice(0, 500),
      checked_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("[admin-phonecallbot-health] FATAL ERROR:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(500, "internal_error", message, {
      type: error instanceof Error ? error.name : "UnknownError",
    });
  }
});
