

# Fix: Testimonial Text Contrast in Case File Cards

## Problem

The expandable testimonial text in `CaseFileCard.tsx` uses `text-secondary-foreground` which resolves to:
- **Dark mode**: `220 20% 6%` (near-black) -- on the dark `bg-dossier-folder` card, this is unreadable
- **Light mode**: `0 0% 100%` (white) -- works if the card background is dark

The attribution line ("-- Sarah J., Boca Raton, FL") uses `text-slate-400` which is also too low-contrast in dark mode.

## Fix (2 lines in `src/components/beat-your-quote/CaseFileCard.tsx`)

**Line 151** -- Testimonial text:
- Change `text-secondary-foreground` to `text-white/90`
- This guarantees high contrast on the dark dossier card in both themes

**Line 154** -- Attribution name:
- Change `text-slate-400` to `text-white/60`
- Provides readable but visually subordinate attribution text

Both changes use opacity-modified white, which works reliably against the dark dossier card background regardless of theme mode. This avoids depending on semantic tokens that flip between themes when the card background itself does not flip.

## Files

| File | Line | Before | After |
|------|------|--------|-------|
| `CaseFileCard.tsx` | 151 | `text-secondary-foreground` | `text-white/90` |
| `CaseFileCard.tsx` | 154 | `text-slate-400` | `text-white/60` |

