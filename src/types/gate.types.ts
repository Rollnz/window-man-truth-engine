/**
 * Type definitions for Progressive Hardening gate system
 * 
 * The progressive gate implements a 3-level escalation:
 * - soft: X button visible, ESC/overlay allowed (initial state)
 * - medium: X hidden, ESC/overlay trigger warning toast
 * - hard: Fully locked, submit-only exit
 */

export type GateLockLevel = 'soft' | 'medium' | 'hard';

export interface GateAttemptMetrics {
  attemptNumber: number;
  lockLevel: GateLockLevel;
  timeSpentMs: number;
  previousAttempts: number;
}

export interface GateAnalytics {
  event: 'gate_view' | 'gate_close_attempt' | 'gate_complete' | 'gate_error';
  data: {
    lead_id?: string;
    lock_level?: GateLockLevel;
    attempt_number?: number;
    time_to_complete_ms?: number;
    referrer?: string;
    utm_source?: string | null;
    error_message?: string;
  };
}

export interface UseProgressiveGateConfig {
  /** Starting lock level (defaults to 'soft') */
  initialLockLevel?: GateLockLevel;
  /** Called when lead capture completes successfully */
  onComplete?: (leadId: string) => void;
  /** Called if user escapes on first attempt (soft mode only) */
  onFinalEscape?: () => void;
}

export interface UseProgressiveGateReturn {
  /** Current lock level */
  lockLevel: GateLockLevel;
  /** Number of close attempts */
  attemptCount: number;
  /** Call when user attempts to close (ESC/overlay/X) */
  handleCloseAttempt: () => void;
  /** Call when form submission succeeds */
  handleComplete: (leadId: string) => void;
  /** Get current metrics for analytics */
  getAttemptMetrics: () => GateAttemptMetrics;
  /** Reset gate to initial state */
  resetGate: () => void;
}
