import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ===== Config =====
const ADMIN_EMAILS = ["vansiclenp@gmail.com", "mongoloyd@protonmail.com"];

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

function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// ===== Main handler =====
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return json(405, { ok: false, code: "method_not_allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const webhookUrl = Deno.env.get("PHONECALL_BOT_WEBHOOK_URL");

  if (!supabaseUrl || !anonKey) {
    console.error("[admin-phonecallbot-health] Missing Supabase credentials");
    return json(500, { ok: false, code: "config_error", error: "Server configuration error" });
  }

  if (!webhookUrl) {
    return json(500, {
      ok: false,
      code: "config_error",
      error: "PHONECALL_BOT_WEBHOOK_URL not configured",
      response_preview: "Missing environment variable",
    });
  }

  // Extract bearer token
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return json(401, { ok: false, code: "unauthorized", error: "Missing bearer token" });
  }

  // Validate JWT
  const supabaseAuth = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userRes, error: userErr } = await supabaseAuth.auth.getUser(token);
  const user = userRes?.user;

  if (userErr || !user) {
    console.error("[admin-phonecallbot-health] Auth error:", userErr?.message);
    return json(401, { ok: false, code: "unauthorized", error: "Unauthorized" });
  }

  // Check admin whitelist
  const email = (user.email || "").toLowerCase();
  if (!isAdminEmail(email)) {
    console.warn("[admin-phonecallbot-health] Non-admin access attempt:", email);
    return json(403, { ok: false, code: "forbidden", error: "Access denied" });
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

  return json(200, {
    ok: isHealthy,
    webhook_url_configured: !!webhookUrl,
    health_status: healthStatus,
    response_preview: healthResponseText.slice(0, 500),
    checked_at: new Date().toISOString(),
  });
});
