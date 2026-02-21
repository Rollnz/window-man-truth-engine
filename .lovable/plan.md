

# Complete the Before/After Card Upgrade: Stage Surface + Scroll Activation

## Already Done (No Changes Needed)
- Before card wrapper: rose-tinted borders/shadows, solid elevated surface, motion-safe hover lift -- APPLIED
- After card wrapper: primary-tinted accents, default lift, stronger hover -- APPLIED
- Inner dashed border reduced to subordinate opacity -- APPLIED
- `transition-[transform,box-shadow,border-color]` with `motion-safe:` guards -- APPLIED

## Remaining: 2 Changes in `src/pages/QuoteScanner.tsx`

### 1. Stage Surface + Breathing Room (Line 132)

Add ambient radial glows behind the card section and increase vertical padding so the cards sit on a "lit stage" rather than floating on a flat page.

**Current (line 132):**
```
<section className="py-12 md:py-20">
```

**New:**
```tsx
<section className="relative py-16 md:py-24 overflow-hidden">
  {/* Ambient stage glows */}
  <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
    <div className="absolute top-1/4 left-[15%] w-[400px] h-[400px] rounded-full bg-rose-500/[0.04] dark:bg-rose-500/[0.06] blur-3xl" />
    <div className="absolute top-1/4 right-[15%] w-[400px] h-[400px] rounded-full bg-primary/[0.05] dark:bg-primary/[0.08] blur-3xl" />
  </div>
```

- Rose glow behind the Before card (left), primary glow behind After card (right)
- `blur-3xl` is static (no repaints), `pointer-events-none` + `aria-hidden` for accessibility
- Extra vertical padding gives the cards breathing room

### 2. Scroll Activation (Lines 141 and 213)

Wrap each card column in `AnimateOnScroll` with directional entrance:

- **Before column (line 141):** wrap `<div className="flex flex-col">` in `<AnimateOnScroll direction="left" duration={400} threshold={0.2}>`
- **After column (line 213):** wrap `<div className="flex flex-col">` in `<AnimateOnScroll direction="right" duration={400} delay={150} threshold={0.2}>`

This creates a staggered left/right reveal when the section enters viewport. `AnimateOnScroll` already handles `prefers-reduced-motion` (instantly shows content without animation).

An import for `AnimateOnScroll` will be added at the top of the file if not already present.

## What Does NOT Change
- All card wrapper styling (already applied)
- All text, CTAs, buttons, click handlers, tracking
- Inner card content, layout, padding
- Gating logic and phase management
- Dashed border styling (already fixed)

## Visual Outcome
The cards will fade in with directional motion when scrolled into view, sitting on a subtle warm/cool ambient glow stage that reinforces the rose (caution) vs primary (trust) narrative split.
