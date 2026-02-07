import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useFormLock - Production-grade form submission protection
 * 
 * Implements a "lockout" pattern (NOT debounce) for lead capture forms:
 * - Leading Edge Execution: Fires immediately on first click
 * - Promise Awareness: Lock held until async operation settles
 * - Exception Safety: finally block guarantees unlock even on errors
 * - Unmount Safety: Checks isMounted before state updates
 * - Anti-Flicker: Minimum loading duration prevents UI jitter
 * - Idempotency: Generates UUID for network deduplication
 * 
 * @example
 * const { isLocked, idempotencyKey, lockAndExecute } = useFormLock();
 * 
 * const handleSubmit = async (e: React.FormEvent) => {
 *   e.preventDefault();
 *   if (!validateAll()) return;
 *   
 *   await lockAndExecute(async () => {
 *     await fetch('/api/lead', {
 *       headers: { 'Idempotency-Key': idempotencyKey || '' },
 *       body: JSON.stringify(data),
 *     });
 *   });
 * };
 * 
 * <Button disabled={isLocked}>Submit</Button>
 */

interface UseFormLockOptions {
  /** Minimum time to show loading state (prevents flicker) - default: 500ms */
  minLoadingMs?: number;
  /** Generate idempotency key for network protection - default: true */
  enableIdempotency?: boolean;
  /** Callback when submission is blocked due to lock */
  onBlocked?: () => void;
}

interface UseFormLockReturn {
  /** Whether form is locked (use for button disabled state) */
  isLocked: boolean;
  /** Current idempotency key (send in request headers) */
  idempotencyKey: string | null;
  /** Wrap async handler - executes immediately, blocks subsequent calls */
  lockAndExecute: <T>(handler: () => Promise<T>) => Promise<T | undefined>;
  /** Manual unlock (rarely needed - handled automatically) */
  unlock: () => void;
}

const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

export function useFormLock({
  minLoadingMs = 500,
  enableIdempotency = true,
  onBlocked,
}: UseFormLockOptions = {}): UseFormLockReturn {
  const [isLocked, setIsLocked] = useState(false);
  
  // Synchronous lock ref - prevents race conditions with React batching
  const isLockedRef = useRef(false);
  
  // Unmount safety - prevents setState after component unmounts
  const isMountedRef = useRef(true);
  
  // Idempotency key for current submission
  const idempotencyKeyRef = useRef<string | null>(null);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const unlock = useCallback(() => {
    isLockedRef.current = false;
    if (isMountedRef.current) {
      setIsLocked(false);
    }
    idempotencyKeyRef.current = null;
  }, []);

  const lockAndExecute = useCallback(
    async <T>(handler: () => Promise<T>): Promise<T | undefined> => {
      // ========================================
      // IMMEDIATE SYNCHRONOUS GUARD
      // This check happens BEFORE React can batch
      // ========================================
      if (isLockedRef.current) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[useFormLock] Blocked duplicate submission');
        }
        onBlocked?.();
        return undefined;
      }

      // ========================================
      // ENGAGE LOCK
      // ========================================
      isLockedRef.current = true;
      if (isMountedRef.current) {
        setIsLocked(true);
      }

      // Generate idempotency key for this submission
      if (enableIdempotency) {
        idempotencyKeyRef.current = crypto.randomUUID();
      }

      try {
        // ========================================
        // EXECUTE WITH MINIMUM LOADING DURATION
        // Prevents UI flicker on fast networks
        // ========================================
        const [result] = await Promise.all([
          handler(),
          minLoadingMs > 0 ? sleep(minLoadingMs) : Promise.resolve(),
        ]);

        return result;
      } catch (error) {
        // ========================================
        // AUTO-UNLOCK ON ERROR
        // User can retry after fixing their input
        // ========================================
        unlock();
        throw error;
      }
      // NOTE: We do NOT unlock on success by default.
      // This allows the parent to show success state before
      // navigating away. Parent can call unlock() if needed.
    },
    [minLoadingMs, enableIdempotency, onBlocked, unlock]
  );

  return {
    isLocked,
    idempotencyKey: idempotencyKeyRef.current,
    lockAndExecute,
    unlock,
  };
}
