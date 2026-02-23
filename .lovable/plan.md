

# Mobile Speed Optimization Plan

## Overview
A focused set of changes across 4 phases targeting mobile download speed: image delivery, JavaScript reduction, render-blocking CSS/JS, and layout stability.

---

## Phase 1: Image Delivery (Fixes LCP)

### 1a. Convert hero background JPG to WebP
- Convert `public/images/hero/window_background.jpg` to WebP format (typically 25-35% smaller)
- Update the reference in `QuoteScannerHero.tsx` (line 124) from `.jpg` to `.webp`

### 1b. Add `fetchpriority="high"` to Navbar logo
- The `index.html` already preloads `/icon-512.webp` with `fetchpriority="high"`, but the actual `<img>` tag in `Navbar.tsx` (line 96) does not carry the attribute
- Add `fetchpriority="high"` to the primary logo `<img>` so the browser prioritizes decoding it

### 1c. Add `loading="lazy"` and `decoding="async"` to below-fold images
- Currently only `WhoIsWindowManSection.tsx` and `MascotTransition.tsx` have lazy loading
- The secondary logo images in `Navbar.tsx` (lines 113, 220) are tiny (16x16) and above-fold -- no change needed
- No other `<img>` tags exist in homepage sections (content is text-only), so this sub-task is already complete

---

## Phase 2: JavaScript Reduction (Fixes TBT/TTI)

### 2a. Delete MobileStickyFooter
- Delete `src/components/navigation/MobileStickyFooter.tsx` (116 lines of JS including a scroll listener + rAF loop running on every public page)
- Update `src/components/layout/PublicLayout.tsx`: remove the import and `<MobileStickyFooter />` render
- Remove `pb-[var(--mobile-sticky-footer-h)]` padding from the `<main>` tag (line 32)
- Remove `--mobile-sticky-footer-h: 104px` CSS variable from `src/index.css` (line 12)
- Update `FloatingEstimateButton.tsx` bottom position from `bottom-[120px]` to `bottom-6` on mobile since the sticky footer no longer exists (line 112)

### 2b. Delete unused Hero.tsx
- `src/components/home/Hero.tsx` is never imported anywhere -- `Index.tsx` uses `HeroSection.tsx` instead
- Safe to delete

### 2c. Delete App.css
- `src/App.css` contains Vite boilerplate styles that are not used by the application (the app uses Tailwind via `index.css`)
- Check if it's imported anywhere; if only from a dead path, delete it

---

## Phase 3: Render-Blocking CSS/JS (Fixes FCP)

### 3a. Disable `cta-glow` animation on mobile
- The `cta-breathe` infinite keyframe animation runs on the main CTA button on mobile, consuming GPU compositing every frame
- Add to the existing `@media (max-width: 767px)` block in `index.css` (after line 592):
```css
.cta-glow {
  animation: none;
  box-shadow: 0 0 20px hsl(var(--secondary) / 0.3);
}
```
- This matches the existing `prefers-reduced-motion` override pattern

### 3b. Disable `badge-shimmer` animation on mobile
- The `badge-shimmer` pseudo-element runs an infinite 3s shimmer on multiple elements
- Add to the same mobile media query:
```css
.badge-shimmer::before {
  animation: none;
  opacity: 0;
}
```

### 3c. Replace `backdrop-blur-sm` with solid background on mobile
- `HeroSection.tsx` line 23 uses `backdrop-blur-sm` on the info card -- expensive on mobile GPUs
- Change the class to include a responsive override: replace `bg-card/50 border border-border/50 backdrop-blur-sm` with `bg-card/80 md:bg-card/50 border border-border/50 md:backdrop-blur-sm`
- This gives mobile a solid card background while keeping the blur effect on desktop

---

## Phase 4: Layout Stability (Fixes CLS)

### 4a. Reserve space for UrgencyTicker on homepage
- In `src/pages/Index.tsx` (line 82-84), the `UrgencyTicker` fetches data from an edge function and renders dynamically
- Wrap it in a container with `min-h-[56px]` to prevent layout shift when data arrives:
```jsx
<div className="container px-4 -mt-16 relative z-10 border-secondary my-0 py-0 min-h-[56px]">
  <UrgencyTicker variant="homepage" size="lg" />
</div>
```

### 4b. Image dimensions already present
- Navbar logo: has `width={36} height={36}` -- good
- WhoIsWindowManSection: has `width={1456}` and other attrs -- good
- MascotTransition: has `width={288}` -- good
- No other images on homepage sections to fix

---

## Files Summary

### Files to delete (3)
- `src/components/navigation/MobileStickyFooter.tsx`
- `src/components/home/Hero.tsx`
- `src/App.css` (if confirmed unused)

### Files to modify (5)
| File | Change |
|---|---|
| `src/index.css` | Remove `--mobile-sticky-footer-h`, add mobile `cta-glow` + `badge-shimmer` overrides |
| `src/components/layout/PublicLayout.tsx` | Remove MobileStickyFooter import/render, remove bottom padding |
| `src/components/floating-cta/FloatingEstimateButton.tsx` | Update mobile bottom position from `120px` to `6` |
| `src/components/home/HeroSection.tsx` | Replace `backdrop-blur-sm` with responsive solid bg on mobile |
| `src/pages/Index.tsx` | Add `min-h-[56px]` to UrgencyTicker container |
| `src/components/home/Navbar.tsx` | Add `fetchpriority="high"` to logo img |
| `src/components/quote-scanner/QuoteScannerHero.tsx` | Update `.jpg` to `.webp` reference |

### Files to convert (1)
- `public/images/hero/window_background.jpg` to `window_background.webp`

### No dependencies added or removed

---

## Expected Impact
- **LCP**: Faster hero image decode (WebP ~30% smaller), prioritized logo
- **TBT/TTI**: Eliminated 2 scroll listeners (MobileStickyFooter + its rAF loop), reduced JS parse by ~120+ lines
- **FCP**: Removed 2 infinite CSS animations and 1 backdrop-blur on mobile
- **CLS**: Reserved space for async UrgencyTicker data

