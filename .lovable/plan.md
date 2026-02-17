

# Polish the Before/After Section -- Visual Parity + Ghost Preview

## Scope

Only `src/pages/QuoteScanner.tsx` is modified. No hooks, modals, analytics, or dependencies change.

## Changes

### 1. Match Card Frames

Both columns currently have different outer styles. The Before card inherits whatever `QuoteUploadZone` renders (dashed border upload area), while the After card uses `rounded-xl border border-border bg-card`.

**Fix:** Wrap the left column's content in the same `rounded-xl border border-border bg-card min-h-[400px] p-6` container that the right column uses. This makes both cards look like a matched pair in both themes. The dashed upload styling stays *inside* this frame as content, not as the outer border.

### 2. Blurred Ghost Report Preview (Pure CSS, No Images)

Add an `absolute inset-0` layer inside the After card (idle phase only) that renders a faint "ghost report" using divs styled with theme tokens:

- A fake header bar (`bg-muted/40 rounded h-4 w-3/4`)
- 3 stacked "score tile" rows (small colored dot + gray bar placeholders)
- A fake "warning row" with a slightly different width

The entire layer gets `opacity-40 blur-[1px] pointer-events-none` so it's visible but never competes with the benefit list text above it. The card becomes `relative` and the benefit list content gets `relative z-10`.

All colors use `bg-muted`, `bg-primary/20`, `border-border` -- zero hardcoded values.

### 3. Top-Align Idle Layout + Pin CTA to Bottom

Change the idle state container from `items-center justify-center` (vertically centered) to `justify-between` with the CTA wrapped in an `mt-auto` container. This fills the vertical space and pins the button to the lower third, matching the visual weight of the left card.

The layout becomes:
```text
+---------------------------+
| [ShieldCheck icon]        |
| Your Report Will Include  |
|  - 5 category scores      |
|  - Missing scope items    |
|  - Fine print alerts      |
|  - Fair price comparison  |
|  - Negotiation scripts    |
|                           |
|   [ See What I Flag ]     |
+---------------------------+
```

### 4. Differentiate CTA Copy

Change the right-side CTA text from "Upload Your Quote" to "See What I Flag". Same `onClick` handler (triggers the file picker via `uploadRef`), just different copy so the two buttons don't feel redundant.

## Technical Detail

All changes are within lines 167-225 of `src/pages/QuoteScanner.tsx`:

- **Line 174**: Add `relative` to the After card's className
- **Lines 186-225**: Replace the idle phase block with the new top-aligned layout + ghost preview background layer + updated CTA copy
- **Lines 112-165**: Wrap the left column's phase-conditional content in a matching card frame

No new files, no new imports, no new dependencies.

## Definition of Done

- After card has a faint ghost report preview behind the benefit list (idle phase only)
- Both cards share the same outer frame style (`rounded-xl border border-border bg-card`)
- After card content is top-aligned with CTA pinned to the bottom
- Right CTA reads "See What I Flag"; left CTA unchanged
- Correct in both light and dark mode (all semantic tokens, zero hardcoded colors)

