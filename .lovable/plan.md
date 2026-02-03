
# Disable PWA Install Prompts

## Summary
Remove the web app manifest that triggers automatic "Add to Home Screen" prompts on mobile devices while keeping beneficial styling and fallback icon functionality.

---

## Root Cause

The **`site.webmanifest`** file with `"display": "standalone"` combined with the `<link rel="manifest">` tag tells browsers: "This site can be installed as an app." Modern mobile browsers (especially Chrome on Android and Safari on iOS) automatically detect this and offer install prompts.

---

## What to Remove vs Keep

| Element | Location | Action | Reason |
|---------|----------|--------|--------|
| `<link rel="manifest">` | `index.html` line 45 | **REMOVE** | Primary trigger for install prompts |
| `site.webmanifest` file | `public/site.webmanifest` | **DELETE** | No longer needed without manifest link |
| `<meta name="theme-color">` | `index.html` line 46 | **KEEP** | Only colors browser chrome - no install trigger. Good for branding. |
| `<link rel="apple-touch-icon">` | `index.html` line 42 | **KEEP** | Only provides icon if user manually saves. No automatic prompt. |
| `icon-512.webp` | `public/icon-512.webp` | **KEEP** | Used for favicon and apple-touch-icon |

---

## Changes

### File: `index.html`

**Remove lines 44-45** (the manifest link and PWA comment):

```html
<!-- PWA/Android -->
<link rel="manifest" href="/site.webmanifest" />
```

**Keep this line** (just removes the "PWA/Android" comment context):
```html
<meta name="theme-color" content="#1e40af" />
```

### File: `public/site.webmanifest`

**DELETE this file entirely** - it's no longer referenced and could still be accessed directly.

---

## Technical Details

### Why this works:
- Without a manifest file, browsers have no way to know the site is "installable"
- The `beforeinstallprompt` event won't fire (no manifest = no PWA eligibility)
- Chrome/Safari won't show "Add to Home Screen" banners or prompts

### What you keep:
- **theme-color**: Makes the browser address bar match your brand blue (#1e40af) on mobile - purely cosmetic
- **apple-touch-icon**: If a user manually chooses "Add to Home Screen" in Safari, they get your logo instead of a screenshot - this is passive, not promotional

---

## Files Changed

| File | Action |
|------|--------|
| `index.html` | Remove manifest link (lines 44-45), keep theme-color |
| `public/site.webmanifest` | Delete file |
