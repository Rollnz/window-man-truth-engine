import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { track } from '@/lib/tracking';

// ===== Types =====
export interface ExecutiveKPIs {
  gross_revenue: number;
  net_profit: number;
  ad_spend: number;
  roas: number | null;
  profit_margin: number | null;
  cpa: number | null;
  deals_won: number;
  leads_captured: number;
  marketing_adjusted_profit: number;
}

export interface ExecutiveWaterfall {
  gross_revenue: number;
  cogs: number;
  labor: number;
  commissions: number;
  other_cost: number;
  net_profit: number;
  ad_spend: number;
  marketing_adjusted_profit: number;
}

export interface MatchCoverage {
  spend_match_pct: number | null;
  revenue_match_pct: number | null;
  matched_spend: number;
  total_spend: number;
  matched_revenue: number;
  total_revenue: number;
}

export interface ProfitRow {
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

export interface RedFlag {
  type: string;
  severity: 'warning' | 'critical';
  message: string;
  action: string;
}

export interface ExecutiveFilters {
  start_date: string;
  end_date: string;
  group_by: 'platform' | 'campaign';
  basis: 'closed_won' | 'captured';
}

export interface ExecutiveData {
  filters: ExecutiveFilters;
  kpis: ExecutiveKPIs;
  waterfall: ExecutiveWaterfall;
  match_coverage: MatchCoverage;
  rows: ProfitRow[];
  red_flags: RedFlag[];
}

export interface ExecutiveResponse {
  ok: boolean;
  code: string;
  timestamp: string;
  data?: ExecutiveData;
  error?: string;
}

interface UseExecutiveProfitProps {
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'platform' | 'campaign';
  basis?: 'closed_won' | 'captured';
}

interface UseExecutiveProfitReturn {
  data: ExecutiveData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useExecutiveProfit({
  startDate,
  endDate,
  groupBy = 'platform',
  basis = 'closed_won',
}: UseExecutiveProfitProps = {}): UseExecutiveProfitReturn {
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const params = new URLSearchParams();
      if (startDate) params.set('start_date', format(startDate, 'yyyy-MM-dd'));
      if (endDate) params.set('end_date', format(endDate, 'yyyy-MM-dd'));
      params.set('group_by', groupBy);
      params.set('basis', basis);

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-executive-profit?${params}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result: ExecutiveResponse = await res.json();

      if (!res.ok || !result.ok) {
        throw new Error(result.error || 'Failed to fetch executive data');
      }

      if (result.data) {
        setData(result.data);

        // Track dashboard view
        track('exec_dashboard_viewed', {
          page_path: '/admin/executive',
          section_id: 'executive-dashboard',
          filters: {
            start_date: result.data.filters.start_date,
            end_date: result.data.filters.end_date,
            group_by: result.data.filters.group_by,
            basis: result.data.filters.basis,
          },
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load executive data';
      setError(message);
      console.error('[useExecutiveProfit] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, groupBy, basis]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
