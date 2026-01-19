import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logAttributionEvent } from "../_shared/attributionLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin email whitelist - must be lowercase for comparison
const ADMIN_EMAILS = [
  "admin@windowtruth.com",
  "tim@impactwindowexperts.com",
  "tim@itswindowman.com",
  "vansiclenp@gmail.com",
  "mongoloyd@protonmail.com",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = user.email?.toLowerCase() || "";
    if (!ADMIN_EMAILS.includes(userEmail)) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { leadId, newStatus, actualDealValue, notes, estimatedDealValue } = body;

    if (!leadId || !newStatus) {
      return new Response(JSON.stringify({ error: "leadId and newStatus required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current lead data
    const { data: currentLead, error: fetchError } = await supabase
      .from("wm_leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (fetchError || !currentLead) {
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get original attribution data from leads table for offline conversion tracking
    let originalAttribution = { 
      gclid: null as string | null, 
      fbc: null as string | null, 
      fbp: null as string | null, 
      email: currentLead.email as string,
    };
    
    if (currentLead.lead_id) {
      const { data: sourceLead } = await supabase
        .from("leads")
        .select("gclid, fbc, fbp, email")
        .eq("id", currentLead.lead_id)
        .single();
      
      if (sourceLead) {
        originalAttribution = {
          gclid: sourceLead.gclid,
          fbc: sourceLead.fbc,
          fbp: sourceLead.fbp,
          email: sourceLead.email || currentLead.email,
        };
      }
    }

    const previousStatus = currentLead.status;

    // Build update object
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (estimatedDealValue !== undefined) {
      updateData.estimated_deal_value = estimatedDealValue;
    }

    // Handle closed_won - record the sale
    if (newStatus === "closed_won") {
      updateData.closed_at = new Date().toISOString();
      if (actualDealValue !== undefined) {
        updateData.actual_deal_value = actualDealValue;
      }
    }

    // Handle appointment_set - update lead quality
    if (newStatus === "appointment_set" && currentLead.lead_quality !== "qualified") {
      updateData.lead_quality = "qualified";
    }

    // Update the lead
    const { data: updatedLead, error: updateError } = await supabase
      .from("wm_leads")
      .update(updateData)
      .eq("id", leadId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating lead:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log attribution event for key status changes
    const sessionId = currentLead.original_session_id;
    
    if (sessionId) {
      try {
        // Log status change event
        await logAttributionEvent({
          sessionId,
          eventName: "lead_status_changed",
          eventCategory: "crm",
          pagePath: "/admin/crm",
          eventData: {
            lead_id: leadId,
            email: currentLead.email,
            previous_status: previousStatus,
            new_status: newStatus,
            changed_by: userEmail,
          },
        });

        // Fire special events for key conversions
        if (newStatus === "appointment_set" && previousStatus !== "appointment_set") {
          await logAttributionEvent({
            sessionId,
            eventName: "appointment_set",
            eventCategory: "conversion",
            pagePath: "/admin/crm",
            eventData: {
              lead_id: leadId,
              email: currentLead.email,
              source_tool: currentLead.original_source_tool,
            },
          });
        }

        if (newStatus === "closed_won" && previousStatus !== "closed_won") {
          await logAttributionEvent({
            sessionId,
            eventName: "sale_completed",
            eventCategory: "conversion",
            pagePath: "/admin/crm",
            eventData: {
              lead_id: leadId,
              email: currentLead.email,
              source_tool: currentLead.original_source_tool,
              deal_value: actualDealValue || currentLead.estimated_deal_value || 0,
            },
          });
        }

        if (newStatus === "dead" && previousStatus !== "dead") {
          await logAttributionEvent({
            sessionId,
            eventName: "lead_marked_dead",
            eventCategory: "crm",
            pagePath: "/admin/crm",
            eventData: {
              lead_id: leadId,
              email: currentLead.email,
              previous_status: previousStatus,
            },
          });
        }
      } catch (logError) {
        // Don't fail the update if logging fails
        console.error("Attribution logging error:", logError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      lead: updatedLead,
      previousStatus,
      newStatus,
      // Include original attribution for offline conversion tracking
      attribution: originalAttribution,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("CRM Disposition error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
