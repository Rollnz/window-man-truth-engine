/**
 * Unified Tool Tracking Hook
 * 
 * Centralizes the logic for tracking tool completions with value-based bidding.
 * Automatically pulls user data from session for Enhanced Conversions.
 * 
 * EXPERT-GRADE FEATURES:
 * 1. Event Deduplication: Each tool fires only once per session
 * 2. Two-Step Pattern: Value-only event immediately, Enhanced Match after email capture
 * 3. Cumulative Score: Included for debugging without double-counting
 * 4. Auto Identity Fetch: Always gets latest email/phone from session
 * 5. E.164 Phone Normalization: Proper format for Enhanced Conversions
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
import { wmRetarget } from '@/lib/wmTracking';
import { getToolDeltaConfig } from '@/config/toolDeltaValues';
import { getEngagementScore } from '@/services/analytics';
import { createToolEventId, isToolEventTracked, markToolEventTracked } from '@/lib/eventDeduplication';
import type { ToolCompletionMetadata } from '@/types/tracking';
import type { SourceTool } from '@/types/sourceTool';

interface UseTrackToolCompletionReturn {
  /**
   * Track a tool completion event with automatic delta value lookup
   * and Enhanced Conversions user data injection.
   * 
   * Fires a "value_only" event if no email in session, or "full" event with PII.
   * 
   * DEDUPLICATION: Each tool fires only once per session unless forced.
   */
  trackToolComplete: (toolId: SourceTool, metadata?: ToolCompletionMetadata, force?: boolean) => void;
  
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
   * 
   * DEDUPLICATION: Uses session-based event ID to prevent double-fires
   */
  const trackToolComplete = useCallback((
    toolId: SourceTool,
    metadata?: ToolCompletionMetadata,
    force: boolean = false
  ) => {
    // DEDUPLICATION: Check if already tracked this session
    if (!force && isToolEventTracked(toolId, 'completed')) {
      if (import.meta.env.DEV) {
        console.log(`%c[Tool] ${toolId} already tracked this session`, 'color: #f59e0b');
      }
      return;
    }
    
    // Get the delta config for this tool
    const config = getToolDeltaConfig(toolId);
    
    // AUTO-FETCH: Always get the latest from session state
    const email = sessionData.email;
    const phone = sessionData.phone;
    
    // Get cumulative engagement score for debugging (prevents double-counting confusion)
    const cumulativeScore = getEngagementScore();
    
    // Determine tracking step based on email presence
    const trackingStep = email ? 'full' : 'value_only';
    
    // Create deterministic event ID for this tool completion
    const eventId = createToolEventId(toolId, 'completed');
    
    // Fire retargeting event (no value/currency — audience building only)
    wmRetarget(config.eventName, {
      lead_id: sessionData.leadId,
      source_tool: toolId,
      tool_id: toolId,
      tool_version: '1.0',
      tracking_step: trackingStep,
      score_snapshot: cumulativeScore,
      ...metadata,
    } as Record<string, unknown>);
    
    // Mark as tracked in deduplication system
    markToolEventTracked(toolId, 'completed');
    
    // Mark tool as completed in session (for UX purposes)
    markToolCompleted(toolId);
    
    // DEV LOGGING: Enhanced visibility
    if (import.meta.env.DEV) {
      console.log(
        `%c[Tool Complete] ${toolId}`,
        'color: #3b82f6; font-weight: bold',
        {
          tier: config.tier,
          cumulative: cumulativeScore,
          step: trackingStep,
          hasEmail: !!email,
          hasPhone: !!phone,
          eventId: eventId.slice(0, 8) + '...',
          metadata,
        }
      );
    }
  }, [sessionData.email, sessionData.phone, sessionData.leadId, markToolCompleted]);

  /**
   * STEP 2: Fire "Enhanced Match" event AFTER email capture
   * Links identity to the previous value-only event for gated tools.
   * Does NOT add additional delta points - just links identity.
   * 
   * DEDUPLICATION: Fires only once per tool per session
   */
  const trackEnhancedMatch = useCallback((toolId: SourceTool) => {
    // DEDUPLICATION: Check if enhanced match already fired
    if (isToolEventTracked(toolId, 'enhanced_match')) {
      if (import.meta.env.DEV) {
        console.log(`%c[Enhanced Match] ${toolId} already tracked`, 'color: #f59e0b');
      }
      return;
    }
    
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
    
    // Create deterministic event ID
    const eventId = createToolEventId(toolId, 'enhanced_match');
    
    // Fire identity linking event (retargeting — no value/currency)
    wmRetarget('enhanced_match', {
      lead_id: sessionData.leadId,
      source_tool: toolId,
      tool_id: toolId,
      tracking_step: 'enhanced_match',
    } as Record<string, unknown>);
    
    // Mark as tracked
    markToolEventTracked(toolId, 'enhanced_match');
    
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
    return isToolCompleted(toolId) || isToolEventTracked(toolId, 'completed');
  }, [isToolCompleted]);

  return {
    trackToolComplete,
    trackEnhancedMatch,
    isToolTracked,
  };
}
