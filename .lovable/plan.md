# Replace GTM with Production-Only Conditional Loading

## Summary

Remove unconditional GTM loading and replace with a domain-checking script that only initializes GTM on your production domain, preventing Lovable preview domains from polluting your GTM suggestions.

---

## Changes

### File: `index.html`

**1. Replace Head GTM Script (lines 25-29)**

Replace the current unconditional GTM snippet with:

```html
<!-- Google Tag Manager (Production Only) -->
<script>
  // Only load GTM on production domain
  var productionDomain = 'itswindowman.com';

  if (window.location.hostname === productionDomain || window.location.hostname === 'www.' + productionDomain) {
    // --- Stape Server-Side GTM ---
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src="https://lunaa.itswindowman.com/76bwidfqcvb.js?"+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','dwjnsf8=CxJeNjIpRDkqICUjUzUzURRLUV9XQg0ZXx8XAhENBxMNAQ4QCEoKGA8%3D');
  } else {
    console.log('[GTM] Blocked on non-production domain:', window.location.hostname);
  }
</script>
<!-- End Google Tag Manager -->
```

**Key differences from your provided script:**

- Preserves your **Stape server-side endpoint** (`lunaa.itswindowman.com`) instead of switching to standard Google
- Preserves your **obfuscated container ID** for security
- Adds hostname to console log for easier debugging

**2. Remove Body noscript Tag (lines 69-78)**

Delete entirely:

```html
<!-- Google Tag Manager (noscript) -->
<noscript
  ><iframe
    src="https://lunaa.itswindowman.com/ns.html?id=GTM-NHVFR5QZ"
    height="0"
    width="0"
    style="display:none;visibility:hidden"
  ></iframe
></noscript>
<!-- End Google Tag Manager (noscript) -->
```

---

## How It Works

| Domain                                     | GTM Loads? | Result           |
| ------------------------------------------ | ---------- | ---------------- |
| `itswindowman.com`                         | Yes        | Full tracking    |
| `www.itswindowman.com`                     | Yes        | Full tracking    |
| `*.lovable.app`                            | No         | Console log only |
| `*-preview--*.lovable.app`                 | No         | Console log only |
| '\*-window-truth-engine.lovable.app'       | No         | Console log only |
| 'preview--window-truth-engine.lovable.app' | No         | Console log only |

---

## Impact

- **GTM will stop seeing preview domains** - Google can't suggest domains where GTM never loads
- **Production tracking unchanged** - All your existing tags, triggers, and variables work normally
- **No noscript fallback** - Acceptable tradeoff since <0.5% of users disable JavaScript

---

## Files Changed

| File         | Action                                            |
| ------------ | ------------------------------------------------- |
| `index.html` | Replace GTM head script, remove GTM body noscript |
