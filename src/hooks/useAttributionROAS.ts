import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';

export interface ROASSummary {
  total_spend: number;
  total_revenue: number;
  total_profit: number;
  roas: number | null;
  cpa: number | null;
  deals_won: number;
  leads_total: number;
}

export interface ROASRow {
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
}

export interface ROASFilters {
  start_date: string;
  end_date: string;
  group_by: 'platform' | 'campaign';
}

export interface ROASData {
  filters: ROASFilters;
  summary: ROASSummary;
  rows: ROASRow[];
}

interface UseAttributionROASProps {
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'platform' | 'campaign';
}

interface UseAttributionROASReturn {
  data: ROASData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAttributionROAS({
  startDate,
  endDate,
  groupBy = 'platform',
}: UseAttributionROASProps = {}): UseAttributionROASReturn {
  const [data, setData] = useState<ROASData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-attribution-roas?${params}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch ROAS data');
      }

      const result = await res.json();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load ROAS data';
      setError(message);
      console.error('[useAttributionROAS] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, groupBy, toast]);

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
