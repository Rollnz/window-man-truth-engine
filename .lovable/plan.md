

# Fix Before/After Section: Visual Balance, Alignment, and CTA Consistency

## What's Being Fixed (6 Issues)

1. **Height mismatch** -- Before card is taller than After card
2. **Visual density gap** -- Before has nested frames (outer card + dashed inner + sample doc overlay); After is a flat list
3. **Header misalignment** -- "BEFORE:" renders inside the QuoteUploadZone component (inside the card); "AFTER:" floats above the card border
4. **Nested frame difference** -- Before has a "document within a card" feel; After is just a bare card
5. **Orphan paragraph** -- "Contractors often hand you..." sits at the bottom of the Before card with disconnected spacing
6. **CTA style competition** -- Left has an orange "Download Sample" button; right has a blue primary CTA. Two different colors for file-picker triggers creates confusion

## Architecture Constraint

The "BEFORE:" header lives inside `QuoteUploadZone.tsx` (line 94-98), not in the parent page. This means to fix header alignment, I need to touch **two files**:

- `src/pages/QuoteScanner.tsx` -- restructure both column layouts
- `src/components/quote-scanner/QuoteUploadZone.tsx` -- move the "BEFORE:" header out (or let the parent control it)

## The Layout After This Fix

```text
DESKTOP (lg:grid-cols-2)
+----------------------------------------------+  +----------------------------------------------+
| rounded-xl border bg-card/40 min-h-[560px]   |  | rounded-xl border bg-card/40 min-h-[560px]   |
| p-6 flex flex-col                             |  | p-6 flex flex-col                             |
|                                               |  |                                               |
| [FileText] BEFORE: Just a Confusing Estimate  |  | [ShieldCheck] AFTER: Your AI Intelligence     |
|                                               |  |               Report                          |
| +------------------------------------------+ |  | +------------------------------------------+ |
| | Inner dashed frame (upload zone)         | |  | | Inner report frame                       | |
| | - Sample quote doc + callouts            | |  | | - Ghost report preview (bg layer)        | |
| | - Upload CTA overlay                     | |  | | - Benefit list (fg, z-10)                | |
| |                                          | |  | |                                          | |
| |                                          | |  | |                                          | |
| +------------------------------------------+ |  | +------------------------------------------+ |
|                                               |  |                                               |
| Caption: "Contractors often hand you..."      |  | [Start My Free Audit] -- pinned via mt-auto  |
+----------------------------------------------+  +----------------------------------------------+

MOBILE (stacked, same structure per card)
```

## Changes

### File 1: `src/components/quote-scanner/QuoteUploadZone.tsx`

**Move the "BEFORE:" header out of this component.**

The header (lines 93-98) and the orphan paragraph (lines 279-283) are currently inside QuoteUploadZone. To let the parent page control header placement consistently across both columns:

- Remove the header `div` (lines 93-98) from inside QuoteUploadZone
- Remove the orphan paragraph (lines 279-283) from inside QuoteUploadZone
- Export both as separate optional renders, OR simply let the parent render them

This way both headers live in `QuoteScanner.tsx` at the same structural level.

### File 2: `src/pages/QuoteScanner.tsx`

**Restructure both columns to be symmetrical:**

**Both columns get the same outer frame:**
- `rounded-xl border border-border bg-card/40 dark:bg-background/30 min-h-[560px] p-6 flex flex-col`

**Both columns render their header INSIDE the card at the top:**
- Left: `[FileText] BEFORE: Just a Confusing Estimate` (rose colored, moved from QuoteUploadZone)
- Right: `[ShieldCheck] AFTER: Your AI Intelligence Report` (primary colored, moved from above the card into it)

**After card idle state gets an inner report frame:**
- Wrap the ghost preview + benefit list in: `relative flex-1 rounded-xl border border-border/60 bg-muted/10 overflow-hidden`
- Strengthen the ghost preview to look like a recognizable report structure:
  - "Report Header" bar
  - Row of 5 score chip placeholders
  - "Top Flags" section with 3 warning rows (dot + bar)
  - "Missing Items" section with 2 rows
  - Vignette overlay for readability: `bg-gradient-to-b from-background/0 via-background/0 to-background/60`

**Orphan paragraph becomes a caption:**
- Render the "Contractors often hand you..." text below the upload zone inside the left card as: `mt-4 text-sm text-muted-foreground leading-relaxed`

**CTA unification:**
- Both CTAs use `variant="default" size="lg"` (primary color)
- Left copy: "Upload Your Quote" (unchanged)
- Right copy: "Start My Free Audit" (was "See What I Flag")
- Same click handler on both (triggers file picker)

**Equal height enforcement:**
- Both outer cards: `min-h-[560px]`
- Inner content uses `flex-1`
- Right CTA pinned with `mt-auto`

## Files Modified

| File | What Changes |
|------|-------------|
| `src/components/quote-scanner/QuoteUploadZone.tsx` | Remove header and orphan paragraph (they move to parent) |
| `src/pages/QuoteScanner.tsx` | Restructure both column layouts, add inner report frame, unify headers and CTAs |

## What Does NOT Change

- Upload hooks, refs, gating phases, modals
- Analytics events
- Any other page sections
- No new dependencies

