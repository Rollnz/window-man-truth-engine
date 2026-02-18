/**
 * useCanonicalScore - Server-sourced engagement scoring
 * 
 * Replaces the sessionStorage-based scoring with server-authoritative scores.
 * Calls the score-event Edge Function and handles GTM threshold events.
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { wmInternal } from '@/lib/wmTracking';
import { useAuth } from '@/hooks/useAuth';
import { getGoldenThreadId } from '@/lib/goldenThread';

// Re-export for backward compatibility
// All existing code importing getOrCreateAnonId will continue to work
export const getOrCreateAnonId = getGoldenThreadId;

// Event types (must match server whitelist)
export type ScoreEventType = 'QUOTE_UPLOADED' | 'LEAD_CAPTURED' | 'SESSION_ENGAGED';

export interface ScoreEventParams {
  eventType: ScoreEventType;
  sourceEntityType: 'quote' | 'lead';
  sourceEntityId: string;
}

export interface ScoreState {
  totalScore: number;
  levelLabel: string;
  isLoading: boolean;
  lastError: string | null;
}

export interface UseCanonicalScoreReturn extends ScoreState {
  awardScore: (params: ScoreEventParams) => Promise<{
    inserted: boolean;
    totalScore: number;
    levelLabel: string;
    highIntentReachedNow: boolean;
    qualifiedReachedNow: boolean;
  } | null>;
  refreshScore: () => Promise<void>;
}

/**
 * Hook for managing canonical server-sourced engagement scores
 */
export function useCanonicalScore(): UseCanonicalScoreReturn {
  const { user } = useAuth();
  const [state, setState] = useState<ScoreState>({
    totalScore: 0,
    levelLabel: 'Just Starting',
    isLoading: false,
    lastError: null,
  });

  // Load initial score from profile if authenticated
  const refreshScore = useCallback(async () => {
    if (!user?.id) {
      // For anonymous users, we don't have a persistent score store
      // Score is returned on each award call
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('total_score')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('[useCanonicalScore] Profile fetch error:', error);
        return;
      }

      if (data) {
        const score = data.total_score || 0;
        setState(prev => ({
          ...prev,
          totalScore: score,
          levelLabel: scoreToLevel(score),
        }));
      }
    } catch (error) {
      console.error('[useCanonicalScore] Refresh error:', error);
    }
  }, [user?.id]);

  // Refresh score on mount and when user changes
  useEffect(() => {
    refreshScore();
  }, [refreshScore]);

  /**
   * Award points for a high-value action
   * Returns the result or null if an error occurred
   */
  const awardScore = useCallback(async (params: ScoreEventParams) => {
    const { eventType, sourceEntityType, sourceEntityId } = params;
    
    // Generate deterministic event_id for idempotency
    const eventId = `${eventType.toLowerCase()}:${sourceEntityId}`;
    const anonId = getOrCreateAnonId();

    setState(prev => ({ ...prev, isLoading: true, lastError: null }));

    try {
      const { data, error } = await supabase.functions.invoke('score-event', {
        body: {
          event_type: eventType,
          source_entity_type: sourceEntityType,
          source_entity_id: sourceEntityId,
          event_id: eventId,
          anon_id: anonId,
        },
      });

      if (error) {
        // Check if this is an ownership/403 error - silently fail for these
        const errorMessage = error.message || '';
        const isOwnershipError = errorMessage.includes('403') || 
                                  errorMessage.includes('ownership') ||
                                  errorMessage.includes('Ownership');
        
        if (isOwnershipError) {
          // Silent fail for ownership mismatches (expected for returning users with different session)
          console.info('[useCanonicalScore] Ownership mismatch - likely returning user or different session');
          setState(prev => ({ ...prev, isLoading: false, lastError: null }));
          return null;
        }
        
        console.error('[useCanonicalScore] Award error:', error);
        setState(prev => ({ ...prev, isLoading: false, lastError: error.message }));
        return null;
      }

      if (!data?.ok) {
        const errorMsg = data?.error || 'Unknown error';
        
        // Check if this is an ownership validation failure - silently handle
        const isOwnershipError = errorMsg.includes('ownership') || 
                                  errorMsg.includes('Ownership');
        
        if (isOwnershipError) {
          console.info('[useCanonicalScore] Ownership validation failed - likely session mismatch, silently continuing');
          setState(prev => ({ ...prev, isLoading: false, lastError: null }));
          return null;
        }
        
        console.warn('[useCanonicalScore] Award rejected:', errorMsg);
        setState(prev => ({ ...prev, isLoading: false, lastError: errorMsg }));
        return null;
      }

      const {
        inserted,
        total_score,
        level_label,
        high_intent_reached_now,
        qualified_reached_now,
      } = data;

      // Update local state
      setState({
        totalScore: total_score,
        levelLabel: level_label,
        isLoading: false,
        lastError: null,
      });

      // Fire GTM threshold events ONLY when server confirms transition
      if (high_intent_reached_now) {
        wmInternal('HighIntentUser', {
          total_score,
          level_label,
          triggered_by: eventType,
        });
        console.log('🎯 HIGH INTENT USER DETECTED (server-confirmed):', total_score);
      }

      if (qualified_reached_now) {
        wmInternal('QualifiedProspect', {
          total_score,
          level_label,
          triggered_by: eventType,
        });
        console.log('🏆 QUALIFIED PROSPECT (server-confirmed):', total_score);
      }

      // Always log the engagement delta for analytics
      if (inserted) {
        wmInternal('engagement_score', {
          action: eventType,
          score_delta: eventType === 'QUOTE_UPLOADED' ? 50 : 100,
          total_score,
          level_label,
        });
      }

      return {
        inserted,
        totalScore: total_score,
        levelLabel: level_label,
        highIntentReachedNow: high_intent_reached_now,
        qualifiedReachedNow: qualified_reached_now,
      };

    } catch (error) {
      console.error('[useCanonicalScore] Award exception:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      }));
      return null;
    }
  }, []);

  return {
    ...state,
    awardScore,
    refreshScore,
  };
}

/**
 * Convert score to level label (client-side mirror of server function)
 */
function scoreToLevel(score: number): string {
  if (score >= 150) return 'Qualified';
  if (score >= 100) return 'High Intent';
  if (score >= 50) return 'Warming Up';
  return 'Just Starting';
}
