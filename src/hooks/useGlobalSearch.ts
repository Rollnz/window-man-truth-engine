import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getLeadRoute } from '@/lib/leadRouting';
import { CRMLead } from '@/types/crm';

const RECENT_LEADS_KEY = 'admin_recent_leads';
const MAX_RECENT = 5;
const DEBOUNCE_MS = 200;
const MIN_QUERY_LENGTH = 2;

/**
 * Entity types returned from global search
 */
export type EntityType = 'lead' | 'call' | 'pending_call' | 'note' | 'session' | 'quote_upload' | 'consultation';

/**
 * Search result item from the unified global_search_index
 */
export interface SearchResultItem {
  entity_type: EntityType;
  entity_type_label: string;
  entity_id: string;
  /** Canonical admin lead ID (wm_leads.id) - use for routing */
  wm_lead_id: string | null;
  /** Public leads.id - for reference, not routing */
  lead_id: string | null;
  title: string;
  subtitle: string;
  updated_at: string;
  payload: Record<string, any>;
  match_reason: 'exact_id' | 'exact_match' | 'keyword_match' | 'digits' | 'partial';
  match_field: string;
  match_snippet?: string;
  match_positions?: Array<{ start: number; length: number }>;
}

/**
 * Grouped search results by entity type
 */
export type GroupedResults = Record<EntityType, SearchResultItem[]>;

export interface UseGlobalSearchReturn {
  recentLeads: CRMLead[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  entityTypeFilter: EntityType[];
  setEntityTypeFilter: (types: EntityType[]) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  searchResults: SearchResultItem[];
  groupedResults: GroupedResults;
  addToRecent: (lead: CRMLead) => void;
  navigateToResult: (result: SearchResultItem) => void;
  navigateToLead: (leadId: string) => void;
  viewAllResults: () => void;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  // Keyboard navigation
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export function useGlobalSearch(): UseGlobalSearchReturn {
  const navigate = useNavigate();
  const [recentLeads, setRecentLeads] = useState<CRMLead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityType[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [groupedResults, setGroupedResults] = useState<GroupedResults>({} as GroupedResults);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
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
      setGroupedResults({} as GroupedResults);
      setError(null);
      setIsLoading(false);
      setHasMore(false);
      setTotalCount(0);
      setSelectedIndex(-1);
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

        // Build query params
        const params = new URLSearchParams();
        params.set('q', trimmedQuery);
        params.set('limit', '12');
        
        if (entityTypeFilter.length > 0) {
          params.set('entity_type', entityTypeFilter.join(','));
        }

        const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-global-search`;

        // Call edge function
        const response = await fetch(
          `${baseUrl}?${params.toString()}`,
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
          setGroupedResults({} as GroupedResults);
          setIsLoading(false);
          setHasMore(false);
          return;
        }

        const data = await response.json();
        setSearchResults(data.items || []);
        setGroupedResults(data.grouped || {});
        setHasMore(data.has_more || false);
        setTotalCount(data.total_count || data.items?.length || 0);
        setError(null);
        setSelectedIndex(-1); // Reset selection on new results
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('Search error:', err);
        setError('Search failed');
        setSearchResults([]);
        setGroupedResults({} as GroupedResults);
        setHasMore(false);
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
  }, [searchQuery, entityTypeFilter]);

  // Clear state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      const timeout = setTimeout(() => {
        if (!isOpen) {
          setSearchQuery('');
          setSearchResults([]);
          setGroupedResults({} as GroupedResults);
          setError(null);
          setHasMore(false);
          setTotalCount(0);
          setSelectedIndex(-1);
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

  // Navigate to a specific result based on its entity type
  // Uses wm_lead_id (canonical admin ID) for all lead routing via getLeadRoute
  const navigateToResult = useCallback((result: SearchResultItem) => {
    setIsOpen(false);
    setSearchQuery('');

    // For leads, navigate directly to lead detail using wm_lead_id
    if (result.entity_type === 'lead') {
      // For lead entities, entity_id = wm_leads.id
      const route = getLeadRoute({ wm_lead_id: result.wm_lead_id || result.entity_id });
      if (route) {
        navigate(route);
      } else {
        navigate('/admin/crm');
      }
      return;
    }

    // For entities with a wm_lead_id, navigate to that lead
    if (result.wm_lead_id) {
      const route = getLeadRoute({ wm_lead_id: result.wm_lead_id });
      if (route) {
        navigate(route);
        return;
      }
    }

    // Fallback: use lead_id if available, otherwise navigate to entity's page
    switch (result.entity_type) {
      case 'call':
      case 'pending_call':
        // Navigate to lead if available via fallback
        if (result.lead_id) {
          const route = getLeadRoute({ lead_id: result.lead_id });
          if (route) {
            navigate(route);
            return;
          }
        }
        navigate('/admin/crm');
        break;
      case 'note':
        // Notes should have wm_lead_id, fallback to CRM
        navigate('/admin/crm');
        break;
      case 'quote_upload':
        navigate('/admin/quotes');
        break;
      case 'session':
        // Sessions are analytics-focused
        navigate('/admin/attribution');
        break;
      case 'consultation':
        navigate('/admin/crm');
        break;
      default:
        navigate('/admin/crm');
    }
  }, [navigate]);

  // Navigate directly to a lead by ID (used for recent leads)
  // leadId here is wm_leads.id from the CRM API
  const navigateToLead = useCallback((leadId: string) => {
    // Find in recent or search results
    const recentLead = recentLeads.find((l) => l.id === leadId);
    if (recentLead) {
      addToRecent(recentLead);
    }
    
    setIsOpen(false);
    setSearchQuery('');
    const route = getLeadRoute({ wm_lead_id: leadId });
    if (route) {
      navigate(route);
    }
  }, [recentLeads, addToRecent, navigate]);

  const viewAllResults = useCallback(() => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length >= MIN_QUERY_LENGTH) {
      setIsOpen(false);
      
      const params = new URLSearchParams();
      params.set('q', trimmedQuery);
      
      if (entityTypeFilter.length > 0) {
        params.set('entity_type', entityTypeFilter.join(','));
      }
      
      navigate(`/admin/search?${params.toString()}`);
    }
  }, [searchQuery, entityTypeFilter, navigate]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = searchResults.length + (hasMore ? 1 : 0); // +1 for "View all" option

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev + 1;
          return next >= totalItems ? 0 : next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev - 1;
          return next < 0 ? totalItems - 1 : next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          navigateToResult(searchResults[selectedIndex]);
        } else if (selectedIndex === searchResults.length && hasMore) {
          viewAllResults();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }, [searchResults, hasMore, selectedIndex, navigateToResult, viewAllResults]);

  return {
    recentLeads,
    searchQuery,
    setSearchQuery,
    entityTypeFilter,
    setEntityTypeFilter,
    isOpen,
    setIsOpen,
    searchResults,
    groupedResults,
    addToRecent,
    navigateToResult,
    navigateToLead,
    viewAllResults,
    isLoading,
    error,
    hasMore,
    totalCount,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
  };
}
