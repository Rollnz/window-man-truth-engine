/**
 * Admin Analytics Edge Function
 * Main data fetcher for the Truth Engine Analytics Dashboard
 * 
 * Returns: daily metrics, attribution breakdown, tool performance,
 * and health stats (gaps, orphans, spam signals)
 */

import { validateAdminRequest, corsHeaders, successResponse, errorResponse } from "../_shared/adminAuth.ts";

interface DailyMetric {
  date: string;
  visitors: number;
  leads: number;
  conversion_rate: number;
  quote_scans: number;
  calculator_completions: number;
  risk_assessments: number;
  consultations_booked: number;
}

interface AttributionRow {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  lead_count: number;
  qualified_count: number;
  qualification_rate: number;
  first_seen: string;
  last_seen: string;
}

interface ToolPerformanceRow {
  source_tool: string;
  total_leads: number;
  qualified_leads: number;
  qualification_rate: number;
  avg_engagement_score: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate admin access
    const validation = await validateAdminRequest(req);
    if (!validation.ok) {
      return validation.response;
    }
    const { supabaseAdmin } = validation;

    // Parse query params
    const url = new URL(req.url);
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    // Build date filter
    const dateFilter = {
      start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: endDate || new Date().toISOString().split('T')[0],
    };

    console.log('[admin-analytics] Fetching data for:', dateFilter);

    // Parallel queries for performance
    const [
      dailyMetricsResult,
      attributionResult,
      toolPerformanceResult,
      attributionGapsResult,
      orphanedEventsResult,
      spamSignalsResult,
    ] = await Promise.all([
      // 1. Daily Overview
      supabaseAdmin
        .from('analytics_daily_overview')
        .select('*')
        .gte('date', dateFilter.start)
        .lte('date', dateFilter.end)
        .order('date', { ascending: false }),

      // 2. Attribution Breakdown
      supabaseAdmin
        .from('analytics_attribution_breakdown')
        .select('*')
        .limit(50),

      // 3. Tool Performance
      supabaseAdmin
        .from('analytics_tool_performance')
        .select('*'),

      // 4. Attribution Gaps (for healing)
      supabaseAdmin
        .from('analytics_attribution_gaps')
        .select('lead_id')
        .limit(1000),

      // 5. Orphaned Events (for resurrection)
      supabaseAdmin
        .from('analytics_orphaned_events')
        .select('event_id')
        .limit(100),

      // 6. Spam Signals
      supabaseAdmin
        .from('analytics_spam_signals')
        .select('lead_id')
        .limit(100),
    ]);

    // Handle potential errors
    if (dailyMetricsResult.error) {
      console.error('[admin-analytics] Daily metrics error:', dailyMetricsResult.error);
    }
    if (attributionResult.error) {
      console.error('[admin-analytics] Attribution error:', attributionResult.error);
    }
    if (toolPerformanceResult.error) {
      console.error('[admin-analytics] Tool performance error:', toolPerformanceResult.error);
    }

    const dailyMetrics: DailyMetric[] = (dailyMetricsResult.data || []).map(row => ({
      date: row.date,
      visitors: Number(row.visitors) || 0,
      leads: Number(row.leads) || 0,
      conversion_rate: Number(row.conversion_rate) || 0,
      quote_scans: Number(row.quote_scans) || 0,
      calculator_completions: Number(row.calculator_completions) || 0,
      risk_assessments: Number(row.risk_assessments) || 0,
      consultations_booked: Number(row.consultations_booked) || 0,
    }));

    const attribution: AttributionRow[] = (attributionResult.data || []).map(row => ({
      utm_source: row.utm_source || '(direct)',
      utm_medium: row.utm_medium || '(none)',
      utm_campaign: row.utm_campaign || '(no campaign)',
      lead_count: Number(row.lead_count) || 0,
      qualified_count: Number(row.qualified_count) || 0,
      qualification_rate: Number(row.qualification_rate) || 0,
      first_seen: row.first_seen || '',
      last_seen: row.last_seen || '',
    }));

    const toolPerformance: ToolPerformanceRow[] = (toolPerformanceResult.data || []).map(row => ({
      source_tool: row.source_tool || 'unknown',
      total_leads: Number(row.total_leads) || 0,
      qualified_leads: Number(row.qualified_leads) || 0,
      qualification_rate: Number(row.qualification_rate) || 0,
      avg_engagement_score: Number(row.avg_engagement_score) || 0,
    }));

    // Calculate summary metrics
    const totalVisitors = dailyMetrics.reduce((sum, d) => sum + d.visitors, 0);
    const totalLeads = dailyMetrics.reduce((sum, d) => sum + d.leads, 0);
    const totalScans = dailyMetrics.reduce((sum, d) => sum + d.quote_scans, 0);
    const totalCalculators = dailyMetrics.reduce((sum, d) => sum + d.calculator_completions, 0);
    const totalConsultations = dailyMetrics.reduce((sum, d) => sum + d.consultations_booked, 0);
    const overallConversionRate = totalVisitors > 0 
      ? Math.round((totalLeads / totalVisitors) * 1000) / 10 
      : 0;

    // Health stats
    const healthStats = {
      attributionGapsCount: attributionGapsResult.data?.length || 0,
      orphanedEventsCount: orphanedEventsResult.data?.length || 0,
      spamSignalsCount: spamSignalsResult.data?.length || 0,
    };

    console.log('[admin-analytics] Health stats:', healthStats);

    return successResponse({
      summary: {
        totalVisitors,
        totalLeads,
        overallConversionRate,
        totalScans,
        totalCalculators,
        totalConsultations,
      },
      dailyMetrics,
      attribution,
      toolPerformance,
      healthStats,
      dateRange: dateFilter,
    });

  } catch (error) {
    console.error('[admin-analytics] Error:', error);
    return errorResponse(500, 'internal_error', error instanceof Error ? error.message : 'Unknown error');
  }
});
