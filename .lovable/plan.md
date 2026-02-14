

# Replace GTM Snippet with Stape Custom Loader

## What Changes

One file: `index.html`. Replace the GTM script block (lines 80-98) and update the noscript fallback (lines 125-128).

## Change 1: Replace GTM script (lines 80-98)

**Current:** Standard GTM loader pointing to `googletagmanager.com/gtm.js`

**New:** Stape-proxied loader pointing to `lunaa.itswindowman.com`, with production-domain gating preserved:

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
    j=d.createElement(s);j.async=true;j.src=
    'https://lunaa.itswindowman.com/76bwidfqcvb.js?'+i;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','dwjnsf8=CxJeNjIpRDkqICUjUzUzURRLUV9XQg0ZXx8XAhENBxMNAQ4QCEoKGA8%3D');
  } else {
    console.log('[GTM] Blocked on non-production domain:', window.location.hostname);
  }
</script>
<!-- End Google Tag Manager -->
```

## Change 2: Update noscript fallback (lines 125-128)

Route the noscript iframe through the Stape domain as well for consistency:

```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://lunaa.itswindowman.com/ns.html?id=GTM-NHVFR5QZ"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

## What is NOT changing

- **Early attribution script** (lines 25-77): Stays exactly as-is. It initializes `window.dataLayer` and captures UTMs/click IDs before GTM loads.
- **Preconnect hints**: `lunaa.itswindowman.com` preconnect already exists (line 18). Keep `googletagmanager.com` preconnect too since Stape may still fetch resources from there.
- **`src/lib/gtm.ts`**: All tracking functions push to `window.dataLayer` -- works identically regardless of how GTM is loaded.
- **`src/main.tsx`**: Deferred init (attribution, bot detection, identity reconciliation) is unrelated to GTM script loading.
- **`save-lead` edge function**: Server-side CAPI routing to Stape is unchanged.
- **Admin pages, CRM, all tools**: This is an SPA with one `index.html` -- every route gets the same GTM loader automatically.

## Why attribution is safe

1. The early attribution script runs synchronously during HTML parse (before GTM).
2. It pushes `attribution_captured` and landing URL data into `window.dataLayer`.
3. When GTM loads (whether from `googletagmanager.com` or `lunaa.itswindowman.com`), it processes all queued `dataLayer` events.
4. The React app's `initializeAttribution()` (deferred in `main.tsx`) handles session-level attribution separately via `sessionStorage` -- also unaffected.

## Verification after publish

1. Open production site, DevTools Network tab -- confirm request to `lunaa.itswindowman.com/76bwidfqcvb.js` with status 200
2. Console: `window.google_tag_manager` should exist
3. GTM Preview / Tag Assistant should connect (Stape proxied containers support preview mode)
4. On preview/dev domain: confirm NO GTM request fires, console shows `[GTM] Blocked on non-production domain:`
5. Navigate to `/admin` pages -- same GTM container loads (single index.html serves all routes)

