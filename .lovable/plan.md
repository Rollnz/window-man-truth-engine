

# Fix AFTER Card: Blurred Report Preview + Matched Frame

## Scope: ONLY the right column idle state (lines 199-257)

The Before card is NOT touched. Headers stay outside both cards.

## Exact Changes to `src/pages/QuoteScanner.tsx`

### 1. Replace idle-state wrapper classes (line 200)

**Current:**
```
border border-dashed border-border/60 rounded-xl p-6
```

**New:**
```
relative rounded-xl border-2 border-dashed border-border/40 overflow-hidden
```

This matches the Before card's heavier dashed frame.

### 2. Add blurred ghost report layer (new code, inside the wrapper, before content)

A CSS-only fake report rendered as an `absolute inset-0` background:

- A large circle (w-20 h-20) at the top center representing the score donut
- A text bar placeholder below it
- 5 horizontal bars (h-2 rounded-full, varying widths) representing score categories
- 3 pill-shaped rows representing flagged items
- All wrapped in `blur-sm opacity-25 pointer-events-none` so it is a ghost, not readable
- A vignette overlay div on top: `absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/80`

### 3. Content layer stays identical (on top of blur)

Wrap existing content in `relative z-10 p-8 h-full flex flex-col items-center justify-center text-center`:

- ShieldCheck icon circle (unchanged)
- "Your Report Will Include" heading (unchanged)
- "Upload a quote to unlock your full analysis" subtitle (unchanged)
- 5 bullet points with primary dots (unchanged)
- "Start My Free Audit" button (mt-6, unchanged)
- "No Quote Yet?" + "Get a Free Consultation" button (unchanged)

### 4. CTA spacing

`mt-6` on the CTA block -- buttons sit directly under the bullets, not pushed to the card bottom.

## What Does NOT Change

- Before card (left column) -- zero changes
- Headers outside cards -- zero changes
- Upload hooks, refs, gating phases, modals, analytics -- zero changes
- Other phases (uploaded, locked, analyzing, revealed) -- zero changes
- Any other page sections -- zero changes
- QuoteUploadZone component -- zero changes

## File Modified

| File | Lines Affected |
|------|---------------|
| `src/pages/QuoteScanner.tsx` | ~199-257 (idle state block only) |

