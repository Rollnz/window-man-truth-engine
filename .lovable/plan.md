

# Signup3 Landing Page: Creation + CRO Polish

## Overview
Create `/signup3` using the provided two-scene layout (Hero + Features), then upgrade it from a raw prototype to a production-grade, conversion-optimized page by swapping in existing design-system components and adding CRO enhancements.

## What Gets Created

### 1. New Page: `src/pages/Signup3.tsx`
The provided code adapted to TypeScript with project conventions:
- Scene 1: Dark terminal-aesthetic Hero with parallax grid, animated counter, and dual CTAs
- Scene 2: Feature section with floating paper mockups and animated callout chips

### 2. New Route in `App.tsx`
Add `/signup3` alongside the existing `/signup` and `/signup2` private routes.

---

## CRO Upgrades (Senior CRO Recommendations)

### A. Replace Raw Primitives with Design-System Components

| Raw Code | Replaced With | Why |
|----------|--------------|-----|
| Inline `<button>` elements | `<Button variant="cta">` and `<Button variant="frame">` | Consistent hover states, focus rings, accessibility |
| Custom `useCounter` hook | Existing `useCountUp` from `@/components/social-proof` | DRY, already battle-tested with easeOutExpo |
| Custom `useOnScreen` hook | Existing `AnimateOnScroll` wrapper | Handles reduced-motion, direction variants, will-change cleanup |
| Inline badge markup | `ShimmerBadge` component | Adds the animated shimmer sweep that signals "AI-powered" |

### B. Add UrgencyTicker as Social Proof Anchor
Place `<UrgencyTicker variant="cyberpunk" size="md" />` between the two scenes (after Hero, before Features). This:
- Replaces the static "142,085" counter with the live server-synced ticker
- Adds the "+X today" pulse dot for real-time urgency
- Creates a visual "break" between scenes that reinforces credibility

### C. Trust Row Polish
- Replace the inline trust dots with a reusable flex row using proper semantic markup
- Add a subtle `AnimateOnScroll` fade-up to the trust row so it doesn't compete with the H1 on load

### D. Feature Callout Chips
- Wrap the three callout chips (Hidden Fee, Warranty, Scope) in `AnimateOnScroll` with staggered delays instead of raw CSS `animation-delay` -- this gives us intersection-observer triggering (only animate when scrolled into view) and reduced-motion respect for free

### E. Typography & Spacing
- Use the project's `font-mono` (JetBrains Mono already loaded globally) instead of re-importing via Google Fonts `<style>` tag
- Move all custom keyframes into a scoped `<style>` block (following the Signup2 pattern) to avoid polluting global styles
- Prefix all custom classes with `s3-` to prevent collisions (matching the `s2-` convention from Signup2)

### F. CTA Routing
- Primary CTA ("Run Free AI Scan") routes to `ROUTES.QUOTE_SCANNER`
- Secondary CTA ("Create Free Account") routes to `/signup`
- Both use `<Link>` from react-router-dom via `Button asChild`

---

## File Changes Summary

| File | Action |
|------|--------|
| `src/pages/Signup3.tsx` | **Create** -- Full page with Hero + Features + UrgencyTicker |
| `src/App.tsx` | **Edit** -- Add lazy import + `/signup3` route in private routes section |

No new dependencies. No database changes. All visual components already exist in the design system.

---

## Technical Notes
- The `WindowManIcon` SVG from the provided code is incomplete (empty paths) -- will be omitted until proper SVG markup is provided
- The `@import url()` for Google Fonts will be kept in the scoped `<style>` block for Manrope only (Inter is already the project default)
- The parallax mouse effect follows the same pattern already proven in Signup2
- All inline colors use the project's CSS custom properties where possible, falling back to the provided hex values for the terminal dark theme which intentionally differs from the standard light theme

