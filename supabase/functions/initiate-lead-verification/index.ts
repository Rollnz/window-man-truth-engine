const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[^0-9+]/g, "");
  if (!normalized.startsWith("+")) {
    if (normalized.length === 10) normalized = "+1" + normalized;
    else if (normalized.length === 11 && normalized.startsWith("1")) normalized = "+" + normalized;
    else normalized = "+" + normalized;
  }
  return normalized;
}

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

    const normalized = normalizePhone(phone);

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

    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    // ── Phase 1: Twilio Lookup (line_type_intelligence) ──────────────
    const lookupUrl = `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(normalized)}?Fields=line_type_intelligence`;

    const lookupRes = await fetch(lookupUrl, {
      method: "GET",
      headers: { Authorization: `Basic ${credentials}` },
    });

    const lookupData = await lookupRes.json();

    if (!lookupRes.ok) {
      console.error("Twilio Lookup error:", JSON.stringify(lookupData));
      return new Response(
        JSON.stringify({ error: "Unable to validate phone number. Please try again." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lineType = lookupData?.line_type_intelligence?.type;
    console.log(`Lookup result for ****${normalized.slice(-4)}: type=${lineType}`);

    if (lineType === "voip" || lineType === "invalid") {
      return new Response(
        JSON.stringify({
          error: "Please enter a valid mobile number to receive your quote.",
          line_type: lineType,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Phase 2: Send OTP via Twilio Verify ──────────────────────────
    const verifyUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`;

    const verifyRes = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: normalized, Channel: "sms" }),
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok) {
      console.error("Twilio Verify send error:", JSON.stringify(verifyData));

      const userMessage = verifyData.message?.includes("not a valid")
        ? "This phone number is not valid for SMS delivery."
        : verifyData.message?.includes("unverified")
        ? "This number is not verified on your Twilio trial account."
        : "Failed to send verification code. Please try again.";

      return new Response(
        JSON.stringify({ error: userMessage }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`OTP sent to ****${normalized.slice(-4)}, status: ${verifyData.status}`);

    return new Response(
      JSON.stringify({ success: true, phone: normalized }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("initiate-lead-verification error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
