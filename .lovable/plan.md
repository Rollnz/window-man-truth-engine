

# Increase Orange Shadow Intensity + Add Forensic Border Glow

## Changes

### 1. `src/components/forensic/FindingCard.tsx`

**Shadow intensity increase** -- boost opacity values from 0.25/0.15 to 0.45/0.30 (resting) and 0.60/0.40 (hover), making the warm #ffc672 glow much more visible:

```
SHADOW:       '0 8px 24px -6px rgba(255,198,114,0.45), 0 18px 40px -22px rgba(255,198,114,0.30)'
SHADOW_HOVER: '0 14px 40px -8px rgba(255,198,114,0.60), 0 30px 70px -30px rgba(255,198,114,0.40)'
```

**Orange border glow** -- replace the plain `border border-border/20` with a gradient border technique matching `glow-border-secondary` but using the `#ffc672` forensic orange. Add a new CSS class `.glow-border-forensic` (see below) and apply it to the card's `className`.

### 2. `src/components/forensic/MidPageCTA.tsx`

**Shadow intensity increase** on the inner card -- boost from 0.30/0.15 to 0.50/0.30:

```
CTA_SHADOW: '0 12px 32px -8px rgba(255,198,114,0.50), 0 24px 56px -16px rgba(255,198,114,0.30)'
```

### 3. `src/index.css`

Add a new `.glow-border-forensic` class (alongside the existing `glow-border-secondary` block) using `#ffc672` (approximately `hsl(37 100% 73%)`):

```css
.glow-border-forensic {
  border: 1px solid transparent;
  border-radius: 1rem;
  background:
    linear-gradient(hsl(var(--card)), hsl(var(--card))) padding-box,
    linear-gradient(135deg, rgba(255,198,114,0.5) 0%, transparent 50%) border-box;
  transition: all 0.3s ease;
}

.glow-border-forensic:hover {
  background:
    linear-gradient(hsl(var(--card)), hsl(var(--card))) padding-box,
    linear-gradient(135deg, rgba(255,198,114,0.7) 0%, rgba(255,198,114,0.25) 50%, transparent 80%) border-box;
}
```

Also add reduced-motion and mobile overrides to match the existing glow-border patterns.

## Summary

| File | What changes |
|---|---|
| `FindingCard.tsx` | Shadow opacity nearly doubled; swap border class to `.glow-border-forensic` |
| `MidPageCTA.tsx` | Shadow opacity boosted ~65% |
| `src/index.css` | New `.glow-border-forensic` class + reduced-motion/mobile rules |

No other files touched. No new dependencies.

