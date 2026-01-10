import { useState, useEffect, useCallback } from 'react';
import { getEngagementScore, getEngagementState } from '@/services/analytics';

const SCORE_STORAGE_KEY = 'wte-engagement-score';

/**
 * Hook to reactively listen to engagement score changes
 */
export function useEngagementScore() {
  const [score, setScore] = useState(getEngagementScore);
  const [previousScore, setPreviousScore] = useState(0);
  
  // Poll for changes (since sessionStorage doesn't have native events)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentScore = getEngagementScore();
      if (currentScore !== score) {
        setPreviousScore(score);
        setScore(currentScore);
      }
    }, 500);
    
    // Also listen to storage events (for cross-tab sync)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SCORE_STORAGE_KEY) {
        const currentScore = getEngagementScore();
        setPreviousScore(score);
        setScore(currentScore);
      }
    };
    
    window.addEventListener('storage', handleStorage);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [score]);
  
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
