/**
 * Unified Tool Tracking Hook
 * 
 * Centralizes the logic for tracking tool completions with value-based bidding.
 * Automatically pulls user data from session for Enhanced Conversions.
 * 
 * Usage:
 * ```tsx
 * const { trackToolComplete } = useTrackToolCompletion();
 * 
 * // After successful tool completion:
 * trackToolComplete('quote-scanner', { quote_amount: 15000 });
 * ```
 */

import { useCallback } from 'react';
import { useSessionData } from './useSessionData';
import { trackConversionValue } from '@/lib/gtm';
import { getToolDeltaConfig } from '@/config/toolDeltaValues';
import type { ToolCompletionMetadata } from '@/types/tracking';
import type { SourceTool } from '@/types/sourceTool';

interface UseTrackToolCompletionReturn {
  /**
   * Track a tool completion event with automatic delta value lookup
   * and Enhanced Conversions user data injection.
   */
  trackToolComplete: (toolId: SourceTool, metadata?: ToolCompletionMetadata) => void;
  
  /**
   * Check if a tool has already been tracked this session
   * (useful for preventing duplicate tracking)
   */
  isToolTracked: (toolId: SourceTool) => boolean;
}

export function useTrackToolCompletion(): UseTrackToolCompletionReturn {
  const { sessionData, markToolCompleted, isToolCompleted } = useSessionData();

  const trackToolComplete = useCallback((
    toolId: SourceTool,
    metadata?: ToolCompletionMetadata
  ) => {
    // Get the delta config for this tool
    const config = getToolDeltaConfig(toolId);
    
    // Extract user data from session for Enhanced Conversions
    const email = sessionData.email;
    const phone = sessionData.phone;
    
    // Fire the conversion value event
    trackConversionValue({
      eventName: config.eventName,
      value: config.deltaValue,
      email,
      phone,
      metadata: {
        tool_id: toolId,
        ...metadata,
      },
    });
    
    // Mark tool as completed in session (for UX purposes)
    markToolCompleted(toolId);
    
    // Log for debugging in development
    if (import.meta.env.DEV) {
      console.log(`[TrackToolComplete] ${toolId}`, {
        eventName: config.eventName,
        deltaValue: config.deltaValue,
        hasEmail: !!email,
        hasPhone: !!phone,
        metadata,
      });
    }
  }, [sessionData.email, sessionData.phone, markToolCompleted]);

  const isToolTracked = useCallback((toolId: SourceTool): boolean => {
    return isToolCompleted(toolId);
  }, [isToolCompleted]);

  return {
    trackToolComplete,
    isToolTracked,
  };
}
