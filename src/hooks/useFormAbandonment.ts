/**
 * Form Abandonment Tracking Hook
 * Tracks when users enter data but don't submit within a timeout period
 * Fires form_abandonment event to GTM for CRO analysis
 */

import { useRef, useCallback, useEffect } from 'react';
import { trackFormAbandonment } from '@/lib/gtm';

interface UseFormAbandonmentOptions {
  formId: string;
  sourceTool: string;
  /** Timeout in ms before tracking abandonment (default: 60000 = 60 seconds) */
  abandonmentTimeoutMs?: number;
  /** Whether the form has been submitted successfully */
  isSubmitted?: boolean;
}

interface FieldTracker {
  [fieldName: string]: boolean;
}

/**
 * Hook to track form field interactions and fire abandonment events
 * 
 * Usage:
 * ```tsx
 * const { trackFieldEntry, resetTracking } = useFormAbandonment({
 *   formId: 'lead_capture',
 *   sourceTool: 'quote-scanner',
 *   isSubmitted,
 * });
 * 
 * <Input onBlur={() => trackFieldEntry('email')} />
 * ```
 */
export function useFormAbandonment({
  formId,
  sourceTool,
  abandonmentTimeoutMs = 60000,
  isSubmitted = false,
}: UseFormAbandonmentOptions) {
  const fieldsEntered = useRef<FieldTracker>({});
  const formStartTime = useRef<number | null>(null);
  const abandonmentTimer = useRef<NodeJS.Timeout | null>(null);
  const hasFiredAbandonment = useRef(false);
  
  // Clear any existing timer
  const clearTimer = useCallback(() => {
    if (abandonmentTimer.current) {
      clearTimeout(abandonmentTimer.current);
      abandonmentTimer.current = null;
    }
  }, []);
  
  // Fire abandonment event
  const fireAbandonment = useCallback(() => {
    if (hasFiredAbandonment.current || isSubmitted) return;
    
    const enteredFields = Object.entries(fieldsEntered.current)
      .filter(([_, entered]) => entered)
      .map(([fieldName]) => fieldName);
    
    // Only fire if user actually entered data
    if (enteredFields.length === 0) return;
    
    const timeOnForm = formStartTime.current 
      ? Date.now() - formStartTime.current 
      : 0;
    
    trackFormAbandonment({
      formId,
      sourceTool,
      fieldsEntered: enteredFields,
      timeOnFormMs: timeOnForm,
    });
    
    hasFiredAbandonment.current = true;
  }, [formId, sourceTool, isSubmitted]);
  
  // Start/reset the abandonment timer
  const resetTimer = useCallback(() => {
    clearTimer();
    abandonmentTimer.current = setTimeout(() => {
      fireAbandonment();
    }, abandonmentTimeoutMs);
  }, [clearTimer, fireAbandonment, abandonmentTimeoutMs]);
  
  // Track when a field receives data
  const trackFieldEntry = useCallback((fieldName: string) => {
    // Start tracking form time on first interaction
    if (!formStartTime.current) {
      formStartTime.current = Date.now();
    }
    
    fieldsEntered.current[fieldName] = true;
    
    // Reset the abandonment timer each time user interacts
    resetTimer();
  }, [resetTimer]);
  
  // Reset all tracking state
  const resetTracking = useCallback(() => {
    clearTimer();
    fieldsEntered.current = {};
    formStartTime.current = null;
    hasFiredAbandonment.current = false;
  }, [clearTimer]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      // Fire abandonment on unmount if user navigated away
      if (!isSubmitted && !hasFiredAbandonment.current) {
        fireAbandonment();
      }
    };
  }, [clearTimer, fireAbandonment, isSubmitted]);
  
  // Clear timer and reset if form was submitted
  useEffect(() => {
    if (isSubmitted) {
      clearTimer();
      hasFiredAbandonment.current = true; // Prevent abandonment fire
    }
  }, [isSubmitted, clearTimer]);
  
  return {
    /** Call this onBlur for each form field */
    trackFieldEntry,
    /** Reset tracking state (e.g., when modal closes without submit) */
    resetTracking,
    /** Current fields that have been entered */
    getFieldsEntered: () => Object.keys(fieldsEntered.current).filter(k => fieldsEntered.current[k]),
  };
}
