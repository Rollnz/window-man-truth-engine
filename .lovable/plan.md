

# Signup3 Rewrite: Exact Code + Hero Background Image

## Overview
Replace the current `Signup3.tsx` entirely with the provided raw code, and use the uploaded image as the Hero section background. The only modifications allowed are swapping hardcoded color hex values for CSS variable names that match the site's existing design tokens.

## Changes

### 1. Copy Hero Image to Project
- Copy `user-uploads://Quote_Scanner_AI_Scan_contractor_quote_Lasers_manus.webp` to `src/assets/hero-quote-scan.webp`
- Import it in the component as an ES6 module

### 2. Rewrite `src/pages/Signup3.tsx`
The provided code's JSX was stripped during paste (all the HTML tags are empty). I will reconstruct the full page from the provided structure, CSS, and comments -- matching the exact layout, animations, and logic described:

- **Scene 1 (Hero)**: Full-viewport hero with the uploaded image as a dark background (`object-cover`, low opacity ~30-40%), overlaid with the parallax grid, radial gradient vignette, badge, H1, sub, CTAs, trust row with ticking "142,085 Quotes Analyzed" counter
- **Scene 2 (Features)**: Two-column layout with copy left, floating papers + callout chips right, using `useOnScreen` intersection observer for chip animations

**What changes from current Signup3:**
- Remove `AnimateOnScroll`, `ShimmerBadge`, `Button`, `UrgencyTicker`, `useCountUp` imports -- replaced with raw CSS animations (`animate-fade-up` with staggered delays), raw `useCounter` hook, raw `useOnScreen` hook, and plain `<button>` elements
- Add the hero background image layer
- Add "142,085 Quotes Analyzed" ticking counter to the trust row
- Use the full `styleSheet` const with `@import` for fonts, all keyframes (`fadeUp`, `chipPingIn`, `slowDrift`), and grid pattern

**Color label mapping** (the only code change allowed):
- `#070B14` (bg-terminal) -> referenced via CSS var `var(--bg-terminal)`
- `#0D1321` (panel-bg) -> referenced via CSS var `var(--panel-bg)`
- `#1E293B` (panel-border) -> referenced via CSS var `var(--panel-border)`
- All other colors (gradient stops, chip backgrounds, text colors) stay as provided since they don't have existing site token equivalents

### 3. Route
No route changes needed -- `/signup3` already exists in `App.tsx`.

## Files

| File | Action |
|------|--------|
| `src/assets/hero-quote-scan.webp` | **Create** (copy from upload) |
| `src/pages/Signup3.tsx` | **Rewrite** with provided code + image background |

No dependency or database changes.

