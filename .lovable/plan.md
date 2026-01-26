
# Plan: Apply Slanted Blue Gradient to Kitchen Table Guide Conversion Section

## Overview
Replace the current `bg-primary` background on the conversion section with the specified slanted blue gradient using an inline style.

---

## File to Modify

### `src/pages/KitchenTableGuide.tsx`

**Line 224** - Update the section element:

| Current | New |
|---------|-----|
| `className="py-16 bg-primary text-primary-foreground text-xl text-center sm:py-0"` | `style={{ background: 'linear-gradient(135deg, #d0e4f7 0%, #73b1e7 16%, #0a77d5 34%, #539fe1 61%, #539fe1 61%, #87bcea 100%)' }}` + adjusted className |

**Code change:**

```tsx
// Line 224 - Before
<section className="py-16 bg-primary text-primary-foreground text-xl text-center sm:py-0">

// Line 224 - After
<section 
  className="py-16 text-white text-xl text-center sm:py-0"
  style={{ background: 'linear-gradient(135deg, #d0e4f7 0%, #73b1e7 16%, #0a77d5 34%, #539fe1 61%, #539fe1 61%, #87bcea 100%)' }}
>
```

---

## Additional Text Color Updates

Since the gradient goes from light blue (#d0e4f7) to medium blue (#0a77d5), text colors need adjustment for proper contrast:

| Line | Element | Current | New |
|------|---------|---------|-----|
| 227 | H2 heading | (inherits) | `text-slate-900` (dark text on light gradient areas) |
| 228 | Subtitle | `text-primary-foreground/80` | `text-slate-700` |
| 268 | "Why is this free?" | `text-primary-foreground` | `text-slate-900` |
| 269-271 | Explanation text | `text-primary-foreground/80` | `text-slate-700` |

---

## Technical Details

- **Gradient Direction**: 135deg (diagonal from top-left to bottom-right)
- **Color Stops**: Light blue → Medium blue → Deep blue → Lighter blue
- **Performance Impact**: Negligible - CSS gradients are GPU-accelerated and add minimal file size

---

## Summary

| Change | Description |
|--------|-------------|
| Background | `bg-primary` → inline gradient style |
| Section text | `text-primary-foreground` → `text-slate-900` for contrast |
| Subtitle text | `text-primary-foreground/80` → `text-slate-700` |

This creates the slanted blue depth effect while maintaining readable text contrast across the gradient.
