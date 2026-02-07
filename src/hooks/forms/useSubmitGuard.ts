import { useState, useCallback, useRef } from 'react';

/**
 * @deprecated Use `useFormLock` instead. This hook has race condition vulnerabilities.
 * 
 * useSubmitGuard - Prevents double form submissions
 * 
 * MIGRATION GUIDE:
 * ```typescript
 * // Before (useSubmitGuard)
 * const { isSubmitting, guardedSubmit } = useSubmitGuard();
 * await guardedSubmit(handleSubmit);
 * 
 * // After (useFormLock) - recommended
 * const { isLocked, lockAndExecute } = useFormLock();
 * await lockAndExecute(handleSubmit);
 * ```
 * 
 * Features:
 * - Disables submit button after first click
 * - Shows loading state
 * - Auto-resets after success/failure
 * - Configurable timeout for auto-reset
 * 
 * @example
 * const { isSubmitting, guardedSubmit, reset } = useSubmitGuard();
 * 
 * <Button disabled={isSubmitting} onClick={() => guardedSubmit(handleSubmit)}>
 *   {isSubmitting ? <Loader2 className="animate-spin" /> : "Submit"}
 * </Button>
 */

interface UseSubmitGuardOptions {
  /** Auto-reset after this many milliseconds (0 = no auto-reset) */
  autoResetMs?: number;
  /** Callback when submission is blocked due to already submitting */
  onBlocked?: () => void;
}

interface UseSubmitGuardReturn {
  /** Whether a submission is currently in progress */
  isSubmitting: boolean;
  /** Wrap your submit handler with this to guard against double-submits */
  guardedSubmit: <T>(handler: () => Promise<T>) => Promise<T | undefined>;
  /** Manually reset the guard (e.g., on form reset) */
  reset: () => void;
}

export function useSubmitGuard({
  autoResetMs = 30000, // 30 second auto-reset by default
  onBlocked,
}: UseSubmitGuardOptions = {}): UseSubmitGuardReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    setIsSubmitting(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const guardedSubmit = useCallback(
    async <T>(handler: () => Promise<T>): Promise<T | undefined> => {
      // Block if already submitting
      if (isSubmitting) {
        onBlocked?.();
        return undefined;
      }

      setIsSubmitting(true);

      // Set auto-reset timeout
      if (autoResetMs > 0) {
        timeoutRef.current = setTimeout(() => {
          console.warn('[useSubmitGuard] Auto-reset triggered after timeout');
          reset();
        }, autoResetMs);
      }

      try {
        const result = await handler();
        // Don't auto-reset on success - let parent component control this
        // for showing success states
        return result;
      } catch (error) {
        // Reset on error so user can retry
        reset();
        throw error;
      }
    },
    [isSubmitting, autoResetMs, onBlocked, reset]
  );

  return {
    isSubmitting,
    guardedSubmit,
    reset,
  };
}
