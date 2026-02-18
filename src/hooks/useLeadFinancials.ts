import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/gtm';

export interface Opportunity {
  id: string;
  wm_lead_id: string;
  stage: 'new' | 'qualifying' | 'quoted' | 'negotiating' | 'won' | 'lost';
  expected_value: number;
  probability: number;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  wm_lead_id: string;
  opportunity_id: string | null;
  outcome: 'won' | 'lost';
  close_date: string | null;
  gross_revenue: number;
  cogs: number;
  labor_cost: number;
  commissions: number;
  other_cost: number;
  net_profit: number; // Generated column, read-only
  payment_status: 'unpaid' | 'deposit_paid' | 'paid_in_full' | 'refunded';
  invoice_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalProfit: number;
  wonCount: number;
  lostCount: number;
  totalForecast: number;
  latestCloseDate: string | null;
}

export interface OpportunityInput {
  stage?: Opportunity['stage'];
  expected_value?: number;
  probability?: number;
  assigned_to?: string | null;
  notes?: string | null;
}

export interface DealInput {
  opportunity_id?: string | null;
  outcome?: Deal['outcome'];
  close_date?: string | null;
  gross_revenue?: number;
  cogs?: number;
  labor_cost?: number;
  commissions?: number;
  other_cost?: number;
  payment_status?: Deal['payment_status'];
  invoice_id?: string | null;
}

interface UseLeadFinancialsReturn {
  opportunities: Opportunity[];
  deals: Deal[];
  summary: FinancialSummary;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createOpportunity: (data: OpportunityInput) => Promise<boolean>;
  updateOpportunity: (id: string, data: OpportunityInput) => Promise<boolean>;
  deleteOpportunity: (id: string) => Promise<boolean>;
  createDeal: (data: DealInput) => Promise<boolean>;
  updateDeal: (id: string, data: DealInput) => Promise<boolean>;
  deleteDeal: (id: string) => Promise<boolean>;
  hasFinancials: boolean;
}

/**
 * Manages opportunities and deals for a single CRM lead.
 * Provides CRUD for pipeline stages, deal values, and financial summaries.
 * @param wmLeadId - The wm_leads ID to load financials for
 */
export function useLeadFinancials(wmLeadId: string | undefined): UseLeadFinancialsReturn {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalProfit: 0,
    wonCount: 0,
    lostCount: 0,
    totalForecast: 0,
    latestCloseDate: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!wmLeadId) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        setError('Not authenticated');
        return;
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-lead-detail?id=${wmLeadId}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch financials');
      }

      const data = await res.json();
      setOpportunities(data.opportunities || []);
      setDeals(data.deals || []);
      setSummary(data.financialSummary || {
        totalRevenue: 0,
        totalProfit: 0,
        wonCount: 0,
        lostCount: 0,
        totalForecast: 0,
        latestCloseDate: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load financials';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [wmLeadId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const callAction = async (action: string, data: Record<string, unknown>): Promise<boolean> => {
    if (!wmLeadId) return false;

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
        return false;
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-lead-detail?id=${wmLeadId}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...data }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Action failed');
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Action failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return false;
    }
  };

  const createOpportunity = async (data: OpportunityInput): Promise<boolean> => {
    const success = await callAction('create_opportunity', data as Record<string, unknown>);
    if (success) {
      await fetchData();
      toast({ title: 'Success', description: 'Opportunity created' });
    }
    return success;
  };

  const updateOpportunity = async (id: string, data: OpportunityInput): Promise<boolean> => {
    const success = await callAction('update_opportunity', { opportunity_id: id, ...data } as Record<string, unknown>);
    if (success) {
      await fetchData();
      toast({ title: 'Success', description: 'Opportunity updated' });
    }
    return success;
  };

  const deleteOpportunity = async (id: string): Promise<boolean> => {
    const success = await callAction('delete_opportunity', { opportunity_id: id });
    if (success) {
      await fetchData();
      toast({ title: 'Success', description: 'Opportunity deleted' });
    }
    return success;
  };

  const createDeal = async (data: DealInput): Promise<boolean> => {
    const success = await callAction('create_deal', data as Record<string, unknown>);
    if (success) {
      await fetchData();
      trackEvent('admin_deal_saved', { action: 'create', wmLeadId });
      toast({ title: 'Success', description: 'Deal created' });
    }
    return success;
  };

  const updateDeal = async (id: string, data: DealInput): Promise<boolean> => {
    const success = await callAction('update_deal', { deal_id: id, ...data } as Record<string, unknown>);
    if (success) {
      await fetchData();
      trackEvent('admin_deal_saved', { action: 'update', wmLeadId });
      toast({ title: 'Success', description: 'Deal updated' });
    }
    return success;
  };

  const deleteDeal = async (id: string): Promise<boolean> => {
    const success = await callAction('delete_deal', { deal_id: id });
    if (success) {
      await fetchData();
      toast({ title: 'Success', description: 'Deal deleted' });
    }
    return success;
  };

  const hasFinancials = opportunities.length > 0 || deals.length > 0;

  return {
    opportunities,
    deals,
    summary,
    isLoading,
    error,
    refetch: fetchData,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    createDeal,
    updateDeal,
    deleteDeal,
    hasFinancials,
  };
}
