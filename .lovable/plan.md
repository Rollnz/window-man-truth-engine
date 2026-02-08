

# Dynamic Theme: Schematic vs. Blueprint

## Overview
Transform the "forced dark" Blueprint section into a fully theme-aware component that adapts its visual identity based on user preference:

- **Dark Mode → "Cyberpunk Blueprint"**: Cool blue grid lines, glowing cards, neon accents
- **Light Mode → "Technical Schematic"**: Clean white paper, subtle gray grid, sharp typography

---

## Visual Comparison

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              DARK MODE (Blueprint)                                  │
│                                                                                     │
│  Background: bg-slate-950          Grid Lines: rgba(56,189,248,0.08) (cyan)        │
│  Cards: bg-slate-900/80            Borders: Glowing colored (sky/amber/emerald)    │
│  Headlines: text-white             Body: text-slate-300                            │
│  Form inputs: bg-slate-800         CTA: Pulsing glow effect                        │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          LIGHT MODE (Technical Schematic)                           │
│                                                                                     │
│  Background: bg-slate-50           Grid Lines: rgba(15,23,42,0.05) (subtle slate)  │
│  Cards: bg-white/80                Borders: border-slate-200 + accent top-bar      │
│  Headlines: text-slate-900         Body: text-slate-600                            │
│  Form inputs: bg-white             CTA: Solid shadow (no glow)                     │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Part 1: NoQuotePivotSection - Dynamic Background & Typography

**Current (Hardcoded Dark):**
```tsx
<section className="bg-slate-950">
  <h2 className="text-white">...</h2>
  <p className="text-slate-300">...</p>
</section>
```

**New (Theme-Aware):**
```tsx
<section className="bg-slate-50 dark:bg-slate-950">
  <h2 className="text-slate-900 dark:text-white">...</h2>
  <p className="text-slate-600 dark:text-slate-300">...</p>
</section>
```

**Grid Lines - Dynamic Background Image:**

Since we can't use Tailwind's `dark:` modifier inside inline `style` attributes, we'll use CSS custom properties or a conditional approach:

```tsx
// Option A: Use a themed div with Tailwind classes for the grid overlay
<div className="absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(90deg,rgba(56,189,248,0.08)_1px,transparent_1px),linear-gradient(rgba(56,189,248,0.08)_1px,transparent_1px)] bg-[size:40px_40px]" />
```

**Color Mapping:**

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Section BG | `bg-slate-50` | `dark:bg-slate-950` |
| Grid Lines | `rgba(15,23,42,0.05)` (slate) | `rgba(56,189,248,0.08)` (cyan) |
| Headline H2 | `text-slate-900` | `dark:text-white` |
| Subheadline | `text-sky-600` | `dark:text-sky-400` |
| Body text | `text-slate-600` | `dark:text-slate-300` |
| Muted text | `text-slate-500` | `dark:text-slate-400` |
| Emphasis | `text-slate-900` | `dark:text-white` |

---

### Part 2: VaultAdvantageCard - Adaptive Glassmorphism

**Current (Dark-Only):**
```tsx
'bg-slate-900/80 backdrop-blur-sm'
'border-sky-500/30 hover:border-sky-500/50'
'text-white'
```

**New (Theme-Aware):**

```tsx
// Card container
'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md'

// Border strategy: Clean in light, glowing in dark
'border border-slate-200 dark:border-2 dark:border-sky-500/30'
'hover:border-slate-300 dark:hover:border-sky-500/50'

// Light mode: Add accent top-bar instead of glow
'before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-sky-500 before:rounded-t-2xl'

// Shadow: Clean in light, glow in dark
'shadow-md dark:shadow-[0_0_25px_rgba(14,165,233,0.15)]'
'hover:shadow-lg dark:hover:shadow-[0_0_35px_rgba(14,165,233,0.25)]'
```

**Updated accentMap with theme-aware classes:**

```tsx
const accentMap: Record<AccentColor, {
  border: string;
  shadow: string;
  topBar: string;
  icon: string;
  iconBg: string;
}> = {
  blue: {
    border: 'border-slate-200 dark:border-sky-500/30 hover:border-sky-200 dark:hover:border-sky-500/50',
    shadow: 'shadow-md hover:shadow-lg dark:shadow-[0_0_25px_rgba(14,165,233,0.15)] dark:hover:shadow-[0_0_35px_rgba(14,165,233,0.25)]',
    topBar: 'before:bg-sky-500',
    icon: 'text-sky-600 dark:text-sky-400',
    iconBg: 'bg-sky-100 dark:bg-sky-500/10',
  },
  amber: {
    border: 'border-slate-200 dark:border-amber-500/30 hover:border-amber-200 dark:hover:border-amber-500/50',
    shadow: 'shadow-md hover:shadow-lg dark:shadow-[0_0_25px_rgba(245,158,11,0.15)] dark:hover:shadow-[0_0_35px_rgba(245,158,11,0.25)]',
    topBar: 'before:bg-amber-500',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-500/10',
  },
  emerald: {
    border: 'border-slate-200 dark:border-emerald-500/30 hover:border-emerald-200 dark:hover:border-emerald-500/50',
    shadow: 'shadow-md hover:shadow-lg dark:shadow-[0_0_25px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_0_35px_rgba(16,185,129,0.25)]',
    topBar: 'before:bg-emerald-500',
    icon: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/10',
  },
};
```

**Card Typography:**

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Micro-label | `text-slate-500` | `dark:text-slate-500` (same) |
| Title | `text-slate-900` | `dark:text-white` |
| Subtitle | `text-slate-600` | `dark:text-slate-400` |
| Step badge BG | `bg-accent-100` | `dark:bg-accent-500/10` |

---

### Part 3: VaultCTABlock - Adaptive Form & Button

**CTA Button:**
```tsx
// Current: Always glowing
'shadow-[0_0_30px_rgba(14,165,233,0.4)]'

// New: Clean shadow in light, glow in dark
'shadow-lg dark:shadow-[0_0_30px_rgba(14,165,233,0.4)]'
```

**Animation Strategy:**
- Dark mode: Keep the `pulse-glow-cta` animation
- Light mode: Use standard hover effects (no glow animation)

```tsx
// Conditionally apply animation class only in dark mode
className={cn(
  'bg-sky-500 hover:bg-sky-400 text-white',
  'shadow-lg hover:shadow-xl',
  'dark:shadow-[0_0_30px_rgba(14,165,233,0.4)]',
  'dark:animate-[pulse-glow-cta_2.5s_ease-in-out_infinite]'
)}
```

**Email Fallback Form:**

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Form container | `bg-white border-slate-200` | `dark:bg-slate-900/80 dark:border-slate-800` |
| Labels | `text-slate-700` | `dark:text-slate-300` |
| Inputs | `bg-white border-slate-300` | `dark:bg-slate-800 dark:border-slate-700` |
| Input text | `text-slate-900` | `dark:text-white` |
| Toggle link | `text-slate-500` | `dark:text-slate-400` |

---

### Part 4: Success State (isSubmitted)

Apply the same theme-aware pattern to the success state in NoQuotePivotSection:

```tsx
// Background
'bg-slate-50 dark:bg-slate-950'

// Success message
'text-slate-900 dark:text-white'
'text-slate-600 dark:text-slate-300'

// Outline button
'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
```

---

## Mobile Connector Lines (VaultAdvantageGrid)

Update the gradient connector colors to be theme-aware:

```tsx
// Current
'bg-gradient-to-b from-sky-500/50 to-amber-500/50'

// New
'bg-gradient-to-b from-sky-400/40 to-amber-400/40 dark:from-sky-500/50 dark:to-amber-500/50'
```

---

## Complete Color Token Mapping

| Element | Light Mode Class | Dark Mode Class |
|---------|-----------------|-----------------|
| **Section** | | |
| Background | `bg-slate-50` | `dark:bg-slate-950` |
| Grid lines | `rgba(15,23,42,0.05)` | `rgba(56,189,248,0.08)` |
| **Typography** | | |
| Headline | `text-slate-900` | `dark:text-white` |
| Subheadline | `text-sky-600` | `dark:text-sky-400` |
| Body | `text-slate-600` | `dark:text-slate-300` |
| Muted | `text-slate-500` | `dark:text-slate-400` |
| Emphasis | `text-slate-800` | `dark:text-white` |
| **Cards** | | |
| Background | `bg-white/80` | `dark:bg-slate-900/80` |
| Border | `border-slate-200` | `dark:border-{accent}-500/30` |
| Shadow | `shadow-md` | `dark:shadow-[glow]` |
| Icon BG | `bg-{accent}-100` | `dark:bg-{accent}-500/10` |
| Icon | `text-{accent}-600` | `dark:text-{accent}-400` |
| **Form** | | |
| Container | `bg-white border-slate-200` | `dark:bg-slate-900/80 dark:border-slate-800` |
| Input BG | `bg-white` | `dark:bg-slate-800` |
| Input border | `border-slate-300` | `dark:border-slate-700` |
| Input text | `text-slate-900` | `dark:text-white` |
| Labels | `text-slate-700` | `dark:text-slate-300` |
| **CTA** | | |
| Button | `bg-sky-500 shadow-lg` | `dark:shadow-[glow] dark:animate-pulse` |

---

## Files Summary

| File | Action | Changes |
|------|--------|---------|
| `src/components/quote-scanner/vault-pivot/NoQuotePivotSection.tsx` | **MODIFY** | Replace all hardcoded dark colors with theme-aware variants (`dark:` prefix), update grid lines background |
| `src/components/quote-scanner/vault-pivot/VaultAdvantageCard.tsx` | **MODIFY** | Update accentMap with theme-aware border/shadow/icon classes, add accent top-bar for light mode, unlock text colors |
| `src/components/quote-scanner/vault-pivot/VaultAdvantageGrid.tsx` | **MODIFY** | Update mobile connector gradient colors to be theme-aware |
| `src/components/quote-scanner/vault-pivot/VaultCTABlock.tsx` | **MODIFY** | Make form, button, and toggle text theme-aware; conditionally apply glow animation only in dark mode |

---

## Expected Result

1. **Light Mode**: Clean, professional "Technical Schematic" aesthetic
   - White/gray background with subtle grid lines
   - Cards have clean shadows and colored top-bars
   - Sharp, dark typography
   - No glowing effects (clean, corporate feel)

2. **Dark Mode**: Premium "Cyberpunk Blueprint" aesthetic
   - Dark background with cyan grid lines
   - Cards have glowing colored borders
   - Bright white text with sky-blue accents
   - Pulsing CTA button with glow effect

3. **Seamless Transition**: Switching themes feels intentional, not broken

