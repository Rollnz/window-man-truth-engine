

# Replace Cyan with Blue + Orange Theme Colors

## What Changes

Swap every cyan color reference in `AIComparisonSection.tsx` to use the project's Industrial Blue (`#3993DD` / `hsl(209 68% 55%)`) and Safety Orange (`hsl(25 95% 55%)`) theme. The red problem card stays red as requested.

## File: `src/components/quote-scanner/AIComparisonSection.tsx`

### 1. Embedded CSS (`STYLES` constant) -- Replace all cyan/`#2776F5` with theme blue

| Find | Replace With |
|------|-------------|
| `rgba(39,118,245,...)` (the blue in grid/glows) | `rgba(57,147,221,...)` (theme primary `#3993DD`) |
| `#2776F5` (brain color pulse target) | `#3993DD` |
| `#e6effd` (brain pulse light state) | `#d4e8f8` (lighter tint of theme blue) |
| `rgb(39 118 245)` (nodes) | `rgb(57 147 221)` |
| `rgb(244 114 182)` (rose node) | `rgb(234 138 50)` (Safety Orange node) |

### 2. JSX Tailwind classes -- Replace cyan with primary/secondary

| Current | New |
|---------|-----|
| `border-cyan-500/20` | `border-primary/20` |
| `border-cyan-500/30` | `border-primary/30` |
| `text-cyan-400` | `text-primary` |
| `text-cyan-300` | `text-primary/80` |
| `text-cyan-500/60` | `text-primary/40` |
| `bg-cyan-500/10` | `bg-primary/10` |
| `border-cyan-500/30` (badge) | `border-primary/30` |
| `from-cyan-500/80 to-blue-500/60` (stream) | `from-primary/80 to-primary/60` |
| `bg-cyan-500` (CTA button) | `bg-secondary` |
| `hover:bg-cyan-400` (CTA hover) | `hover:bg-secondary/90` |
| `text-slate-900` (CTA text) | `text-secondary-foreground` |
| `shadow-cyan-500/30` (CTA shadow) | `shadow-secondary/30` |

### 3. Solution card -- keep blue but use theme blue

The `.tp-glow-solution` CSS already uses blue tones close to theme. The JSX classes `text-blue-300` and `bg-blue-500/60` stay as-is (they align with theme primary). No change needed on the solution card or problem card (red stays).

### 4. Node colors

- Default node: theme blue (already close)
- `.tp-node-rose` renamed conceptually to orange node using Safety Orange (`rgb(234 138 50)`)

## Summary

Pure color swap -- no layout, animation, or structural changes. Every cyan instance becomes either `primary` (blue) or `secondary` (orange for CTA/accents).
