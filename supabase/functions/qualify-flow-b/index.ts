import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { account_id, is_homeowner, timeline, window_count, has_estimate } =
      await req.json();

    if (!account_id) throw new Error("account_id is required");

    // SCORING LOGIC
    let score = 0;
    if (is_homeowner) score += 30;

    if (timeline === "now") score += 25;
    else if (timeline === "within_month") score += 20;
    else if (timeline === "several_months") score += 10;

    if (window_count === "11+" || window_count === "whole_house") score += 20;
    else if (window_count === "6-10") score += 15;
    else if (window_count === "1-5") score += 10;

    if (has_estimate === "no") score += 10;
    else if (has_estimate === "yes_one" || has_estimate === "yes_multiple")
      score += 5;

    const qualifies = score >= 60 && is_homeowner;
    const event_type = qualifies ? "registration_completed" : "lead";
    const event_value = qualifies ? 100 : 10;

    // INSERT INTO DATABASE
    const { error: dbError } = await supabaseClient
      .from("qualification_answers")
      .insert({
        account_id,
        is_homeowner,
        timeline,
        window_count,
        has_estimate,
        raw_score: score,
        final_score: score,
        qualifies_for_registration_completed: qualifies,
        event_type,
        pixel_value: event_value,
      });

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({
        success: true,
        score,
        qualifies_for_registration_completed: qualifies,
        event_type,
        event_value,
        message: qualifies
          ? "Vault Unlocked. You are fully qualified."
          : "Vault Created. Upload a quote when you are ready.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
