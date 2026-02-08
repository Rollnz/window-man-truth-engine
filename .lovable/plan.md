

# Reusable UrgencyTicker Component

## Overview
Create a centralized, configurable `UrgencyTicker` component in `src/components/social-proof/` that can be placed on multiple pages with different visual variants and data sources.

---

## Component Architecture

```text
src/components/social-proof/
├── UrgencyTicker.tsx          # Main reusable component with variants
├── useCountUp.ts              # Extracted animation hook (reusable)
└── index.ts                   # Barrel export
```

---

## Configuration Options

The component will support these configurable props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'cyberpunk' \| 'minimal' \| 'homepage'` | `'cyberpunk'` | Visual style preset |
| `showToday` | `boolean` | `true` | Show/hide the "+X today" section |
| `animated` | `boolean` | `true` | Enable/disable count-up animation |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size preset |
| `className` | `string` | `''` | Additional classes |

---

## Visual Variants

### 1. Cyberpunk (Default) - For AI Scanner
Current Gemini-style dark zinc/emerald/amber aesthetic:
```text
┌──────────────────────────────────────────────────────────────────┐
│  🛡️(emerald)  3,568 quotes scanned  │  🟠(amber) +19 today      │
│  [bg-zinc-900/70, backdrop-blur-sm]   [bg-amber-500/10]          │
└──────────────────────────────────────────────────────────────────┘
```

### 2. Minimal - For Sample Report
Lighter, less visually dominant for content-focused pages:
```text
┌──────────────────────────────────────────────────────────────────┐
│  🛡️  3,568 quotes scanned  │  🟢 +19 today                      │
│  [bg-card, border-border]   [subtle primary tint]                │
└──────────────────────────────────────────────────────────────────┘
```

### 3. Homepage - For Index
Integrated with the homepage aesthetic (primary color focus):
```text
┌──────────────────────────────────────────────────────────────────┐
│  🛡️  3,568+ quotes analyzed  │  Live                            │
│  [bg-primary/5, border-primary/20]                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### File 1: `src/components/social-proof/useCountUp.ts` (NEW)

Extract the animation hook for reusability:

```tsx
import { useState, useEffect, useRef } from 'react';

export function useCountUp(end: number, duration: number = 2500) {
  const [count, setCount] = useState(0);
  const prevEndRef = useRef(0);

  useEffect(() => {
    if (end === prevEndRef.current) return;
    prevEndRef.current = end;
    
    if (end === 0) {
      setCount(0);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;

      if (progress < duration) {
        const t = progress / duration;
        const ease = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        setCount(Math.floor(ease * end));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}
```

---

### File 2: `src/components/social-proof/UrgencyTicker.tsx` (NEW)

Main reusable component with variant support:

```tsx
import { useState, useEffect, useRef } from 'react';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectedQuotes } from '@/hooks/useProjectedQuotes';
import { useCountUp } from './useCountUp';

type TickerVariant = 'cyberpunk' | 'minimal' | 'homepage';
type TickerSize = 'sm' | 'md' | 'lg';

interface UrgencyTickerProps {
  variant?: TickerVariant;
  showToday?: boolean;
  animated?: boolean;
  size?: TickerSize;
  className?: string;
}

const variantStyles = {
  cyberpunk: {
    container: 'bg-zinc-900/70 border-zinc-700/40 divide-zinc-700/50 backdrop-blur-sm ring-1 ring-white/5 shadow-xl',
    icon: 'text-emerald-400',
    count: 'text-zinc-100',
    label: 'text-zinc-400',
    todayBg: 'bg-amber-500/10',
    todayDot: 'bg-amber-400',
    todayText: 'text-amber-300',
  },
  minimal: {
    container: 'bg-card border-border divide-border',
    icon: 'text-primary',
    count: 'text-foreground',
    label: 'text-muted-foreground',
    todayBg: 'bg-primary/5',
    todayDot: 'bg-primary',
    todayText: 'text-primary',
  },
  homepage: {
    container: 'bg-primary/5 border-primary/20 divide-primary/20',
    icon: 'text-primary',
    count: 'text-foreground',
    label: 'text-muted-foreground',
    todayBg: 'bg-primary/10',
    todayDot: 'bg-primary',
    todayText: 'text-primary',
  },
};

const sizeStyles = {
  sm: { padding: 'px-3 py-1.5', iconSize: 'w-3 h-3', text: 'text-xs', label: 'text-[10px]' },
  md: { padding: 'px-4 py-2.5', iconSize: 'w-4 h-4', text: 'text-sm', label: 'text-xs' },
  lg: { padding: 'px-5 py-3', iconSize: 'w-5 h-5', text: 'text-base', label: 'text-sm' },
};

export function UrgencyTicker({
  variant = 'cyberpunk',
  showToday = true,
  animated = true,
  size = 'md',
  className,
}: UrgencyTickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!animated);
  const { total, today } = useProjectedQuotes();

  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  // IntersectionObserver for animation trigger
  useEffect(() => {
    if (!animated) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [animated]);

  const totalCount = useCountUp(isVisible ? total : 0, 2500);
  const todayCount = useCountUp(isVisible && showToday ? today : 0, 2500);

  return (
    <div ref={ref} className={cn('flex items-center justify-center', className)}>
      <div className={cn(
        'inline-flex items-center divide-x rounded-lg border overflow-hidden',
        styles.container
      )}>
        {/* Left: Total Count */}
        <div className={cn('flex items-center gap-2', sizes.padding)}>
          <Shield className={cn(sizes.iconSize, styles.icon)} />
          <span className={cn('font-bold tabular-nums', sizes.text, styles.count)}>
            {totalCount.toLocaleString()}
          </span>
          <span className={cn(sizes.label, styles.label)}>quotes scanned</span>
        </div>

        {/* Right: Today Count (optional) */}
        {showToday && (
          <div className={cn('flex items-center gap-2 h-full', sizes.padding, styles.todayBg)}>
            <div className="relative flex h-2 w-2">
              <span className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                styles.todayDot
              )} />
              <span className={cn('relative inline-flex rounded-full h-2 w-2', styles.todayDot)} />
            </div>
            <span className={cn('font-semibold tabular-nums', sizes.text, styles.todayText)}>
              +{todayCount} today
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### File 3: `src/components/social-proof/index.ts` (NEW)

Barrel export:

```tsx
export { UrgencyTicker } from './UrgencyTicker';
export { useCountUp } from './useCountUp';
```

---

### File 4: `src/pages/QuoteScanner.tsx` (MODIFY)

Update import to use new location:

```tsx
// Before:
import { UrgencyTicker } from '@/components/quote-scanner/UrgencyTicker';

// After:
import { UrgencyTicker } from '@/components/social-proof';

// Usage (no change needed - uses cyberpunk default):
<UrgencyTicker />
```

---

### File 5: `src/pages/SampleReport.tsx` (MODIFY)

Add the ticker with minimal variant:

```tsx
import { UrgencyTicker } from '@/components/social-proof';

// After SampleReportHeader, before main content:
<SampleReportHeader onOpenLeadModal={handleOpenLeadModal} />

<div className="container px-4 py-6">
  <UrgencyTicker variant="minimal" />
</div>

<main className="pt-28">
```

---

### File 6: `src/pages/Index.tsx` (MODIFY)

Add the ticker to homepage (after HeroSection):

```tsx
import { UrgencyTicker } from '@/components/social-proof';

// After HeroSection:
<HeroSection />

<div className="container px-4 py-8 -mt-16 relative z-10">
  <UrgencyTicker variant="homepage" size="lg" />
</div>

<MarketRealitySection />
```

---

### File 7: `src/components/quote-scanner/UrgencyTicker.tsx` (DELETE or DEPRECATE)

Option A (Recommended): Delete and update all imports
Option B: Keep as re-export wrapper for backwards compatibility:

```tsx
// Re-export from new location for backwards compatibility
export { UrgencyTicker } from '@/components/social-proof';
```

---

## Page-Specific Integration

| Page | Variant | Position | Extra Config |
|------|---------|----------|--------------|
| `/ai-scanner` | `cyberpunk` | After hero, `-mt-6` overlap | Default |
| `/sample-report` | `minimal` | After header, before hero | Standard spacing |
| `/` (Homepage) | `homepage` | After HeroSection, `-mt-16` overlap | `size="lg"` |

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/social-proof/useCountUp.ts` | CREATE | Extracted animation hook |
| `src/components/social-proof/UrgencyTicker.tsx` | CREATE | Reusable component with variants |
| `src/components/social-proof/index.ts` | CREATE | Barrel exports |
| `src/pages/QuoteScanner.tsx` | MODIFY | Update import path |
| `src/pages/SampleReport.tsx` | MODIFY | Add ticker with minimal variant |
| `src/pages/Index.tsx` | MODIFY | Add ticker with homepage variant |
| `src/components/quote-scanner/UrgencyTicker.tsx` | DELETE | Remove old location |

