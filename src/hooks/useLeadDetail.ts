import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LeadStatus } from '@/types/crm';

export interface LeadNote {
  id: string;
  lead_id: string;
  content: string;
  admin_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadEvent {
  id: string;
  session_id: string;
  event_name: string;
  event_category: string | null;
  event_data: Record<string, unknown> | null;
  page_path: string | null;
  page_title: string | null;
  created_at: string;
}

export interface LeadFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  source_page: string | null;
}

export interface LeadSession {
  id: string;
  anonymous_id: string;
  landing_page: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  created_at: string;
}

export interface PhoneCallLog {
  id: string;
  call_request_id: string;
  lead_id: string | null;
  source_tool: string;
  agent_id: string;
  call_status: string;
  call_duration_sec: number | null;
  call_sentiment: string | null;
  recording_url: string | null;
  ai_notes: string | null;
  triggered_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface PendingCall {
  id: string;
  call_request_id: string;
  lead_id: string | null;
  source_tool: string;
  status: string;
  scheduled_for: string;
  attempt_count: number;
  created_at: string;
}

export interface LeadDetailData {
  id: string;
  lead_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  status: LeadStatus;
  lead_quality: string | null;
  engagement_score: number | null;
  original_source_tool: string | null;
  original_session_id: string | null;
  verified_social_url: string | null;
  city: string | null;
  facebook_page_name: string | null;
  facebook_ad_id: string | null;
  notes: string | null;
  estimated_deal_value: number | null;
  actual_deal_value: number | null;
  assigned_to: string | null;
  last_contacted_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Canonical redirect info when the request used a non-canonical ID */
export interface CanonicalInfo {
  wm_lead_id: string;
  canonical_path: string;
}

export interface AiPreAnalysisResult {
  estimated_total_price: number | null;
  window_brand_or_material: string;
  detected_markup_level: 'High' | 'Average' | 'Low' | 'Unknown';
  red_flags: string[];
  sales_angle: string;
}

export interface AiPreAnalysis {
  status: 'none' | 'pending' | 'completed' | 'failed';
  result: AiPreAnalysisResult | null;
  reason: string | null;
  started_at: string | null;
  completed_at: string | null;
  model: string | null;
}

interface UseLeadDetailReturn {
  lead: LeadDetailData | null;
  events: LeadEvent[];
  files: LeadFile[];
  notes: LeadNote[];
  session: LeadSession | null;
  calls: PhoneCallLog[];
  pendingCalls: PendingCall[];
  aiPreAnalysis: AiPreAnalysis | null;
  isLoading: boolean;
  error: string | null;
  canonical: CanonicalInfo | null;
  refetch: () => Promise<void>;
  updateStatus: (status: LeadStatus) => Promise<boolean>;
  addNote: (content: string) => Promise<boolean>;
  updateSocialUrl: (url: string) => Promise<boolean>;
  updateLead: (updates: Partial<LeadDetailData>) => Promise<boolean>;
}

/**
 * Fetches full lead detail (profile, timeline events, notes) for the
 * admin lead-detail view. Supports status updates, note CRUD, and refresh.
 * @param leadId - The wm_leads ID to load
 */
export function useLeadDetail(leadId: string | undefined): UseLeadDetailReturn {
  const [lead, setLead] = useState<LeadDetailData | null>(null);
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [files, setFiles] = useState<LeadFile[]>([]);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [session, setSession] = useState<LeadSession | null>(null);
  const [calls, setCalls] = useState<PhoneCallLog[]>([]);
  const [pendingCalls, setPendingCalls] = useState<PendingCall[]>([]);
  const [aiPreAnalysis, setAiPreAnalysis] = useState<AiPreAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canonical, setCanonical] = useState<CanonicalInfo | null>(null);
  const { toast } = useToast();

  // UUID validation helper
  const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const fetchData = useCallback(async () => {
    if (!leadId) {
      setError('No lead ID provided');
      setIsLoading(false);
      return;
    }

    if (!isValidUUID(leadId)) {
      setError('Invalid lead ID format. Please use a valid lead URL.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        setError('Not authenticated. Please log in to access lead details.');
        return;
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-lead-detail?id=${leadId}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch lead');
      }

      const data = await res.json();
      setLead(data.lead);
      setEvents(data.events || []);
      setFiles(data.files || []);
      setNotes(data.notes || []);
      setSession(data.session);
      setCalls(data.calls || []);
      setPendingCalls(data.pendingCalls || []);
      setAiPreAnalysis(data.aiPreAnalysis || null);
      
      if (data.canonical) {
        setCanonical(data.canonical);
      } else {
        setCanonical(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load lead details';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [leadId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Safe polling via useRef — prevents stale closures without eslint-disable
  const fetchRef = useRef(fetchData);
  useEffect(() => { fetchRef.current = fetchData; }, [fetchData]);

  useEffect(() => {
    if (aiPreAnalysis?.status !== 'pending') return;
    const interval = setInterval(() => fetchRef.current(), 5000);
    return () => clearInterval(interval);
  }, [aiPreAnalysis?.status]);

  const callAction = async (action: string, data: Record<string, unknown>): Promise<boolean> => {
    if (!leadId) return false;

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
        return false;
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-lead-detail?id=${leadId}`;
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

  const updateStatus = async (status: LeadStatus): Promise<boolean> => {
    const success = await callAction('update_status', { status });
    if (success) {
      setLead(prev => prev ? { ...prev, status } : null);
      toast({ title: 'Success', description: 'Status updated' });
    }
    return success;
  };

  const addNote = async (content: string): Promise<boolean> => {
    const success = await callAction('add_note', { content });
    if (success) {
      await fetchData();
      toast({ title: 'Success', description: 'Note added' });
    }
    return success;
  };

  const updateSocialUrl = async (url: string): Promise<boolean> => {
    const success = await callAction('update_social_url', { verified_social_url: url });
    if (success) {
      setLead(prev => prev ? { ...prev, verified_social_url: url } : null);
      toast({ title: 'Success', description: 'Social profile saved' });
    }
    return success;
  };

  const updateLead = async (updates: Partial<LeadDetailData>): Promise<boolean> => {
    const success = await callAction('update_lead', { updates });
    if (success) {
      setLead(prev => prev ? { ...prev, ...updates } : null);
      toast({ title: 'Success', description: 'Lead updated' });
    }
    return success;
  };

  return {
    lead,
    events,
    files,
    notes,
    session,
    calls,
    pendingCalls,
    aiPreAnalysis,
    isLoading,
    error,
    canonical,
    refetch: fetchData,
    updateStatus,
    addNote,
    updateSocialUrl,
    updateLead,
  };
}
