

# Visual Overhaul: "Forensic Elevated" Surfaces for Pillar Components + About Page

## Problem

The 6 shared pillar components and the About page use flat backgrounds (`bg-card/50`, `bg-card/30`, `bg-muted/30`) with basic borders (`border-border`, `border-border/50`) and minimal shadows (`shadow-md`, `shadow-sm`). This creates a flat, monotone feel that clashes with the premium depth of the homepage and /sample-report.

## What Changes

Upgrade all surfaces, borders, shadows, and hover effects across 7 files using the existing `surface-1/2/3` CSS custom properties, glassmorphic borders, and elevated shadows. No new dependencies. No structural or content changes. Pure Tailwind class swaps.

## Files Modified (7 total)

### 1. PillarHeroSection.tsx

**Current:** Weak `bg-primary/5` and `bg-secondary/5` orbs at small size (w-96, w-80)
**Updated:**
- Enlarge orbs to `w-[500px] h-[500px]` and `w-[400px] h-[400px]` with stronger opacity (`bg-primary/8`, `bg-secondary/6`)
- Add section background: `bg-[hsl(var(--surface-1))]`
- Add bottom separator: `border-b border-border/30`
- Badge gets glassmorphic border: `border-white/10 backdrop-blur-sm`

### 2. PillarStatBar.tsx

**Current:** `bg-card/50 border-y border-border/50`, cards use `shadow-md hover:shadow-lg`
**Updated:**
- Section: `bg-[hsl(var(--surface-2))]` with `border-y border-border/30`
- Cards: `bg-card backdrop-blur-sm border border-white/10 shadow-xl hover:shadow-2xl hover:scale-[1.02] hover:shadow-primary/10 transition-all duration-300`
- Icon container: `border-white/10`

### 3. PillarContentBlock.tsx

**Current:** No section background, bullet box uses `bg-card/50 border-border/50 shadow-sm`
**Updated:**
- Section: `bg-[hsl(var(--surface-1))]`
- Left accent border: thicken to `border-l-[3px] border-primary/40`
- Bullet card: `bg-card/80 backdrop-blur-sm border-white/10 shadow-lg`

### 4. PillarCalloutCard.tsx

**Current:** `bg-gradient-to-br from-primary/10 to-secondary/5 border-primary/20 shadow-lg`
**Updated:**
- Outer card: `bg-card/90 backdrop-blur-sm border-white/10 shadow-2xl`
- Keep internal gradient as a subtle layered effect
- Icon container: `border-white/10`

### 5. PillarGuideCards.tsx

**Current:** Section `bg-card/30`, cards already have `shadow-xl hover:shadow-2xl hover:scale-[1.02]`
**Updated:**
- Section: `bg-[hsl(var(--surface-2))]`
- Cards: add `backdrop-blur-sm border-white/10 hover:shadow-primary/10`
- Icon container: `border-white/10`

### 6. PillarCTASection.tsx

**Current:** `bg-gradient-to-br from-primary/8 to-secondary/5`, single ambient orb
**Updated:**
- Section: `bg-[hsl(var(--surface-1))]` as base, keep gradient overlay
- Add `border-t border-border/30` top separator
- Enlarge ambient orb to `w-[600px] h-[600px]` with `bg-primary/6`

### 7. About.tsx (manual upgrade)

Since About doesn't use pillar components, it gets the same treatment applied directly:

- **Hero section:** Add `bg-[hsl(var(--surface-1))]`, ambient gradient orbs behind content, wrap with `relative overflow-hidden`
- **3 hero value cards** (Safety First, AI + Human, Lead With Value): Upgrade from `border-border` to `bg-card backdrop-blur-sm border-white/10 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300`. Wrap each in `AnimateOnScroll` with staggered `delay={index * 120}`
- **Methodology section:** Change from `bg-muted/30` to `bg-[hsl(var(--surface-2))]`
- **Methodology inner cards:** Add `border-white/10 shadow-lg backdrop-blur-sm`
- **Transparency callout:** Add `shadow-lg backdrop-blur-sm`
- **Review Board section:** Add `bg-[hsl(var(--surface-1))]`
- **Review Board card:** Add `border-white/10 shadow-xl backdrop-blur-sm`
- **Credential pills:** Add `backdrop-blur-sm`
- **Mission section:** Change from `bg-muted/30` to `bg-[hsl(var(--surface-2))]`
- **Problem/Solution cards:** Add `border-white/10 shadow-lg backdrop-blur-sm`
- **Wrap sections** with `AnimateOnScroll` for entrance animations

## What Does NOT Change

- No routing, SEO, analytics, or database changes
- No new files or dependencies
- No content, CTA, or ExitIntentModal changes
- Pillar page files themselves are NOT modified (they inherit from shared components)
- All text stays on semantic tokens (`text-foreground`, `text-muted-foreground`) for 5:1+ contrast
- `border-white/10` is decorative only, not carrying meaning

## Accessibility

- All existing semantic tokens preserved -- contrast ratios unchanged
- `backdrop-blur-sm` is purely visual enhancement
- `AnimateOnScroll` already respects `prefers-reduced-motion`
- No opacity animations on paragraph text
- Hover effects are progressive enhancement only

## Performance

- Zero new JS -- all changes are Tailwind class swaps
- No new dependencies
- `backdrop-blur-sm` is GPU-composited, negligible cost on modern browsers

