import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TickerStats {
  total: number;
  today: number;
  isLoading: boolean;
  isFromServer: boolean;
}

/**
 * Client-side fallback calculation (matches original useProjectedQuotes logic)
 * Used immediately on mount and as fallback if edge function fails
 */
function getClientFallback() {
  const START_DATE = new Date('2024-02-12');
  const GROWTH_RATE = 4.9;
  const TODAY_MIN = 12;
  const TODAY_MAX = 28;

  const now = new Date();
  const daysPassed = Math.floor(
    (now.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Seeded random for today (consistent per day)
  const todayString = now.toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < todayString.length; i++) {
    hash = (hash << 5) - hash + todayString.charCodeAt(i);
    hash |= 0;
  }
  const random = (Math.abs(hash) % 1000) / 1000;
  const today = Math.floor(random * (TODAY_MAX - TODAY_MIN + 1)) + TODAY_MIN;

  const total = Math.floor(daysPassed * GROWTH_RATE) + today;

  return { total, today };
}

// Module-level cache to avoid refetching across components
let cachedStats: { total: number; today: number } | null = null;
let fetchPromise: Promise<{ total: number; today: number } | null> | null = null;

async function fetchTickerStats(): Promise<{ total: number; today: number } | null> {
  // Return cached result if available
  if (cachedStats) {
    return cachedStats;
  }

  // Return existing promise if fetch is in progress
  if (fetchPromise) {
    return fetchPromise;
  }

  // Start new fetch
  fetchPromise = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-ticker-stats');

      if (error) {
        console.warn('[useTickerStats] Edge function error:', error);
        return null;
      }

      if (data?.total !== undefined && data?.today !== undefined) {
        cachedStats = { total: data.total, today: data.today };
        console.log('[useTickerStats] Server response:', cachedStats);
        return cachedStats;
      }

      return null;
    } catch (err) {
      console.warn('[useTickerStats] Fetch failed, using fallback:', err);
      return null;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

/**
 * Hybrid ticker stats hook
 * 
 * 1. Immediately returns client-side fallback (no blank flash)
 * 2. Fetches server-side hybrid data in background
 * 3. Updates with server data when available
 * 4. Falls back gracefully if server fails
 */
export function useTickerStats(): TickerStats {
  const fallback = useMemo(() => getClientFallback(), []);

  const [stats, setStats] = useState<TickerStats>({
    total: cachedStats?.total ?? fallback.total,
    today: cachedStats?.today ?? fallback.today,
    isLoading: !cachedStats,
    isFromServer: !!cachedStats,
  });

  useEffect(() => {
    // If we already have cached data, no need to fetch
    if (cachedStats) {
      setStats({
        total: cachedStats.total,
        today: cachedStats.today,
        isLoading: false,
        isFromServer: true,
      });
      return;
    }

    let isMounted = true;

    // PERFORMANCE: Defer fetch to idle time to not block FCP/LCP
    // The fallback values are already displayed, so this is purely enhancement
    const timeoutId = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        (window as Window).requestIdleCallback(() => {
          if (!isMounted) return;
          performFetch();
        }, { timeout: 3000 });
      } else {
        performFetch();
      }
    }, 100); // Small delay to ensure render completes first

    function performFetch() {
      fetchTickerStats().then((result) => {
        if (!isMounted) return;

        if (result) {
          setStats({
            total: result.total,
            today: result.today,
            isLoading: false,
            isFromServer: true,
          });
        } else {
          // Keep fallback values, just mark as not loading
          setStats((prev) => ({ ...prev, isLoading: false }));
        }
      });
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [fallback]);

  return stats;
}
