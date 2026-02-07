

# Attribution Race Condition Audit — Analysis & Fix

## Executive Summary

**STATUS: MODERATE RISK IDENTIFIED** ⚠️

The current implementation has a timing vulnerability that could cause attribution loss for very fast bounces or React Router navigation. While React Router doesn't actively strip UTMs, the deferred initialization pattern creates a window where GTM could miss attribution data.

---

## Current Timing Analysis

### Execution Timeline (Current)

```text
index.html parses (t=0)
    │
    ├── window.dataLayer = [] (IMMEDIATE) ✓
    │
    └── GTM load scheduled for window.load + 2s
    
main.tsx executes (t=~50ms)
    │
    ├── createRoot().render() - React mounts
    │
    ├── scheduleWhenIdle(initializeAttribution) - 500ms delay
    │   └── Captures UTMs → localStorage (t=~550ms)
    │
    └── scheduleWhenIdle(reconcileIdentities) - 1000ms delay
        └── Sets up Golden Thread (t=~1000ms)

window.load fires (t=~1-3s)
    │
    └── setTimeout(loadGTM, 2000) scheduled

GTM loads (t=~3-5s)
    │
    └── Reads window.location for UTMs
    └── ❓ URL may still have UTMs OR may have been cleaned
```

### What's Protected (Already Safe)

| System | Where | Timing | Safe? |
|--------|-------|--------|-------|
| Golden Thread ID | `getGoldenThreadId()` | Lazy getter | ✅ Yes |
| localStorage persistence | `attribution.ts` | 500ms deferred | ⚠️ Mostly |
| Cookie capture (_fbc, _fbp) | `attribution.ts` | 500ms deferred | ⚠️ Mostly |
| Lead form submissions | Various | User-initiated | ✅ Yes |

### What's At Risk

| Risk | Impact | Probability |
|------|--------|-------------|
| GTM sees clean URL | Direct traffic in GA4/Meta | Low (React Router doesn't strip) |
| Early dataLayer events lack UTMs | Engagement events mis-attributed | Medium |
| URL cleaned by external redirect | Lost attribution | Low |

---

## Findings: No Active URL Cleaning

**Good news**: Search of the codebase confirms:

1. ✅ **No `replaceState`/`pushState` URL cleaning** - React Router preserves query strings
2. ✅ **No `searchParams.delete()` for UTMs** - Only one usage (admin tabs, unrelated)
3. ✅ **No third-party libraries stripping params** - Clean implementation

**However**, the deferred `initializeAttribution()` (500ms delay) means:
- Very early dataLayer pushes may lack attribution context
- If a user bounces in < 500ms, attribution might not be persisted

---

## The Gap: No Early dataLayer Push

**Critical Finding**: Currently, UTM parameters are:
1. ✅ Captured to localStorage (via `initializeAttribution()` - 500ms delay)
2. ✅ Included in lead form submissions (via `getAttributionData()`)
3. ❌ **NOT pushed to dataLayer as a standalone event**

When GTM loads (3-5s after page load), it reads `window.location.href` to get UTMs. This works **IF the URL hasn't changed**. But for SPA navigations within those 3-5 seconds, the URL might now be `/cost-calculator` instead of `/?utm_source=facebook&...`.

---

## Recommended Fix: Early Attribution Capture

### Pattern: "Capture-Then-Queue"

Add a synchronous, lightweight snippet to `index.html` that:
1. Reads `window.location.search` immediately (before React)
2. Parses all UTM/Click-ID parameters
3. Pushes to `dataLayer` as a "seed" event
4. GTM picks up these values from the queue when it loads

### Implementation Plan

**Modify: `index.html`**

Add a new inline script (synchronous, < 1KB) **before** the GTM script:

```html
<!-- Attribution Capture (SYNCHRONOUS - runs before React) -->
<script>
  // Early Attribution Capture - Immunizes against GTM deferral
  // This runs IMMEDIATELY during HTML parse, before any URL cleaning
  (function() {
    'use strict';
    
    // Initialize dataLayer first
    window.dataLayer = window.dataLayer || [];
    
    // Parse current URL (guaranteed to have UTMs if they were present)
    var url = new URL(window.location.href);
    var params = url.searchParams;
    
    // Extract attribution parameters
    var attribution = {
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
      utm_term: params.get('utm_term') || undefined,
      utm_content: params.get('utm_content') || undefined,
      gclid: params.get('gclid') || undefined,
      fbclid: params.get('fbclid') || undefined,
      msclkid: params.get('msclkid') || undefined,
      // Capture the ORIGINAL landing page with full query string
      original_location: window.location.href,
      page_path: window.location.pathname
    };
    
    // Check if we have any meaningful attribution
    var hasAttribution = attribution.utm_source || attribution.gclid || 
                         attribution.fbclid || attribution.msclkid;
    
    if (hasAttribution) {
      // Push to dataLayer - will be queued until GTM loads
      window.dataLayer.push({
        event: 'attribution_captured',
        attribution_source: 'early_capture',
        ...attribution
      });
      
      // Also persist to sessionStorage for cross-page safety
      try {
        sessionStorage.setItem('wm_early_attribution', JSON.stringify(attribution));
      } catch(e) {}
      
      console.log('[Attribution] Early capture:', attribution.utm_source || attribution.gclid || 'click-id');
    }
    
    // Always capture the original landing URL (even without UTMs)
    // This ensures GTM can reference it later
    window.dataLayer.push({
      original_page_location: window.location.href,
      original_page_path: window.location.pathname,
      original_referrer: document.referrer || 'direct'
    });
  })();
</script>
```

### Key Properties of This Fix

| Property | Value |
|----------|-------|
| **Timing** | Synchronous, before React, before GTM |
| **Size** | < 1KB minified (no FCP impact) |
| **Blocking** | ~1-2ms execution (negligible) |
| **Fallback** | sessionStorage backup for cross-page persistence |
| **GTM Integration** | `attribution_captured` event available in GTM triggers |

---

## Updated Timeline (After Fix)

```text
index.html parses (t=0)
    │
    ├── EARLY CAPTURE SCRIPT (NEW) ⬅️
    │   ├── Reads window.location.search IMMEDIATELY
    │   ├── Pushes attribution_captured to dataLayer
    │   └── Persists to sessionStorage
    │
    ├── window.dataLayer initialized (contains attribution!)
    │
    └── GTM load scheduled for window.load + 2s

main.tsx executes (t=~50ms)
    │
    ├── createRoot().render() - React mounts
    │
    └── scheduleWhenIdle(initializeAttribution) - 500ms delay
        └── Captures UTMs → localStorage (redundant but safe)

React Router navigates (t=~100ms)
    │
    └── URL changes to /new-page (UTMs stripped from URL bar)
        └── ✅ SAFE: Attribution already captured in dataLayer

GTM loads (t=~3-5s)
    │
    └── Processes queued events
    └── Finds attribution_captured event with UTMs
    └── ✅ Correct attribution reported
```

---

## Files to Modify

| Action | File | Change |
|--------|------|--------|
| **Modify** | `index.html` | Add early attribution capture script before GTM script |

---

## GTM Configuration Recommendations

After implementing the early capture, configure GTM to use these dataLayer variables:

| Variable Name | DataLayer Key | Use Case |
|---------------|---------------|----------|
| `DL - UTM Source` | `utm_source` | GA4 campaign tracking |
| `DL - UTM Medium` | `utm_medium` | GA4 campaign tracking |
| `DL - GCLID` | `gclid` | Google Ads conversion tracking |
| `DL - FBCLID` | `fbclid` | Meta CAPI matching |
| `DL - Original Location` | `original_page_location` | Full URL with UTMs |

Create a GTM Trigger: `attribution_captured` event, which fires for any page load with UTMs.

---

## Success Criteria

After implementation:
- [ ] Console shows `[Attribution] Early capture: facebook` (or source) on UTM landing
- [ ] `dataLayer` contains `attribution_captured` event before GTM loads
- [ ] GA4 reports show correct campaign attribution (not all Direct)
- [ ] Meta Events Manager shows UTM parameters in events
- [ ] sessionStorage contains `wm_early_attribution` on pages with UTMs
- [ ] Mobile Lighthouse score unchanged (< 2ms script execution)

---

## Alternative Considered: Partytown / Web Worker

We considered using Partytown to run GTM in a Web Worker, which would allow GTM to "freeze" the URL state. However:

1. **GTM trigger compatibility**: Many GTM triggers rely on main-thread DOM access
2. **Complexity**: Requires Vite plugin + service worker setup
3. **Diminishing returns**: Early capture provides same protection with 10x less complexity

The synchronous early capture script is the simplest, safest solution.

