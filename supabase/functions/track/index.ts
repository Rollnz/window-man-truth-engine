/**
 * /track Edge Function
 * 
 * Receives tracking events and persists to lead_activities for analytics.
 * 
 * SCORING REMOVED: Per unified scoring plan, all scoring logic is now
 * centralized in the get_event_score() PostgreSQL function, triggered
 * via wm_events → handle_new_event_scoring() trigger.
 * 
 * This function now ONLY:
 * - Persists events to lead_activities
 * - Links activities to existing leads
 * - Updates lead timestamps
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =====================================================
// Main Handler
// =====================================================

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    
    // Validate required fields
    const {
      event_id,
      event_name,
      client_id,
      session_id,
      user_id,
      page_path,
      section_id,
      payload = {},
      attribution,
      timestamp,
    } = body;

    if (!event_id || !event_name || !client_id || !session_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: event_id, event_name, client_id, session_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for writes
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Insert activity (idempotent via event_id UNIQUE)
    // NOTE: score_delta is now always 0 - scoring happens via DB trigger on wm_events
    const { error: insertError } = await supabase
      .from("lead_activities")
      .insert({
        event_id,
        lead_id: null, // Will be linked later if lead exists
        user_id: user_id || null,
        session_id,
        client_id,
        event_name,
        score_delta: 0, // Scoring centralized in DB
        page_path,
        section_id: section_id || payload.section_id || null,
        payload: {
          ...payload,
          attribution,
          timestamp,
        },
      });

    // Handle duplicate event_id (idempotent - return success)
    if (insertError?.code === "23505") {
      console.log("[track] Duplicate event_id, returning success:", event_id);
      return new Response(
        JSON.stringify({ ok: true, duplicate: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (insertError) {
      console.error("[track] Insert error:", insertError);
      throw insertError;
    }

    // =====================================================
    // Lead Resolution & Linking (NO SCORING)
    // =====================================================

    let lead = null;

    // Try to find existing lead by user_id first
    if (user_id) {
      const { data: userLead } = await supabase
        .from("leads")
        .select("id")
        .eq("user_id", user_id)
        .single();
      
      if (userLead) lead = userLead;
    }

    // Fall back to client_id lookup
    if (!lead) {
      const { data: clientLead } = await supabase
        .from("leads")
        .select("id")
        .eq("client_id", client_id)
        .single();
      
      if (clientLead) lead = clientLead;
    }

    // If lead exists, link activity and update timestamp
    if (lead) {
      const updatePayload: Record<string, unknown> = {
        last_activity_at: new Date().toISOString(),
      };

      // Update last_touch attribution
      if (attribution?.last_touch) {
        updatePayload.last_touch = attribution.last_touch;
      }

      const { error: updateError } = await supabase
        .from("leads")
        .update(updatePayload)
        .eq("id", lead.id);

      if (updateError) {
        console.error("[track] Lead update error:", updateError);
      }

      // Link the activity to the lead
      await supabase
        .from("lead_activities")
        .update({ lead_id: lead.id })
        .eq("event_id", event_id);
    }

    // Return success (no scoring data)
    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[track] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
