import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const url = new URL(req.url);
    const method = req.method;

    // GET - Fetch leads with filters
    if (method === "GET") {
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");
      const status = url.searchParams.get("status");
      const quality = url.searchParams.get("quality");

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

      // Get summary stats
      const { data: stats } = await supabase
        .from("wm_leads")
        .select("status, lead_quality", { count: "exact" });

      const summary = {
        total: leads?.length || 0,
        byStatus: {} as Record<string, number>,
        byQuality: {} as Record<string, number>,
        totalValue: leads?.reduce((sum, l) => sum + (l.actual_deal_value || l.estimated_deal_value || 0), 0) || 0,
      };

      leads?.forEach((lead) => {
        summary.byStatus[lead.status] = (summary.byStatus[lead.status] || 0) + 1;
        summary.byQuality[lead.lead_quality] = (summary.byQuality[lead.lead_quality] || 0) + 1;
      });

      return new Response(JSON.stringify({ leads, summary }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
