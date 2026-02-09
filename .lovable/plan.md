

# Fix Visual Fidelity: Grid, Transparency, Containers & Hierarchy

## What's Wrong (Root Causes)

1. **Invisible grid**: `.tp-circuit-bg` has `position: relative` (line 1455) which overrides Tailwind's `absolute inset-0`, collapsing the grid to 0px height.
2. **Flat grid pattern**: The current CSS uses thin 1px line gradients. The reference image shows a **3D beveled tile** effect -- each square cell has visible edges/ridges giving an embossed, padded look. This requires an `inset box-shadow` trick or layered gradients to simulate depth on each tile.
3. **Opaque cards**: Cards use solid `bg-slate-900/80` -- the grid can't bleed through.
4. **Floating data stream**: No container wrapping the "Live data stream" elements.
5. **Wrong heading hierarchy**: The main heading is oversized; the subheading is undersized.
6. **Cyan accent colors**: The user explicitly says no cyan. Keep text white or use the site's Industrial Blue (`text-sky-600` / `text-primary`).

## Changes

### File 1: `src/index.css` (lines 1454-1460)

**Fix**: Remove `position: relative` and upgrade the grid pattern to a 3D beveled tile effect matching the reference image.

Replace the `.tp-circuit-bg` block with:

```css
.tp-circuit-bg {
  background-color: #020617;
  background-image:
    /* Horizontal ridge lines */
    linear-gradient(0deg, #262B3C 1px, transparent 1px),
    /* Vertical ridge lines */
    linear-gradient(90deg, #262B3C 1px, transparent 1px),
    /* Subtle inner highlight per cell (top-left light) */
    linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 50%),
    /* Subtle inner shadow per cell (bottom-right dark) */
    linear-gradient(0deg, rgba(0,0,0,0.15) 0%, transparent 50%);
  background-size: 48px 48px;
}
```

This creates the quilted/embossed tile look from the reference -- dark squares with lighter ridge lines and per-cell shading for 3D depth.

Also update the radial overlay (`.tp-section::before`, lines 1462-1471) to use the same color family instead of blue:

```css
.tp-section::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.35;
  background:
    radial-gradient(circle at 20% 0%, rgba(38,43,60,0.6), transparent 55%),
    radial-gradient(circle at 80% 100%, rgba(38,43,60,0.5), transparent 60%);
}
```

### File 2: `src/components/quote-scanner/AIComparisonSection.tsx`

**A. Heading hierarchy swap (lines 87-101)**

- Make "Why AI instead of human advisors?" a small uppercase label (like the reference shows it at the very top)
- Make "Unbiased Comparison. Data Driven insight. Updated Daily" the hero-sized heading
- Use `text-white` for "Unbiased Comparison." and `text-primary` (Industrial Blue) for "Data Driven insight. Updated Daily" -- no cyan
- Reorder: label first, then badge, then hero heading, then body text

```tsx
{/* Small uppercase label */}
<p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
  Why AI instead of human advisors?
</p>

{/* AI Advantage badge */}
<div className="flex items-center gap-3">
  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium">
    <span className="block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
    AI Advantage
  </span>
</div>

{/* Hero heading */}
<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight max-w-xl">
  Unbiased Comparison.{' '}
  <span className="text-primary">Data Driven insight. Updated Daily</span>
</h2>

{/* Body text (unchanged) */}
```

**B. Semi-transparent cards with backdrop blur (lines 113, 137)**

Problem card:
```
bg-slate-900/80 --> bg-slate-950/40 backdrop-blur-md
```

Solution card:
```
bg-slate-900/80 --> bg-slate-950/40 backdrop-blur-md
```

Solution card top gradient bar: change `from-blue-500/80 to-cyan-400/40` to `from-blue-500/80 to-blue-400/40` (remove cyan).

**C. Wrap "Live data stream" in a frosted container (lines 41-65)**

Add a container div around the data stream elements:

```tsx
<div className="w-full max-w-xs rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm space-y-3">
  {/* existing data stream label, bar, and italic text */}
</div>
```

Remove the outer `<div className="w-full max-w-xs space-y-3">` since the new container replaces it.

**D. Remove cyan from stream bar gradient (line 54)**

Change `from-blue-500 to-cyan-400` to `from-blue-500 to-blue-400`.

**E. Remove cyan dot colors (line 57)**

Change `bg-blue-400/60` to `bg-slate-400/60` (subtle neutral dots).

## Summary of Visual Changes

| Element | Before | After |
|---------|--------|-------|
| Grid background | Invisible (collapsed) flat color | Visible 3D beveled tile grid |
| Cards | Solid `bg-slate-900/80` | Semi-transparent `bg-slate-950/40 backdrop-blur-md` |
| Data stream | Floating elements | Frosted glass container `border-white/10 bg-white/5` |
| Main heading | Oversized `text-5xl` | Small uppercase label `text-sm tracking-[0.2em]` |
| Subheading | Small `text-lg` | Hero-sized `text-5xl` with `text-primary` accent |
| Cyan references | `to-cyan-400` in gradients | Replaced with `to-blue-400` |

Two files modified. No new files. No new dependencies.

