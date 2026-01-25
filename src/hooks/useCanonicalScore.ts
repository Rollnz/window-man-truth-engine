/**
 * useCanonicalScore - Server-sourced engagement scoring
 * 
 * Replaces the sessionStorage-based scoring with server-authoritative scores.
 * Calls the score-event Edge Function and handles GTM threshold events.
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/gtm';
import { useAuth } from '@/hooks/useAuth';

// Anon ID management (persisted across sessions)
const ANON_ID_KEY = 'wte-anon-id';

export function getOrCreateAnonId(): string {
  try {
    let anonId = localStorage.getItem(ANON_ID_KEY);
    if (!anonId) {
      anonId = crypto.randomUUID();
      localStorage.setItem(ANON_ID_KEY, anonId);
    }
    return anonId;
  } catch {
    // Fallback for SSR or storage errors
    return crypto.randomUUID();
  }
}

// Event types (must match server whitelist)
export type ScoreEventType = 'QUOTE_UPLOADED' | 'LEAD_CAPTURED';

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
        console.error('[useCanonicalScore] Award error:', error);
        setState(prev => ({ ...prev, isLoading: false, lastError: error.message }));
        return null;
      }

      if (!data?.ok) {
        const errorMsg = data?.error || 'Unknown error';
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
        trackEvent('HighIntentUser', {
          total_score,
          level_label,
          triggered_by: eventType,
        });
        console.log('🎯 HIGH INTENT USER DETECTED (server-confirmed):', total_score);
      }

      if (qualified_reached_now) {
        trackEvent('QualifiedProspect', {
          total_score,
          level_label,
          triggered_by: eventType,
        });
        console.log('🏆 QUALIFIED PROSPECT (server-confirmed):', total_score);
      }

      // Always log the engagement delta for analytics
      if (inserted) {
        trackEvent('engagement_score', {
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
