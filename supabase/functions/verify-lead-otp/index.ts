import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { phone, code, leadData } = await req.json();

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: "Phone and code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalized = normalizePhone(phone);

    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_VERIFY_SERVICE_SID = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    // ── Verify OTP with Twilio ───────────────────────────────────────
    const checkUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;

    const checkRes = await fetch(checkUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: normalized, Code: code }),
    });

    const checkData = await checkRes.json();

    if (!checkRes.ok || checkData.status !== "approved") {
      console.error("OTP check failed:", JSON.stringify(checkData));
      return new Response(
        JSON.stringify({
          error: "Incorrect code, please try again.",
          valid: false,
          status: checkData.status || "failed",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── OTP approved → Save lead to database ─────────────────────────
    console.log(`OTP approved for ****${normalized.slice(-4)}, saving lead...`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const leadPayload = {
      email: leadData?.email || "",
      name: leadData?.name || null,
      first_name: leadData?.firstName || null,
      last_name: leadData?.lastName || null,
      phone: normalized,
      source_tool: leadData?.sourceTool || "quote-builder",
      source_form: "quote-builder-verified",
      // Attribution fields
      utm_source: leadData?.attribution?.utm_source || null,
      utm_medium: leadData?.attribution?.utm_medium || null,
      utm_campaign: leadData?.attribution?.utm_campaign || null,
      client_id: leadData?.clientId || null,
      session_data: leadData?.sessionData || null,
      identity_version: 2,
    };

    const { data: insertedLead, error: dbError } = await supabase
      .from("leads")
      .insert(leadPayload)
      .select("id")
      .single();

    if (dbError) {
      console.error("Lead insert error:", JSON.stringify(dbError));
      return new Response(
        JSON.stringify({ error: "Failed to save your information. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Lead saved: ${insertedLead.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        valid: true,
        status: "approved",
        leadId: insertedLead.id,
        phone: normalized,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-lead-otp error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
