

# Truth Pillar Pages Redesign - Visual Consistency Overhaul

## The Problem

The 4 Truth Pillar pages (`/window-cost-truth`, `/window-risk-and-code`, `/window-sales-truth`, `/window-verification-system`) look like generic blog posts compared to the rich, immersive visual experience of the homepage and `/sample-report`. Here's exactly what's wrong:

### Audit Findings

| Issue | Pillar Pages | Homepage / Sample Report |
|-------|-------------|--------------------------|
| **Hero** | Plain text on flat background, no gradient or depth | Full-viewport gradient hero with radial glows, animated badge, text-shadow effects |
| **Animations** | Zero scroll animations | `AnimateOnScroll` on every section, staggered reveals, animated score counters |
| **Cards** | Basic `Card` with `hover:border-primary/50` only | `rounded-2xl`, `shadow-xl`, `hover:shadow-2xl hover:scale-[1.02]`, colored top borders, icon containers with tinted backgrounds |
| **Content blocks** | Raw `prose` block -- wall of text, no visual breakup | Stat cards, gradient callout boxes, segmented bars, social proof tickers |
| **Section spacing** | `py-8` / `py-12` -- tight | `py-20 md:py-32` -- generous breathing room |
| **Section dividers** | `border-t border-border` -- thin flat lines | Gradient backgrounds (`bg-[hsl(var(--surface-1))]`), layered sections |
| **Typography** | Standard h2/h3, no accent colors | Colored accent spans, text-shadow glows, `tracking-tight` on headings |
| **Backgrounds** | Flat `bg-background` everywhere | Alternating surface layers, radial gradient orbs, gradient-to-b transitions |
| **CTAs** | Basic `Button` at bottom | Gradient `variant="cta"` with glow, hover arrow animation, supporting microcopy |
| **AccordionContent** | `text-black` (hardcoded -- breaks dark mode!) | Uses theme tokens |
| **Social proof** | None | `UrgencyTicker`, stat counters, trust badges |

---

## Solution: Component-Driven Redesign

Rather than patching CSS, create reusable section components that match the homepage/sample-report visual standard, then rebuild each pillar page using them.

### New Shared Components (create once, reuse across all 4 pages)

**1. `PillarHeroSection`** -- Full-viewport gradient hero with radial glow orbs, animated badge, accent-colored heading spans, dual CTA buttons with glow, and `AnimateOnScroll` entrance animations.

**2. `PillarStatBar`** -- A horizontal stat strip (like MarketRealitySection's StatCards) showing 3 key numbers relevant to the pillar (e.g., "$1,200/yr in energy waste", "31% claims denied", "40-60% hidden cost gap"). Each stat has an icon, colored top bar, and staggered scroll-in animation.

**3. `PillarContentBlock`** -- Replaces raw `prose` walls. Alternating layout: left-aligned content blocks with a colored sidebar accent, pull-quote callout boxes with gradient backgrounds (matching the homepage's `bg-card/50 border border-border/50` pattern), and bullet lists inside elevated cards rather than raw `ul` elements.

**4. `PillarCalloutCard`** -- A gradient-bordered card for key insights (like the homepage's "When something goes wrong, insurers don't look at intent..." box). Uses `bg-gradient-to-br from-primary/10 to-secondary/5 border border-primary/20 rounded-2xl p-8`.

**5. `PillarGuideCard`** (replaces current flat cards) -- Elevated card with icon container (tinted background + border), shadow-xl base, hover:shadow-2xl + scale-[1.02] lift, colored top accent bar, and `AnimateOnScroll` stagger.

**6. `PillarCTASection`** -- A gradient-backed full-width CTA section (not a plain centered button). Uses `bg-gradient-to-br from-primary/10 to-secondary/5`, large heading, supporting copy, `variant="cta"` button with glow, and microcopy below.

### File Changes

**Create new files:**
- `src/components/pillar/PillarHeroSection.tsx`
- `src/components/pillar/PillarStatBar.tsx`
- `src/components/pillar/PillarContentBlock.tsx`
- `src/components/pillar/PillarCalloutCard.tsx`
- `src/components/pillar/PillarGuideCard.tsx`
- `src/components/pillar/PillarCTASection.tsx`
- `src/components/pillar/index.ts` (barrel export)

**Refactor existing files:**
- `src/pages/WindowCostTruth.tsx` -- Rebuild using new pillar components
- `src/pages/WindowRiskAndCode.tsx` -- Rebuild using new pillar components
- `src/pages/WindowSalesTruth.tsx` -- Rebuild using new pillar components
- `src/pages/WindowVerificationSystem.tsx` -- Rebuild using new pillar components

### Per-Page Content Strategy

Each page gets unique content data but the same visual framework:

**WindowCostTruth:**
- Stats: "$1,200+/yr" energy waste, "40-60%" hidden cost gap, "25-30yr" premium lifespan
- Callout: "Budget windows cost 2-3x more over a decade"
- Content broken into 3 visual blocks: Hidden Economics, Florida Cost Equation, What Quotes Don't Tell You

**WindowRiskAndCode:**
- Stats: "150+ mph" wind zones, "45%" max insurance discount, "9,000" pressure test cycles
- Callout: "One weak point can cause catastrophic failure"
- Content: HVHZ Requirements, Outside HVHZ, Insurance Implications

**WindowSalesTruth:**
- Stats: "30-50%" built-in margin, "3 days" FL cancellation right, "4" common manipulation tactics
- Callout: "No legitimate deal expires same-day"
- Content: Psychology of Sales, Common Tactics, How to Protect Yourself

**WindowVerificationSystem:**
- Stats: "3" verification pillars, "NOA" certification check, "100%" permit compliance needed
- Callout: "If they can't provide NOA numbers, walk away"
- Content: Product Verification, Contractor Verification, Quote Verification

### Bug Fixes Included
- Remove all `text-black` from AccordionContent (3 pages have this -- breaks dark mode)
- Replace `border-t border-border` section dividers with alternating gradient backgrounds
- Add `AnimateOnScroll` to all sections with staggered delays

### What Does NOT Change
- SEO metadata, JSON-LD schemas, canonical URLs
- ExitIntentModal integration (stays exactly as-is)
- ReviewedByBadge placement
- Pillar config data structure
- FAQ content
- Route paths

