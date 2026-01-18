/**
 * /track Edge Function
 * 
 * Receives tracking events, persists to lead_activities, 
 * calculates score_delta, and updates leads table with lead scoring.
 * 
 * Implements:
 * - Idempotent inserts via event_id UNIQUE constraint
 * - Server-side score calculation with exact weights
 * - Per-session caps for transcript_open and dossier_open
 * - Lead status thresholds: curious < 10, engaged 10-24, high_intent 25-44, hot >= 45
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =====================================================
// Scoring Configuration
// =====================================================

const SECTION_VIEW_SCORES: Record<string, number> = {
  'truth-audit': 3,
  'voice-agent': 3,
  'economic-proof': 4,
  'case-vault': 5,
  'golden-thread': 2,
  'hero': 0,
};

const CTA_CLICK_SCORES: Record<string, number> = {
  'audit_my_quote': 12,
  'listen_real_call': 8,
  'calculate_cost_of_inaction': 10,
  'see_how_my_home_compares': 9,
  'watch_voice_agent': 6,
  'view_case_studies': 5,
};

const TOOL_ROUTE_SCORES: Record<string, number> = {
  'quote_scanner': 15,
  'cost_of_inaction': 12,
  'reality_check': 10,
  'intel_library': 7,
};

const ENGAGEMENT_SCORES: Record<string, number> = {
  'wm_proof_transcript_open': 4,
  'wm_proof_dossier_open': 5,
};

const ENGAGEMENT_CAPS: Record<string, number> = {
  'wm_proof_transcript_open': 12, // max +12 per session (3 opens)
  'wm_proof_dossier_open': 15,    // max +15 per session (3 opens)
};

const STATUS_THRESHOLDS = [
  { min: 45, status: 'hot' },
  { min: 25, status: 'high_intent' },
  { min: 10, status: 'engaged' },
  { min: 0, status: 'curious' },
];

// =====================================================
// Score Calculation
// =====================================================

function calculateScoreDelta(
  eventName: string,
  payload: Record<string, unknown>
): number {
  // Section views
  if (eventName === 'wm_proof_section_view') {
    const sectionId = String(payload.section_id || '');
    return SECTION_VIEW_SCORES[sectionId] ?? 0;
  }

  // CTA clicks
  if (eventName === 'wm_proof_cta_click') {
    const ctaId = String(payload.cta_id || '');
    return CTA_CLICK_SCORES[ctaId] ?? 0;
  }

  // Tool routes
  if (eventName === 'wm_tool_route') {
    const toTool = String(payload.to_tool || '');
    return TOOL_ROUTE_SCORES[toTool] ?? 0;
  }

  // Engagement events (transcript/dossier)
  if (ENGAGEMENT_SCORES[eventName]) {
    return ENGAGEMENT_SCORES[eventName];
  }

  // Filters - minimal score
  if (eventName === 'wm_proof_transcript_filter' || eventName === 'wm_proof_dossier_filter') {
    return 1;
  }

  return 0;
}

function getLeadStatus(score: number): string {
  for (const threshold of STATUS_THRESHOLDS) {
    if (score >= threshold.min) {
      return threshold.status;
    }
  }
  return 'curious';
}

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

    // Calculate base score delta
    let scoreDelta = calculateScoreDelta(event_name, payload);

    // Apply per-session caps for engagement events
    if (ENGAGEMENT_CAPS[event_name] && scoreDelta > 0) {
      const cap = ENGAGEMENT_CAPS[event_name];
      
      // Sum existing scores for this event_name + session_id
      const { data: existingEvents } = await supabase
        .from("lead_activities")
        .select("score_delta")
        .eq("session_id", session_id)
        .eq("event_name", event_name);

      const existingTotal = (existingEvents || []).reduce(
        (sum, e) => sum + (e.score_delta || 0),
        0
      );

      // Cap the score delta
      if (existingTotal >= cap) {
        scoreDelta = 0; // Already at cap
      } else if (existingTotal + scoreDelta > cap) {
        scoreDelta = cap - existingTotal; // Partial credit
      }
    }

    // Insert activity (idempotent via event_id UNIQUE)
    const { error: insertError } = await supabase
      .from("lead_activities")
      .insert({
        event_id,
        lead_id: null, // Will be linked later if lead exists
        user_id: user_id || null,
        session_id,
        client_id,
        event_name,
        score_delta: scoreDelta,
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
        JSON.stringify({ ok: true, score_delta: 0, duplicate: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (insertError) {
      console.error("[track] Insert error:", insertError);
      throw insertError;
    }

    // =====================================================
    // Lead Resolution & Scoring
    // =====================================================

    let lead = null;
    let leadScoreTotal = 0;
    let leadStatus = "curious";

    // Try to find existing lead by user_id first
    if (user_id) {
      const { data: userLead } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user_id)
        .single();
      
      if (userLead) lead = userLead;
    }

    // Fall back to client_id lookup
    if (!lead) {
      const { data: clientLead } = await supabase
        .from("leads")
        .select("*")
        .eq("client_id", client_id)
        .single();
      
      if (clientLead) lead = clientLead;
    }

    // If lead exists, update scoring
    if (lead) {
      leadScoreTotal = (lead.lead_score_total || 0) + scoreDelta;
      leadStatus = getLeadStatus(leadScoreTotal);

      const updatePayload: Record<string, unknown> = {
        lead_score_total: leadScoreTotal,
        lead_status: leadStatus,
        last_activity_at: new Date().toISOString(),
      };

      // Update last_touch attribution
      if (attribution?.last_touch) {
        updatePayload.last_touch = attribution.last_touch;
      }

      // If becoming hot and has contact info, store last evidence
      if (leadStatus === "hot" && (lead.email || lead.phone)) {
        updatePayload.last_evidence = {
          last_cta_id: payload.cta_id || null,
          last_case_id: payload.case_id || null,
          last_section: section_id || payload.section_id || null,
          last_transcript_topic: payload.topic || null,
          became_hot_at: new Date().toISOString(),
        };
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

    // Return scoring result
    return new Response(
      JSON.stringify({
        ok: true,
        score_delta: scoreDelta,
        lead_score_total: leadScoreTotal,
        lead_status: leadStatus,
      }),
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
