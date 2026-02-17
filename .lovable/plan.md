

# Improve Mobile Lighthouse Performance Score (Target: 70+)

## Problem Analysis

The current lazy loading of 7 homepage sections is **hurting** mobile performance rather than helping. Here's why:

1. **Chunk waterfall effect**: Each `<Suspense>` boundary triggers a separate network request for its chunk. On mobile (3G/4G), 7 sequential chunk requests add significant latency vs. one larger bundle.
2. **LCP element is the Hero h1 text** -- below-fold sections don't affect LCP at all, so lazy-loading them provides zero LCP benefit while adding overhead.
3. **Navbar imports heavy dependencies eagerly**: `useAuth` pulls in the entire Supabase client, `ReadinessIndicator` imports `canvas-confetti` (35KB), and `useVaultNotifications` triggers additional logic -- all blocking render before the Hero even paints.
4. **UrgencyTicker calls an edge function on mount** via `useTickerStats`, adding a network request to the critical path.

## Plan (4 changes, 2 files)

### 1. Revert Index.tsx to direct imports (undo lazy loading)

Remove all `lazy()` / `Suspense` wrappers for homepage sections. Import them directly:

```
MarketRealitySection, FailurePointsSection, WhoIsWindowManSection,
SecretPlaybookSection, SampleReportSection, WeaponizeAuditSection,
FinalDecisionSection
```

Remove the `SectionFallback` component and the `Skeleton` import (no longer needed). Remove `lazy` and `Suspense` from the React import. This eliminates 7 chunk-loading network requests on mobile.

### 2. Defer Navbar auth checks (biggest win)

The `Navbar` currently calls `useAuth()` on every page load, which imports and initializes the Supabase client synchronously. This blocks the critical rendering path.

**Change**: Create a `useDeferredAuth` pattern inside Navbar that:
- Returns `{ loading: true, isAuthenticated: false }` initially (renders the logged-out icon instantly)
- Runs the real `useAuth()` check after a short delay (via `useEffect` + state)
- This lets the Navbar shell + Hero paint immediately without waiting for Supabase SDK initialization

Similarly, defer `useVaultNotifications` and the `ReadinessIndicator` component (which imports `canvas-confetti`) so they don't load until after initial paint.

### 3. Defer UrgencyTicker's edge function call

The `useTickerStats` hook already has a client-side fallback, but it fires the edge function fetch immediately on mount. Wrap the fetch in `requestIdleCallback` (or the existing `scheduleWhenIdle` utility) so it doesn't compete with LCP resources.

### 4. Preconnect hint for Supabase

Add a `<link rel="preconnect">` for the Supabase domain in `index.html` so that when the deferred auth check runs, the DNS/TLS handshake is already done.

---

## Technical Details

### File: `src/pages/Index.tsx`

| What | Before | After |
|------|--------|-------|
| Section imports | 7x `lazy(() => import(...))` | 7x direct `import { ... } from '...'` |
| Suspense wrappers | 7x `<Suspense fallback={...}>` | None (direct render) |
| SectionFallback | Defined + used | Removed |
| React import | `lazy, Suspense` | (neither needed) |

### File: `src/components/home/Navbar.tsx`

| What | Before | After |
|------|--------|-------|
| `useAuth()` | Called immediately at render | Deferred: returns placeholder initially, real check after idle |
| `useVaultNotifications()` | Called immediately | Deferred alongside auth |
| `ReadinessIndicator` | Direct import (pulls in canvas-confetti) | Lazy-loaded with `React.lazy()` -- only loads after auth resolves |

### File: `src/hooks/useTickerStats.ts`

| What | Before | After |
|------|--------|-------|
| Edge function call | Fires immediately in `useEffect` | Wrapped in `scheduleWhenIdle` with 2s min delay |

### File: `index.html`

| What | Change |
|------|--------|
| Preconnect | Add `<link rel="preconnect" href="https://kffoximblqwcnznwvugu.supabase.co">` in `<head>` |

## Expected Impact

| Metric | Current | Expected |
|--------|---------|----------|
| LCP | ~4.9s over budget | Reduced by 1-2s (fewer blocking resources) |
| TBT | High (Supabase + confetti parse) | Reduced (deferred to idle) |
| FCP | Blocked by auth | Unblocked (shell renders instantly) |
| Chunk requests | 7+ on homepage load | 1 main bundle (sections included) |

## What This Does NOT Change

- Visual design, layout, or UX -- identical user experience
- Functionality -- auth still works, just checks slightly later
- Below-fold content -- still renders, just not lazily chunked
- Other pages' lazy loading (App.tsx route-level splitting) -- untouched

