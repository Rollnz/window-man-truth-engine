

# Add "Threat Card" Gallery to Failure Points Section

## What's Changing
Insert a row of 3 tactical card images between the accordion grid ("The Four Failure Points") and the closing quote block ("When something goes wrong..."). The cards are the uploaded images: Permit Purgatory Trap, Excludes Labor Loophole, and Monster Anchor Quote.

## Layout
- 3 cards in a horizontal row on desktop (`grid-cols-3`), stacked on mobile (`grid-cols-1`)
- Each card has a subtle "lift" effect: `shadow-xl` + slight negative `translateY` to float above the section
- Hover state adds more lift (`hover:-translate-y-1 hover:shadow-2xl`) for interactivity

## Scroll Animations
- Left card: slides in from the **left**
- Right card: slides in from the **right**
- Center card: slides in from **below** (direction `up`)
- Staggered delays (0ms, 100ms, 200ms) so they cascade in

## Performance Considerations
- All 3 images use `loading="lazy"` and `decoding="async"` so they don't block LCP or increase initial payload
- Images are stored in `src/assets/` and imported as ES modules for Vite optimization (hashing, compression)
- Wrapped in existing `AnimateOnScroll` component which uses `IntersectionObserver` (no scroll listeners) and respects `prefers-reduced-motion`
- `will-change` is cleaned up automatically by `AnimateOnScroll` after animation completes

## UX Suggestions I'd Recommend
1. **Rounded corners + subtle border**: Add `rounded-xl border border-white/10` to give them a polished, contained feel that matches the Command Center Noir aesthetic elsewhere on the site
2. **Max width cap on each card**: ~220px per card so they don't stretch too wide on large screens, keeping the "collectible card" proportion
3. **`aspect-auto`**: Let the natural card aspect ratio dictate height rather than forcing a fixed ratio, avoiding distortion

## Technical Details

### New assets (copy 3 files)
- `user-uploads://CARD_-_PERMIT_TRAP.webp` -> `src/assets/card-permit-trap.webp`
- `user-uploads://CARD_-_EXLUDES_LABOR_1.webp` -> `src/assets/card-excludes-labor.webp`
- `user-uploads://CARD_-_MONSTER_ANCHOR.webp` -> `src/assets/card-monster-anchor.webp`

### Modified file: `src/components/home/FailurePointsSection.tsx`
- Import the 3 card images
- Insert a new `div` block between lines 141 and 142 (after the accordion grid, before the closing quote)
- The block contains a `grid` with 3 `AnimateOnScroll` wrappers, each holding an `img` tag
- Cards get: `rounded-xl shadow-xl -translate-y-2 hover:-translate-y-3 hover:shadow-2xl transition-all duration-300 border border-white/10`

No new components or dependencies needed -- this uses the existing `AnimateOnScroll` wrapper and standard Tailwind utilities.
