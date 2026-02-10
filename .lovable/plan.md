

# Transform "Before" Section to Match Reference Screenshot

## What Changes

Restyle the "Before: Just a Confusing Estimate" upload zone to be a 1:1 square card with repositioned callout badges matching the reference screenshot.

## File: `src/components/quote-scanner/QuoteUploadZone.tsx`

### 1. Make the container square (1:1 aspect ratio)

Replace the `min-h-[300px] md:min-h-[400px]` sizing with `aspect-square` to enforce a 1:1 ratio. Remove the min-height constraints entirely.

### 2. Reposition callout badges to match the reference

Current positions vs. target:

| Callout | Current Position | Target Position | Z-Index |
|---------|-----------------|-----------------|---------|
| Price Warning (red) | `top-20 right-0` | `top-3 right-0` (top-right corner) | z-[5] (behind upload card) |
| Legal Clause (red) | `top-4 left-0` | `bottom-8 right-0` (bottom-right) | z-[5] (behind upload card) |
| Warranty Issue (yellow) | `bottom-10 right-0` | `top-1/2 -translate-y-1/2 left-0` (left-center, vertically centered) | z-[5] (behind upload card, partially obscured) |
| Missing Scope (red) | `bottom-24 left-0` | `bottom-8 left-0` (bottom-left corner) | z-[5] (behind upload card) |

### 3. Fix z-index layering

- Callouts: `z-[5]` -- they sit behind the upload card
- Upload CTA card overlay: `z-10` (already set) -- it sits on top
- This creates the effect where the yellow "Warranty Issue" badge is partially obscured by the centered Analyze Quote card

### 4. Show all callouts on mobile

Remove `hideMobile` from both the Price Warning and Warranty Issue callouts so they display on all screen sizes (the square layout has room for all four).

### 5. Add entrance animation

Add an IntersectionObserver-based trigger so callout badges animate in (slide + fade) when the section scrolls into view, using the existing `animate-in fade-in slide-in-from-left/right` classes with staggered delays via inline `style={{ animationDelay }}`.

## File: `src/components/quote-scanner/EnhancedFloatingCallout.tsx`

### 6. Accept animation delay prop

Add an optional `animationDelay` prop (string like `"200ms"`) that gets applied as `style={{ animationDelay }}` on the root div. Also add `fill-mode-forwards` and start with `opacity-0` so callouts are hidden until they animate in.

## Summary of visual result

- Square 1:1 card container
- Red "Price Warning" badge in top-right corner, clearly visible
- Yellow "Warranty Issue" badge on the left side, partially behind the centered upload card
- Red "Missing Scope" badge in bottom-left corner, fully visible
- Red "Legal Clause" badge in bottom-right corner, fully visible
- All four callouts slide in with staggered animation as the user scrolls to this section
- Upload card stays centered and clickable on top of everything

