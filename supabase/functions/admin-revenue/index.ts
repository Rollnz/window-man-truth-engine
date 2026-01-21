import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Admin whitelist (case-insensitive)
const ADMIN_EMAILS = ['vansiclenp@gmail.com', 'mongoloyd@protonmail.com', 'admin@windowman.com', 'support@windowman.com'];

// Helper: Derive platform from lead attribution fields
function derivePlatform(lead: {
  last_non_direct_gclid?: string | null;
  last_non_direct_fbclid?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  last_non_direct_utm_source?: string | null;
  utm_source?: string | null;
}): 'google' | 'meta' | 'other' {
  if (lead.last_non_direct_gclid) return 'google';
  if (lead.last_non_direct_fbclid) return 'meta';
  if (lead.gclid) return 'google';
  if (lead.fbclid) return 'meta';
  
  const utmSource = (lead.last_non_direct_utm_source || lead.utm_source || '').toLowerCase();
  if (utmSource.includes('google')) return 'google';
  if (utmSource.includes('facebook') || utmSource.includes('instagram') || utmSource.includes('meta')) return 'meta';
  
  return 'other';
}

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

    // Parse query params for filtering
    const url = new URL(req.url);
    const platformFilter = url.searchParams.get('platform');
    const utmCampaignFilter = url.searchParams.get('utm_campaign');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    console.log(`[admin-revenue] Filters: platform=${platformFilter}, campaign=${utmCampaignFilter}, start=${startDate}, end=${endDate}`);

    // Build deals query with date filters
    let dealsQuery = supabase
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
      .limit(500);

    // Apply date filters to deals (by close_date)
    if (startDate) {
      dealsQuery = dealsQuery.gte('close_date', startDate);
    }
    if (endDate) {
      dealsQuery = dealsQuery.lte('close_date', endDate);
    }

    const { data: deals, error: dealsError } = await dealsQuery;
    if (dealsError) throw dealsError;

    // Fetch wm_leads for each deal (with attribution fields)
    const leadIds = [...new Set((deals || []).map(d => d.wm_lead_id))];
    let leadsMap: Record<string, any> = {};
    
    if (leadIds.length > 0) {
      const { data: leads, error: leadsError } = await supabase
        .from('wm_leads')
        .select(`
          id, 
          first_name, 
          last_name, 
          email, 
          phone, 
          utm_campaign, 
          utm_source, 
          original_source_tool,
          gclid,
          fbclid,
          last_non_direct_gclid,
          last_non_direct_fbclid,
          last_non_direct_utm_source
        `)
        .in('id', leadIds);
      
      if (leadsError) {
        console.error('[admin-revenue] Leads query error:', leadsError);
      }
      
      if (leads) {
        leadsMap = Object.fromEntries(leads.map(l => [l.id, l]));
      }
    }

    // Enrich deals with lead data and derived platform
    const enrichedDeals = (deals || []).map(deal => {
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
        utm_source: lead.last_non_direct_utm_source || lead.utm_source || null,
        source_tool: lead.original_source_tool || null,
        derived_platform: derivePlatform(lead),
      };
    });

    // Apply platform and campaign filters (post-join filtering)
    let filteredDeals = enrichedDeals;
    
    if (platformFilter) {
      filteredDeals = filteredDeals.filter(d => d.derived_platform === platformFilter);
    }
    
    if (utmCampaignFilter) {
      const normalizedFilter = utmCampaignFilter.toLowerCase().trim();
      filteredDeals = filteredDeals.filter(d => {
        const campaign = (d.utm_campaign || '').toLowerCase().trim();
        return campaign === normalizedFilter || campaign.includes(normalizedFilter);
      });
    }

    // Calculate KPIs from won deals only (after filtering)
    const wonDeals = filteredDeals.filter(d => d.outcome === 'won');
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

    // Return filtered deals list (limit to 50 for display)
    const recentDeals = filteredDeals.slice(0, 50);

    console.log(`[admin-revenue] Returning ${recentDeals.length} deals, KPIs: won=${dealsWon}, revenue=${totalRevenue}`);

    return new Response(JSON.stringify({
      kpis,
      recentDeals,
      filters: {
        platform: platformFilter,
        utm_campaign: utmCampaignFilter,
        start_date: startDate,
        end_date: endDate,
      },
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
