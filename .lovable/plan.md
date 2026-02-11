

## Comprehensive UI/UX Upgrade for /sample-report

### Overview
Transform the Sample Report page with scroll-triggered entrance animations, 3D depth/shadow enhancements, and interactive hover effects -- all using the existing `AnimateOnScroll` component and Tailwind CSS (no new dependencies needed).

---

### 1. Entrance Animations (Scroll-Triggered)

**Approach:** Extend and reuse the existing `AnimateOnScroll` component which already supports `direction`, `delay`, and `duration` props with IntersectionObserver. No framer-motion needed.

#### HeroSection (page-load animation)
- Wrap the left column (badge, heading, description, CTAs) in staggered `AnimateOnScroll` wrappers with `delay` offsets (0, 100, 200, 300ms) and `duration={700}`.
- Wrap the right column (Quote Safety Score card) with `AnimateOnScroll direction="right" duration={800} delay={200}`.

#### ComparisonSection (slide-in left/right)
- "Human View" card: `AnimateOnScroll direction="left" duration={700}`.
- "AI View" card: `AnimateOnScroll direction="right" duration={700} delay={150}`.
- Section heading: `AnimateOnScroll duration={600}` (default fade-up).

#### ScoreboardSection
- Score card: `AnimateOnScroll duration={700}` (fade-up). Internal animations (ring, bars) already trigger on IntersectionObserver visibility.

#### PillarAccordionSection (staggered slide-up)
- Wrap each `PillarAccordion` item in `AnimateOnScroll` with `delay={index * 120}` and `duration={700}` for a staggered cascade effect.

#### HowItWorksSection (staggered steps)
- Wrap each step card in `AnimateOnScroll` with `delay={index * 150}` and `duration={700}`.

#### LeverageOptionsSection (Option A/B cards)
- Option A: `AnimateOnScroll direction="left" duration={700}`.
- Option B: `AnimateOnScroll direction="right" duration={700} delay={150}`.

#### CloserSection
- Heading and CTAs: `AnimateOnScroll duration={700}`.

---

### 2. 3D Depth and Shadow Overhaul

**Approach:** Apply consistent multi-layered shadows and hover transforms via Tailwind utility classes.

#### New shared card style (applied across all primary cards):
```
shadow-xl shadow-black/5 dark:shadow-black/20
hover:shadow-2xl hover:scale-[1.02] transition-all duration-300
```

#### Specific targets:
- **ComparisonSection cards** ("Human View" and "AI View"): Add `shadow-xl` base + `hover:shadow-2xl hover:scale-[1.02]` + `transition-all duration-300`.
- **ScoreboardSection card**: Already has `shadow-lg` -- upgrade to `shadow-xl` + hover lift effect.
- **PillarAccordion items**: Add `shadow-lg` base + `hover:shadow-xl hover:scale-[1.01]` (subtle since these are interactive accordions).
- **HowItWorksSection step cards** (mobile): Add `shadow-md` + `hover:shadow-lg`.
- **Option A/B cards**: Deep shadow treatment (see section 3 below).

---

### 3. Section-Specific Enhancements

#### PillarAccordionSection -- Smooth Expand
- The current `max-h` transition (`max-h-[600px]` toggle) already provides height animation. Enhance by:
  - Adding `opacity` transition to the inner content (fade from 0 to 1 on expand).
  - Wrapping inner content div with `transition-opacity duration-300` and toggling `opacity-0` / `opacity-100` based on `isOpen`.

#### Option A/B Cards -- Gradient Glow + Border Enhancement
- **Option A**: Add a subtle `ring-1 ring-primary/10` and `shadow-xl` + `hover:shadow-2xl hover:scale-[1.02]`.
- **Option B** (already has `border-2 border-primary/30`): Add a gradient glow effect using a pseudo-element or `shadow-[0_0_30px_-5px_hsl(var(--primary)/0.2)]` for a soft primary-color glow. Enhance hover with `hover:shadow-[0_0_40px_-5px_hsl(var(--primary)/0.3)] hover:scale-[1.02]`.

---

### Technical Details

#### Files Modified:

| File | Changes |
|------|---------|
| `src/components/sample-report/HeroSection.tsx` | Add `AnimateOnScroll` wrappers around hero elements with staggered delays |
| `src/components/sample-report/ComparisonSection.tsx` | Add `AnimateOnScroll` (left/right) to cards, add shadow + hover classes |
| `src/components/sample-report/ScoreboardSection.tsx` | Upgrade shadow to `shadow-xl`, add hover effect |
| `src/components/sample-report/PillarAccordionSection.tsx` | Staggered `AnimateOnScroll` per pillar, opacity fade on expand, shadow + hover |
| `src/components/sample-report/HowItWorksSection.tsx` | Staggered `AnimateOnScroll` per step card |
| `src/components/sample-report/LeverageOptionsSection.tsx` | Left/right `AnimateOnScroll` on Option cards, gradient glow + shadow |
| `src/components/sample-report/CloserSection.tsx` | `AnimateOnScroll` on heading + CTA block |

#### Key Principles:
- No new dependencies -- uses existing `AnimateOnScroll` component + Tailwind utilities.
- All animations respect `prefers-reduced-motion` (already built into `AnimateOnScroll`).
- Duration kept at 600-800ms range for "medium-paced" feel as requested.
- Hover effects use `transition-all duration-300` for fluid interactions.
- Deterministic patterns preserved (no `Math.random()` per project architecture rules).

