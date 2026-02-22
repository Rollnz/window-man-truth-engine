// ═══════════════════════════════════════════════════════════════════════════
// ADMIN EXECUTIVE PROFIT EDGE FUNCTION
// Daily profit command center: connects deals + ad spend + attribution
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Database-driven admin check via user_roles table
// deno-lint-ignore no-explicit-any
async function hasAdminRole(supabaseAdmin: any, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) {
    console.error("[admin-executive-profit] Error checking admin role:", error.message);
    return false;
  }
  return !!data;
}

// ===== Response Helpers =====
function successResponse(data: unknown) {
  return new Response(
    JSON.stringify({
      ok: true,
      code: "OK",
      timestamp: new Date().toISOString(),
      data,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function errorResponse(status: number, code: string, message: string) {
  return new Response(
    JSON.stringify({
      ok: false,
      code,
      error: message,
      timestamp: new Date().toISOString(),
    }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function assertNoError<T>(result: { data: T; error: unknown }, context: string): T {
  if (result.error) {
    console.error(`[admin-executive-profit] ${context}:`, result.error);
    throw new Error(`${context} failed`);
  }
  return result.data;
}

// ===== Campaign Normalization =====
function normalizeCampaign(campaign: string | null | undefined): string {
  if (!campaign) return "";
  return campaign
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,!?;:'"\-_()[\]{}]/g, "");
}

// ===== Safe Divide =====
function safeDivide(numerator: number, denominator: number): number | null {
  if (denominator === 0 || !isFinite(denominator)) return null;
  const result = numerator / denominator;
  return isFinite(result) ? result : null;
}

// ===== Platform Derivation =====
function derivePlatform(lead: {
  last_non_direct_gclid?: string | null;
  last_non_direct_fbclid?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  last_non_direct_utm_source?: string | null;
  utm_source?: string | null;
}): "google" | "meta" | "other" {
  if (lead.last_non_direct_gclid) return "google";
  if (lead.last_non_direct_fbclid) return "meta";
  if (lead.gclid) return "google";
  if (lead.fbclid) return "meta";

  const utmSource = (lead.last_non_direct_utm_source || lead.utm_source || "").toLowerCase();
  if (utmSource.includes("google")) return "google";
  if (utmSource.includes("facebook") || utmSource.includes("instagram") || utmSource.includes("meta"))
    return "meta";

  return "other";
}

// ===== Red Flag Detection =====
interface RedFlag {
  type: string;
  severity: "warning" | "critical";
  message: string;
  action: string;
}

function detectRedFlags(params: {
  totalSpend: number;
  totalRevenue: number;
  totalProfit: number;
  dealsWon: number;
  roas: number | null;
  profitMargin: number | null;
  otherPlatformSpend: number;
  totalSpendWithData: number;
  missingDays: number;
  rangeLength: number;
}): RedFlag[] {
  const flags: RedFlag[] = [];

  // Burning spend: spend > 0 but revenue = 0
  if (params.totalSpend > 0 && params.totalRevenue === 0) {
    flags.push({
      type: "burning_spend",
      severity: "critical",
      message: `$${params.totalSpend.toLocaleString()} spent with $0 revenue`,
      action: "Pause campaigns or investigate attribution immediately",
    });
  }

  // Low ROAS (< 2)
  if (params.roas !== null && params.roas < 2 && params.totalSpend > 100) {
    flags.push({
      type: "low_roas",
      severity: "warning",
      message: `ROAS is ${params.roas.toFixed(2)}x (target: 2x+)`,
      action: "Review underperforming campaigns and reallocate budget",
    });
  }

  // Low margin (< 20%)
  if (params.profitMargin !== null && params.profitMargin < 0.2 && params.totalRevenue > 1000) {
    flags.push({
      type: "low_margin",
      severity: "warning",
      message: `Profit margin is ${(params.profitMargin * 100).toFixed(1)}% (target: 20%+)`,
      action: "Review COGS and labor costs on recent deals",
    });
  }

  // High "other" platform spend (attribution drift)
  const otherRatio = params.totalSpend > 0 ? params.otherPlatformSpend / params.totalSpend : 0;
  if (otherRatio > 0.3 && params.otherPlatformSpend > 500) {
    flags.push({
      type: "attribution_drift",
      severity: "warning",
      message: `${(otherRatio * 100).toFixed(0)}% of spend unattributed to Google/Meta`,
      action: "Check UTM tagging and click ID tracking",
    });
  }

  // Missing spend data days
  if (params.missingDays > 0 && params.rangeLength > 0) {
    const missingRatio = params.missingDays / params.rangeLength;
    if (missingRatio > 0.2) {
      flags.push({
        type: "data_gap",
        severity: "warning",
        message: `Missing spend data for ${params.missingDays} of ${params.rangeLength} days`,
        action: "Verify ad platform sync is running correctly",
      });
    }
  }

  return flags;
}

// ===== Main Handler =====
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(401, "UNAUTHORIZED", "Authentication required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return errorResponse(401, "UNAUTHORIZED", "Invalid authentication");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin role in database
    const userId = claimsData.claims.sub as string;
    const isAdmin = await hasAdminRole(supabaseAdmin, userId);
    if (!isAdmin) {
      return errorResponse(403, "FORBIDDEN", "Admin access required");
    }

    // Parse query parameters
    const url = new URL(req.url);
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const startDate = url.searchParams.get("start_date") || sevenDaysAgo.toISOString().split("T")[0];
    const endDate = url.searchParams.get("end_date") || now.toISOString().split("T")[0];
    const groupBy = url.searchParams.get("group_by") === "campaign" ? "campaign" : "platform";
    const basis = url.searchParams.get("basis") === "captured" ? "captured" : "closed_won";

    console.log(
      `[admin-executive-profit] Query: ${startDate} to ${endDate}, groupBy=${groupBy}, basis=${basis}`
    );

    // Calculate date range length for red flag detection
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const rangeLength = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // ===== Fetch Deals =====
    const dealsQuery = supabaseAdmin
      .from("deals")
      .select(
        "id, wm_lead_id, gross_revenue, net_profit, cogs, labor_cost, commissions, other_cost, close_date"
      )
      .eq("outcome", "won")
      .gte("close_date", startDate)
      .lte("close_date", endDate);

    const deals = assertNoError(await dealsQuery, "Deals query");
    console.log(`[admin-executive-profit] Deals found: ${deals?.length || 0}`);

    // ===== Fetch wm_leads (for attribution) =====
    let leads: Array<{
      id: string;
      last_non_direct_gclid: string | null;
      last_non_direct_fbclid: string | null;
      gclid: string | null;
      fbclid: string | null;
      last_non_direct_utm_source: string | null;
      utm_source: string | null;
      utm_campaign: string | null;
      created_at: string;
    }> = [];

    if (basis === "closed_won") {
      // Get leads linked to deals
      const dealLeadIds = [...new Set((deals || []).map((d) => d.wm_lead_id))];
      if (dealLeadIds.length > 0) {
        const leadsResult = await supabaseAdmin
          .from("wm_leads")
          .select(
            "id, last_non_direct_gclid, last_non_direct_fbclid, gclid, fbclid, last_non_direct_utm_source, utm_source, utm_campaign, created_at"
          )
          .in("id", dealLeadIds);
        leads = assertNoError(leadsResult, "Leads query (by deal)") || [];
      }
    } else {
      // Captured basis: get leads created in date range
      const leadsResult = await supabaseAdmin
        .from("wm_leads")
        .select(
          "id, last_non_direct_gclid, last_non_direct_fbclid, gclid, fbclid, last_non_direct_utm_source, utm_source, utm_campaign, created_at"
        )
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`);
      leads = assertNoError(leadsResult, "Leads query (captured)") || [];
    }

    // ===== Fetch Ad Spend =====
    const spendResult = await supabaseAdmin
      .from("ad_spend_daily")
      .select("platform, campaign_id, campaign_name, spend, spend_date")
      .gte("spend_date", startDate)
      .lte("spend_date", endDate);

    const adSpend = assertNoError(spendResult, "Ad spend query") || [];
    console.log(`[admin-executive-profit] Ad spend rows: ${adSpend.length}`);

    // Track unique spend dates for missing days calculation
    const uniqueSpendDates = new Set(adSpend.map((s) => s.spend_date));
    const missingDays = rangeLength - uniqueSpendDates.size;

    // ===== Build lookup maps =====
    const leadMap = new Map<string, (typeof leads)[0]>();
    leads.forEach((lead) => leadMap.set(lead.id, lead));

    // Normalize campaign names from ad spend for matching
    const spendCampaignNormMap = new Map<string, string>();
    adSpend.forEach((row) => {
      const normalized = normalizeCampaign(row.campaign_name);
      if (normalized) {
        spendCampaignNormMap.set(normalized, row.campaign_name || "");
      }
    });

    // ===== Calculate Waterfall =====
    let waterfallGrossRevenue = 0;
    let waterfallCogs = 0;
    let waterfallLabor = 0;
    let waterfallCommissions = 0;
    let waterfallOtherCost = 0;
    let waterfallNetProfit = 0;

    (deals || []).forEach((deal) => {
      waterfallGrossRevenue += Number(deal.gross_revenue || 0);
      waterfallCogs += Number(deal.cogs || 0);
      waterfallLabor += Number(deal.labor_cost || 0);
      waterfallCommissions += Number(deal.commissions || 0);
      waterfallOtherCost += Number(deal.other_cost || 0);
      waterfallNetProfit += Number(deal.net_profit || 0);
    });

    const totalAdSpend = adSpend.reduce((sum, row) => sum + Number(row.spend || 0), 0);
    const marketingAdjustedProfit = waterfallNetProfit - totalAdSpend;

    // ===== Group revenue/profit by platform or campaign =====
    type GroupData = {
      spend: number;
      revenue: number;
      profit: number;
      deals: number;
      leads: number;
      hasSpendData: boolean; // Track if this group has spend data for match coverage
    };

    const groupedData = new Map<string, GroupData>();

    // Initialize with spend data - track which groups have spend
    adSpend.forEach((row) => {
      let groupKey: string;
      if (groupBy === "campaign") {
        groupKey = normalizeCampaign(row.campaign_name) || "unattributed";
      } else {
        groupKey = row.platform || "other";
      }

      const existing = groupedData.get(groupKey) || {
        spend: 0,
        revenue: 0,
        profit: 0,
        deals: 0,
        leads: 0,
        hasSpendData: true,
      };
      existing.spend += Number(row.spend || 0);
      existing.hasSpendData = true;
      groupedData.set(groupKey, existing);
    });

    // Aggregate revenue/profit from deals
    // Track matched revenue = revenue from deals whose group has spend data
    let totalMatchedRevenue = 0;

    (deals || []).forEach((deal) => {
      const lead = leadMap.get(deal.wm_lead_id);
      if (!lead) return;

      let groupKey: string;

      if (groupBy === "campaign") {
        const normalizedCampaign = normalizeCampaign(lead.utm_campaign);
        groupKey = normalizedCampaign || "unattributed";
      } else {
        groupKey = derivePlatform(lead);
      }

      const existing = groupedData.get(groupKey) || {
        spend: 0,
        revenue: 0,
        profit: 0,
        deals: 0,
        leads: 0,
        hasSpendData: false,
      };

      const revenue = Number(deal.gross_revenue || 0);
      const profit = Number(deal.net_profit || 0);

      existing.revenue += revenue;
      existing.profit += profit;
      existing.deals += 1;

      // If this group has spend data, the revenue is "matched"
      if (existing.hasSpendData && existing.spend > 0) {
        totalMatchedRevenue += revenue;
      }

      groupedData.set(groupKey, existing);
    });

    // Count leads per group
    leads.forEach((lead) => {
      let groupKey: string;
      if (groupBy === "campaign") {
        groupKey = normalizeCampaign(lead.utm_campaign) || "unattributed";
      } else {
        groupKey = derivePlatform(lead);
      }

      const existing = groupedData.get(groupKey) || {
        spend: 0,
        revenue: 0,
        profit: 0,
        deals: 0,
        leads: 0,
        hasSpendData: false,
      };
      existing.leads += 1;
      groupedData.set(groupKey, existing);
    });

    // Calculate matched spend = spend from groups that have revenue
    let totalMatchedSpend = 0;
    groupedData.forEach((data) => {
      if (data.hasSpendData && data.revenue > 0) {
        totalMatchedSpend += data.spend;
      }
    });

    // ===== Build rows array =====
    interface ProfitRow {
      group_key: string;
      spend: number;
      deals_won: number;
      revenue: number;
      profit: number;
      roas: number | null;
      cpa: number | null;
      profit_after_spend: number;
      leads: number;
    }

    const rows: ProfitRow[] = [];
    let otherPlatformSpend = 0;

    groupedData.forEach((data, key) => {
      if (key === "other") {
        otherPlatformSpend = data.spend;
      }

      rows.push({
        group_key: key,
        spend: data.spend,
        deals_won: data.deals,
        revenue: data.revenue,
        profit: data.profit,
        roas: safeDivide(data.revenue, data.spend),
        cpa: safeDivide(data.spend, data.deals),
        profit_after_spend: data.profit - data.spend,
        leads: data.leads,
      });
    });

    // Sort by profit descending
    rows.sort((a, b) => b.profit - a.profit);

    // ===== Calculate summary KPIs =====
    const totalRevenue = waterfallGrossRevenue;
    const totalProfit = waterfallNetProfit;
    const dealsWon = deals?.length || 0;
    const leadsCount = leads.length;
    const roas = safeDivide(totalRevenue, totalAdSpend);
    const profitMargin = safeDivide(totalProfit, totalRevenue);
    const cpa = safeDivide(totalAdSpend, dealsWon);

    // ===== Match Coverage =====
    const spendMatchPct = safeDivide(totalMatchedSpend, totalAdSpend);
    const revenueMatchPct = safeDivide(totalMatchedRevenue, totalRevenue);

    // ===== Red Flags =====
    const redFlags = detectRedFlags({
      totalSpend: totalAdSpend,
      totalRevenue,
      totalProfit,
      dealsWon,
      roas,
      profitMargin,
      otherPlatformSpend,
      totalSpendWithData: totalMatchedSpend,
      missingDays,
      rangeLength,
    });

    // ===== Build Response =====
    const responseData = {
      filters: {
        start_date: startDate,
        end_date: endDate,
        group_by: groupBy,
        basis,
      },
      kpis: {
        gross_revenue: totalRevenue,
        net_profit: totalProfit,
        ad_spend: totalAdSpend,
        roas,
        profit_margin: profitMargin,
        cpa,
        deals_won: dealsWon,
        leads_captured: leadsCount,
        marketing_adjusted_profit: marketingAdjustedProfit,
      },
      waterfall: {
        gross_revenue: waterfallGrossRevenue,
        cogs: waterfallCogs,
        labor: waterfallLabor,
        commissions: waterfallCommissions,
        other_cost: waterfallOtherCost,
        net_profit: waterfallNetProfit,
        ad_spend: totalAdSpend,
        marketing_adjusted_profit: marketingAdjustedProfit,
      },
      match_coverage: {
        spend_match_pct: spendMatchPct,
        revenue_match_pct: revenueMatchPct,
        matched_spend: totalMatchedSpend,
        total_spend: totalAdSpend,
        matched_revenue: totalMatchedRevenue,
        total_revenue: totalRevenue,
      },
      rows,
      red_flags: redFlags,
    };

    console.log(
      `[admin-executive-profit] Response: revenue=${totalRevenue}, profit=${totalProfit}, spend=${totalAdSpend}, deals=${dealsWon}`
    );

    return successResponse(responseData);
  } catch (error) {
    console.error("[admin-executive-profit] Error:", error);
    return errorResponse(
      500,
      "EXEC_QUERY_FAILED",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});
