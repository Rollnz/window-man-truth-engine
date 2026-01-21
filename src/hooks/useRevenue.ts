import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RevenueKPIs {
  dealsWon: number;
  totalRevenue: number;
  totalProfit: number;
  avgDealSize: number;
}

export interface DealWithLead {
  id: string;
  wm_lead_id: string;
  opportunity_id: string | null;
  outcome: 'won' | 'lost';
  close_date: string | null;
  gross_revenue: number;
  net_profit: number;
  payment_status: string;
  lead_name: string;
  lead_email: string | null;
  lead_phone: string | null;
  utm_campaign: string | null;
  utm_source: string | null;
  source_tool: string | null;
  created_at: string;
}

interface UseRevenueReturn {
  kpis: RevenueKPIs;
  recentDeals: DealWithLead[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRevenue(): UseRevenueReturn {
  const [kpis, setKpis] = useState<RevenueKPIs>({
    dealsWon: 0,
    totalRevenue: 0,
    totalProfit: 0,
    avgDealSize: 0,
  });
  const [recentDeals, setRecentDeals] = useState<DealWithLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        setError('Not authenticated');
        return;
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-revenue`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch revenue data');
      }

      const data = await res.json();
      setKpis(data.kpis || {
        dealsWon: 0,
        totalRevenue: 0,
        totalProfit: 0,
        avgDealSize: 0,
      });
      setRecentDeals(data.recentDeals || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load revenue data';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    kpis,
    recentDeals,
    isLoading,
    error,
    refetch: fetchData,
  };
}
