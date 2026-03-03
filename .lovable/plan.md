

# Implement All 5 Cinematic Effects for How It Works Section

## What's Being Built

The engine backbone exists and works. This plan adds the visual layer -- all 5 effects described in the spec, plus the Director's Cut enhancements (grade roulette, leverage counter, counter-dynamic shadows).

## Changes Overview

### File 1: `src/components/signup3/HowItWorksSteps.tsx` (full rewrite ~550 lines)

**A. Scoped `<style>` block with all keyframes:**

```text
@keyframes scanReveal       -- clip-path wipe from left (cards entrance)
@keyframes borderOrbit      -- conic-gradient 360deg rotation (card border beam)
@keyframes dataPulse        -- translateX(0% -> 110%) for traveling packet
@keyframes sonarPing        -- scale(0)->scale(2.5) + opacity fade (card center ring)
@keyframes gradeRoulette    -- color flash for F-D-C-B-A cycling
@keyframes laserSlash       -- diagonal scaleX(0)->scaleX(1) for price strike
```

**B. Data Pulse Beam (Desktop only, Effect 1):**
- A horizontal line spanning the full track width between cards
- Background: `linear-gradient(90deg, transparent, #00D9FF/20, transparent)`
- A 40px-wide radial gradient "packet" animating along it via `@keyframes dataPulse` over 3.5s infinite loop
- `mix-blend-mode: screen`, hidden below `md` breakpoint

**C. Border Beam + Inset Glow (Effect 2):**
- Each card gets `box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), inset 1px 0 0 rgba(0,217,255,0.04)`
- `.borderBeam` gets a conic-gradient background that rotates via `@keyframes borderOrbit`
- Each card's beam has a unique `animation-delay` (0s, 0.9s, 1.8s, 2.7s) so they don't sync
- Beam is masked to only show a ~30px arc segment using a radial gradient mask
- The engine's `stepCard--burst` class triggers a brighter burst flash (opacity 1 for 400ms)

**D. Scan Entrance (Effect 3):**
- Cards start with `clip-path: inset(0 100% 0 0); opacity: 0`
- When section enters viewport (via IntersectionObserver), `scanReveal` animation fires
- Staggered delays: 0ms, 400ms, 800ms, 1200ms per card
- A 2px red `::after` pseudo-element travels with the clip edge (the "scan line")
- Total reveal completes in ~1.8s

**E. Progressive Mobile Timeline (Effect 4):**
- On mobile (`< md`), cards stack vertically with a cyan vertical line on the left
- Line background: dark slate, with a `::before` pseudo-element that fills with cyan
- Fill height driven by scroll progress using an IntersectionObserver + scroll listener
- 4 dot nodes at each card position, filling to cyan as scroll passes them
- Uses `scaleY()` transform for GPU-accelerated fill animation
- Replaces the horizontal grid layout entirely on mobile

**F. Micro-Parallax on Images (Effect 5):**
- Desktop only: `onMouseMove` handler on each card
- Computes normalized cursor offset from card center
- Applies `transform: translate(Xpx, Ypx)` to the image (5-8px range)
- Image moves slightly more than card, creating depth
- Counter-dynamic shadow: `filter: drop-shadow()` with offset opposite to tilt direction
- `transition: transform 0.15s ease-out` for smooth feel
- Disabled when `prefers-reduced-motion` is active

**G. Director's Cut Extras:**
- **Grade Roulette (Step 3):** When scan reveal completes, a `setTimeout` chain cycles through F-D-C-B-A at 120ms intervals in a grade badge overlay. Final "A" locks with emerald glow.
- **Leverage Counter (Step 4):** A "$14,200" price display with cyan laser slash animation on engine pulse, cross-fading to "$11,800" with "Save $2,400" below.
- **Reduced Motion:** All animations skip; cards render instantly visible with no motion.

**H. Layout:**
- Desktop: `grid grid-cols-1 md:grid-cols-4 gap-6` (same as current)
- Mobile: `flex flex-col` with timeline on left
- Section: `aria-label="How it works - four step process"` for accessibility
- Cards: `role="group"` with `aria-labelledby`

### File 2: `src/components/signup3/useHowItWorksEngine.ts` (minor additions ~15 lines)

- Add `onBurst?: (cardIndex: number) => void` to `HowItWorksOptions` -- called when a threshold crossing triggers a burst, so the component can sync haptic shadows
- Add `gradeEl` and `priceEl` optional fields to `CardHandle` type for imperative DOM access
- No changes to core engine logic (rAF loop, IO gating, threshold crossing, hysteresis all stay)

### File 3: `src/pages/Signup3.tsx` (add keyframes to styleSheet)

- Add the 6 keyframe definitions listed above to the existing `styleSheet` constant (after the existing `slowDrift` keyframe)
- Add utility classes: `.animate-scan-reveal`, `.animate-border-orbit`, `.animate-data-pulse`
- No changes to JSX (HowItWorksSteps is already rendered at line 539)

## Technical Safeguards

- `contain: layout style paint` on every card (already present)
- `will-change: transform` toggled by IO visibility, not permanent
- `backdrop-blur` stays on Layer 0 which never receives transforms
- Mobile DOM excludes desktop-only elements via conditional render (not CSS `display:none`)
- Single rAF loop in engine drives synchronized effects
- All CSS-only animations (border orbit, data pulse) use `animation-play-state` pausing when section leaves viewport
- Images pre-warmed with `new Image()` (already present)

## No New Files or Dependencies

All changes are within the 3 existing files. No new packages needed.

