

# X-Ray Scan Reveal Hero -- Final Implementation Plan

## Summary

Rewrite `QuoteScannerHero.tsx` with a dual-layer background X-ray reveal animation, preserving all existing content. Address the two identified risks (mobile image cropping and CTA button contrast) explicitly.

## What Stays Exactly the Same

- ShimmerBadge ("AI - Powered by GEMINI-3-FLASH")
- ScanSearch icon in rounded container
- h1: "Is Your Window Quote Fair? AI Analysis in 60 Seconds"
- Subtext: "Stop guessing. Upload a photo..."
- CTA line: "See what our AI finds in seconds"

## Visual Effect

Two background images stacked via absolute-positioned divs:

```text
+-----------------------------------------------+
|  Bottom: warnings_xray.webp  (z-0, always visible) |
|  Top: window_background.jpg  (z-10, clip-path animated) |
|  Dark overlay                (z-20, bg-black/40)       |
|  Red scan line               (z-30, 2px + red glow)    |
|  Content (text/badges)       (z-40)                    |
+-----------------------------------------------+
```

The top layer animates `clip-path: inset(X% 0 0 0)` from 0% to 100% over 8 seconds, then resets (2s pause). This "erases" the frosted window from top to bottom, revealing the warnings image underneath. A 2px red scan line with `box-shadow: 0 0 20px red` tracks the reveal edge.

## Risk Mitigations

### Mobile Image Cropping

Both background divs will use `background-position: center` and `background-size: cover`. Additionally, the warnings image will get `background-position: center 40%` on mobile (`sm:background-position: center`) to bias toward the upper-center where the red flags are concentrated. This ensures the "scary stuff" stays visible on portrait viewports.

### CTA Button Contrast

The current hero has no button -- only text lines. However, to address future-proofing and the CTA text visibility:

- The h1 accent span will use `text-red-400` (not subtle primary) with heavy `drop-shadow` so it pops against both dark backgrounds
- The CTA arrow line will use `text-orange-400 font-bold` (brand Safety Orange) instead of muted text, making it function as a visual call-to-action even without a button
- If a CTA button is added later, the plan establishes that it must use the `cta` variant (which is brand orange with shadow) or a custom orange gradient matching the existing ScannerHeroWindow button style

## Text Restyling

| Element | Current | New |
|---------|---------|-----|
| h1 | `text-foreground font-bold` | `text-white font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]` |
| h1 accent span | `text-primary` | `text-red-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]` |
| Subtext | `text-muted-foreground` | `text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]` |
| CTA line | `text-muted-foreground/70` | `text-orange-400 font-bold drop-shadow-md uppercase` |
| ScanSearch container | `bg-primary/10 border-primary/20` | `bg-white/10 border-white/20 backdrop-blur-sm` |
| ScanSearch icon | `text-primary` | `text-white` |

## CSS Keyframes

Inline `style` tag in the component (no external CSS file needed):

```css
@keyframes xray-reveal {
  0%     { clip-path: inset(0 0 0 0); }
  80%    { clip-path: inset(100% 0 0 0); }
  80.01%, 100% { clip-path: inset(0 0 0 0); }
}

@keyframes xray-line {
  0%     { top: 0%; }
  80%    { top: 100%; }
  80.01%, 100% { top: 0%; }
}

@media (prefers-reduced-motion: reduce) {
  .xray-top-layer, .xray-scan-line {
    animation: none !important;
  }
}
```

Total cycle: 10 seconds (8s sweep + 2s reset pause).

## Layout Change in `QuoteScanner.tsx`

Move the UrgencyTicker out of the hero overlap:

**Before (lines 126-132):**
```
<QuoteScannerHero />
<div className="container px-4 pb-6 -mt-6">
  <UrgencyTicker />
</div>
```

**After:**
```
<QuoteScannerHero />
<div className="container px-4 py-6">
  <UrgencyTicker />
</div>
```

Remove `-mt-6` so the pill sits cleanly below the hero with its own spacing. Flow becomes: Hero -> Quote Counter Pill -> ScanPipelineStrip.

## Files Changed

| File | Action |
|------|--------|
| `public/images/hero/window_background.jpg` | Add from uploaded asset |
| `public/images/hero/warnings_xray.webp` | Add from uploaded asset |
| `src/components/quote-scanner/QuoteScannerHero.tsx` | Rewrite with X-Ray reveal effect |
| `src/pages/QuoteScanner.tsx` | Remove `-mt-6` from UrgencyTicker wrapper |

## Performance

- Pure CSS `@keyframes` -- no JS animation loops, no `setInterval`, no `requestAnimationFrame`
- `will-change: clip-path` on the top layer for GPU compositing
- `prefers-reduced-motion: reduce` disables all animations (shows frosted image statically)
- No new dependencies
- Background images referenced via CSS `background-image` URL from `/public` (not ES module imports)

