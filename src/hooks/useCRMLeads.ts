import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CRMLead, LeadStatus, KANBAN_COLUMNS } from '@/types/crm';
import { trackEvent, trackOfflineConversion } from '@/lib/gtm';
import { getAttributionData } from '@/lib/attribution';

interface CRMSummary {
  total: number;
  byStatus: Record<string, number>;
  byQuality: Record<string, number>;
  totalValue: number;
}

interface UseCRMLeadsReturn {
  leads: CRMLead[];
  summary: CRMSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchLeads: (startDate?: string, endDate?: string) => Promise<void>;
  updateLeadStatus: (leadId: string, newStatus: LeadStatus, extras?: {
    actualDealValue?: number;
    notes?: string;
    estimatedDealValue?: number;
  }) => Promise<boolean>;
  getLeadsByStatus: (status: LeadStatus) => CRMLead[];
}

export function useCRMLeads(): UseCRMLeadsReturn {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [summary, setSummary] = useState<CRMSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLeads = useCallback(async (startDate?: string, endDate?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await supabase.functions.invoke('crm-leads', {
        body: null,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch leads');
      }

      const data = response.data;
      setLeads(data.leads || []);
      setSummary(data.summary || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch leads';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateLeadStatus = useCallback(async (
    leadId: string, 
    newStatus: LeadStatus,
    extras?: {
      actualDealValue?: number;
      notes?: string;
      estimatedDealValue?: number;
    }
  ): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Error',
          description: 'Not authenticated',
          variant: 'destructive',
        });
        return false;
      }

      // Optimistic update
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));

      const response = await supabase.functions.invoke('crm-disposition', {
        body: {
          leadId,
          newStatus,
          ...extras,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to update lead');
      }

      const data = response.data;

      // Update with server response
      if (data.lead) {
        setLeads(prev => prev.map(lead => 
          lead.id === leadId ? data.lead : lead
        ));
      }

      // Track GTM event for key conversions (Phase 7: Offline Conversions)
      // Get stored attribution for gclid/fbclid
      const attribution = getAttributionData();
      
      if (newStatus === 'closed_won' || newStatus === 'appointment_set') {
        await trackOfflineConversion({
          leadId,
          newStatus: newStatus as 'closed_won' | 'appointment_set',
          dealValue: extras?.actualDealValue,
          gclid: attribution.gclid,
          fbclid: attribution.fbc?.split('.').pop(), // Extract fbclid from _fbc format
        });
      }

      toast({
        title: 'Lead Updated',
        description: `Status changed to ${newStatus.replace('_', ' ')}`,
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update lead';
      
      // Revert optimistic update
      await fetchLeads();
      
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchLeads]);

  const getLeadsByStatus = useCallback((status: LeadStatus): CRMLead[] => {
    return leads.filter(lead => lead.status === status);
  }, [leads]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('wm_leads_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wm_leads',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLeads(prev => [payload.new as CRMLead, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setLeads(prev => prev.map(lead => 
              lead.id === payload.new.id ? payload.new as CRMLead : lead
            ));
          } else if (payload.eventType === 'DELETE') {
            setLeads(prev => prev.filter(lead => lead.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return {
    leads,
    summary,
    isLoading,
    error,
    fetchLeads,
    updateLeadStatus,
    getLeadsByStatus,
  };
}
