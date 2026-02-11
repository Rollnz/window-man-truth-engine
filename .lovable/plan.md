

# Refactor: ScanPipelineStrip — Semantic Theme Compliance

## Scope

Single file: `src/components/quote-scanner/ScanPipelineStrip.tsx` (914 lines)

Every visual color in this component flows through a hardcoded `C` constants object (hex/rgba) and inline `style` props. No Tailwind color classes are used at all -- it's all inline CSS.

## Strategy

Because the component is built on inline styles (SVG strokes, absolute positioning, CSS animations), we **cannot** simply swap to Tailwind utility classes. Instead:

1. Replace the `C` constants object with CSS custom property references (`hsl(var(--primary))`, `hsl(var(--foreground))`, etc.)
2. Replace hardcoded colors in the `SCOPED_STYLES` keyframes string with the same CSS variables
3. Convert the section wrapper and card cells to use Tailwind classes where practical
4. SVG `stroke`/`fill` attributes will use the CSS variable string format since they accept any valid CSS color

## Color Mapping

```text
Old constant           -->  New semantic value
--------------------------------------------------------------
C.bg (#0b1018)         -->  hsl(var(--secondary)) with /50 opacity  (section bg)
C.bgCard (#0d1520)     -->  hsl(var(--card))
C.cyan (#00e5ff)       -->  hsl(var(--primary))
C.cyanDim (0.12)       -->  hsl(var(--primary) / 0.12)
C.cyanMid (0.35)       -->  hsl(var(--primary) / 0.35)
C.cyanGlow (0.55)      -->  hsl(var(--primary) / 0.55)
C.cyanBright (0.85)    -->  hsl(var(--primary) / 0.85)
C.red (#ff3d5a)        -->  hsl(var(--destructive))
C.redDim (0.15)        -->  hsl(var(--destructive) / 0.15)
C.redMid (0.4)         -->  hsl(var(--destructive) / 0.4)
C.green (#4ade80)      -->  Keep as-is (semantic green for "pass" indicators in SVG)
C.greenDim (0.2)       -->  Keep as-is (only used in tiny SVG check icons)
C.white (#e8edf5)      -->  hsl(var(--foreground))
C.whiteDim (0.5)       -->  hsl(var(--muted-foreground))
C.whiteFaint (0.15)    -->  hsl(var(--border))
```

**Note on green/amber**: These are used exclusively inside the Red Flag Report SVG for semantic "pass" (green check) and "warn" (amber triangle) indicators. They are **status colors**, not theme accents. Keeping them as fixed values is correct -- they represent data states, not brand color.

## Detailed Changes

### A. Replace the `C` constants object (lines 5-21)

Replace with a function or object that returns CSS variable strings:

```tsx
const C = {
  bg:         'hsl(var(--secondary) / 0.5)',
  bgCard:     'hsl(var(--card))',
  primary:    'hsl(var(--primary))',
  primaryDim: 'hsl(var(--primary) / 0.12)',
  primaryMid: 'hsl(var(--primary) / 0.35)',
  primaryGlow:'hsl(var(--primary) / 0.55)',
  primaryBright:'hsl(var(--primary) / 0.85)',
  destructive:'hsl(var(--destructive))',
  destructiveDim:'hsl(var(--destructive) / 0.15)',
  destructiveMid:'hsl(var(--destructive) / 0.4)',
  green:      '#4ade80',           // status color (pass)
  greenDim:   'rgba(74,222,128,0.2)',
  fg:         'hsl(var(--foreground))',
  fgMuted:    'hsl(var(--muted-foreground))',
  border:     'hsl(var(--border))',
};
```

Then rename all references throughout the file:
- `C.cyan` -> `C.primary`
- `C.cyanDim` -> `C.primaryDim`
- `C.cyanMid` -> `C.primaryMid`
- `C.cyanGlow` -> `C.primaryGlow`
- `C.cyanBright` -> `C.primaryBright`
- `C.red` -> `C.destructive`
- `C.redDim` -> `C.destructiveDim`
- `C.redMid` -> `C.destructiveMid`
- `C.white` -> `C.fg`
- `C.whiteDim` -> `C.fgMuted`
- `C.whiteFaint` -> `C.border`

### B. Update SCOPED_STYLES keyframes (lines 24-47)

Replace hardcoded `rgba(0,229,255,...)` in keyframes with CSS variable equivalents:

```css
/* Before */
box-shadow: 0 0 20px rgba(0,229,255,0.2), 0 0 40px rgba(0,229,255,0.1);

/* After */
box-shadow: 0 0 20px hsl(var(--primary) / 0.2), 0 0 40px hsl(var(--primary) / 0.1);
```

All 4 keyframe rules that reference cyan will be updated.

### C. Section wrapper (lines 823-832)

Convert from inline style to Tailwind classes + minimal inline for border-radius/padding:

```tsx
<div
  className="bg-secondary/50 rounded-[20px] relative overflow-hidden max-w-[960px] mx-auto"
  style={{ padding: isMobile ? '24px 12px' : '32px 28px' }}
>
```

### D. Cell factory function (lines 808-817)

Update `cell()` to use semantic colors:

```tsx
const cell = (delay: number, borderOverride?: string): CSSProperties => ({
  position: 'relative',
  background: 'hsl(var(--card))',
  borderRadius: 16,
  border: `1px solid ${borderOverride || C.primaryDim}`,
  overflow: 'hidden',
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(20px)',
  transition: `opacity 0.6s ${delay}s ease, transform 0.6s ${delay}s ease`,
});
```

### E. Sub-components (bulk rename)

Every sub-component (ForensicBadge, ExtractionScene, AIBrainScene, DatabaseScene, RedFlagScene, ParticleBeam, CircuitTraces, VerticalBeam) will have its color references updated via the renamed `C` object. No layout, spacing, or animation timing changes.

### F. Gradient conversions

All inline gradients like:
```
linear-gradient(180deg, ${C.bgCard}, #0a0f16)
```
become:
```
linear-gradient(180deg, hsl(var(--card)), hsl(var(--background)))
```

Any standalone dark hex (`#080d14`, `#0a0f16`, `#111a28`) maps to `hsl(var(--background))`.

## What Is NOT Changing

- Copy / labels / text content
- Layout, spacing, grid structure
- Animation timing, durations, easing
- IntersectionObserver logic
- RotatingValueProp (already uses semantic tokens -- `hsl(var(--primary))` and `hsl(var(--muted-foreground))`)
- Component API / exports
- Green (#4ade80) and amber (#fbbf24) status indicator colors in Red Flag Report SVG icons

## Potential Challenges

1. **CSS `hsl()` with `/` opacity in SVG attributes**: SVG `stroke` and `fill` accept CSS color values when used in HTML (not standalone SVG files), so `hsl(var(--primary))` works. Verified this is inline SVG in JSX.

2. **Keyframe `box-shadow` with CSS variables**: `hsl(var(--primary) / 0.2)` inside a `@keyframes` block works in modern browsers. The existing code already uses `rgba()` in keyframes, so this is a direct swap.

3. **No visual regression in dark mode**: The current `--primary` in dark mode maps to the Industrial Blue, not the legacy neon cyan. The forensic vibe will shift from cyan to blue -- this is intentional per the theme spec. The section will look cohesive with the rest of the site.

## Verification Checklist

- Light Mode: section bg is light gray/white (via --secondary), text readable, cards separated by border + subtle shadow
- Dark Mode: section feels "forensic/tech" with primary-colored glows, no washed-out panels
- Zero hardcoded hex/rgba values remain (except green/amber status colors)
- Animations unchanged in timing and behavior
- `prefers-reduced-motion` still respected

## Implementation Order

Single file edit -- the entire `C` object replacement + bulk find-replace of constant names propagates through all sub-components automatically since they all read from the same `C` object.

## Analytics Integration Points

None. This component has no tracking events -- it's a purely visual/animated section.

## File Structure

No new files. No new components. Single file refactor of `src/components/quote-scanner/ScanPipelineStrip.tsx`.

