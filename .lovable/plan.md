

# Fix ScanPipelineStrip: Component-Local CSS Variables + Legacy Key Names

## Problem

The previous refactor mapped `C.bg` to `hsl(var(--secondary) / 0.5)`, but `--secondary` is Safety Orange (`25 95% 55%`). This produces an orange section backdrop in both Light and Dark mode (visible in the uploaded screenshots).

Additionally, the `C` object keys were renamed from the original art-direction names (`cyan`, `red`, `white`) to generic names (`primary`, `destructive`, `fg`), requiring a mass rename across 900 lines that makes future maintenance harder.

## Strategy

1. Introduce component-local `--sp-*` CSS custom properties inside `.sp-pipeline-root` (already exists as a wrapper class), with Light/Dark overrides
2. Restore the original `C` key names (`cyan`, `red`, `white`, etc.) pointing to the new `--sp-*` variables
3. Fix the wrapper background class from `bg-secondary/50` to `bg-muted/50 dark:bg-background/40`
4. Deduplicate the `sp-coreGlow` keyframe (use the CSS variable version with `--sp-accent`)

## Detailed Changes

### A. Add `--sp-*` variable declarations to `SCOPED_STYLES` (before keyframes)

Insert at the top of the SCOPED_STYLES template string:

```css
.sp-pipeline-root {
  --sp-bg: var(--muted);
  --sp-card: var(--card);
  --sp-accent: var(--primary);
  --sp-danger: var(--destructive);
  --sp-fg: var(--foreground);
  --sp-muted: var(--muted-foreground);
  --sp-border: var(--border);
}

.dark .sp-pipeline-root {
  --sp-bg: var(--background);
  --sp-card: var(--card);
  --sp-accent: var(--primary);
  --sp-danger: var(--destructive);
  --sp-fg: var(--foreground);
  --sp-muted: var(--muted-foreground);
  --sp-border: var(--border);
}
```

This creates a single indirection layer. Today both modes alias to the same global tokens, but in the future you can tune Light vs Dark independently without touching `C` or any component code.

### B. Replace the `C` constants object (lines 5-21)

Restore original key names, pointing to `--sp-*` variables:

```tsx
const C = {
  bg:         'hsl(var(--sp-bg) / 0.55)',
  bgCard:     'hsl(var(--sp-card))',
  cyan:       'hsl(var(--sp-accent))',
  cyanDim:    'hsl(var(--sp-accent) / 0.12)',
  cyanMid:    'hsl(var(--sp-accent) / 0.35)',
  cyanGlow:   'hsl(var(--sp-accent) / 0.55)',
  cyanBright: 'hsl(var(--sp-accent) / 0.85)',
  red:        'hsl(var(--sp-danger))',
  redDim:     'hsl(var(--sp-danger) / 0.15)',
  redMid:     'hsl(var(--sp-danger) / 0.4)',
  green:      '#4ade80',
  greenDim:   'rgba(74,222,128,0.2)',
  white:      'hsl(var(--sp-fg))',
  whiteDim:   'hsl(var(--sp-muted))',
  whiteFaint: 'hsl(var(--sp-border))',
};
```

### C. Bulk rename all references in the file

Every `C.primary` -> `C.cyan`, `C.primaryDim` -> `C.cyanDim`, etc. This is a mechanical find-replace across the ~900 lines:

- `C.primary` -> `C.cyan` (and all Dim/Mid/Glow/Bright variants)
- `C.destructive` -> `C.red` (and Dim/Mid variants)
- `C.fg` -> `C.white`
- `C.fgMuted` -> `C.whiteDim`
- `C.border` -> `C.whiteFaint`

### D. Update keyframes to use `--sp-accent` instead of `--primary`

```css
@keyframes sp-coreGlow {
  0%, 100% { box-shadow: 0 0 20px hsl(var(--sp-accent) / 0.20), 0 0 40px hsl(var(--sp-accent) / 0.10); }
  50%      { box-shadow: 0 0 30px hsl(var(--sp-accent) / 0.35), 0 0 60px hsl(var(--sp-accent) / 0.15); }
}
```

### E. Fix wrapper background (line 824)

**Before:**
```tsx
className="bg-secondary/50 rounded-[20px] relative overflow-hidden max-w-[960px] mx-auto"
```

**After:**
```tsx
className="bg-muted/50 dark:bg-background/40 rounded-[20px] relative overflow-hidden max-w-[960px] mx-auto"
```

### F. Gradient conversions

Any remaining `hsl(var(--background))` or `hsl(var(--card))` references in gradients will be updated to their `--sp-*` equivalents (`hsl(var(--sp-card))`, `hsl(var(--sp-bg))`).

## What Is NOT Changing

- Copy / labels / text content
- Layout, spacing, grid structure
- Animation timing, durations, easing
- IntersectionObserver logic
- RotatingValueProp (already uses semantic tokens)
- Component API / exports
- Green and amber status indicator colors

## Expected Result

- **Light Mode**: Neutral gray-blue section background (via `--muted`), readable text, white cards with subtle borders
- **Dark Mode**: Deep cinematic background (via `--background`), tech-vibe preserved with primary-colored glows
- Zero orange contamination from `--secondary`

