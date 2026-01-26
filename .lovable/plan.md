
# Plan: Fix Evidence Page Contrast with Inverted Theme

## Summary
Invert the Evidence page so the background swaps between themes while elements stay locked for proper contrast.

## The Problem

The Evidence page uses global semantic tokens (`bg-background`, `bg-card`, `text-foreground`, etc.) that all change together when the theme switches:

- **Dark mode**: Dark background (`#0f1318`) + dark cards → dark on dark = poor contrast
- **Light mode**: Light background (`#f8fafc`) + light cards → light on light = poor contrast

## What You Want

| Theme | Background | Elements |
|-------|------------|----------|
| Dark | White/light | Stay dark-themed (readable on white) |
| Light | Dark | Stay light-themed (readable on dark) |

Only the background inverts. Elements stay locked.

## Solution

### Step 1: Add wrapper class to Evidence page

**File: `src/pages/Evidence.tsx`**

Change line 119:
```tsx
// Before
<div className="min-h-screen bg-background">

// After  
<div className="min-h-screen evidence-inverted">
```

### Step 2: Add CSS overrides for the Evidence page

**File: `src/index.css`**

Add new rules that override tokens ONLY inside `.evidence-inverted`:

```css
/* ============================================
   EVIDENCE PAGE - Inverted Contrast
   Background swaps, elements stay locked
   ============================================ */

/* Dark mode: Force WHITE background, elements use LIGHT theme colors */
:root .evidence-inverted,
.dark .evidence-inverted {
  --background: 210 35% 98%;
  --foreground: 209 80% 12%;
  --card: 0 0% 100%;
  --card-foreground: 209 80% 12%;
  --muted: 209 30% 92%;
  --muted-foreground: 209 25% 42%;
  --border: 209 35% 86%;
  --popover: 0 0% 100%;
  --popover-foreground: 209 80% 12%;
}

/* Light mode: Force DARK background, elements use DARK theme colors */
.light .evidence-inverted {
  --background: 220 20% 6%;
  --foreground: 210 40% 98%;
  --card: 220 18% 10%;
  --card-foreground: 210 40% 98%;
  --muted: 220 15% 18%;
  --muted-foreground: 215 20% 68%;
  --border: 220 12% 22%;
  --popover: 220 18% 10%;
  --popover-foreground: 210 40% 98%;
}
```

## Technical Details

| Aspect | Before | After |
|--------|--------|-------|
| Dark mode background | `#0f1318` (dark) | `#f8fafc` (white) |
| Dark mode cards | `#181c22` (dark) | `#ffffff` (white) |
| Light mode background | `#f8fafc` (white) | `#0f1318` (dark) |
| Light mode cards | `#ffffff` (white) | `#181c22` (dark) |

## Why This Works

By scoping the variable overrides to `.evidence-inverted`:
- The Evidence page gets inverted tokens
- All other pages remain unaffected
- Child components automatically pick up the inverted values through CSS custom properties
- No changes needed to CaseFileCard, FilterBar, or other components

## Files Modified

1. `src/pages/Evidence.tsx` - Add `evidence-inverted` class (1 line)
2. `src/index.css` - Add scoped CSS variable overrides (~25 lines)
