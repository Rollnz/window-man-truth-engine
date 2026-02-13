

# Prompt 2: Live Threat Detection Cards — IMPLEMENTED ✅

## What Was Built

Created `WarningCard` component and injected 9 data-driven threat cards into Layer 2 of `QuoteScannerHero`.

### Files Changed

| File | Action |
|------|--------|
| `src/components/quote-scanner/WarningCard.tsx` | Created: two-wrapper HUD card with animKey retrigger and will-change-transform |
| `src/components/quote-scanner/QuoteScannerHero.tsx` | Updated: added WARNING_DATA array (9 cards across 3 rounds), render in Layer 2 with causality-correct reveal |
| `tailwind.config.ts` | Updated: added glitch-pop keyframe + animation |

### Key Guarantees

1. **Reveal Causality**: Raw `card.y` drives timing; clamped Y drives placement only
2. **Monotonic Progress**: scanProgress derived from performance.now(), strictly increasing within round
3. **Transform Isolation**: Outer wrapper positions, inner wrapper animates
4. **Deterministic Retrigger**: animKey increments on visible false→true transition
5. **Opacity Ownership**: ONLY outer wrapper has opacity utility classes; inner wrapper uses keyframe opacity only
6. **Reduced Motion**: Uses `transition-opacity duration-300` (not animate-fade-in) since that animation isn't defined
7. **Mobile Performance**: will-change-transform on inner wrapper
8. **No Layer 2 Dimming**: No additional overlays between cards and frost
