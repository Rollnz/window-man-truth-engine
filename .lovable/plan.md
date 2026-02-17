
# Before/After Section — Clean Layout (Completed)

## What Changed

1. **Headers moved outside cards** — BEFORE and AFTER titles sit above their respective card containers
2. **No outer borders** — Cards use `bg-card/40` background only, no `border border-border`
3. **Dual CTAs on both cards** — Upload + No Quote path on each side for lead capture
4. **Tighter CTA spacing** — Buttons sit right below content with `mb-6` gap, no `mt-auto` pushing to bottom
5. **Symmetrical sizing** — Both cards use `min-h-[520px]`
6. **Orphan caption removed** — "Contractors often hand you..." text removed for clean layout

## Files Modified

| File | What Changed |
|------|-------------|
| `src/pages/QuoteScanner.tsx` | Headers outside cards, no borders, dual CTAs, trackEvent import, FileDown import |

## What Did NOT Change
- QuoteUploadZone component (already has Upload + No Quote CTAs)
- Upload hooks, refs, gating phases, modals, analytics
- Any other page sections
