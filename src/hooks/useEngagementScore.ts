import { useState, useEffect, useCallback, useRef } from 'react';
import { getEngagementScore, getEngagementState } from '@/services/analytics';
import { scheduleWhenIdle } from '@/lib/deferredInit';

const SCORE_STORAGE_KEY = 'wte-engagement-score';

/**
 * Hook to reactively listen to engagement score changes
 * - Polling is deferred to avoid blocking initial render
 */
export function useEngagementScore() {
  const [score, setScore] = useState(getEngagementScore);
  const [previousScore, setPreviousScore] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Poll for changes (since sessionStorage doesn't have native events)
  // Deferred to idle time to avoid blocking initial render
  useEffect(() => {
    // Also listen to storage events (for cross-tab sync) - this is lightweight
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SCORE_STORAGE_KEY) {
        const currentScore = getEngagementScore();
        setScore(prev => {
          if (currentScore !== prev) {
            setPreviousScore(prev);
            return currentScore;
          }
          return prev;
        });
      }
    };
    
    window.addEventListener('storage', handleStorage);
    
    // Defer polling start by 3 seconds
    const cancelIdle = scheduleWhenIdle(() => {
      intervalRef.current = setInterval(() => {
        const currentScore = getEngagementScore();
        setScore(prev => {
          if (currentScore !== prev) {
            setPreviousScore(prev);
            return currentScore;
          }
          return prev;
        });
      }, 500);
    }, { minDelay: 3000 });
    
    return () => {
      cancelIdle();
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);
  
  // Get status based on score thresholds
  const getStatus = useCallback((s: number) => {
    if (s >= 81) return { label: 'Ready to Win', color: 'text-emerald-500', bgColor: 'bg-emerald-500', ring: 'stroke-emerald-500' };
    if (s >= 51) return { label: 'Prepared', color: 'text-purple-500', bgColor: 'bg-purple-500', ring: 'stroke-purple-500' };
    if (s >= 21) return { label: 'Learning', color: 'text-blue-500', bgColor: 'bg-blue-500', ring: 'stroke-blue-500' };
    return { label: 'Just Starting', color: 'text-muted-foreground', bgColor: 'bg-muted-foreground', ring: 'stroke-muted-foreground' };
  }, []);
  
  const status = getStatus(score);
  const hasIncreased = score > previousScore && previousScore > 0;
  
  return {
    score,
    previousScore,
    hasIncreased,
    status,
    events: getEngagementState().events,
    maxScore: 150,
  };
}
