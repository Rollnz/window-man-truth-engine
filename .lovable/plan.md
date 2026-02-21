

# Idea 2: Gradient Bridge + Faint Glow Accent

## Summary

Replace all 5 edge glow dividers in `Index.tsx` with layered backgrounds that combine:
1. A **linear gradient** blending the exact end-color of the section above into the start-color of the section below (seamless bridge)
2. A **faint radial glow** layered on top (primary or secondary, 8% opacity) to preserve the subtle "energy line" that guides scrolling

## Single File Changed

**`src/pages/Index.tsx`** -- lines 87, 90, 93, 96, 99

Each divider `div` gets a `style` prop with a two-layer `background` instead of the current single radial gradient class.

## Divider-by-Divider Spec

### Divider 1 (line 87): MarketReality to FailurePoints
- Top: `hsl(var(--surface-1))`
- Bottom: `hsl(34,34%,96.8%)`
- Accent: primary @ 8%

### Divider 2 (line 90): FailurePoints to WhoIsWindowMan
- Top: `hsl(210,26%,96.1%)`
- Bottom: `hsl(var(--surface-3))`
- Accent: secondary @ 8%

### Divider 3 (line 93): WhoIsWindowMan to SecretPlaybook
- Top: `hsl(var(--surface-3))`
- Bottom: `hsl(210,28%,96.8%)`
- Accent: primary @ 8%

### Divider 4 (line 96): SecretPlaybook to SampleReport
- Top: `hsl(32,24%,97.2%)`
- Bottom: `hsl(var(--surface-2))`
- Accent: secondary @ 8%

### Divider 5 (line 99): SampleReport to WeaponizeAudit
- Top: `hsl(var(--surface-2))`
- Bottom: `hsl(28,30%,97.2%)`
- Accent: primary @ 8%

## Implementation Pattern

Each divider becomes:
```html
<div
  className="h-[clamp(52px,7vw,84px)]"
  style={{
    background: `radial-gradient(ellipse at center, hsl(var(--primary) / 0.08) 0%, transparent 60%), linear-gradient(to bottom, hsl(var(--surface-1)), hsl(34,34%,96.8%))`
  }}
  aria-hidden="true"
/>
```

The `style` prop is used because Tailwind arbitrary values don't support multi-layer backgrounds cleanly. The height stays as a Tailwind class.

## What Does NOT Change
- All section components (no files touched except Index.tsx)
- All content, CTAs, animations, and business logic
- Ambient mesh blobs and pattern overlays remain as-is

