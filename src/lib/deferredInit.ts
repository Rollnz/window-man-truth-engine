/**
 * Deferred Initialization Utility
 * 
 * Schedules non-critical operations to run during browser idle time,
 * improving Core Web Vitals by keeping the main thread clear during initial render.
 * 
 * @see .lovable/plan.md for performance optimization context
 */

interface ScheduleOptions {
  /** Minimum delay before attempting idle callback (default: 3000ms) */
  minDelay?: number;
  /** Maximum wait time for idle callback before forcing execution (default: 5000ms) */
  timeout?: number;
}

/**
 * Schedule a function to run during browser idle time.
 * 
 * Pattern:
 * 1. Wait for minDelay (default 3s) to let initial render complete
 * 2. Use requestIdleCallback if available (Chrome, Edge, Firefox)
 * 3. Fall back to setTimeout for Safari
 * 
 * @param fn - Function to execute during idle time
 * @param options - Configuration options
 * @returns Cleanup function to cancel scheduled execution
 */
export function scheduleWhenIdle(
  fn: () => void,
  options: ScheduleOptions = {}
): () => void {
  const { minDelay = 3000, timeout = 5000 } = options;
  
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let idleCallbackId: number | null = null;
  let executed = false;
  
  const execute = () => {
    if (executed) return;
    executed = true;
    
    if ('requestIdleCallback' in window) {
      idleCallbackId = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(fn, { timeout });
    } else {
      // Safari fallback - execute immediately after minDelay
      fn();
    }
  };
  
  if (minDelay > 0) {
    timeoutId = setTimeout(execute, minDelay);
  } else {
    execute();
  }
  
  // Return cleanup function
  return () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    if (idleCallbackId !== null && 'cancelIdleCallback' in window) {
      (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleCallbackId);
    }
  };
}

/**
 * Track whether core tracking systems have been initialized.
 * Used by early tracking calls to queue events if needed.
 */
let trackingInitialized = false;

export const isTrackingReady = (): boolean => trackingInitialized;
export const markTrackingReady = (): void => { trackingInitialized = true; };
