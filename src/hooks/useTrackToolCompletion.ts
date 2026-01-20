/**
 * Unified Tool Tracking Hook
 * 
 * Centralizes the logic for tracking tool completions with value-based bidding.
 * Automatically pulls user data from session for Enhanced Conversions.
 * 
 * EXPERT-GRADE FEATURES:
 * 1. Two-Step Pattern: Value-only event immediately, Enhanced Match after email capture
 * 2. Cumulative Score: Included for debugging without double-counting
 * 3. Auto Identity Fetch: Always gets latest email/phone from session
 * 
 * Usage:
 * ```tsx
 * const { trackToolComplete, trackEnhancedMatch } = useTrackToolCompletion();
 * 
 * // After successful tool completion (value-only if no email):
 * trackToolComplete('quote-scanner', { quote_amount: 15000 });
 * 
 * // After email capture (links identity to previous value event):
 * trackEnhancedMatch('quote-scanner');
 * ```
 */

import { useCallback } from 'react';
import { useSessionData } from './useSessionData';
import { trackConversionValue } from '@/lib/gtm';
import { getToolDeltaConfig } from '@/config/toolDeltaValues';
import { getEngagementScore } from '@/services/analytics';
import type { ToolCompletionMetadata } from '@/types/tracking';
import type { SourceTool } from '@/types/sourceTool';

interface UseTrackToolCompletionReturn {
  /**
   * Track a tool completion event with automatic delta value lookup
   * and Enhanced Conversions user data injection.
   * 
   * Fires a "value_only" event if no email in session, or "full" event with PII.
   */
  trackToolComplete: (toolId: SourceTool, metadata?: ToolCompletionMetadata) => void;
  
  /**
   * Fire an "Enhanced Match" event AFTER email capture for gated tools.
   * Links identity to the previous value-only event without adding delta points.
   */
  trackEnhancedMatch: (toolId: SourceTool) => void;
  
  /**
   * Check if a tool has already been tracked this session
   * (useful for preventing duplicate tracking)
   */
  isToolTracked: (toolId: SourceTool) => boolean;
}

export function useTrackToolCompletion(): UseTrackToolCompletionReturn {
  const { sessionData, markToolCompleted, isToolCompleted } = useSessionData();

  /**
   * STEP 1: Fire "Value Only" or "Full" event based on email presence
   * This is the primary tracking call made immediately upon tool completion
   */
  const trackToolComplete = useCallback((
    toolId: SourceTool,
    metadata?: ToolCompletionMetadata
  ) => {
    // Get the delta config for this tool
    const config = getToolDeltaConfig(toolId);
    
    // AUTO-FETCH: Always get the latest from session state
    const email = sessionData.email;
    const phone = sessionData.phone;
    
    // Get cumulative engagement score for debugging (prevents double-counting confusion)
    const cumulativeScore = getEngagementScore();
    
    // Determine tracking step based on email presence
    const trackingStep = email ? 'full' : 'value_only';
    
    // Fire the conversion value event with full context
    trackConversionValue({
      eventName: config.eventName,
      value: config.deltaValue,
      email,
      phone,
      cumulativeScore,
      metadata: {
        tool_id: toolId,
        session_id: sessionData.leadId || 'anonymous',
        tracking_step: trackingStep,
        ...metadata,
      },
    });
    
    // Mark tool as completed in session (for UX purposes)
    markToolCompleted(toolId);
    
    // DEV LOGGING: Enhanced visibility
    if (import.meta.env.DEV) {
      console.log(
        `%c[Tool Complete] ${toolId}`,
        'color: #3b82f6; font-weight: bold',
        {
          delta: config.deltaValue,
          cumulative: cumulativeScore,
          step: trackingStep,
          hasEmail: !!email,
          hasPhone: !!phone,
          metadata,
        }
      );
    }
  }, [sessionData.email, sessionData.phone, sessionData.leadId, markToolCompleted]);

  /**
   * STEP 2: Fire "Enhanced Match" event AFTER email capture
   * Links identity to the previous value-only event for gated tools.
   * Does NOT add additional delta points - just links identity.
   */
  const trackEnhancedMatch = useCallback((toolId: SourceTool) => {
    const email = sessionData.email;
    const phone = sessionData.phone;
    
    if (!email) {
      if (import.meta.env.DEV) {
        console.warn('[TrackEnhancedMatch] No email in session, skipping');
      }
      return;
    }
    
    // Get cumulative score for debugging
    const cumulativeScore = getEngagementScore();
    
    // Fire identity linking event (no additional delta value)
    trackConversionValue({
      eventName: 'enhanced_match',
      value: 0, // No additional delta, just linking identity
      email,
      phone,
      cumulativeScore,
      metadata: {
        tool_id: toolId,
        session_id: sessionData.leadId,
        tracking_step: 'enhanced_match',
      },
    });
    
    // DEV LOGGING: Enhanced Match visibility
    if (import.meta.env.DEV) {
      console.log(
        `%c[Enhanced Match] ${toolId}`,
        'color: #a855f7; font-weight: bold',
        { 
          email: email.slice(0, 3) + '***', 
          hasPhone: !!phone,
          cumulative: cumulativeScore,
        }
      );
    }
  }, [sessionData.email, sessionData.phone, sessionData.leadId]);

  const isToolTracked = useCallback((toolId: SourceTool): boolean => {
    return isToolCompleted(toolId);
  }, [isToolCompleted]);

  return {
    trackToolComplete,
    trackEnhancedMatch,
    isToolTracked,
  };
}
