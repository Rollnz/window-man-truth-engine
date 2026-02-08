import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface DailyMetric {
  date: string;
  visitors: number;
  leads: number;
  conversion_rate: number;
  quote_scans: number;
  calculator_completions: number;
  risk_assessments: number;
  consultations_booked: number;
}

export interface AttributionRow {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  lead_count: number;
  qualified_count: number;
  qualification_rate: number;
  first_seen: string;
  last_seen: string;
}

export interface ToolPerformanceRow {
  source_tool: string;
  total_leads: number;
  qualified_leads: number;
  qualification_rate: number;
  avg_engagement_score: number;
}

export interface AnalyticsSummary {
  totalVisitors: number;
  totalLeads: number;
  overallConversionRate: number;
  totalScans: number;
  totalCalculators: number;
  totalConsultations: number;
}

export interface HealthStats {
  attributionGapsCount: number;
  orphanedEventsCount: number;
  spamSignalsCount: number;
}

export interface AnalyticsDashboardData {
  summary: AnalyticsSummary;
  dailyMetrics: DailyMetric[];
  attribution: AttributionRow[];
  toolPerformance: ToolPerformanceRow[];
  healthStats: HealthStats;
}

const defaultData: AnalyticsDashboardData = {
  summary: {
    totalVisitors: 0,
    totalLeads: 0,
    overallConversionRate: 0,
    totalScans: 0,
    totalCalculators: 0,
    totalConsultations: 0,
  },
  dailyMetrics: [],
  attribution: [],
  toolPerformance: [],
  healthStats: {
    attributionGapsCount: 0,
    orphanedEventsCount: 0,
    spamSignalsCount: 0,
  },
};

export function useAnalyticsDashboard(initialDateRange?: DateRange) {
  const [data, setData] = useState<AnalyticsDashboardData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(
    initialDateRange || {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    }
  );
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const params = new URLSearchParams();
      if (dateRange.startDate) {
        params.set('start_date', dateRange.startDate.toISOString().split('T')[0]);
      }
      if (dateRange.endDate) {
        params.set('end_date', dateRange.endDate.toISOString().split('T')[0]);
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-analytics?${params}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch: ${response.status}`);
      }

      const result = await response.json();
      setData({
        summary: result.summary || defaultData.summary,
        dailyMetrics: result.dailyMetrics || [],
        attribution: result.attribution || [],
        toolPerformance: result.toolPerformance || [],
        healthStats: result.healthStats || defaultData.healthStats,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useAnalyticsDashboard] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Action: Heal Attribution
  const healAttribution = useCallback(async (leadIds?: string[]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-fix-attribution`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lead_ids: leadIds,
            heal_all: !leadIds || leadIds.length === 0,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to heal attribution');
      }

      toast({
        title: 'Attribution Healed',
        description: `${result.healed} lead(s) updated with first-touch attribution`,
      });

      // Refresh data
      fetchData();

      return { healed: result.healed };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: 'Heal Failed',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [fetchData, toast]);

  // Action: Reprocess Orphans
  const reprocessOrphans = useCallback(async (eventIds?: string[]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reprocess-lead-event`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_ids: eventIds,
            reprocess_all: !eventIds || eventIds.length === 0,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reprocess events');
      }

      toast({
        title: 'Leads Recovered',
        description: `${result.recovered} lead(s) created from orphaned events`,
      });

      // Refresh data
      fetchData();

      return { recovered: result.recovered };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: 'Recovery Failed',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [fetchData, toast]);

  // Action: Mark as Spam
  const markAsSpam = useCallback(async (leadIds: string[], blockIp = false) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-mark-spam`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lead_ids: leadIds,
            block_ip: blockIp,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to mark as spam');
      }

      toast({
        title: 'Spam Marked',
        description: `${result.marked} lead(s) marked as spam${result.ipsBlocked > 0 ? `, ${result.ipsBlocked} IP(s) blocked` : ''}`,
      });

      // Refresh data
      fetchData();

      return { marked: result.marked, ipsBlocked: result.ipsBlocked };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: 'Mark Spam Failed',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [fetchData, toast]);

  return {
    data,
    isLoading,
    error,
    dateRange,
    setDateRange,
    refetch: fetchData,
    // Actions
    healAttribution,
    reprocessOrphans,
    markAsSpam,
  };
}
