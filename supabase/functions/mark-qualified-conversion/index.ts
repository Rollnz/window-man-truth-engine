import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Mark Qualified Conversion Endpoint
 * 
 * CRITICAL: This is the server-side truth for cv_qualified_lead deduplication.
 * 
 * The client calls this BEFORE firing cv_qualified_lead.
 * - If qualified_cv_fired = false → set to true, return { fired: true }
 * - If qualified_cv_fired = true → return { fired: false } (already fired)
 * 
 * This prevents:
 * - Refresh duplicates
 * - Cross-device duplicates  
 * - localStorage wipe duplicates
 * - Client-side manipulation
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Database-driven admin check via user_roles table
async function hasAdminRole(supabase: ReturnType<typeof createClient>, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) {
    console.error("[mark-qualified-conversion] Error checking admin role:", error.message);
    return false;
  }
  return !!data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin access (only admins can mark conversions)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized", fired: false }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token", fired: false }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role in database
    const isAdmin = await hasAdminRole(supabase, user.id);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Access denied", fired: false }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed", fired: false }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { leadId } = body;

    if (!leadId) {
      return new Response(JSON.stringify({ error: "leadId required", fired: false }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==========================================================================
    // IDEMPOTENT OPERATION: Mark qualified conversion as fired
    // ==========================================================================
    // This query atomically:
    // 1. Checks if qualified_cv_fired = false
    // 2. Sets it to true
    // 3. Returns the row ONLY if the update actually happened
    //
    // This prevents race conditions and ensures exactly-once semantics.
    
    const { data: updatedLead, error: updateError } = await supabase
      .from("wm_leads")
      .update({ 
        qualified_cv_fired: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)
      .eq("qualified_cv_fired", false) // Only update if not already fired
      .select("id, email, qualified_cv_fired, qualified_at")
      .single();

    if (updateError) {
      // Check if it's a "no rows found" error (already fired)
      if (updateError.code === "PGRST116") {
        // Row exists but qualified_cv_fired was already true
        console.log(`[mark-qualified-conversion] Already fired for lead ${leadId}`);
        return new Response(JSON.stringify({ 
          fired: false,
          reason: "already_fired",
          leadId,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      console.error("Error marking qualified conversion:", updateError);
      return new Response(JSON.stringify({ 
        error: updateError.message, 
        fired: false,
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If updatedLead is null, the lead either doesn't exist or was already fired
    if (!updatedLead) {
      // Check if lead exists at all
      const { data: existingLead } = await supabase
        .from("wm_leads")
        .select("id, qualified_cv_fired")
        .eq("id", leadId)
        .single();

      if (!existingLead) {
        return new Response(JSON.stringify({ 
          error: "Lead not found", 
          fired: false,
        }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Lead exists but was already fired
      console.log(`[mark-qualified-conversion] Already fired for lead ${leadId} (existing check)`);
      return new Response(JSON.stringify({ 
        fired: false,
        reason: "already_fired",
        leadId,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SUCCESS: First time marking this conversion
    console.log(`[mark-qualified-conversion] Successfully marked conversion for lead ${leadId}`);
    
    return new Response(JSON.stringify({ 
      fired: true,
      leadId,
      email: updatedLead.email,
      qualified_at: updatedLead.qualified_at,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("mark-qualified-conversion error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      fired: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
