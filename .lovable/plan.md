

# Z-Index Swap: Upload Button Above Callouts

## Problem
On mobile, the warning callouts (z-20) sit above the upload overlay (z-10), blocking clicks on the primary CTA.

## Fix: Two Class Changes in `src/components/audit/UploadZoneXRay.tsx`

### 1. Raise upload overlay z-index
On the `<label>` element (the upload overlay, ~line 269), change `z-10` to `z-30`.

### 2. Increase background opacity
On that same `<label>`, change `bg-slate-900/60` to `bg-slate-900/80` so the button text stays readable with warnings sitting underneath.

## Result
- **Mobile:** Warnings remain visible through the darker overlay but no longer block clicks
- **Desktop:** No visual change (callouts already float outside the card edges)
- **Design/layout:** Unchanged

## Files

| File | Change |
|------|--------|
| `src/components/audit/UploadZoneXRay.tsx` | `z-10` -> `z-30`, `bg-slate-900/60` -> `bg-slate-900/80` on the upload label |

