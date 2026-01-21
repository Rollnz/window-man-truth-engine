import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Admin whitelist (case-insensitive)
const ADMIN_EMAILS = ['vansiclenp@gmail.com', 'mongoloyd@protonmail.com'];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!ADMIN_EMAILS.some(email => email.toLowerCase() === user.email?.toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Global-only mode: Fetch all deals with lead data for KPIs and recent deals list
    
    // Fetch all deals with wm_leads join
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select(`
        id,
        wm_lead_id,
        opportunity_id,
        outcome,
        close_date,
        gross_revenue,
        cogs,
        labor_cost,
        commissions,
        other_cost,
        net_profit,
        payment_status,
        invoice_id,
        created_at,
        updated_at
      `)
      .order('close_date', { ascending: false, nullsFirst: false })
      .limit(100);

    if (dealsError) throw dealsError;

    // Fetch wm_leads for each deal
    const leadIds = [...new Set((deals || []).map(d => d.wm_lead_id))];
    let leadsMap: Record<string, any> = {};
    
    if (leadIds.length > 0) {
      const { data: leads } = await supabase
        .from('wm_leads')
        .select('id, first_name, last_name, email, phone, utm_campaign, utm_source, original_source_tool')
        .in('id', leadIds);
      
      if (leads) {
        leadsMap = Object.fromEntries(leads.map(l => [l.id, l]));
      }
    }

    // Calculate KPIs from won deals only
    const wonDeals = (deals || []).filter(d => d.outcome === 'won');
    const dealsWon = wonDeals.length;
    const totalRevenue = wonDeals.reduce((sum, d) => sum + (parseFloat(d.gross_revenue) || 0), 0);
    const totalProfit = wonDeals.reduce((sum, d) => sum + (parseFloat(d.net_profit) || 0), 0);
    const avgDealSize = dealsWon > 0 ? totalRevenue / dealsWon : 0;

    const kpis = {
      dealsWon,
      totalRevenue,
      totalProfit,
      avgDealSize,
    };

    // Enrich deals with lead data for recent deals table
    const recentDeals = (deals || []).slice(0, 50).map(deal => {
      const lead = leadsMap[deal.wm_lead_id] || {};
      const displayName = lead.first_name || lead.last_name 
        ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
        : (lead.email || 'Unknown');
      
      return {
        ...deal,
        lead_name: displayName,
        lead_email: lead.email || null,
        lead_phone: lead.phone || null,
        utm_campaign: lead.utm_campaign || null,
        utm_source: lead.utm_source || null,
        source_tool: lead.original_source_tool || null,
      };
    });

    return new Response(JSON.stringify({
      kpis,
      recentDeals,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in admin-revenue:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
