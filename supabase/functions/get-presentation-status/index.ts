import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { generationId } = await req.json();

    if (!generationId) {
      console.error("[get-presentation-status] Missing generationId");
      return new Response(
        JSON.stringify({ error: "Missing generationId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gammaApiKey = Deno.env.get("GAMMA_API_KEY");
    if (!gammaApiKey) {
      console.error("[get-presentation-status] GAMMA_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Gamma API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[get-presentation-status] Checking status for: ${generationId}`);

    const response = await fetch(
      `https://public-api.gamma.app/v1.0/generations/${generationId}`,
      {
        method: "GET",
        headers: {
          "X-API-KEY": gammaApiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[get-presentation-status] Gamma API error: ${response.status}`, errorText);
      return new Response(
        JSON.stringify({ 
          status: "error", 
          error: `Gamma API error: ${response.status}` 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log("[get-presentation-status] Gamma response:", JSON.stringify(result));

    // Gamma API returns status and url when complete
    // Possible statuses: "pending", "processing", "completed", "failed"
    if (result.status === "completed" && result.url) {
      return new Response(
        JSON.stringify({ 
          status: "completed", 
          url: result.url 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (result.status === "failed") {
      return new Response(
        JSON.stringify({ 
          status: "failed", 
          error: result.error || "Generation failed" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Still processing
    return new Response(
      JSON.stringify({ 
        status: result.status || "pending" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[get-presentation-status] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
