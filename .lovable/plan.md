

# Theme-Aware "What a Legitimate Quote Should Include" Section

## Overview
Refactor the `QuoteSafetyChecklist` component to fully support the site's Light/Dark theme toggle while maintaining accessibility with a 5:1 contrast ratio. The section will feature a "Cyberpunk" aesthetic in dark mode and a clean "Professional Audit" look in light mode.

---

## Current State Analysis

**File:** `src/components/quote-scanner/QuoteSafetyChecklist.tsx`

**Current Issues:**
- Uses single-mode colors (`text-emerald-500`, `text-rose-500`) that lack sufficient contrast in light mode
- Relies on generic theme tokens (`bg-card`, `border-border`) that don't provide the distinct dual-mode aesthetic
- No explicit light vs dark color definitions

---

## Dual-Mode Visual Strategy

### Dark Mode - "Cyberpunk" Aesthetic
| Element | Classes |
|---------|---------|
| Section BG | `bg-zinc-950/60` |
| Card BG | `bg-zinc-900/50` |
| Card Border | `border-zinc-800` |
| Emerald Icon/Header | `text-emerald-400` |
| Emerald Card Tint | `bg-emerald-500/10` + `border-emerald-500/30` |
| Rose Icon/Header | `text-rose-400` |
| Rose Card Tint | `bg-rose-500/10` + `border-rose-500/30` |
| Body Text | `text-zinc-300` |
| CTA Button | Gradient red glow effect |

### Light Mode - "Professional Audit" Aesthetic
| Element | Classes |
|---------|---------|
| Section BG | `bg-slate-50` |
| Card BG | `bg-white` |
| Card Border | `border-slate-200` + `shadow-sm` |
| Emerald Icon/Header | `text-emerald-700` |
| Emerald Card Tint | `bg-emerald-50` + `border-emerald-200` |
| Rose Icon/Header | `text-rose-700` |
| Rose Card Tint | `bg-rose-50` + `border-rose-200` |
| Body Text | `text-slate-700` |
| CTA Button | Solid rose with subtle shadow |

---

## Accessibility Compliance (5:1 Contrast Ratio)

**Text Colors:**
| Context | Light Mode | Dark Mode | Contrast |
|---------|------------|-----------|----------|
| Body text | `text-slate-700` | `text-zinc-300` | >7:1 |
| Emerald accent | `text-emerald-700` | `text-emerald-400` | >5:1 |
| Rose accent | `text-rose-700` | `text-rose-400` | >5:1 |
| Muted text | `text-slate-500` | `text-zinc-400` | >4.5:1 |

**Icon Colors:**
| Type | Light Mode | Dark Mode |
|------|------------|-----------|
| Checkmark | `text-emerald-600` | `text-emerald-400` |
| X mark | `text-rose-600` | `text-rose-400` |

---

## Technical Implementation

### File: `src/components/quote-scanner/QuoteSafetyChecklist.tsx`

**Key Changes:**

1. **Section Background:**
```tsx
// Before:
<section className="py-12 md:py-16 bg-muted/20">

// After:
<section className="py-12 md:py-16 bg-slate-50 dark:bg-zinc-950/60">
```

2. **Title & Subtitle:**
```tsx
// Title
<h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-2">

// Subtitle
<p className="text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto">
```

3. **Column Headers:**
```tsx
// Emerald header
<h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-4">
  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
  What to Look For
</h3>

// Rose header
<h3 className="text-lg font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2 mb-4">
  <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
  Common Red Flags
</h3>
```

4. **Checklist Cards (Emerald/Good):**
```tsx
<div className={cn(
  "flex items-start gap-3 p-3 rounded-lg",
  // Light mode: clean white card
  "bg-white border border-emerald-200 shadow-sm",
  // Dark mode: glassmorphism
  "dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:shadow-none"
)}>
  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
  <span className="text-sm text-slate-700 dark:text-zinc-300">{item.text}</span>
</div>
```

5. **Red Flag Cards (Rose/Bad):**
```tsx
<div className={cn(
  "flex items-start gap-3 p-3 rounded-lg",
  // Light mode: clean white card with rose accent
  "bg-white border border-rose-200 shadow-sm",
  // Dark mode: glassmorphism with rose tint
  "dark:bg-rose-500/10 dark:border-rose-500/30 dark:shadow-none"
)}>
  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
  <span className="text-sm text-slate-700 dark:text-zinc-300">{item.text}</span>
</div>
```

6. **CTA Button:**
```tsx
<Button
  onClick={handleScrollToUpload}
  className={cn(
    "w-full gap-2",
    // Light mode: solid rose
    "bg-rose-600 text-white hover:bg-rose-700 border-0",
    // Dark mode: transparent with glow
    "dark:bg-rose-500/20 dark:text-rose-300 dark:border dark:border-rose-500/40",
    "dark:hover:bg-rose-500/30"
  )}
>
  <Upload className="w-4 h-4" />
  Scan Your Quote for Red Flags
</Button>
```

---

## Visual Comparison

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          LIGHT MODE                                      │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐       │
│  │  ✓ What to Look For         │  │  ✗ Common Red Flags          │       │
│  │  [emerald-700 text]         │  │  [rose-700 text]             │       │
│  │                             │  │                              │       │
│  │  ┌─ White card ──────────┐  │  │  ┌─ White card ──────────┐  │       │
│  │  │ ✓ Impact rating...    │  │  │  │ ✗ Vague install...    │  │       │
│  │  │ [slate-700 text]      │  │  │  │ [slate-700 text]      │  │       │
│  │  │ [emerald-200 border]  │  │  │  │ [rose-200 border]     │  │       │
│  │  └───────────────────────┘  │  │  └───────────────────────┘  │       │
│  │  [bg-slate-50 section]      │  │  [shadow-sm for depth]      │       │
│  └─────────────────────────────┘  └─────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          DARK MODE                                       │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐       │
│  │  ✓ What to Look For         │  │  ✗ Common Red Flags          │       │
│  │  [emerald-400 neon text]    │  │  [rose-400 neon text]        │       │
│  │                             │  │                              │       │
│  │  ┌─ Glassy card ─────────┐  │  │  ┌─ Glassy card ─────────┐  │       │
│  │  │ ✓ Impact rating...    │  │  │  │ ✗ Vague install...    │  │       │
│  │  │ [zinc-300 text]       │  │  │  │ [zinc-300 text]       │  │       │
│  │  │ [emerald-500/30 bdr]  │  │  │  │ [rose-500/30 border]  │  │       │
│  │  │ [emerald-500/10 bg]   │  │  │  │ [rose-500/10 bg]      │  │       │
│  │  └───────────────────────┘  │  │  └───────────────────────┘  │       │
│  │  [bg-zinc-950/60 section]   │  │  [no shadow - glow instead] │       │
│  └─────────────────────────────┘  └─────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Rule Summary

| Rule | Implementation |
|------|----------------|
| No opacity-only colors | Every color has explicit `light:` and `dark:` tokens |
| 5:1 contrast minimum | Light uses 700 shades, dark uses 400 shades |
| Explicit declarations | `className="bg-white dark:bg-zinc-900..."` pattern |
| Consistent text hierarchy | `slate-900/700/600` (light) → `zinc-100/300/400` (dark) |
| Shadow strategy | Light uses `shadow-sm`, dark removes shadows for glow |

---

## Files Summary

| File | Action | Changes |
|------|--------|---------|
| `src/components/quote-scanner/QuoteSafetyChecklist.tsx` | MODIFY | Add explicit light/dark color tokens for all elements |

