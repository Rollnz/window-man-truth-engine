import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminStats {
  totalLeads: number;
  hotLeads: number;
  quotesToday: number;
  newLeadsToday: number;
  conversionRate: number;
}

export interface ActivityEvent {
  id: string;
  type: 'lead' | 'quote' | 'status_change' | 'note';
  title: string;
  subtitle: string;
  timestamp: string;
  /** Canonical admin lead ID (wm_leads.id) - use for routing */
  leadId?: string;
}

export interface AdminDashboardData {
  stats: AdminStats;
  recentActivity: ActivityEvent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAdminDashboard(): AdminDashboardData {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('Not authenticated');

      // Fetch leads
      const leadsResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-leads`,
        {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const leadsData = leadsResponse.ok ? await leadsResponse.json() : { leads: [] };
      const leads = leadsData.leads || [];

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalLeads = leads.length;
      const hotLeads = leads.filter((l: { engagement_score: number }) => l.engagement_score >= 150).length;
      const newLeadsToday = leads.filter((l: { created_at: string }) => 
        new Date(l.created_at) >= today
      ).length;
      const closedWon = leads.filter((l: { status: string }) => l.status === 'closed_won').length;
      const conversionRate = totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100) : 0;

      // Fetch quote count for today
      const quotesResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-quotes?startDate=${today.toISOString().split('T')[0]}&endDate=${today.toISOString().split('T')[0]}`,
        {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const quotesData = quotesResponse.ok ? await quotesResponse.json() : { total: 0 };
      const quotesToday = quotesData.total || 0;

      // Build activity feed from leads
      const recentActivity: ActivityEvent[] = leads
        .slice(0, 10)
        .map((lead: { id: string; first_name?: string; last_name?: string; email: string; created_at: string; status: string }) => ({
          id: lead.id,
          type: 'lead' as const,
          title: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.email.split('@')[0],
          subtitle: lead.status === 'new' ? 'New lead captured' : `Status: ${lead.status}`,
          timestamp: lead.created_at,
          leadId: lead.id,
        }));

      return {
        stats: {
          totalLeads,
          hotLeads,
          quotesToday,
          newLeadsToday,
          conversionRate,
        },
        recentActivity,
      };
    },
    staleTime: 60000, // 1 minute
  });

  return {
    stats: data?.stats || { totalLeads: 0, hotLeads: 0, quotesToday: 0, newLeadsToday: 0, conversionRate: 0 },
    recentActivity: data?.recentActivity || [],
    isLoading,
    error: error?.message || null,
    refetch,
  };
}
