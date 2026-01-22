import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-wm-log-secret",
};

// UUID v4 regex for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(val: unknown): val is string {
  return typeof val === "string" && UUID_REGEX.test(val);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Authentication: Accept either secret header OR Supabase anon key
  // Secret header is for server-to-server, anon key is for frontend signals
  const providedSecret = req.headers.get("x-wm-log-secret");
  const expectedSecret = Deno.env.get("WM_LOG_SECRET");
  const authHeader = req.headers.get("authorization");
  const apiKeyHeader = req.headers.get("apikey");
  
  // Check multiple anon key sources (Lovable Cloud uses JWT format, standard Supabase uses sb_publishable_)
  const expectedAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  // Hardcode the known project anon key as fallback for Lovable Cloud
  const knownAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6dWxxZXhsZ2F2Z2djeWl6YWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODQwNjgsImV4cCI6MjA4MjY2MDA2OH0.QvwUD5ScBk2DrD8yKiS3NBSeOuGAikQ3XT5TKn6Hf5U";
  
  // Check secret header auth (server-to-server)
  const secretValid = expectedSecret && providedSecret && providedSecret === expectedSecret;
  
  // Check anon key auth (frontend signals via Supabase client pattern)
  // Accept either the env var anon key OR the known project anon key
  const anonKeyValid = (
    (expectedAnonKey && (apiKeyHeader === expectedAnonKey || authHeader === `Bearer ${expectedAnonKey}`)) ||
    (apiKeyHeader === knownAnonKey || authHeader === `Bearer ${knownAnonKey}`)
  );
  
  if (!secretValid && !anonKeyValid) {
    // Log which auth methods were attempted for debugging (v2)
    console.warn("[log-event] Auth failed v2:", {
      hasSecretHeader: !!providedSecret,
      hasApiKey: !!apiKeyHeader,
      hasAuthHeader: !!authHeader,
      // Debug: show actual values
      apiKeyPrefix: apiKeyHeader?.slice(0, 30),
      authHeaderPrefix: authHeader?.slice(0, 50),
      expectedKeyPrefix: expectedAnonKey?.slice(0, 30),
      knownKeyPrefix: knownAnonKey.slice(0, 30),
      // Check if auth header matches known key
      authMatchesKnown: authHeader === `Bearer ${knownAnonKey}`,
    });
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  console.log("[log-event] Auth succeeded via:", secretValid ? "secret" : "anon-key");

  try {
    const body = await req.json();
    
    // event_name is required
    if (!body.event_name || typeof body.event_name !== "string") {
      return new Response(JSON.stringify({ error: "event_name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // event_id: use provided if valid UUID, otherwise generate
    let eventId: string;
    if (isValidUUID(body.event_id)) {
      eventId = body.event_id;
    } else {
      eventId = crypto.randomUUID();
    }

    // Validate optional UUID fields (lead_id, session_id)
    const leadId = isValidUUID(body.lead_id) ? body.lead_id : null;
    const sessionId = isValidUUID(body.session_id) ? body.session_id : null;

    // Build insert payload
    const insertPayload = {
      event_id: eventId,
      event_name: body.event_name,
      event_type: typeof body.event_type === "string" ? body.event_type : "unknown",
      event_time: body.event_time || new Date().toISOString(),
      client_id: typeof body.client_id === "string" ? body.client_id : null,
      lead_id: leadId,
      session_id: sessionId,
      external_id: typeof body.external_id === "string" ? body.external_id : null,
      source_tool: typeof body.source_tool === "string" ? body.source_tool : null,
      page_path: typeof body.page_path === "string" ? body.page_path : null,
      funnel_stage: typeof body.funnel_stage === "string" ? body.funnel_stage : null,
      intent_tier: typeof body.intent_tier === "number" ? body.intent_tier : null,
      traffic_source: typeof body.traffic_source === "string" ? body.traffic_source : null,
      traffic_medium: typeof body.traffic_medium === "string" ? body.traffic_medium : null,
      campaign_id: typeof body.campaign_id === "string" ? body.campaign_id : null,
      fbclid: typeof body.fbclid === "string" ? body.fbclid : null,
      gclid: typeof body.gclid === "string" ? body.gclid : null,
      fbp: typeof body.fbp === "string" ? body.fbp : null,
      fbc: typeof body.fbc === "string" ? body.fbc : null,
      lead_score: typeof body.lead_score === "number" ? body.lead_score : null,
      metadata: typeof body.metadata === "object" && body.metadata !== null ? body.metadata : {},
      user_data: typeof body.user_data === "object" && body.user_data !== null ? body.user_data : null,
      source_system: typeof body.source_system === "string" ? body.source_system : "web",
      ingested_by: typeof body.ingested_by === "string" ? body.ingested_by : "log-event",
    };

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Attempt insert with ON CONFLICT handling via unique index
    const { data, error } = await supabase
      .from("wm_event_log")
      .insert(insertPayload)
      .select("id, event_id")
      .single();

    if (error) {
      // Check for unique constraint violation (duplicate event_id)
      if (error.code === "23505" && error.message.includes("uix_wm_event_log_event_id")) {
        console.log(`[log-event] Duplicate event_id: ${eventId}`);
        return new Response(
          JSON.stringify({ ok: true, event_id: eventId, duplicate: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Other errors
      console.error("[log-event] Insert error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[log-event] Logged event: ${body.event_name} (${eventId})`);
    return new Response(
      JSON.stringify({ ok: true, event_id: eventId, duplicate: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[log-event] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
