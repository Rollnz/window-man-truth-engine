import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CRMLead, LeadStatus, DisqualificationReason } from '@/types/crm';
import { trackEvent } from '@/lib/gtm';

interface CRMSummary {
  total: number;
  byStatus: Record<string, number>;
  byQuality: Record<string, number>;
  totalValue: number;
}

interface UpdateLeadExtras {
  actualDealValue?: number;
  notes?: string;
  estimatedDealValue?: number;
  disqualificationReason?: DisqualificationReason;
  adminOverride?: boolean;
}

interface UseCRMLeadsReturn {
  leads: CRMLead[];
  summary: CRMSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchLeads: (startDate?: string, endDate?: string, options?: { hasQuote?: boolean; analyzed?: boolean }) => Promise<void>;
  updateLeadStatus: (leadId: string, newStatus: LeadStatus, extras?: UpdateLeadExtras) => Promise<boolean>;
  getLeadsByStatus: (status: LeadStatus) => CRMLead[];
  /**
   * Mark a lead's qualification conversion as fired (server-side truth).
   * Returns { fired: true } only once per lead lifetime - safe for cv_qualified_lead.
   */
  markQualifiedConversion: (leadId: string) => Promise<{ fired: boolean }>;
}

/**
 * Admin CRM lead management hook. Fetches, filters, updates status,
 * and disqualifies leads. Provides summary statistics by status and quality.
 */
export function useCRMLeads(): UseCRMLeadsReturn {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [summary, setSummary] = useState<CRMSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLeads = useCallback(async (startDate?: string, endDate?: string, options?: { hasQuote?: boolean; analyzed?: boolean }) => {
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
      if (options?.hasQuote) params.append('has_quote', 'true');
      if (options?.analyzed) params.append('analyzed', 'true');

      // Use GET request with query params (edge function only handles GET)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const queryString = params.toString();
      const url = `${supabaseUrl}/functions/v1/crm-leads${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch leads (${response.status})`);
      }

      const data = await response.json();
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

  /**
   * SERVER-SIDE TRUTH: Mark qualified conversion as fired.
   * 
   * This is the ONLY way cv_qualified_lead should be gated.
   * - Returns { fired: true } only once per lead (ever)
   * - Prevents refresh, cross-device, localStorage-wipe duplicates
   * - Client should fire cv_qualified_lead ONLY if this returns true
   */
  const markQualifiedConversion = useCallback(async (leadId: string): Promise<{ fired: boolean }> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('[markQualifiedConversion] Not authenticated');
        return { fired: false };
      }

      const response = await supabase.functions.invoke('mark-qualified-conversion', {
        body: { leadId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        console.error('[markQualifiedConversion] Error:', response.error);
        return { fired: false };
      }

      const { fired } = response.data || { fired: false };
      
      if (import.meta.env.DEV) {
        console.log(
          `%c[Qualified CV] ${fired ? '✅ FIRST TIME' : '⏸️ Already fired'}`,
          fired ? 'color: #10b981; font-weight: bold' : 'color: #f59e0b',
          { leadId }
        );
      }

      return { fired };
    } catch (err) {
      console.error('[markQualifiedConversion] Unexpected error:', err);
      return { fired: false };
    }
  }, []);

  const updateLeadStatus = useCallback(async (
    leadId: string, 
    newStatus: LeadStatus,
    extras?: UpdateLeadExtras
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

      // Check if server rejected the transition (state machine enforcement)
      if (data.error) {
        throw new Error(data.error);
      }

      // Update with server response
      if (data.lead) {
        setLeads(prev => prev.map(lead => 
          lead.id === leadId ? data.lead : lead
        ));
      }

      // ==========================================================================
      // OFFLINE CONVERSION TRACKING (Server-Gated for Qualification)
      // ==========================================================================
      const attribution = data.attribution || {};
      
      // Fire offline conversion for qualifying statuses
      const conversionStatuses = ['qualified', 'mql', 'appointment_set', 'sat', 'closed_won', 'closed_lost', 'dead'];
      
      if (conversionStatuses.includes(newStatus)) {
        // For 'qualified' status, use server-gated cv_qualified_lead
        if (newStatus === 'qualified' || newStatus === 'mql') {
          // CRITICAL: Gate cv_qualified_lead on server truth
          const { fired } = await markQualifiedConversion(leadId);
          
          if (fired) {
            // Only fire the primary conversion if server confirms first-time
            trackEvent('offline_conversion', {
              lead_id: leadId,
              conversion_type: newStatus,
              lead_status: newStatus,
            });
          }
          // If not fired, skip - prevents duplicate cv_qualified_lead events
        } else {
          // Other statuses don't need the server gate
          trackEvent('offline_conversion', {
            lead_id: leadId,
            conversion_type: newStatus,
            conversion_value: extras?.actualDealValue,
            lead_status: newStatus,
          });
        }
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
  }, [toast, fetchLeads, markQualifiedConversion]);

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
    markQualifiedConversion,
  };
}
