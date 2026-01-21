// ═══════════════════════════════════════════════════════════════════════════
// ADMIN ATTRIBUTION ROAS EDGE FUNCTION
// Secure endpoint for ROAS aggregates with platform/campaign grouping
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_EMAILS = [
  'admin@windowman.com',
  'support@windowman.com',
  'vansiclenp@gmail.com',
  'mongoloyd@protonmail.com',
].map(e => e.toLowerCase());

// Helper: Derive platform from lead attribution fields
function derivePlatform(lead: {
  last_non_direct_gclid?: string | null;
  last_non_direct_fbclid?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  last_non_direct_utm_source?: string | null;
  utm_source?: string | null;
}): 'google' | 'meta' | 'other' {
  // Priority 1: last_non_direct_gclid => google
  if (lead.last_non_direct_gclid) return 'google';
  // Priority 2: last_non_direct_fbclid => meta
  if (lead.last_non_direct_fbclid) return 'meta';
  // Priority 3: direct gclid => google
  if (lead.gclid) return 'google';
  // Priority 4: direct fbclid => meta
  if (lead.fbclid) return 'meta';
  
  // Priority 5: utm_source heuristics
  const utmSource = (lead.last_non_direct_utm_source || lead.utm_source || '').toLowerCase();
  if (utmSource.includes('google')) return 'google';
  if (utmSource.includes('facebook') || utmSource.includes('instagram') || utmSource.includes('meta')) return 'meta';
  
  return 'other';
}

// Helper: Derive campaign key from lead
function deriveCampaign(lead: {
  last_non_direct_utm_campaign?: string | null;
  utm_campaign?: string | null;
}): string | null {
  return lead.last_non_direct_utm_campaign || lead.utm_campaign || null;
}

// Helper: Normalize campaign string for matching
function normalizeCampaign(campaign: string | null): string {
  if (!campaign) return '';
  return campaign.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Helper: Safe division
function safeDivide(numerator: number, denominator: number): number | null {
  if (denominator === 0 || !isFinite(denominator)) return null;
  const result = numerator / denominator;
  return isFinite(result) ? result : null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userEmail = claimsData.claims.email as string;
    if (!ADMIN_EMAILS.includes(userEmail?.toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse query parameters
    const url = new URL(req.url);
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const startDate = url.searchParams.get('start_date') || thirtyDaysAgo.toISOString().split('T')[0];
    const endDate = url.searchParams.get('end_date') || now.toISOString().split('T')[0];
    const groupBy = url.searchParams.get('group_by') === 'campaign' ? 'campaign' : 'platform';

    console.log(`[admin-attribution-roas] Fetching ROAS data: ${startDate} to ${endDate}, group_by=${groupBy}`);

    // 1. Fetch won deals in date range (by close_date)
    const { data: deals, error: dealsError } = await supabaseAdmin
      .from('deals')
      .select('id, wm_lead_id, gross_revenue, net_profit, close_date')
      .eq('outcome', 'won')
      .gte('close_date', startDate)
      .lte('close_date', endDate);

    if (dealsError) {
      console.error('[admin-attribution-roas] Deals query error:', dealsError);
      throw new Error('Failed to fetch deals');
    }

    // 2. Fetch wm_leads for attribution data (get all leads with deals OR created in range)
    const dealLeadIds = [...new Set((deals || []).map(d => d.wm_lead_id))];
    
    let leads: Array<{
      id: string;
      last_non_direct_gclid: string | null;
      last_non_direct_fbclid: string | null;
      gclid: string | null;
      fbclid: string | null;
      last_non_direct_utm_source: string | null;
      last_non_direct_utm_campaign: string | null;
      utm_source: string | null;
      utm_campaign: string | null;
      created_at: string;
    }> = [];

    // Get leads linked to deals
    if (dealLeadIds.length > 0) {
      const { data: dealLeads } = await supabaseAdmin
        .from('wm_leads')
        .select('id, last_non_direct_gclid, last_non_direct_fbclid, gclid, fbclid, last_non_direct_utm_source, last_non_direct_utm_campaign, utm_source, utm_campaign, created_at')
        .in('id', dealLeadIds);
      
      if (dealLeads) leads = dealLeads;
    }

    // Also count all leads created in date range (for leads_total)
    const { count: leadsCreatedInRange } = await supabaseAdmin
      .from('wm_leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`);

    // 3. Fetch ad spend in date range
    const { data: adSpend, error: spendError } = await supabaseAdmin
      .from('ad_spend_daily')
      .select('platform, campaign_id, campaign_name, spend')
      .gte('spend_date', startDate)
      .lte('spend_date', endDate);

    if (spendError) {
      console.error('[admin-attribution-roas] Ad spend query error:', spendError);
      throw new Error('Failed to fetch ad spend');
    }

    // Create lead lookup map
    const leadMap = new Map<string, typeof leads[0]>();
    leads.forEach(lead => leadMap.set(lead.id, lead));

    // Calculate aggregates based on group_by
    type RowData = {
      group_key: string;
      mapping_quality: 'high' | 'medium' | 'low';
      spend: number;
      leads: number;
      deals_won: number;
      revenue: number;
      profit: number;
    };

    const rowMap = new Map<string, RowData>();

    // Aggregate spend by group
    const spendByGroup = new Map<string, number>();
    (adSpend || []).forEach(row => {
      let groupKey: string;
      if (groupBy === 'campaign') {
        groupKey = row.campaign_id || row.campaign_name || 'unknown';
      } else {
        groupKey = row.platform || 'other';
      }
      spendByGroup.set(groupKey, (spendByGroup.get(groupKey) || 0) + Number(row.spend || 0));
    });

    // Aggregate revenue/profit by derived group from leads
    const revenueByGroup = new Map<string, { revenue: number; profit: number; deals: number }>();
    const campaignNormMap = new Map<string, string>(); // normalized -> original

    (deals || []).forEach(deal => {
      const lead = leadMap.get(deal.wm_lead_id);
      if (!lead) return;

      let groupKey: string;
      if (groupBy === 'campaign') {
        groupKey = deriveCampaign(lead) || 'unknown';
      } else {
        groupKey = derivePlatform(lead);
      }

      const existing = revenueByGroup.get(groupKey) || { revenue: 0, profit: 0, deals: 0 };
      revenueByGroup.set(groupKey, {
        revenue: existing.revenue + Number(deal.gross_revenue || 0),
        profit: existing.profit + Number(deal.net_profit || 0),
        deals: existing.deals + 1,
      });
    });

    // Count leads by group (for leads created in range)
    const leadsByGroup = new Map<string, number>();
    // Re-fetch leads in date range for counting
    const { data: leadsInRange } = await supabaseAdmin
      .from('wm_leads')
      .select('id, last_non_direct_gclid, last_non_direct_fbclid, gclid, fbclid, last_non_direct_utm_source, last_non_direct_utm_campaign, utm_source, utm_campaign')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`);

    (leadsInRange || []).forEach(lead => {
      let groupKey: string;
      if (groupBy === 'campaign') {
        groupKey = deriveCampaign(lead) || 'unknown';
      } else {
        groupKey = derivePlatform(lead);
      }
      leadsByGroup.set(groupKey, (leadsByGroup.get(groupKey) || 0) + 1);
    });

    // Build row data - merge spend and revenue groups
    const allGroupKeys = new Set([
      ...spendByGroup.keys(),
      ...revenueByGroup.keys(),
      ...leadsByGroup.keys(),
    ]);

    const rows: Array<{
      group_key: string;
      mapping_quality: 'high' | 'medium' | 'low';
      spend: number;
      leads: number;
      deals_won: number;
      revenue: number;
      profit: number;
      roas: number | null;
      cpa: number | null;
      rev_per_lead: number | null;
      profit_per_lead: number | null;
    }> = [];

    allGroupKeys.forEach(groupKey => {
      const spend = spendByGroup.get(groupKey) || 0;
      const revenueData = revenueByGroup.get(groupKey) || { revenue: 0, profit: 0, deals: 0 };
      const leadsCount = leadsByGroup.get(groupKey) || 0;

      // Determine mapping quality
      let mappingQuality: 'high' | 'medium' | 'low' = 'low';
      if (groupBy === 'platform') {
        // Platform matching is medium quality (derived from click IDs or UTM)
        mappingQuality = spend > 0 && revenueData.revenue > 0 ? 'medium' : 'low';
      } else {
        // Campaign matching - check if we can match
        const normalizedGroup = normalizeCampaign(groupKey);
        let hasSpendMatch = false;
        spendByGroup.forEach((_, spendKey) => {
          if (normalizeCampaign(spendKey) === normalizedGroup) {
            hasSpendMatch = true;
          }
        });
        mappingQuality = hasSpendMatch && groupKey !== 'unknown' ? 'medium' : 'low';
      }

      rows.push({
        group_key: groupKey,
        mapping_quality: mappingQuality,
        spend,
        leads: leadsCount,
        deals_won: revenueData.deals,
        revenue: revenueData.revenue,
        profit: revenueData.profit,
        roas: safeDivide(revenueData.revenue, spend),
        cpa: safeDivide(spend, revenueData.deals),
        rev_per_lead: safeDivide(revenueData.revenue, leadsCount),
        profit_per_lead: safeDivide(revenueData.profit, leadsCount),
      });
    });

    // Sort by profit descending
    rows.sort((a, b) => b.profit - a.profit);

    // Calculate summary totals
    const totalSpend = Array.from(spendByGroup.values()).reduce((sum, v) => sum + v, 0);
    const totalRevenue = Array.from(revenueByGroup.values()).reduce((sum, v) => sum + v.revenue, 0);
    const totalProfit = Array.from(revenueByGroup.values()).reduce((sum, v) => sum + v.profit, 0);
    const totalDealsWon = Array.from(revenueByGroup.values()).reduce((sum, v) => sum + v.deals, 0);

    const summary = {
      total_spend: totalSpend,
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      roas: safeDivide(totalRevenue, totalSpend),
      cpa: safeDivide(totalSpend, totalDealsWon),
      deals_won: totalDealsWon,
      leads_total: leadsCreatedInRange || 0,
    };

    console.log(`[admin-attribution-roas] Summary: spend=${totalSpend}, revenue=${totalRevenue}, profit=${totalProfit}, deals=${totalDealsWon}`);

    return new Response(JSON.stringify({
      filters: { start_date: startDate, end_date: endDate, group_by: groupBy },
      summary,
      rows,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[admin-attribution-roas] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
