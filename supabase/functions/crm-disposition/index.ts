import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logAttributionEvent } from "../_shared/attributionLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Database-driven admin check via user_roles table
// deno-lint-ignore no-explicit-any
async function hasAdminRole(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) {
    console.error("[crm-disposition] Error checking admin role:", error.message);
    return false;
  }
  return !!data;
}

// =============================================================================
// STATE MACHINE: Allowed Transitions Matrix
// =============================================================================
// Key insight: This prevents bidding corruption by ensuring CRM state cannot be
// manipulated by UI bugs or client-side tampering.

type LeadStatus = 
  | "new" 
  | "qualifying" 
  | "mql" 
  | "qualified" 
  | "appointment_set" 
  | "sat" 
  | "closed_won" 
  | "closed_lost" 
  | "dead";

const ALLOWED_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  // Entry state
  new: ["qualifying", "mql", "dead"],
  
  // Qualification funnel
  qualifying: ["mql", "qualified", "dead"],
  mql: ["qualified", "appointment_set", "dead"],
  qualified: ["appointment_set", "dead"],
  
  // Sales funnel  
  appointment_set: ["sat", "closed_won", "closed_lost", "dead"],
  sat: ["closed_won", "closed_lost", "dead"],
  
  // Terminal states - NO transitions out (except admin override)
  closed_won: [],
  closed_lost: [],
  dead: [],
};

// Disqualification reason codes for granular tracking
const VALID_DISQUALIFICATION_REASONS = [
  "outside_service_area",
  "non_window_inquiry",
  "duplicate",
  "price_shopper",
  "spam",
] as const;

type DisqualificationReason = typeof VALID_DISQUALIFICATION_REASONS[number];

function isValidTransition(from: LeadStatus, to: LeadStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

function isTerminalStatus(status: LeadStatus): boolean {
  return ["closed_won", "closed_lost", "dead"].includes(status);
}

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

    // Check admin role in database
    const isAdmin = await hasAdminRole(supabase, user.id);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = user.email || 'unknown';

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { 
      leadId, 
      newStatus, 
      actualDealValue, 
      notes, 
      estimatedDealValue,
      disqualificationReason,
      adminOverride = false, // Allow terminal state escape hatch for admins
    } = body;

    if (!leadId || !newStatus) {
      return new Response(JSON.stringify({ error: "leadId and newStatus required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate disqualification reason if moving to dead
    if (newStatus === "dead" && disqualificationReason) {
      if (!VALID_DISQUALIFICATION_REASONS.includes(disqualificationReason)) {
        return new Response(JSON.stringify({ 
          error: `Invalid disqualification reason. Valid options: ${VALID_DISQUALIFICATION_REASONS.join(", ")}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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

    const previousStatus = currentLead.status as LeadStatus;

    // ==========================================================================
    // STATE MACHINE ENFORCEMENT (Server-side truth)
    // ==========================================================================
    
    // Block transitions out of terminal states unless admin override
    if (isTerminalStatus(previousStatus) && !adminOverride) {
      return new Response(JSON.stringify({ 
        error: `Cannot transition from terminal status '${previousStatus}'. Use adminOverride flag if intentional.`,
        previousStatus,
        attemptedStatus: newStatus,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate the transition is allowed (unless admin override)
    if (!adminOverride && !isValidTransition(previousStatus, newStatus as LeadStatus)) {
      return new Response(JSON.stringify({ 
        error: `Invalid transition from '${previousStatus}' to '${newStatus}'`,
        previousStatus,
        attemptedStatus: newStatus,
        allowedTransitions: ALLOWED_TRANSITIONS[previousStatus] || [],
      }), {
        status: 400,
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

    // ==========================================================================
    // IMMUTABLE TIMESTAMPS (Set once, never overwrite)
    // ==========================================================================
    const now = new Date().toISOString();

    // captured_at: Set when entering any status beyond 'new' (first real interaction)
    if (previousStatus === "new" && newStatus !== "new" && !currentLead.captured_at) {
      updateData.captured_at = now;
    }

    // qualified_at: Set when entering qualified/mql/appointment_set (first qualification)
    const qualifyingStatuses = ["mql", "qualified", "appointment_set"];
    if (qualifyingStatuses.includes(newStatus) && !currentLead.qualified_at) {
      updateData.qualified_at = now;
    }

    // disqualified_at: Set when entering dead
    if (newStatus === "dead" && !currentLead.disqualified_at) {
      updateData.disqualified_at = now;
      if (disqualificationReason) {
        updateData.disqualification_reason = disqualificationReason;
      }
    }

    // Handle closed_won - record the sale
    if (newStatus === "closed_won") {
      if (!currentLead.closed_at) {
        updateData.closed_at = now;
      }
      if (actualDealValue !== undefined) {
        updateData.actual_deal_value = actualDealValue;
      }
    }

    // Handle closed_lost
    if (newStatus === "closed_lost" && !currentLead.closed_at) {
      updateData.closed_at = now;
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
            transition_valid: true,
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
            eventName: "lead_disqualified",
            eventCategory: "conversion",
            pagePath: "/admin/crm",
            eventData: {
              lead_id: leadId,
              email: currentLead.email,
              source_tool: currentLead.original_source_tool,
              previous_status: previousStatus,
              disqualification_reason: disqualificationReason || "unspecified",
              negative_value: -50, // Penalty for garbage leads
            },
          });
        }
        
        // Fire qualified event for 'qualified' status (sales qualified)
        // Note: cv_qualified_lead is gated separately via mark-qualified-conversion
        if (newStatus === "qualified" && previousStatus !== "qualified") {
          await logAttributionEvent({
            sessionId,
            eventName: "lead_qualified",
            eventCategory: "conversion",
            pagePath: "/admin/crm",
            eventData: {
              lead_id: leadId,
              email: currentLead.email,
              source_tool: currentLead.original_source_tool,
              qualification_value: 35, // $35 offline conversion value
            },
          });
        }
        
        // Fire qualified event for MQL status
        if (newStatus === "mql" && previousStatus !== "mql") {
          await logAttributionEvent({
            sessionId,
            eventName: "lead_qualified",
            eventCategory: "conversion",
            pagePath: "/admin/crm",
            eventData: {
              lead_id: leadId,
              email: currentLead.email,
              source_tool: currentLead.original_source_tool,
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
      transitioned: true, // Indicates valid transition occurred
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
