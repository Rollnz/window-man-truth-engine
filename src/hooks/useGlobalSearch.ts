import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CRMLead } from '@/types/crm';

const RECENT_LEADS_KEY = 'admin_recent_leads';
const MAX_RECENT = 5;
const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

/**
 * Search suggestion returned from admin-global-search edge function
 */
export interface SearchSuggestion {
  type: 'lead';
  id: string;
  title: string;
  subtitle: string;
  status: string;
  engagement_score: number | null;
  match_field: 'email' | 'phone' | 'name' | 'notes' | 'id' | 'city' | 'source' | 'unknown';
  match_snippet?: string;
  match_positions?: Array<{ start: number; length: number }>;
}

export interface UseGlobalSearchReturn {
  recentLeads: CRMLead[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  searchResults: SearchSuggestion[];
  addToRecent: (lead: CRMLead) => void;
  navigateToLead: (leadId: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function useGlobalSearch(): UseGlobalSearchReturn {
  const navigate = useNavigate();
  const [recentLeads, setRecentLeads] = useState<CRMLead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for debounce and abort
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  // Debounced search when query changes
  useEffect(() => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear results if query too short
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setSearchResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Set loading immediately for UX
    setIsLoading(true);
    setError(null);

    // Debounce the actual search
    debounceRef.current = setTimeout(async () => {
      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          setError('Not authenticated');
          setIsLoading(false);
          return;
        }

        // Call edge function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-global-search?q=${encodeURIComponent(trimmedQuery)}&limit=8`,
          {
            headers: {
              Authorization: `Bearer ${sessionData.session.access_token}`,
              'Content-Type': 'application/json',
            },
            signal: abortControllerRef.current?.signal,
          }
        );

        if (!response.ok) {
          if (response.status === 403) {
            setError('Admin access required');
          } else if (response.status === 401) {
            setError('Not authenticated');
          } else {
            setError('Search failed');
          }
          setSearchResults([]);
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setSearchResults(data.suggestions || []);
        setError(null);
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('Search error:', err);
        setError('Search failed');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    // Cleanup
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  // Clear state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Clear after a short delay to avoid flicker on reopen
      const timeout = setTimeout(() => {
        if (!isOpen) {
          setSearchQuery('');
          setSearchResults([]);
          setError(null);
        }
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

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
      // Try to find lead in recent leads to add to history
      const recentLead = recentLeads.find((l) => l.id === leadId);
      if (recentLead) {
        addToRecent(recentLead);
      } else {
        // If from search results, create a minimal CRMLead object for recent
        const searchResult = searchResults.find((s) => s.id === leadId);
        if (searchResult) {
          // Partial lead for recent storage - only fields needed for display
          const minimalLead = {
            id: searchResult.id,
            email: searchResult.subtitle.split(' | ')[0] || '',
            phone: searchResult.subtitle.split(' | ')[1] || null,
            first_name: searchResult.title.split(' ')[0] || null,
            last_name: searchResult.title.split(' ').slice(1).join(' ') || null,
            status: searchResult.status,
            engagement_score: searchResult.engagement_score,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as CRMLead;
          addToRecent(minimalLead);
        }
      }
      
      setIsOpen(false);
      setSearchQuery('');
      navigate(`/admin/leads/${leadId}`);
    },
    [recentLeads, searchResults, addToRecent, navigate]
  );

  return {
    recentLeads,
    searchQuery,
    setSearchQuery,
    isOpen,
    setIsOpen,
    searchResults,
    addToRecent,
    navigateToLead,
    isLoading,
    error,
  };
}
