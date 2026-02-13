

# GTM Web Container Restoration & Meta Pixel Repair

## Problem

The GTM web container (GTM-NHVFR5QZ) is **not loading in the browser**. The current `index.html` uses a Stape obfuscated loader (`lunaa.itswindowman.com/76bwidfqcvb.js`) that is deferred until `window.load + 2 seconds`. This means:

1. No `gtm.js` request appears in DevTools Network tab
2. GTM Preview / Tag Assistant cannot connect
3. Meta Pixel browser events never fire (no "Browser" integration in Events Manager)
4. Early pageviews are missed entirely
5. EMQ is 4-6/10 because only server-side events work

## Root Cause

In `index.html` (lines 87-109), the GTM loader:
- Uses a Stape power-up obfuscated URL instead of the standard `googletagmanager.com/gtm.js` endpoint
- Is wrapped in a `setTimeout(loadGTM, 2000)` after `window.load`
- The obfuscated script likely fails to load or does not bootstrap the full web container (no `window.google_tag_manager`)

## Solution

Replace the Stape obfuscated loader with the **standard GTM snippet** that loads `gtm.js` directly from `googletagmanager.com`. Keep the Stape server-side endpoint (`lunaa.itswindowman.com/data`) for CAPI -- that is a separate server-side GTM container and is unaffected.

---

## Changes

### 1. `index.html` -- Replace GTM loader

**Remove (lines 82-109):** The entire deferred GTM block including:
- The `loadGTM()` function that creates a script element pointing to `lunaa.itswindowman.com/76bwidfqcvb.js`
- The `window.load + 2s` delay logic
- The production domain gating (keep this -- see below)

**Replace with:** Standard GTM snippet (production-gated):

```html
<!-- Google Tag Manager (Production Only) -->
<script>
  window.dataLayer = window.dataLayer || [];
  
  var productionDomain = 'itswindowman.com';
  var isProduction = window.location.hostname === productionDomain || 
                     window.location.hostname === 'www.' + productionDomain;
  
  if (isProduction) {
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-NHVFR5QZ');
  } else {
    console.log('[GTM] Blocked on non-production domain:', window.location.hostname);
  }
</script>
<!-- End Google Tag Manager -->
```

Key differences from current implementation:
- Loads `async` immediately during HTML parse (no 2-second delay)
- Uses standard `googletagmanager.com` URL (GTM Preview will connect)
- `window.dataLayer` is already initialized by the early attribution script above
- Still production-gated (no tracking on preview/dev domains)

**Add after `<body>` tag (line 121):** The `<noscript>` fallback iframe:

```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NHVFR5QZ"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

Note: The `<noscript>` is also production-only by nature (GTM will handle it). But since it's inside noscript, it won't affect non-production environments in practice (no JS means no SPA anyway). If strict gating is needed, it can be omitted -- but standard GTM documentation includes it.

### 2. `index.html` -- Keep existing early attribution script

The synchronous attribution capture script (lines 31-79) stays exactly as-is. It initializes `window.dataLayer` and pushes `attribution_captured` before GTM loads. Since the standard GTM snippet also references `window.dataLayer`, events queued before GTM loads will be processed when GTM initializes -- this is standard GTM behavior.

### 3. `index.html` -- Update preconnect hint

Change the preconnect for `lunaa.itswindowman.com` to `www.googletagmanager.com`:

```html
<link rel="preconnect" href="https://www.googletagmanager.com" crossorigin />
```

Keep `lunaa.itswindowman.com` preconnect as well since the server-side GTM container (Stape) still uses it for CAPI from the edge function.

### 4. No changes to `src/lib/gtm.ts`

The `trackEvent()` function pushes to `window.dataLayer` -- this works regardless of how GTM is loaded. No changes needed.

### 5. No changes to `src/main.tsx` or deferred init

The deferred init system (`scheduleWhenIdle`) handles attribution, bot detection, and identity reconciliation -- none of these relate to GTM script loading. They remain as-is.

---

## Deduplication Architecture (Already Correct)

The codebase already generates unique `event_id` values per event instance via `generateEventId()` (which calls `crypto.randomUUID()`). These are pushed to `dataLayer` and available to GTM tags. The server-side CAPI (via `save-lead` edge function) generates its own `event_id` or receives one in the payload.

For browser+server dedup to work:
- The GTM web container's Meta Pixel tag must read `{{DLV - event_id}}` and pass it as the `eventID` parameter to `fbq()`
- The server-side CAPI must use the same `event_id`
- This is a **GTM container configuration** concern, not a code concern

The `lead_submission_success` event already includes `event_id` in its dataLayer push (line 589 of gtm.ts). The `trackLeadSubmissionSuccess` function generates a fresh UUID per call via `generateEventId()`.

---

## Event Name Consistency

The codebase uses `page_view` (via `trackPageView` in gtm.ts line 403). This aligns with GA4 conventions. Meta uses `PageView`. These are different systems and do not conflict -- GTM maps events to each platform's expected format via tag configuration.

No `PageView` vs `page_view` fragmentation exists in the code. The GTM container handles mapping.

---

## Files Changed

| File | Change |
|------|--------|
| `index.html` | Replace Stape obfuscated loader with standard GTM snippet; add noscript fallback; add googletagmanager.com preconnect |

One file. No new dependencies. No database changes. No edge function changes.

---

## Verification Checklist

### Network Checks
1. Open Chrome DevTools > Network tab on production domain
2. Filter by "gtm" -- confirm request to `https://www.googletagmanager.com/gtm.js?id=GTM-NHVFR5QZ` with status 200
3. Confirm the request fires within the first few seconds (not delayed by 2s+)

### Console Checks
1. Open Chrome DevTools > Console on production domain
2. Run: `window.google_tag_manager` -- should exist and contain `GTM-NHVFR5QZ`
3. Run: `window.dataLayer` -- should contain queued events including `attribution_captured` (if UTMs present) and `gtm.start`

### GTM Preview
1. Open GTM > Preview > Enter production URL
2. Tag Assistant should connect and show container `GTM-NHVFR5QZ`
3. Verify tags fire on page load (GA4 Config, Meta Pixel PageView, etc.)

### Meta Test Events
1. In Meta Events Manager > Test Events > Open production site
2. Confirm `PageView` appears with Integration = "Browser" (not just "Server")
3. Submit a test lead form -- confirm `Lead` or `lead_submission_success` appears with Integration = "Browser" alongside the server event
4. Verify both browser and server events share the same `event_id` for deduplication

### Non-Production Safety
1. Open the Lovable preview URL
2. Confirm NO request to `googletagmanager.com` in Network tab
3. Confirm console shows: `[GTM] Blocked on non-production domain:`

---

## Remaining Notes

- **Stape server-side GTM** (`lunaa.itswindowman.com/data`) is unaffected -- it's called from edge functions, not from the browser GTM loader
- **The obfuscated loader** (`76bwidfqcvb.js`) was likely a Stape "power-up" that proxied GTM through a custom domain. This may have been set up to avoid ad-blocker detection. By switching to the standard GTM URL, ad-blockers may block GTM. If this is a concern, the Stape custom loader can be re-evaluated after confirming the standard snippet works
- **Meta Pixel tag configuration** inside the GTM container must be verified separately (this is GTM UI work, not code). Ensure the Meta Pixel tag reads `event_id` from `{{DLV - event_id}}` data layer variable

