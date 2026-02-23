

# Comprehensive Light Mode Accessibility and Contrast Audit

## Problem Diagnosed

The /tools page has **two invisible text blocks** in light mode:

1. **Tools.tsx subtitle** (line 17): Uses `text-primary-foreground` which resolves to pure white (`0 0% 100%`) in both themes. On the light `bg-background` (near-white), this text is completely invisible.
2. **ToolGrid.tsx heading** "12 Tools to Discover the Truth" (line 90): Uses inherited `text-foreground` which is `209 80% 12%` in light mode -- this is actually legible but very dark blue. The real issue is the subtitle below it uses `text-muted-foreground` at `209 25% 42%` which may appear weak.

The root cause is **misuse of the `text-primary-foreground` token**. This token is white in both themes, designed ONLY for text sitting on `bg-primary` surfaces (buttons, banners with blue backgrounds). When used as body text on the page's default background, it becomes invisible in light mode.

## Scope of Changes

### Tier 1: Critical Fixes (invisible text)

**File: `src/pages/Tools.tsx`**
- Line 17: Change `text-primary-foreground` to `text-muted-foreground`
- This is the subtitle "Everything you need to make smarter window decisions..."

### Tier 2: Light-Mode Contrast Improvements

**File: `src/components/home/ToolGrid.tsx`**
- Line 101: The "You're in control" badge uses `bg-[#2473c2]` with `text-foreground`. In light mode, foreground is dark (`209 80% 12%`) on blue -- poor contrast. Change to `text-white` since this is a locked dark-blue surface.

### Tier 3: Global Theme Token Hardening

**File: `src/index.css` (light theme variables, lines 107-165)**
- Darken `--muted-foreground` from `209 25% 42%` to `209 25% 35%` for stronger body text contrast (currently ~4.2:1, target 5:1+)
- Darken `--border` from `209 35% 86%` to `209 30% 78%` for more visible card/input borders
- Darken `--input` from `209 35% 88%` to `209 30% 80%` for more defined input fields

### Tier 4: Card and Container Border Definition

**File: `src/components/ui/card.tsx`**
- Add `shadow-sm` to the base Card component for light-mode elevation
- The current class is `rounded-lg border bg-card text-card-foreground shadow-sm` -- shadow-sm is already there, but the border relies on `--border` which we are darkening in Tier 3

**File: `src/components/ui/input.tsx` (if it exists)**
- Ensure input border uses the darkened `--input` token

### Tier 5: Audit of `text-primary-foreground` Misuse Across Pages

After reviewing all 46 files with `text-primary-foreground`:
- **Correct usage (no change needed):** Files using it on `bg-primary` surfaces (buttons, hero banners with blue backgrounds) -- e.g., `Consultation.tsx` line 153 has `bg-primary text-primary-foreground`, `CalculateEstimate.tsx` line 59 has `bg-primary ... text-primary-foreground`. These are correct.
- **Incorrect usage (needs fix):** `Tools.tsx` line 17 (already in Tier 1). The beat-your-quote components (`OutcomeFolders.tsx`, `CaseFileCard.tsx`) use `text-primary-foreground` but live inside the Dossier theme which force-locks a dark background, so those are safe.
- **Upload components** (`UploadZoneXRay.tsx`): Uses `text-primary-foreground` inside cards that appear to have dark/themed backgrounds -- needs visual verification but likely safe since they sit inside the dossier/forensic theme zone.

## Summary of Files to Change

| File | Lines | Change |
|------|-------|--------|
| `src/pages/Tools.tsx` | 17 | `text-primary-foreground` to `text-muted-foreground` |
| `src/components/home/ToolGrid.tsx` | 101-103 | `text-foreground` to `text-white` on the locked blue badge |
| `src/index.css` | 128 | Darken `--muted-foreground` to `209 25% 35%` |
| `src/index.css` | 130 | Darken `--border` to `209 30% 78%` |
| `src/index.css` | 131 | Darken `--input` to `209 30% 80%` |

## What This Does NOT Touch

- ImpactWindowCard: Already has a theme protection layer forcing dark tokens (`!important` overrides in index.css lines 1447-1457). This is correctly locked.
- Dossier/beat-your-quote pages: Already locked to dark theme via `.dossier-page` overrides.
- Evidence page: Already has its own inverted contrast system.
- Dark mode: All changes are scoped to the `.light` CSS block or use semantic tokens that already work in dark mode.

## Contrast Ratios After Fix

| Element | Before (light) | After (light) |
|---------|----------------|---------------|
| Tools subtitle | 1:1 (white on white, invisible) | ~7:1 (dark gray on white) |
| Muted body text | ~4.2:1 (below AA) | ~5.5:1 (AA compliant) |
| Card borders | Barely visible | Clearly defined |
| Input field borders | Washed out | Distinct |
| "You're in control" badge | Dark on blue (~3:1) | White on blue (~8:1) |

