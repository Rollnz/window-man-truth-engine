
# Extract ForensicBadge + Fix 4-Card Horizontal Layout

## Two Changes

### 1. Extract ForensicBadge to a standalone section header above the strip

**In `src/components/quote-scanner/ScanPipelineStrip.tsx`:**
- Remove the `ForensicBadge` function (lines 201-246)
- Remove the `<ForensicBadge isMobile={isMobile} />` call (line 938)

**In `src/pages/QuoteScanner.tsx`:**
- Import `SectionFrame` from `@/components/proof/SectionFrame` and the `aiBrainImg` asset
- Wrap the `<ScanPipelineStrip />` inside a `<SectionFrame>` with:
  - **Eyebrow**: AI brain icon + "FORENSIC ALLY" (rendered as a ReactNode with the icon inline)
  - **Title**: "See Exactly How We Protect You"
  - **Subtitle**: "Our AI scans every line of your quote in seconds -- here's the 4-step process."
- This elevates the badge into a proper section header with `h2` typography, scroll-reveal animations, and consistent site-wide styling

### 2. Force all 4 cards on one horizontal line (desktop/tablet)

The current desktop grid uses `gridTemplateColumns: "1fr auto 1.3fr auto 0.8fr auto 1fr"` which can overflow on narrower viewports (768-960px range).

**Fix in `ScanPipelineStrip.tsx`:**
- Change the grid to use equal fractions: `"1fr auto 1fr auto 1fr auto 1fr"` -- this distributes space evenly and prevents any card from being disproportionately wide
- Reduce beam connector width from `60px` to `40px` to reclaim horizontal space
- Add `min-width: 0` to each card cell to allow CSS Grid to shrink content rather than overflow
- The mobile vertical stack remains unchanged -- all 4 cards stay stacked vertically on mobile

**Net result on desktop**: All 4 cards + 3 connectors sit on a single horizontal line at any width above the mobile breakpoint (768px).

---

## Technical Details

### `src/components/quote-scanner/ScanPipelineStrip.tsx`

| Line | Change |
|------|--------|
| 201-246 | Delete `ForensicBadge` function |
| 938 | Delete `<ForensicBadge isMobile={isMobile} />` |
| 972 | Change `gridTemplateColumns` to `"1fr auto 1fr auto 1fr auto 1fr"` |
| 983, 992, 1001 | Reduce beam wrapper `width` from `60` to `40` |
| 978, 987, 996, 1005 | Add `minWidth: 0` to each cell style |

### `src/pages/QuoteScanner.tsx`

| Line | Change |
|------|--------|
| Imports | Add `SectionFrame` and `aiBrainImg` |
| 102 | Replace bare `<ScanPipelineStrip />` with `<SectionFrame>` wrapper containing the new header + strip as children |

### What does NOT change

- All 4 scene components (Extraction, AI Brain, Database, Red Flags) -- untouched
- Mobile vertical layout -- untouched
- Particle beam animations -- untouched
- RotatingValueProp -- untouched
- All other page sections -- untouched
