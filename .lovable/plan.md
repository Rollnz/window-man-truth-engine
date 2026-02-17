

# Fix "Missing Scope" Callout Layering on Mobile

## Problem
The "Missing Scope" callout (id: 2) sits at `z-20`, which is above the upload overlay at `z-10`. On mobile, this callout's `left: -15%` position lands directly over the upload button, blocking clicks. The other two callouts ("Price Warning" at `top: 15%, right: -10%` and "Legal Alert" at `bottom: 15%, right: -5%`) do not overlap the button.

## Fix: Conditional Z-Index on One Callout

Two changes in one file (`src/components/audit/UploadZoneXRay.tsx`):

### 1. Conditional z-index in the callout map loop (line 237)

Currently all callouts share the same class:
```
"absolute z-20 transform transition-all duration-500"
```

Change to:
```
"absolute transform transition-all duration-500",
callout.id === 2 ? "z-0 lg:z-20" : "z-20"
```

- **"Missing Scope" (id 2):** Gets `z-0` on mobile (behind the upload overlay at `z-10`), and `z-20` on desktop via `lg:z-20` (unchanged behavior).
- **All other callouts:** Stay at `z-20` everywhere (unchanged).

### 2. Upload overlay stays at z-10 (line 269)

No change needed. The label remains at `z-10`, which is between `z-0` (Missing Scope on mobile) and `z-20` (other callouts).

## Layering Summary

```text
Layer     Mobile                    Desktop
------    ----------------------    ----------------------
z-20      Price Warning, Legal      Price Warning, Legal,
          Alert                     Missing Scope
z-10      Upload Overlay            Upload Overlay
z-0       Missing Scope             (not used)
```

## Result
- **Mobile:** "Missing Scope" is visible but faded behind the semi-transparent upload overlay. It cannot block clicks. The other two callouts remain bright and on top.
- **Desktop:** No change whatsoever. All three callouts float at `z-20` as they do today.
- **No layout, design, or content changes.**

## File

| File | Change |
|------|--------|
| `src/components/audit/UploadZoneXRay.tsx` | Line 237: conditional `z-0 lg:z-20` for callout id 2, `z-20` for others |

