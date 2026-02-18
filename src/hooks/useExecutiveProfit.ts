import { useState, useEffect, useCallback, useRef } from 'react';
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

/**
 * Executive-level P&L dashboard hook. Aggregates revenue, ad spend,
 * profit margins, ROAS, and CPA across configurable date ranges with auto-refresh.
 */
export function useExecutiveProfit({
  startDate,
  endDate,
  groupBy = 'platform',
  basis = 'closed_won',
}: UseExecutiveProfitProps = {}): UseExecutiveProfitReturn {
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stabilize date dependencies by converting to strings
  const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : '';
  const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : '';
  
  // Request deduplication: abort previous request when new one starts
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentRequestId = ++requestIdRef.current;

    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (startDateStr) params.set('start_date', startDateStr);
      if (endDateStr) params.set('end_date', endDateStr);
      params.set('group_by', groupBy);
      params.set('basis', basis);

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-executive-profit?${params}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      // Check if this request is still current
      if (currentRequestId !== requestIdRef.current) {
        return; // Stale request, ignore result
      }

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
      // Silently ignore abort errors - do NOT set error state or toast
      if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('signal is aborted'))) {
        return;
      }
      
      // Only update state if this is still the current request
      if (currentRequestId === requestIdRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load executive data';
        setError(message);
        console.error('[useExecutiveProfit] Error:', err);
      }
    } finally {
      // Only update loading state if this is still the current request
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [startDateStr, endDateStr, groupBy, basis]);

  useEffect(() => {
    fetchData();
    
    // Cleanup: abort on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
