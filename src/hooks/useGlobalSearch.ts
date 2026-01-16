import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CRMLead } from '@/types/crm';

const RECENT_LEADS_KEY = 'admin_recent_leads';
const MAX_RECENT = 5;

export interface UseGlobalSearchReturn {
  leads: CRMLead[];
  recentLeads: CRMLead[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  filteredLeads: CRMLead[];
  addToRecent: (lead: CRMLead) => void;
  navigateToLead: (leadId: string) => void;
  isLoading: boolean;
}

export function useGlobalSearch(): UseGlobalSearchReturn {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [recentLeads, setRecentLeads] = useState<CRMLead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load recent leads from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_LEADS_KEY);
    if (stored) {
      try {
        setRecentLeads(JSON.parse(stored));
      } catch {
        localStorage.removeItem(RECENT_LEADS_KEY);
      }
    }
  }, []);

  // Fetch all leads when opened
  useEffect(() => {
    if (!isOpen) return;

    const fetchLeads = async () => {
      setIsLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) return;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-leads`,
          {
            headers: {
              Authorization: `Bearer ${sessionData.session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setLeads(data.leads || []);
        }
      } catch (error) {
        console.error('Failed to fetch leads for search:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, [isOpen]);

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter leads based on search query
  const filteredLeads = leads.filter((lead) => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase();
    const name = `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase();
    return (
      name.includes(query) ||
      lead.email.toLowerCase().includes(query) ||
      (lead.phone?.includes(query) ?? false)
    );
  });

  const addToRecent = useCallback((lead: CRMLead) => {
    setRecentLeads((prev) => {
      const filtered = prev.filter((l) => l.id !== lead.id);
      const updated = [lead, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_LEADS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const navigateToLead = useCallback(
    (leadId: string) => {
      const lead = leads.find((l) => l.id === leadId) || recentLeads.find((l) => l.id === leadId);
      if (lead) {
        addToRecent(lead);
      }
      setIsOpen(false);
      setSearchQuery('');
      navigate(`/admin/leads/${leadId}`);
    },
    [leads, recentLeads, addToRecent, navigate]
  );

  return {
    leads,
    recentLeads,
    searchQuery,
    setSearchQuery,
    isOpen,
    setIsOpen,
    filteredLeads,
    addToRecent,
    navigateToLead,
    isLoading,
  };
}
