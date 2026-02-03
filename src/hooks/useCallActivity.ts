import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityCall {
  id: string;
  source_tool: string;
  status: string;
  triggered_at: string;
  phone_masked: string | null;
  duration_seconds: number | null;
  recording_url: string | null;
  transcript: string | null;
  error_message: string | null;
  sentiment: string | null;
  wm_lead_id: string | null;
}

export interface ActivityFilters {
  source_tool: string;  // empty string means all tools
  status: string;       // empty string means all statuses
}

export function useCallActivity() {
  const [calls, setCalls] = useState<ActivityCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filters, setFilters] = useState<ActivityFilters>({
    source_tool: "",
    status: "",
  });

  const fetchCalls = useCallback(async (params?: {
    source_tool?: string;
    status?: string;
    cursor?: string;
    append?: boolean;
  }) => {
    const isAppend = params?.append;
    if (isAppend) setIsLoadingMore(true);
    else setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const queryParams = new URLSearchParams();
      if (params?.source_tool) queryParams.set("source_tool", params.source_tool);
      if (params?.status) queryParams.set("status", params.status);
      if (params?.cursor) queryParams.set("cursor", params.cursor);

      const qs = queryParams.toString();
      const url =
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-call-activity`
        + (qs ? `?${qs}` : "");

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);

      if (isAppend) {
        setCalls(prev => [...prev, ...data.calls]);
      } else {
        setCalls(data.calls);
      }

      setHasMore(data.hasMore);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Auto-fetch when filters change
  // CRITICAL: Using primitive values in deps, NOT the filters object
  useEffect(() => {
    fetchCalls({
      source_tool: filters.source_tool || undefined,
      status: filters.status || undefined,
    });
  }, [filters.source_tool, filters.status, fetchCalls]);

  const loadMore = useCallback(() => {
    if (calls.length === 0 || isLoadingMore || !hasMore) return;
    const lastCall = calls[calls.length - 1];
    fetchCalls({
      source_tool: filters.source_tool || undefined,
      status: filters.status || undefined,
      cursor: lastCall.triggered_at,
      append: true,
    });
  }, [calls, filters.source_tool, filters.status, isLoadingMore, hasMore, fetchCalls]);

  const refetch = useCallback(() => {
    fetchCalls({
      source_tool: filters.source_tool || undefined,
      status: filters.status || undefined,
    });
  }, [filters.source_tool, filters.status, fetchCalls]);

  return {
    calls,
    loading,
    error,
    hasMore,
    isLoadingMore,
    filters,
    setFilters,
    loadMore,
    refetch,
  };
}
