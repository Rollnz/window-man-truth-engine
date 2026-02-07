
# Lazy Load Tracking Scripts — Performance Optimization Plan

## Problem Analysis

The current implementation runs multiple tracking operations **synchronously on page load**, creating a main thread traffic jam that degrades mobile performance (currently ~40% score):

### Current Execution Timeline (main.tsx)
```text
Page Load
    │
    ├── pushBotSignalToDataLayer() ← BLOCKS RENDER (synchronous)
    │       └── 10+ checks (webdriver, UA parsing, plugins, languages...)
    │
    ├── installTruthEngine() ← BLOCKS RENDER (synchronous)
    │
    ├── reconcileIdentities() ← BLOCKS RENDER (synchronous)
    │       └── localStorage reads, cookie parsing, cookie writes
    │
    └── createRoot().render()
            │
            ├── App.tsx → AppContent()
            │       ├── usePageTimer() ← Sets 2-minute timer immediately
            │       └── useSessionSync() ← Database calls on auth
            │
            └── Index.tsx (or other page)
                    └── usePageTracking() ← Immediate trackEvent calls
```

**Impact on Core Web Vitals:**
- **TBT (Total Blocking Time)**: Bot detection loops through 10+ checks synchronously
- **INP (Interaction to Next Paint)**: Heavy event listeners for scroll tracking
- **FCP/LCP**: Main thread busy with tracking before first paint

---

## Solution: Deferred Initialization Pattern

Refactor all non-critical tracking to use a **"Lazy Initialization"** pattern:
1. Render the page content immediately (user sees content)
2. Wait 3-5 seconds (or use `requestIdleCallback`)
3. Initialize tracking systems during browser idle time

### Target Improvements
| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Mobile Performance | ~40% | 60%+ | +20 points |
| TBT | High | < 200ms | Significant reduction |
| INP | Elevated | < 200ms | Reduced event listener overhead |

---

## Implementation Phases

### Phase 1: Defer Bot Detection in main.tsx

**Current (Blocks Render):**
```typescript
// Line 12 - Runs synchronously BEFORE render
pushBotSignalToDataLayer();
```

**Refactored (Deferred):**
```typescript
// Defer bot detection to idle time
const scheduleBotDetection = () => {
  const delay = 3000; // 3 seconds after load
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => pushBotSignalToDataLayer(), { timeout: delay + 2000 });
  } else {
    setTimeout(pushBotSignalToDataLayer, delay);
  }
};
scheduleBotDetection();
```

**Why 3 seconds?** Bot detection doesn't affect user experience — bots don't care about UX. We only need the signal before conversion events fire, which typically happen much later.

---

### Phase 2: Defer Identity Reconciliation

**Current (Blocks Render):**
```typescript
// Line 20-21 - Synchronous localStorage + cookie operations
const goldenThreadFID = reconcileIdentities();
console.log(`[Golden Thread] Active FID: ${goldenThreadFID}`);
```

**Refactored (Deferred with Lazy Getter):**
```typescript
// Immediately export a lazy getter that initializes on first access
let cachedGoldenThreadId: string | null = null;

const scheduleReconciliation = () => {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      cachedGoldenThreadId = reconcileIdentities();
      console.log(`[Golden Thread] Active FID: ${cachedGoldenThreadId}`);
    }, { timeout: 2000 });
  } else {
    setTimeout(() => {
      cachedGoldenThreadId = reconcileIdentities();
      console.log(`[Golden Thread] Active FID: ${cachedGoldenThreadId}`);
    }, 1);
  }
};
scheduleReconciliation();
```

**Safety Note:** The identity system already has lazy getters (`getGoldenThreadId()`), so early tracking calls will still work correctly.

---

### Phase 3: Create Deferred Tracker Utility

**Create: `src/lib/deferredInit.ts`**

A reusable utility for all tracking initialization:

```typescript
/**
 * Schedule non-critical initialization to browser idle time.
 * 
 * @param fn - Function to execute
 * @param options - Configuration options
 */
export function scheduleWhenIdle(
  fn: () => void,
  options: { 
    minDelay?: number;  // Minimum wait (ms) - default: 3000
    timeout?: number;   // Max wait for idle callback - default: 5000
  } = {}
): void {
  const { minDelay = 3000, timeout = 5000 } = options;
  
  if (typeof window === 'undefined') return;
  
  const execute = () => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(fn, { timeout });
    } else {
      fn();
    }
  };
  
  if (minDelay > 0) {
    setTimeout(execute, minDelay);
  } else {
    execute();
  }
}

/**
 * Check if tracking has been initialized
 */
let trackingInitialized = false;
export const isTrackingReady = () => trackingInitialized;
export const markTrackingReady = () => { trackingInitialized = true; };
```

---

### Phase 4: Defer usePageTimer Hook

**Current (Immediate Setup):**
```typescript
useEffect(() => {
  const TWO_MINUTES = 2 * 60 * 1000;
  const timer = setTimeout(() => { ... }, TWO_MINUTES);
  return () => clearTimeout(timer);
}, []);
```

**Refactored (Delayed Setup):**
```typescript
import { scheduleWhenIdle } from '@/lib/deferredInit';

useEffect(() => {
  // Defer timer setup by 3 seconds
  let timer: NodeJS.Timeout | null = null;
  
  scheduleWhenIdle(() => {
    // Check if already fired this session
    try {
      if (sessionStorage.getItem(TIMER_FIRED_KEY)) {
        firedRef.current = true;
        return;
      }
    } catch { /* Ignore */ }
    
    const TWO_MINUTES = 2 * 60 * 1000;
    timer = setTimeout(() => { ... }, TWO_MINUTES);
  }, { minDelay: 3000 });
  
  return () => {
    if (timer) clearTimeout(timer);
  };
}, []);
```

---

### Phase 5: Defer usePageTracking Hook

**Current:**
```typescript
useEffect(() => {
  trackPageView(path);
  trackEvent('tool_page_view', { ... });
}, []); // Fire once on mount
```

**Refactored:**
```typescript
import { scheduleWhenIdle } from '@/lib/deferredInit';

useEffect(() => {
  // Defer page tracking to idle time
  scheduleWhenIdle(() => {
    trackPageView(path);
    trackEvent('tool_page_view', {
      tool_name: toolName,
      page_path: path,
      referrer: document.referrer || 'direct',
    });
  }, { minDelay: 500 }); // Small delay for page views
}, []);
```

---

### Phase 6: Defer useSessionSync Database Calls

**Current:**
```typescript
// Line 71 - Database sync on auth with 500ms debounce
const timer = setTimeout(syncSession, 500);
```

**Refactored:**
```typescript
// Increase debounce to 2000ms and use idle callback
scheduleWhenIdle(syncSession, { minDelay: 2000 });
```

---

### Phase 7: Optimize ExitIntentModal Scroll Tracking

**Current (Always Active):**
```typescript
useEffect(() => {
  const handleScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const currentScrollDepth = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
    maxScrollDepthRef.current = Math.max(maxScrollDepthRef.current, currentScrollDepth);
    lastScrollYRef.current = window.scrollY;
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

**Refactored (Throttled + Deferred):**
```typescript
import { scheduleWhenIdle } from '@/lib/deferredInit';

useEffect(() => {
  let rafId: number | null = null;
  
  const handleScroll = () => {
    // RAF-throttle scroll handler for performance
    if (rafId !== null) return;
    
    rafId = requestAnimationFrame(() => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScrollDepth = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
      maxScrollDepthRef.current = Math.max(maxScrollDepthRef.current, currentScrollDepth);
      lastScrollYRef.current = window.scrollY;
      rafId = null;
    });
  };
  
  // Defer scroll listener setup
  let cleanup: (() => void) | null = null;
  
  scheduleWhenIdle(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    cleanup = () => window.removeEventListener('scroll', handleScroll);
  }, { minDelay: 2000 });
  
  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    cleanup?.();
  };
}, []);
```

---

### Phase 8: Defer useEngagementScore Polling

**Current (500ms Polling):**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    const currentScore = getEngagementScore();
    if (currentScore !== score) { ... }
  }, 500);
  return () => clearInterval(interval);
}, [score]);
```

**Refactored (Deferred Start + Event-Driven):**
```typescript
useEffect(() => {
  let interval: NodeJS.Timeout | null = null;
  
  // Defer polling start by 3 seconds
  const startPolling = () => {
    interval = setInterval(() => {
      const currentScore = getEngagementScore();
      if (currentScore !== score) { ... }
    }, 500);
  };
  
  scheduleWhenIdle(startPolling, { minDelay: 3000 });
  
  return () => {
    if (interval) clearInterval(interval);
  };
}, [score]);
```

---

## Files to Create/Modify

| Action | File |
|--------|------|
| **Create** | `src/lib/deferredInit.ts` |
| **Modify** | `src/main.tsx` |
| **Modify** | `src/hooks/usePageTimer.ts` |
| **Modify** | `src/hooks/usePageTracking.ts` |
| **Modify** | `src/hooks/useSessionSync.ts` |
| **Modify** | `src/hooks/useEngagementScore.ts` |
| **Modify** | `src/components/authority/ExitIntentModal.tsx` |

---

## Success Criteria

After implementation:
- [ ] Mobile Performance score increases from ~40% to 60%+
- [ ] Console shows `[Golden Thread]` log ~3 seconds after page load (not immediately)
- [ ] Console shows `[Bot Detection]` log ~3 seconds after page load
- [ ] Page renders visibly faster on mobile devices
- [ ] All tracking events still fire (just delayed, not removed)
- [ ] No tracking data loss — events eventually fire during idle time

---

## Technical Notes

### Why Not Just Use `defer` on Script Tags?

The GTM script already uses `async`. The problem is our **custom JavaScript** running synchronously in `main.tsx` before React mounts. Script attributes don't help here.

### Why 3 Seconds?

This is the "goldilocks zone":
- **Too short (< 1s)**: Still competes with initial render
- **Too long (> 5s)**: Risk missing early conversions
- **3 seconds**: User has seen content, main thread is idle, tracking can run safely

### Conversion Events Are Safe

This optimization does NOT delay conversion tracking (form submissions, lead captures). Those are user-initiated and fire immediately. We're only deferring:
- Bot detection (no user impact)
- Identity reconciliation (lazy getter already exists)
- Passive engagement tracking (scroll, time on page)
- Page view analytics (can wait a few seconds)

### requestIdleCallback Fallback

Not all browsers support `requestIdleCallback` (Safari). The fallback uses `setTimeout`, which is still better than synchronous execution.
