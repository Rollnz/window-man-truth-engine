import { useState, useRef, useCallback, useEffect } from 'react';
import { trackEvent } from '@/lib/gtm';
import { toast } from 'sonner';
import type { 
  GateLockLevel, 
  GateAttemptMetrics, 
  UseProgressiveGateConfig, 
  UseProgressiveGateReturn 
} from '@/types/gate.types';

/**
 * Progressive Hardening Gate Logic
 * 
 * Implements a 3-level escalation system that balances user autonomy
 * with conversion optimization. Each attempt progressively restricts
 * escape paths while maintaining brand alignment.
 * 
 * @example
 * const { lockLevel, handleCloseAttempt } = useProgressiveGate({
 *   onComplete: (leadId) => console.log('Lead captured:', leadId)
 * });
 */
export function useProgressiveGate(
  config: UseProgressiveGateConfig = {}
): UseProgressiveGateReturn {
  const {
    initialLockLevel = 'soft',
    onComplete,
    onFinalEscape
  } = config;

  const [lockLevel, setLockLevel] = useState<GateLockLevel>(initialLockLevel);
  const [attemptCount, setAttemptCount] = useState(0);
  
  const gateOpenTimeRef = useRef<number>(Date.now());
  const hasTrackedViewRef = useRef(false);

  // Track initial gate view (once per mount)
  useEffect(() => {
    if (!hasTrackedViewRef.current) {
      hasTrackedViewRef.current = true;
      gateOpenTimeRef.current = Date.now();
      trackEvent('sample_report_gate_view', {
        lock_level: lockLevel,
        referrer: document.referrer || 'direct',
        utm_source: new URLSearchParams(window.location.search).get('utm_source')
      });
    }
  }, []);

  /**
   * Progressive escalation logic
   * Attempt 0 (first close): soft → medium (escalate, prevent close)
   * Attempt 1 (second close): medium → hard (escalate, prevent close)
   * Attempt 2+: hard (stay locked, prevent close)
   */
  const handleCloseAttempt = useCallback(() => {
    const newAttemptCount = attemptCount + 1;
    const timeSpent = Date.now() - gateOpenTimeRef.current;

    setAttemptCount(newAttemptCount);

    // Track escape attempt
    trackEvent('sample_report_gate_close_attempt', {
      attempt_number: newAttemptCount,
      lock_level: lockLevel,
      time_spent_ms: timeSpent
    });

    // Level soft → medium: First escalation
    if (lockLevel === 'soft') {
      setLockLevel('medium');
      toast.info(
        'Just need your email to send you this full report',
        { 
          duration: 4000,
          description: 'Takes 30 seconds. 100% free.'
        }
      );
      return; // Don't allow escape
    }

    // Level medium → hard: Second escalation
    if (lockLevel === 'medium') {
      setLockLevel('hard');
      toast.warning(
        'Complete the form to access the report',
        {
          duration: 5000,
          description: 'We respect your time. This helps us send you the analysis.'
        }
      );
      return; // Don't allow escape
    }

    // Level hard: Stay locked
    if (lockLevel === 'hard') {
      toast.error('Submit the form to continue', { duration: 3000 });
      return;
    }
  }, [attemptCount, lockLevel]);

  /**
   * Handle successful form completion
   * Tracks conversion metrics and fires callback
   */
  const handleComplete = useCallback((leadId: string) => {
    const timeToComplete = Date.now() - gateOpenTimeRef.current;

    trackEvent('sample_report_gate_complete', {
      lead_id: leadId,
      time_to_complete_ms: timeToComplete,
      attempt_count: attemptCount,
      final_lock_level: lockLevel
    });

    onComplete?.(leadId);
  }, [attemptCount, lockLevel, onComplete]);

  /**
   * Get current attempt metrics for analytics/debugging
   */
  const getAttemptMetrics = useCallback((): GateAttemptMetrics => ({
    attemptNumber: attemptCount,
    lockLevel,
    timeSpentMs: Date.now() - gateOpenTimeRef.current,
    previousAttempts: attemptCount
  }), [attemptCount, lockLevel]);

  /**
   * Reset gate state (useful for testing/retry flows)
   */
  const resetGate = useCallback(() => {
    setLockLevel(initialLockLevel);
    setAttemptCount(0);
    gateOpenTimeRef.current = Date.now();
    hasTrackedViewRef.current = false;
  }, [initialLockLevel]);

  return {
    lockLevel,
    attemptCount,
    handleCloseAttempt,
    handleComplete,
    getAttemptMetrics,
    resetGate
  };
}
