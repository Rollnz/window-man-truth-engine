

# Fix: Keep Subtext Horizontal on Mobile

## Problem
On mobile, the subtext beneath the headings — "We beat your quote" and "We can't beat it" — is wrapping to multiple lines, breaking the compact folder-tab design.

## Changes (1 file)

**File: `src/components/beat-your-quote/OutcomeFolders.tsx`**

### Heading fixes (from previous approval, included here for completeness)
1. **Line 290** — "WE BEAT IT" h4: Add `whitespace-nowrap` and responsive sizing (`text-lg sm:text-2xl`)
2. **Line 344** — "OR VALIDATE IT" h4: Add `whitespace-nowrap` and responsive sizing (`text-base sm:text-xl`)

### Subtext fixes (this request)
3. **Line 293** — "We beat your quote" p tag: Add `whitespace-nowrap`
4. **Line 347** — "We can't beat it" p tag: Add `whitespace-nowrap`

## What Does NOT Change
- Expand/collapse behavior, state logic, analytics tracking
- All other text, icons, layout, and styling
- No other files touched

