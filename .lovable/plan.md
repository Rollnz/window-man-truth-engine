

# Fix the Before/After Visual Balance

## The Core Problem

The right card's `bg-card/40` is nearly invisible on a dark background, so it looks like the right side has no card at all. The left card only looks like a card because QuoteUploadZone renders its own dashed border internally -- the outer wrapper is invisible on both sides.

## Changes (QuoteScanner.tsx only)

### 1. Add a visible dashed border to the right card
Match the left card's visual language by giving the right column's idle-state content a dashed border frame:
`border border-dashed border-border/60 rounded-xl p-6`

This creates the same "artifact in a frame" look as the left side's upload zone.

### 2. Unify CTA colors
Both the "Upload Your Quote" and "Download Sample" buttons on the left currently have different orange tones. The right has blue. Fix:
- Primary CTA (both sides): default variant (blue)
- Secondary CTA (both sides): outline variant (border only)

### 3. Fill the right card's vertical space
The benefit list + CTAs end at ~40% of the card height. Fix by letting the inner content container use `flex-1 justify-between` so the benefit list sits at top and CTAs pin toward the bottom, filling the visual space to match the left card.

### 4. Keep headers outside (as they are now)
Headers are correctly positioned outside the cards. No change needed.

## File Modified

| File | Change |
|------|--------|
| `src/pages/QuoteScanner.tsx` | Add dashed border frame to right idle state, unify CTA button variants, adjust vertical fill |

## What Does NOT Change
- QuoteUploadZone component
- Upload logic, hooks, modals, analytics
- Left card structure (it already has its dashed frame from QuoteUploadZone)
- Header placement (stays outside)

