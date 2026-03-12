import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_PHONE_CHANGE_ATTEMPTS = 2;

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
    const { phone, leadId, previousPhone } = await req.json();

    if (!phone || typeof phone !== "string") {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalized = normalizePhone(phone);
    const normalizedPrevious = previousPhone ? normalizePhone(previousPhone) : null;

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

    // ── Supabase client for DB operations ────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── A. Same-number check: treat as resend, skip attempt logic ────
    const isSameNumber = normalizedPrevious && normalized === normalizedPrevious;

    // ── B. Phone change attempt tracking (only if leadId + different number) ──
    let currentAttempts = 0;

    if (leadId && !isSameNumber && normalizedPrevious) {
      // This is a phone change attempt — check server-side limits
      const { data: lead, error: leadErr } = await supabase
        .from("leads")
        .select("phone_change_attempts, phone_change_locked_at")
        .eq("id", leadId)
        .single();

      if (leadErr) {
        console.error("Lead lookup error:", JSON.stringify(leadErr));
        return new Response(
          JSON.stringify({ error: "Unable to verify your account. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      currentAttempts = lead?.phone_change_attempts ?? 0;

      if (currentAttempts >= MAX_PHONE_CHANGE_ATTEMPTS) {
        console.log(`Phone change blocked for lead ${leadId}: ${currentAttempts} attempts used`);
        return new Response(
          JSON.stringify({
            error: "max_attempts_reached",
            attemptsUsed: currentAttempts,
            attemptsAllowed: MAX_PHONE_CHANGE_ATTEMPTS,
            lockedAt: lead?.phone_change_locked_at,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── C. VOIP Lookup on new number ─────────────────────────────
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

      if (lineType === "voip" || lineType === "landline" || lineType === "invalid") {
        // Log to phone_change_log for audit, but do NOT increment counter
        const logEntry = {
          attempted_phone: `****${normalized.slice(-4)}`,
          voip_result: lineType,
          timestamp: new Date().toISOString(),
          blocked_reason: lineType,
        };

        await supabase.rpc("jsonb_array_append_to_lead", {
          p_lead_id: leadId,
          p_entry: logEntry,
        }).catch(() => {
          // Fallback: direct update if RPC doesn't exist yet
          // We'll handle this inline
        });

        // Fallback: raw update to append log
        const { data: currentLead } = await supabase
          .from("leads")
          .select("phone_change_log")
          .eq("id", leadId)
          .single();

        const currentLog = Array.isArray(currentLead?.phone_change_log) ? currentLead.phone_change_log : [];
        await supabase
          .from("leads")
          .update({ phone_change_log: [...currentLog, logEntry] })
          .eq("id", leadId);

        return new Response(
          JSON.stringify({
            error: "Please enter a valid mobile number to receive your verification code.",
            line_type: lineType,
            attemptsUsed: currentAttempts,
            attemptsAllowed: MAX_PHONE_CHANGE_ATTEMPTS,
          }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── D. Mobile number — update lead + accounts atomically ──────
      const newAttemptCount = currentAttempts + 1;
      const logEntry = {
        attempted_phone: `****${normalized.slice(-4)}`,
        voip_result: "mobile",
        timestamp: new Date().toISOString(),
        blocked_reason: null,
      };

      // Read current log
      const { data: currentLeadForLog } = await supabase
        .from("leads")
        .select("phone_change_log")
        .eq("id", leadId)
        .single();

      const existingLog = Array.isArray(currentLeadForLog?.phone_change_log) ? currentLeadForLog.phone_change_log : [];

      const leadUpdate: Record<string, unknown> = {
        phone: normalized,
        phone_change_attempts: newAttemptCount,
        phone_change_log: [...existingLog, logEntry],
        updated_at: new Date().toISOString(),
      };

      if (newAttemptCount >= MAX_PHONE_CHANGE_ATTEMPTS) {
        leadUpdate.phone_change_locked_at = new Date().toISOString();
      }

      const { error: updateErr } = await supabase
        .from("leads")
        .update(leadUpdate)
        .eq("id", leadId);

      if (updateErr) {
        console.error("Lead phone update error:", JSON.stringify(updateErr));
        return new Response(
          JSON.stringify({ error: "Failed to update your phone number. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Also update accounts table
      await supabase
        .from("accounts")
        .update({ phone: normalized, updated_at: new Date().toISOString() })
        .eq("email", (await supabase.from("leads").select("email").eq("id", leadId).single()).data?.email);

      currentAttempts = newAttemptCount;
      console.log(`Phone changed for lead ${leadId}: attempt ${newAttemptCount}/${MAX_PHONE_CHANGE_ATTEMPTS}`);

    } else if (!isSameNumber && !leadId) {
      // ── First-time submission (no leadId) — run VOIP lookup ────────
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
    }

    // ── E. Send OTP via Twilio Verify ────────────────────────────────
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
        JSON.stringify({
          error: userMessage,
          attemptsUsed: currentAttempts,
          attemptsAllowed: MAX_PHONE_CHANGE_ATTEMPTS,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`OTP sent to ****${normalized.slice(-4)}, status: ${verifyData.status}`);

    // ── F. Success response with attempt tracking ────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        phone: normalized,
        attemptsUsed: currentAttempts,
        attemptsAllowed: MAX_PHONE_CHANGE_ATTEMPTS,
      }),
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
