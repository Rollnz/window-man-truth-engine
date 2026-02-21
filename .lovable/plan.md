

# Homepage Visual Redesign -- Adapted to Project Standards

## What You Want (and What I'd Do Differently)

Your diff introduces custom CSS classes (`.home-band`, `.home-band--failure`, `.section-divider`, etc.) with `::before` and `::after` pseudo-elements. This is solid CSS, but it conflicts with this project's established approach:

- **This project avoids custom CSS classes for layout/styling.** Everything uses Tailwind utility classes and theme tokens (`surface-1/2/3`, `--primary`, `--secondary`).
- **Pattern utilities already exist** in `src/index.css` (`.pattern-diagonal`, `.pattern-grid`, `.pattern-lines`, `.pattern-steps`) -- they're used at the card level inside FailurePointsSection already.
- **Edge glow dividers already exist** in `Index.tsx` as inline Tailwind radial gradients.
- **Ambient mesh blobs already exist** in FailurePoints and WeaponizeAudit sections.

So the adaptation: I'll achieve the same visual result using the project's existing systems instead of adding a new CSS class layer.

---

## What Changes

### 1. Section Background Gradients (replacing flat surface tokens)

Instead of `.home-band--failure { background: linear-gradient(...) }`, I'll apply the warm-to-cool gradient directly as Tailwind arbitrary values on each section's root element.

| Section | Current | New |
|---|---|---|
| FailurePoints | `bg-[hsl(var(--surface-2))]` | `bg-gradient-to-b from-[hsl(34,34%,96.8%)] to-[hsl(210,26%,96.1%)]` |
| SecretPlaybook | `bg-[hsl(var(--surface-1))]` | `bg-gradient-to-b from-[hsl(210,28%,96.8%)] to-[hsl(32,24%,97.2%)]` |
| WeaponizeAudit | `bg-[hsl(var(--surface-3))]` | `bg-gradient-to-b from-[hsl(28,30%,97.2%)] to-[hsl(210,24%,95.9%)]` |

These are the exact gradient values from your diff, applied as Tailwind classes instead of custom CSS.

### 2. Section-Level Background Patterns (new)

The project already has card-level pattern classes. For section-wide patterns, I'll add three new utility classes to `src/index.css` that are minimal and follow the existing pattern convention:

- `.pattern-crosshatch` -- FailurePoints section (blueprint crosshatch, your `::before` from `--failure`)
- `.pattern-dots` -- SecretPlaybook section (dot grid, your `::before` from `--playbook`)
- `.pattern-scanlines` -- WeaponizeAudit section (horizontal scan lines + vertical cadence, your `::before` from `--weaponize`)

These follow the exact same structure as the existing `.pattern-diagonal`, `.pattern-grid`, etc. -- just tuned for section-scale use with lower opacity.

### 3. Stronger Glow Dividers (tuning existing)

The dividers already exist in `Index.tsx`. I'll increase their opacity from `0.05-0.06` to `0.15-0.20` and use `clamp()` for responsive height, matching your diff's `clamp(52px, 7vw, 84px)` intent.

### 4. Reduced-Motion Support (new)

I'll add a `@media (prefers-reduced-motion: reduce)` block that disables the new pattern overlays and glow dividers. This matches your diff's accessibility approach.

### 5. Mobile Density Tuning

The new pattern classes will include a `@media (max-width: 768px)` override to reduce pattern density on small screens, matching your diff's mobile rules.

---

## Files Updated

| File | Change |
|---|---|
| `src/index.css` | Add `.pattern-crosshatch`, `.pattern-dots`, `.pattern-scanlines` utilities + reduced-motion rule |
| `src/components/home/FailurePointsSection.tsx` | Section root: gradient bg + `pattern-crosshatch` class |
| `src/components/home/SecretPlaybookSection.tsx` | Section root: gradient bg + `pattern-dots` class |
| `src/components/home/WeaponizeAuditSection.tsx` | Section root: gradient bg + `pattern-scanlines` class |
| `src/pages/Index.tsx` | Strengthen existing glow divider opacity/sizing |

## What Does NOT Change

- All text, CTAs, icons, business logic, and component structure
- Existing ambient mesh blobs (already present)
- MarketReality, WhoIsWindowMan, SampleReport, FinalDecision sections (already well-styled)
- Mobile responsiveness and accessibility of content
- Hero section

## Technical Details

The new pattern classes follow the exact convention of the existing ones (lines 404-482 of `index.css`):

```css
/* Section-scale crosshatch (FailurePoints) */
.pattern-crosshatch { position: relative; }
.pattern-crosshatch::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.042;
  background:
    repeating-linear-gradient(45deg, hsl(var(--primary) / 0.11) 0 1px, transparent 1px 13px),
    repeating-linear-gradient(-45deg, hsl(var(--secondary) / 0.09) 0 1px, transparent 1px 15px);
  pointer-events: none;
  z-index: 0;
}
```

Each section component will add `isolation: isolate` via Tailwind's `isolate` class and ensure content sits above the pattern with `relative z-10` on the container.

The reduced-motion rule:
```css
@media (prefers-reduced-motion: reduce) {
  .pattern-crosshatch::before,
  .pattern-dots::before,
  .pattern-scanlines::before { opacity: 0 !important; }
}
```

