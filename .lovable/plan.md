

# Deferred Third-Party Script Loading — Performance Optimization Plan

## Problem Analysis

### Current State (index.html)
```html
<!-- Lines 26-36: GTM loads SYNCHRONOUSLY during HTML parse -->
<script>
  var productionDomain = 'itswindowman.com';
  
  if (window.location.hostname === productionDomain || ...) {
    // GTM script injection - BLOCKS CRITICAL RENDERING PATH
    (function(w,d,s,l,i){...})(window,document,'script','dataLayer','...');
  }
</script>
```

### Why This Is Slow

```text
Browser Parse Timeline (Current)
────────────────────────────────────────────────────────────────────
HTML Parse Start
    │
    ├── <head> processing
    │   ├── Font preconnects ✓
    │   ├── Resource hints ✓
    │   └── GTM INLINE SCRIPT ← BLOCKS PARSE (lines 26-36)
    │         │
    │         ├── Evaluates JS synchronously
    │         ├── Creates script element
    │         ├── Injects gtm.js (async=true, but damage done)
    │         └── GTM loads Meta Pixel, Clarity, etc.
    │
    ├── <body> parse begins
    │   └── React mounts (#root)
    │
    └── FCP (First Contentful Paint) ← DELAYED BY GTM PARSE
```

**Impact on Core Web Vitals:**
- **FCP (First Contentful Paint)**: GTM inline script blocks HTML parser
- **LCP (Largest Contentful Paint)**: Delayed by competing network requests
- **TBT (Total Blocking Time)**: GTM + downstream scripts (Pixel, Clarity) run on main thread

### Verification: No Duplicate Pixel Loading

**Search Results Confirm:**
- ✅ Meta Pixel is loaded via GTM (no `fbevents.js` in index.html)
- ✅ Code reads `_fbp` and `_fbc` cookies (set by GTM-loaded Pixel)
- ✅ No hardcoded Pixel initialization in codebase

---

## Solution Options Comparison

| Approach | Complexity | Performance Gain | Risk |
|----------|------------|-----------------|------|
| **Partytown (Web Worker)** | High | Maximum | High - can break advanced GTM features |
| **Delayed Injection (2s)** | Low | Good | Low - simple, predictable |
| **Window Load Event** | Low | Medium | Low - fires after LCP complete |

### Recommendation: Delayed Window Load Injection

Partytown requires careful configuration and can break GTM triggers that depend on main-thread DOM access. For this project's analytics setup (Meta CAPI, GA4 Enhanced Conversions), a simpler **window load + delay** approach is safer and still highly effective.

---

## Implementation Plan

### Phase 1: Move GTM to Deferred Loading

**Current (Synchronous - Blocks Parse):**
```html
<script>
  // Runs immediately during HTML parse
  (function(w,d,s,l,i){...})(window,document,'script','dataLayer','...');
</script>
```

**Refactored (Deferred - After Window Load + 2s):**
```html
<script>
  // GTM configuration - does NOT block parse
  window.dataLayer = window.dataLayer || [];
  
  var productionDomain = 'itswindowman.com';
  var isProduction = window.location.hostname === productionDomain || 
                     window.location.hostname === 'www.' + productionDomain;
  
  if (!isProduction) {
    console.log('[GTM] Blocked on non-production domain:', window.location.hostname);
  }
  
  // Defer GTM injection to after page is interactive
  function loadGTM() {
    if (!isProduction) return;
    
    // Standard GTM snippet - now runs post-LCP
    window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
    var j = document.createElement('script');
    j.async = true;
    j.src = 'https://lunaa.itswindowman.com/76bwidfqcvb.js?' + 
            'dwjnsf8=CxJeNjIpRDkqICUjUzUzURRLUV9XQg0ZXx8XAhENBxMNAQ4QCEoKGA8%3D';
    document.head.appendChild(j);
    
    console.log('[GTM] Loaded (deferred, post-interactive)');
  }
  
  // Strategy: Wait for window load, then add 2s buffer
  // This ensures:
  // 1. DOM is complete (DOMContentLoaded)
  // 2. All critical resources loaded (load event)
  // 3. React has mounted and painted
  // 4. 2s buffer for hydration to complete
  if (document.readyState === 'complete') {
    setTimeout(loadGTM, 2000);
  } else {
    window.addEventListener('load', function() {
      setTimeout(loadGTM, 2000);
    }, { once: true });
  }
</script>
```

### Phase 2: Remove Blocking Preconnects for Deferred Resources

Since GTM is now deferred, we can also defer the preconnect hints (they currently compete with critical resources):

**Current:**
```html
<link rel="preconnect" href="https://connect.facebook.net" crossorigin />
<link rel="preconnect" href="https://scripts.clarity.ms" crossorigin />
```

**Refactored:** Remove these preconnects entirely (or move to late injection). GTM will establish connections when it loads after the delay.

**Keep:** The Stape/GTM preconnect is still useful since it's the first third-party to load:
```html
<link rel="preconnect" href="https://lunaa.itswindowman.com" crossorigin />
```

### Phase 3: Ensure dataLayer Events Queue Correctly

The early dataLayer initialization ensures events pushed before GTM loads are still captured:

```html
<script>
  window.dataLayer = window.dataLayer || [];
</script>
```

Events pushed by React components (via `trackEvent()`) before GTM loads will queue in the array. When GTM finally loads, it processes the queue automatically.

**Verification:** The `ensureDataLayer()` function in `gtm.ts` already handles this:
```typescript
function ensureDataLayer(): void {
  if (typeof window !== 'undefined' && !window.dataLayer) {
    window.dataLayer = [];
  }
}
```

---

## New Execution Timeline

```text
Browser Parse Timeline (Optimized)
────────────────────────────────────────────────────────────────────
HTML Parse Start
    │
    ├── <head> processing
    │   ├── Font preconnects ✓
    │   ├── Supabase preconnect ✓
    │   ├── Stape preconnect ✓ (keeps connection warm for later)
    │   └── GTM CONFIG ONLY (no blocking) ✓
    │         └── Registers load event listener
    │
    ├── <body> parse (FAST - no competition)
    │   └── React mounts (#root)
    │
    ├── FCP (First Contentful Paint) ← NOW MUCH FASTER
    │
    ├── LCP (Largest Contentful Paint)
    │
    ├── window.load fires
    │
    └── +2000ms: GTM LOADS
          │
          ├── Processes queued dataLayer events
          ├── Loads Meta Pixel (no duplicate)
          └── Loads Clarity
```

---

## Files to Modify

| Action | File | Changes |
|--------|------|---------|
| **Modify** | `index.html` | Refactor GTM injection to use window load + delay |

---

## Success Criteria

After implementation:
- [ ] Mobile Performance score increases from ~40% to 60%+ (target 70%+)
- [ ] FCP improves by 500-1000ms on mobile connections
- [ ] Console shows `[GTM] Loaded (deferred, post-interactive)` ~2s after page load
- [ ] All tracking events still fire (queued before GTM, processed after)
- [ ] No duplicate Pixel loading (already verified)
- [ ] Meta CAPI events continue to match correctly (fbclid, _fbp, _fbc preserved)

---

## Technical Notes

### Why Not Partytown?

Partytown moves scripts to a Web Worker, which sounds ideal but:
1. **GTM Trigger Compatibility**: GTM triggers often rely on DOM element visibility, scroll position, etc. Web Workers can't access the DOM directly.
2. **Meta Pixel**: Uses cookies and DOM events that may not proxy correctly.
3. **Setup Complexity**: Requires Vite plugin configuration and careful allowlist management.
4. **Debugging**: Harder to debug tracking issues when scripts run in a worker.

For a site with sophisticated GTM/Meta CAPI integration, the simpler "delay" approach is safer.

### Why 2 Seconds After Load?

- **< 1s**: Risks overlapping with React hydration on slow devices
- **2s**: Sweet spot - page is definitely interactive
- **> 3s**: Risk losing early page view events

### Will This Break Anything?

**Won't break:**
- Page view tracking (events queue in dataLayer)
- Conversion tracking (user-initiated, happens well after 2s)
- Attribution (UTM params captured in React, not GTM)
- CAPI matching (cookies set by Pixel persist across page loads)

**Edge case:**
- Immediate bounce (user leaves < 2s): No analytics recorded
- This is acceptable — these users weren't going to convert anyway

---

## Alternative: Future Partytown Migration

If you want maximum performance later, we can add Partytown in a separate effort:

```bash
npm install @builder.io/partytown
```

This would require:
1. Vite plugin configuration
2. Service worker setup for script proxying
3. Careful testing of all GTM triggers
4. Meta Pixel compatibility testing

For now, the deferred loading approach gives 80% of the benefit with 20% of the complexity.

