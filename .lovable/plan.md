

# Phase 2: Forensic Proof System Components

## Overview

Create 4 new reusable components -- FindingCard, EvidenceModule, SeverityBadge, and MidPageCTA -- and embed them into each of the 4 pillar pages. All components use the `#ffc672` orange-tinted drop shadow and staggered `AnimateOnScroll` entrance animations.

## New Files (5)

### 1. `src/components/forensic/SeverityBadge.tsx`

A small pill/badge indicating severity level: `critical`, `warning`, or `info`.

- Props: `level: 'critical' | 'warning' | 'info'`, optional `label` override
- Visual: Rounded pill with colored dot + text. Colors:
  - `critical` = red bg (`bg-destructive/15 text-destructive`)
  - `warning` = amber/orange bg (`bg-amber-500/15 text-amber-600 dark:text-amber-400`)
  - `info` = blue bg (`bg-primary/15 text-primary`)
- Compact, inline component (no shadow/animation -- it goes inside other components)

### 2. `src/components/forensic/FindingCard.tsx`

A forensic-style evidence card showing a single "finding" (fact/stat/claim).

- Props: `title`, `description`, `severity` (passed to SeverityBadge), `icon` (LucideIcon), optional `source` string
- Visual:
  - `bg-card backdrop-blur-sm border border-border/20 rounded-2xl p-6`
  - Custom `#ffc672` orange drop shadow via inline style: `boxShadow: '0 8px 24px -6px rgba(255, 198, 114, 0.25), 0 18px 40px -22px rgba(255, 198, 114, 0.15)'`
  - Hover: `hover:-translate-y-1 transition-all duration-300` with deeper shadow
  - Top-left: SeverityBadge
  - Icon in a circular container with `bg-primary/10`
  - Source line at bottom in `text-xs text-muted-foreground font-mono`
- Wrapped in `AnimateOnScroll` at the call site

### 3. `src/components/forensic/EvidenceModule.tsx`

A section-level wrapper that renders a grid of FindingCards with a section header.

- Props: `title`, `subtitle`, `findings[]` (array of FindingCard data), optional `columns` (2 or 3, default 2)
- Visual:
  - Section with `bg-[hsl(var(--surface-2))] py-16 md:py-24`
  - Title + subtitle header with `AnimateOnScroll`
  - Grid of FindingCards with staggered entrance: `delay={index * 120}`
  - Each FindingCard gets the `#ffc672` shadow

### 4. `src/components/forensic/MidPageCTA.tsx`

A contextual CTA strip that sits between content sections to drive tool usage.

- Props: `heading`, `description`, `buttonLabel`, `buttonIcon` (LucideIcon), `to` (route string), optional `microcopy`
- Visual:
  - Full-width band with `bg-card/90 backdrop-blur-sm border-y border-border/20`
  - `#ffc672` orange shadow on the inner card: `boxShadow: '0 12px 32px -8px rgba(255, 198, 114, 0.30)'`
  - Centered content with CTA button
  - Wrapped in `AnimateOnScroll`
  - Hover lift on the button

### 5. `src/components/forensic/index.ts`

Barrel export for all 4 components.

## Modified Files (4 pillar pages)

Each pillar page gets an `EvidenceModule` inserted between `PillarContentBlock` and `PillarCalloutCard`, and a `MidPageCTA` inserted between `PillarCalloutCard` and `PillarGuideCards`. The findings data is static and hardcoded per pillar (no database needed).

### WindowCostTruth.tsx

**EvidenceModule findings (2 cards):**
1. "Budget Windows Cost 2.3x More Over 10 Years" -- severity: critical, icon: TrendingUp, source: "FL DOE Energy Analysis 2024"
2. "Insurance Discount Gap: $1,200/yr Average" -- severity: warning, icon: DollarSign, source: "Citizens Property Insurance Data"

**MidPageCTA:**
- heading: "See How Your Quote Compares"
- buttonLabel: "Run Cost Calculator"
- to: /cost-calculator

### WindowSalesTruth.tsx

**EvidenceModule findings (2 cards):**
1. "73% of Quotes Contain At Least One Red Flag" -- severity: critical, icon: AlertTriangle, source: "WindowMan AI Scanner Analysis"
2. "Average Initial Markup: 38% Above Fair Market" -- severity: warning, icon: DollarSign, source: "3,400+ Quote Database"

**MidPageCTA:**
- heading: "Upload Your Quote for Instant Analysis"
- buttonLabel: "Scan Your Quote"
- to: /ai-scanner

### WindowRiskAndCode.tsx

**EvidenceModule findings (2 cards):**
1. "62% of Homes Have At Least One Non-Compliant Opening" -- severity: critical, icon: AlertTriangle, source: "FL Building Code Inspection Data"
2. "Improper Installation Voids Warranty in 100% of Cases" -- severity: warning, icon: ShieldCheck, source: "Manufacturer Warranty Terms"

**MidPageCTA:**
- heading: "Check Your Home's Protection Gaps"
- buttonLabel: "Run Risk Diagnostic"
- to: /risk-diagnostic

### WindowVerificationSystem.tsx

**EvidenceModule findings (2 cards):**
1. "41% of Quoted Products Lack Valid NOA Certification" -- severity: critical, icon: FileSearch, source: "Miami-Dade Product Approval DB"
2. "1 in 5 Installers Operating Without Proper License" -- severity: warning, icon: Shield, source: "MyFloridaLicense.com Cross-Reference"

**MidPageCTA:**
- heading: "Verify Before You Sign"
- buttonLabel: "Browse Evidence Library"
- to: /evidence

## Shadow Strategy

The `#ffc672` shadow is applied via inline `style` on FindingCard and MidPageCTA rather than modifying the global CSS variables (which use `hsl(25 95% 45%)`). This keeps the forensic components visually distinct from the standard elevation system. The exact values:

```text
Light shadow:  0 8px 24px -6px rgba(255, 198, 114, 0.25), 0 18px 40px -22px rgba(255, 198, 114, 0.15)
Heavy shadow:  0 14px 40px -8px rgba(255, 198, 114, 0.35), 0 30px 70px -30px rgba(255, 198, 114, 0.20)
Hover shadow:  0 14px 40px -8px rgba(255, 198, 114, 0.40), 0 30px 70px -30px rgba(255, 198, 114, 0.25)
```

## Animation Strategy

- Every FindingCard entrance is staggered via `AnimateOnScroll` with `delay={index * 120}` and `duration={600}`
- MidPageCTA uses `AnimateOnScroll` with `duration={700}`
- EvidenceModule header fades in first, then cards stagger in
- All animations respect `prefers-reduced-motion` (handled by existing AnimateOnScroll)

## What Does NOT Change

- No CSS variable or Tailwind config changes
- No routing, SEO schema, or database changes
- No modifications to the 6 shared pillar components (Hero, StatBar, etc.)
- No changes to About page or Proof page
- Existing ExitIntentModal and ReviewedByBadge sections untouched

## Accessibility

- SeverityBadge includes `aria-label` with severity level
- FindingCard uses semantic heading hierarchy (h3)
- All text on semantic tokens for 5:1+ contrast
- Animations respect `prefers-reduced-motion`
- CTA buttons are proper `Link` elements with descriptive labels

