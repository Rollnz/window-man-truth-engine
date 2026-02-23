

# Before Card Mobile Redesign

## Problems to Fix

1. Wasted vertical space from forced `aspect-square` on mobile
2. Sample quote + callouts invisible behind the CTA overlay
3. Two CTAs competing with equal visual weight
4. Dashed border feels unfinished
5. No persuasive context inside the card itself

## Solution: Compact Persuasion-First Upload Card

Remove the `aspect-square` on mobile, kill the hidden sample quote layer, and redesign the CTA block as a tight, trust-building action card.

### File: `src/components/quote-scanner/QuoteUploadZone.tsx`

**Change 1: Drop aspect-square on mobile**
- Line 100: Change `"aspect-square"` to `"aspect-auto min-h-[320px] md:aspect-square"`
- This lets the card size to its content on mobile instead of forcing a giant empty square

**Change 2: Hide the sample quote + callouts on mobile**
- Lines 180-216: Wrap the `showBeforeUploadOverlay` block in a `hidden md:block` container
- The sample quote is a desktop showpiece. On mobile it's invisible behind the CTA anyway -- remove the wasted render

**Change 3: Redesign the CTA overlay for mobile**
- Replace the current card-in-a-card layout with a cleaner structure:
  - Remove the inner `bg-card/95 ... rounded-2xl` wrapper on mobile (the parent card already provides the surface)
  - Add a short persuasion line: "Most quotes have hidden issues. Find yours in 60 seconds."
  - Make "Upload Your Quote" the dominant full-width CTA
  - Demote "Download Sample" to a text link (`variant="ghost"`, smaller size) instead of a competing orange button
  - Replace the dashed border with a solid subtle border on mobile: `border-dashed md:border-dashed border-solid` or just remove the dashed style entirely and use the parent card's border

**Change 4: Swap dashed border for solid on mobile**
- Line 99: Change to `"relative rounded-xl border-2 md:border-dashed border-border/60 transition-all duration-300 overflow-hidden"`
- Solid border on mobile, dashed only on desktop where the sample quote context makes the "drop zone" metaphor make sense

**Change 5: Add a micro trust signal inside the card**
- Below the description text, add a small inline trust badge: a Shield icon + "Free and private" in muted text
- This replaces the persuasion void with a friction-reducer

### Visual Result (Mobile)

```text
+----------------------------------+
|                                  |
|        [Scan icon]               |
|     Analyze Your Quote           |
|                                  |
|  Most quotes have hidden issues. |
|  Find yours in 60 seconds.       |
|                                  |
|  [====== Upload Your Quote =====]|
|                                  |
|  No quote yet? Download a sample |
|                                  |
|     Shield  Free and private     |
+----------------------------------+
```

### Files Changed

| File | What |
|------|------|
| `src/components/quote-scanner/QuoteUploadZone.tsx` | All 5 changes above -- aspect ratio, hidden sample on mobile, CTA hierarchy, border style, trust signal |

No new files. No new dependencies. The parent card in `QuoteScanner.tsx` (lines 171-179) stays untouched -- it already provides the surface, shadow, and border for the Before column.

