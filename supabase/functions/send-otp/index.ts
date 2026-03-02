import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATE_LIMIT_MAX = 5; // max OTPs per phone per hour

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== "string") {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize to E.164
    let normalized = phone.replace(/[^0-9+]/g, "");
    if (!normalized.startsWith("+")) {
      if (normalized.length === 10) normalized = "+1" + normalized;
      else if (normalized.length === 11 && normalized.startsWith("1")) normalized = "+" + normalized;
      else normalized = "+" + normalized;
    }

    // ── Rate limiting ──────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const identifier = `otp:${normalized}`;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count, error: countError } = await supabase
      .from("rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("endpoint", "send-otp")
      .eq("identifier", identifier)
      .gte("created_at", oneHourAgo);

    if (countError) {
      console.error("Rate limit check failed:", countError);
      return new Response(
        JSON.stringify({ error: "Internal error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return new Response(
        JSON.stringify({ error: "Too many OTP requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record rate limit hit
    await supabase.from("rate_limits").insert({
      endpoint: "send-otp",
      identifier,
    });

    // ── Send via Twilio Verify ─────────────────────────────────────
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_VERIFY_SERVICE_SID = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
      console.error("Missing Twilio configuration secrets");
      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const twilioUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`;
    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const twilioRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: normalized,
        Channel: "sms",
      }),
    });

    const twilioData = await twilioRes.json();

    if (!twilioRes.ok) {
      console.error("Twilio Verify error:", JSON.stringify(twilioData));

      const userMessage =
        twilioData.message?.includes("not a valid")
          ? "This phone number is not valid for SMS delivery."
          : twilioData.message?.includes("unverified")
          ? "This number is not verified on your Twilio trial account."
          : "Failed to send verification code. Please try again.";

      return new Response(
        JSON.stringify({
          error: userMessage,
          twilio_code: twilioData.code,
          twilio_status: twilioRes.status,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`OTP sent to ${normalized.slice(-4)} via Twilio Verify, status: ${twilioData.status}`);

    return new Response(
      JSON.stringify({
        success: true,
        status: twilioData.status, // "pending"
        phone: normalized,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-otp error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
