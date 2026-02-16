

# Fix Card Height Mismatch: Corrected CSS + Full-Height After Card

## Problem

Two issues after upload + analysis:

1. **Left "Before" card inflates** -- `FilePreviewCard` renders a `<div>` (not an `<img>`) for PDF placeholders, so `object-contain` is ignored. The `w-full` + `aspect-[3/4]` combo forces the height to `width * 1.33` (~667px), blowing up the card.
2. **Right "After" card is cramped** -- `overflow-auto` and `min-h-[500px]` force the results into a small scrollable box instead of letting the report flow naturally at full height.

## Fix 1: FilePreviewCard sizing in the left panel (lines 155-165)

**Current (broken):**
```
className="w-full h-full object-contain ..."
```

**Corrected:**
```
className="h-full max-h-[420px] w-auto aspect-[3/4] mx-auto ..."
```

Why this works:
- `h-full max-h-[420px]` -- height fills parent but caps at 420px
- `w-auto` -- width is calculated FROM the capped height via aspect ratio (420 * 0.75 = 315px)
- `aspect-[3/4]` -- maintains the portrait document shape without distortion
- `mx-auto` -- centers the narrower card in the column
- `object-contain` removed -- it's a no-op on `<div>` elements

## Fix 2: Right "After" card fully expands in revealed state (line 302)

**Current:**
```
className="... min-h-[500px] overflow-auto"
```

**Changed to:**
```
className="... min-h-[500px] overflow-visible"
```

Remove internal scrolling. The card grows to fit ALL report content. The user scrolls the page normally from the browser scrollbar -- no awkward card-level scroll.

## Fix 3: Grid alignment (line 465)

Add `items-start` (not `items-stretch`) to the grid. This way:
- The left "Before" card stays compact at its natural height
- The right "After" card can grow taller than the left without forcing the left to match
- No empty whitespace problem from stretching

**Current:**
```
className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto"
```

**Changed to:**
```
className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto items-start"
```

## Files Changed

| File | Lines | Change |
|------|-------|--------|
| `src/components/audit/UploadZoneXRay.tsx` | 155-165 | Fix FilePreviewCard className: `h-full max-h-[420px] w-auto aspect-[3/4] mx-auto` (remove `w-full`, `object-contain`) |
| `src/components/audit/UploadZoneXRay.tsx` | 302 | Change `overflow-auto` to `overflow-visible` on revealed Card |
| `src/components/audit/UploadZoneXRay.tsx` | 465 | Add `items-start` to grid container |

## Result

| Before fix | After fix |
|-----------|-----------|
| Left card: ~667px (aspect ratio inflates uncapped width) | Left card: ~420px max, centered portrait shape |
| Right card: fixed-height with internal scroll | Right card: expands fully, no internal scroll |
| Grid columns: implicit stretch | Grid columns: `items-start`, each card at natural height |

