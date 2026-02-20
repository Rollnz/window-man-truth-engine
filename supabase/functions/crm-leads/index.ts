import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    console.error("[crm-leads] Error checking admin role:", error.message);
    return false;
  }
  return !!data;
}

Deno.serve(async (req) => {
  const method = req.method;
  const origin = req.headers.get("origin") || "unknown";
  
  console.log(`[crm-leads] ${method} request from origin: ${origin}`);

  // Handle CORS preflight - MUST return 200 with proper headers
  if (method === "OPTIONS") {
    console.log("[crm-leads] OPTIONS preflight handled");
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  // Only allow GET and POST methods
  if (method !== "GET" && method !== "POST") {
    console.log(`[crm-leads] Method ${method} not allowed`);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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

    const url = new URL(req.url);

    // GET - Fetch leads with filters
    if (method === "GET") {
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");
      const status = url.searchParams.get("status");
      const quality = url.searchParams.get("quality");
      const hasQuoteParam = url.searchParams.get("has_quote");
      const analyzedParam = url.searchParams.get("analyzed");

      let query = supabase
        .from("wm_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (startDate) {
        query = query.gte("created_at", startDate);
      }
      if (endDate) {
        query = query.lte("created_at", endDate);
      }
      if (status) {
        query = query.eq("status", status);
      }
      if (quality) {
        query = query.eq("lead_quality", quality);
      }

      const { data: leads, error } = await query.limit(500);

      if (error) {
        console.error("Error fetching leads:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // --- Quote indicators: batch RPC ---
      let enrichedLeads = (leads || []).map((l: any) => ({
        ...l,
        has_quote_file: false,
        has_analyzed_quote: false,
        latest_quote_status: null,
      }));

      // Collect lead_ids that link to quote_files (wm_leads.lead_id -> leads.id -> quote_files.lead_id)
      const leadIds = (leads || [])
        .map((l: any) => l.lead_id)
        .filter((id: string | null) => !!id);

      if (leadIds.length > 0) {
        const { data: indicators, error: rpcError } = await supabase.rpc(
          "get_quote_indicators",
          { p_lead_ids: leadIds }
        );

        if (rpcError) {
          console.error("[crm-leads] RPC get_quote_indicators error:", rpcError.message);
          // Non-fatal: continue with defaults
        } else if (indicators && indicators.length > 0) {
          // Build lookup by lead_id
          const indicatorMap = new Map<string, any>();
          for (const ind of indicators) {
            indicatorMap.set(ind.lead_id, ind);
          }

          enrichedLeads = enrichedLeads.map((lead: any) => {
            const ind = lead.lead_id ? indicatorMap.get(lead.lead_id) : null;
            if (ind) {
              return {
                ...lead,
                has_quote_file: ind.has_quote_file ?? false,
                has_analyzed_quote: ind.has_analyzed_quote ?? false,
                latest_quote_status: ind.latest_quote_status ?? null,
              };
            }
            return lead;
          });
        }
      }

      // --- Post-filter by quote indicators ---
      if (hasQuoteParam === "true") {
        enrichedLeads = enrichedLeads.filter((l: any) => l.has_quote_file === true);
      }
      if (analyzedParam === "true") {
        enrichedLeads = enrichedLeads.filter((l: any) => l.has_analyzed_quote === true);
      }

      // Get summary stats (computed after filtering)
      const summary = {
        total: enrichedLeads.length,
        byStatus: {} as Record<string, number>,
        byQuality: {} as Record<string, number>,
        totalValue: enrichedLeads.reduce((sum: number, l: any) => sum + (l.actual_deal_value || l.estimated_deal_value || 0), 0),
      };

      enrichedLeads.forEach((lead: any) => {
        summary.byStatus[lead.status] = (summary.byStatus[lead.status] || 0) + 1;
        summary.byQuality[lead.lead_quality] = (summary.byQuality[lead.lead_quality] || 0) + 1;
      });

      return new Response(JSON.stringify({ leads: enrichedLeads, summary }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST - Update lead status or other fields
    if (method === "POST") {
      const body = await req.json();
      const { leadId, updates } = body;

      if (!leadId || !updates) {
        return new Response(JSON.stringify({ error: "leadId and updates required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("wm_leads")
        .update(updates)
        .eq("id", leadId)
        .select()
        .single();

      if (error) {
        console.error("Error updating lead:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, lead: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback - should not reach here
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("CRM Leads error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
