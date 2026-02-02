

# Homepage Visual Enhancement Plan

## Overview

Add premium visual polish to the FailurePointsSection with staggered scroll animations, gradient glow borders, and optional blueprint overlays. Two implementation paths provided.

---

## Option A: With Images (Higher Visual Impact)

Requires 4 custom images uploaded to `/public/images/homepage/`

### Image Specifications

You would need to upload these 4 images:

**1. `wear-tear-diagram.svg` or `.png`**
- Content: Window cross-section cutaway showing glass layers, spacer, and frame seal
- Style: Technical drawing with thin lines (1-2px)
- Color: Single color, works with CSS filter or native orange `#F97316`
- Size: 500x400px, < 30KB
- Transparency: Yes (PNG-24 or SVG)

**2. `code-blueprint.svg` or `.png`**
- Content: Architectural blueprint fragment with:
  - "DP-50" annotation in a callout box
  - Dimension lines with arrows
  - Grid lines at ~45 degree angle
  - "HVHZ" zone indicator
- Style: Blueprint/technical drawing
- Color: Monochrome (will be tinted via CSS)
- Size: 600x400px, < 35KB

**3. `denied-document.svg` or `.png`**
- Content: Faded insurance form/permit with:
  - Horizontal lines suggesting text
  - A checkbox area
  - "CLAIM DENIED" or just "DENIED" stamp rotated -12deg
- Style: Ghosted paperwork aesthetic
- Color: Red tones for stamp, grey for document
- Size: 500x600px, < 40KB

**4. `estimate-invoice.svg` or `.png`**
- Content: Itemized estimate/invoice showing:
  - Line items with prices
  - Subtotal, fees, total structure
  - One line highlighted: "Hurricane Deductible: 2%"
- Style: Clean receipt/invoice format
- Color: Monochrome with one orange highlight
- Size: 400x500px, < 35KB

### Implementation Changes

#### 1. Update FailurePointsSection.tsx

```text
Changes:
- Import AnimateOnScroll component
- Wrap each FailurePoint in AnimateOnScroll with staggered delays
- Add relative positioning and overflow-hidden for overlay support
- Add ghosted image as absolute-positioned background
- Apply glow border gradient
```

Structure per card:
```
<AnimateOnScroll delay={index * 100}>
  <div class="relative overflow-hidden glow-border-secondary">
    {/* Ghosted image overlay */}
    <div class="absolute inset-0 opacity-[0.08] pointer-events-none hidden md:block">
      <img src={backgroundImage} class="absolute right-[-10%] top-[-10%] w-[80%] h-auto" />
    </div>
    
    {/* Existing card content */}
    <FailurePoint ... />
  </div>
</AnimateOnScroll>
```

#### 2. Add CSS Utilities to index.css

```css
/* Glow border - warning/risk theme (Safety Orange) */
.glow-border-secondary {
  border: 1px solid transparent;
  background: 
    linear-gradient(hsl(var(--card)), hsl(var(--card))) padding-box,
    linear-gradient(135deg, hsl(var(--secondary) / 0.4) 0%, transparent 50%) border-box;
  transition: all 0.3s ease;
}

.glow-border-secondary:hover {
  background: 
    linear-gradient(hsl(var(--card)), hsl(var(--card))) padding-box,
    linear-gradient(135deg, hsl(var(--secondary) / 0.6) 0%, hsl(var(--secondary) / 0.2) 50%, transparent 80%) border-box;
}

/* Glow border - positive/solution theme (Primary Blue) */
.glow-border-primary {
  border: 1px solid transparent;
  background: 
    linear-gradient(hsl(var(--card)), hsl(var(--card))) padding-box,
    linear-gradient(135deg, hsl(var(--primary) / 0.3) 0%, transparent 50%) border-box;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .glow-border-secondary,
  .glow-border-primary {
    animation: none !important;
    transition: none !important;
  }
}
```

#### 3. File Structure

```
public/
  images/
    homepage/
      wear-tear-diagram.svg
      code-blueprint.svg  
      denied-document.svg
      estimate-invoice.svg
```

---

## Option B: Without Images (Pure CSS, Faster Implementation)

No image assets required. Uses geometric patterns and CSS gradients.

### Implementation Changes

#### 1. Update FailurePointsSection.tsx

Same stagger animation approach, but replace image overlays with CSS patterns:

```text
Changes:
- Import AnimateOnScroll component
- Wrap each FailurePoint in AnimateOnScroll with staggered delays
- Add glow border gradient
- Add subtle geometric pattern overlay via CSS (no images)
```

Pattern approach per card type:
```
Card 1: Diagonal lines pattern (suggests inspection)
Card 2: Grid/dot pattern (suggests blueprints)  
Card 3: Horizontal lines (suggests document)
Card 4: Stepped lines (suggests pricing tiers)
```

#### 2. CSS Pattern Overlays

```css
/* Technical pattern overlay - diagonal lines */
.pattern-diagonal::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.04;
  background: repeating-linear-gradient(
    45deg,
    hsl(var(--secondary)),
    hsl(var(--secondary)) 1px,
    transparent 1px,
    transparent 20px
  );
  pointer-events: none;
}

/* Blueprint pattern - grid dots */
.pattern-grid::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.06;
  background-image: radial-gradient(
    circle at 1px 1px,
    hsl(var(--secondary)) 1px,
    transparent 1px
  );
  background-size: 24px 24px;
  pointer-events: none;
}

/* Document pattern - horizontal lines */
.pattern-lines::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 18px,
    hsl(var(--secondary)) 18px,
    hsl(var(--secondary)) 19px
  );
  pointer-events: none;
}
```

---

## Shared Implementation (Both Options)

### CTA Button Enhancement

Add subtle "breathing" glow to primary CTAs:

```css
@keyframes cta-breathe {
  0%, 100% { 
    box-shadow: 0 0 20px hsl(var(--secondary) / 0.3); 
  }
  50% { 
    box-shadow: 0 0 35px hsl(var(--secondary) / 0.5); 
  }
}

.cta-glow {
  animation: cta-breathe 4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .cta-glow {
    animation: none;
    box-shadow: 0 0 20px hsl(var(--secondary) / 0.3);
  }
}
```

### Mobile Considerations

```css
/* Mobile: faster stagger, no overlays */
@media (max-width: 767px) {
  .pattern-diagonal::before,
  .pattern-grid::before,
  .pattern-lines::before {
    display: none;
  }
  
  /* Reduce glow intensity on mobile */
  .glow-border-secondary {
    background: 
      linear-gradient(hsl(var(--card)), hsl(var(--card))) padding-box,
      linear-gradient(135deg, hsl(var(--secondary) / 0.2) 0%, transparent 40%) border-box;
  }
}
```

---

## Technical Implementation Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/home/FailurePointsSection.tsx` | Add AnimateOnScroll wrapper with stagger, add overlay divs, add glow-border class |
| `src/index.css` | Add `.glow-border-secondary`, `.glow-border-primary`, pattern classes, CTA animation |
| `src/components/home/HeroSection.tsx` | Add `.cta-glow` class to primary Button |

### Performance Guardrails

- All animations use `transform` and `opacity` only (GPU-accelerated)
- IntersectionObserver with `threshold: 0.3` (not 0 - prevents edge triggering)
- Images lazy-loaded with `loading="lazy"` attribute
- CSS patterns use `pointer-events: none` to avoid hit-test overhead
- `will-change: transform, opacity` on animated elements

### Accessibility

- `prefers-reduced-motion` checks in AnimateOnScroll (already implemented)
- CSS fallback for reduced motion users
- No auto-playing animations that can't be stopped
- Color contrast maintained (overlays at 3-8% opacity don't affect readability)

---

## Recommendation

**Start with Option B (no images)** - it delivers 80% of the visual impact with:
- Zero asset dependencies
- Faster implementation
- No image optimization needed
- Easier to adjust/iterate

**Add images later** if you want more brand-specific visuals. When ready, I can help specify exact image requirements for a designer or AI image generator.

---

## Implementation Order

1. Add glow border CSS utilities
2. Wrap FailurePoints in AnimateOnScroll with stagger delays
3. Add pattern overlays (Option B) or image overlays (Option A)
4. Add CTA breathing animation
5. Test on mobile and with reduced-motion preference
6. Verify performance in Chrome DevTools throttling

