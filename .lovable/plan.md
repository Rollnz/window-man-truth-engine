
# Shared Quote Stats Hook - Single Source of Truth

## Overview
Create a shared hook `useProjectedQuotes` that centralizes the date-based quote calculation logic. This ensures the UrgencyTicker and all other stats displays show identical numbers that grow in perfect unison.

---

## Problem Statement
Currently, **5 components** display quote counts with different values:
| Component | Current Value | Location |
|-----------|---------------|----------|
| `UrgencyTicker.tsx` | ~3,568 (dynamic) | Quote Scanner page |
| `ScannerSocialProof.tsx` | 12,847 (static) | Quote Scanner page |
| `AnimatedStatsBar.tsx` | 12,847 (static) | Audit page |
| `ScannerHeroWindow.tsx` | 12,847+ (static) | Audit hero |
| `PathSelector.tsx` | 12,847+ (static) | Audit modal |

**Result:** Conflicting numbers undermine credibility.

---

## Solution Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                   useProjectedQuotes.ts                     │
│                   (Single Source of Truth)                  │
│                                                             │
│  Config: startDate='2024-02-12', base=0, growth=4.9        │
│  Returns: { total: 3568, today: 19 }                        │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ UrgencyTicker │   │ ScannerSocial │   │ AnimatedStats │
│   (animated)  │   │    Proof      │   │     Bar       │
└───────────────┘   └───────────────┘   └───────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼
┌───────────────┐   ┌───────────────┐
│ ScannerHero   │   │ PathSelector  │
│    Window     │   │   (modal)     │
└───────────────┘   └───────────────┘
```

---

## Technical Implementation

### File 1: `src/hooks/useProjectedQuotes.ts` (NEW)

Create the shared hook with the calculation logic extracted from `UrgencyTicker.tsx`:

```tsx
import { useMemo } from 'react';

// Seeded random for consistent "today" count
const getDailyRandom = (seed: string, min: number, max: number) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const random = (Math.abs(hash) % 1000) / 1000;
  return Math.floor(random * (max - min + 1)) + min;
};

// Configuration constants
const START_DATE = new Date('2024-02-12');
const BASE_TOTAL = 0;
const GROWTH_RATE = 4.9;
const TODAY_MIN = 12;
const TODAY_MAX = 28;

export function useProjectedQuotes() {
  return useMemo(() => {
    const now = new Date();
    
    const daysPassed = Math.floor(
      (now.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const todayString = now.toISOString().split('T')[0];
    const today = getDailyRandom(todayString, TODAY_MIN, TODAY_MAX);

    const total = Math.floor(BASE_TOTAL + (daysPassed * GROWTH_RATE) + today);

    return { total, today };
  }, []);
}
```

**Key Features:**
- Pure calculation with no side effects
- Memoized for performance
- Exports both `total` and `today` values
- Constants at top for easy adjustment

---

### File 2: `src/components/quote-scanner/UrgencyTicker.tsx` (MODIFY)

Refactor to consume the shared hook instead of inline calculation:

**Changes:**
1. Remove `getDailyRandom` helper function (moved to hook)
2. Remove the inline `useMemo` calculation
3. Import and use `useProjectedQuotes` hook

```tsx
// Before:
const { total, today } = useMemo(() => {
  const startDate = new Date('2024-02-12');
  // ... calculation logic
}, []);

// After:
import { useProjectedQuotes } from '@/hooks/useProjectedQuotes';

const { total, today } = useProjectedQuotes();
```

---

### File 3: `src/components/quote-scanner/ScannerSocialProof.tsx` (MODIFY)

Replace hardcoded `'12,847'` with dynamic value.

**Changes:**
1. Convert from static array to component with hook
2. Import `useProjectedQuotes`
3. Build stats array dynamically using `total.toLocaleString()`

```tsx
// Before:
const stats = [
  {
    icon: ScanSearch,
    value: '12,847',  // ❌ Hardcoded
    label: 'Quotes Scanned',
    ...
  },
  ...
];

// After:
export function ScannerSocialProof() {
  const { total } = useProjectedQuotes();
  
  const stats = [
    {
      icon: ScanSearch,
      value: total.toLocaleString(),  // ✅ Dynamic
      label: 'Quotes Scanned',
      ...
    },
    ...
  ];
```

---

### File 4: `src/components/audit/AnimatedStatsBar.tsx` (MODIFY)

Replace hardcoded `12847` in STATS array.

**Challenge:** This component uses an animated count-up effect with the static value.

**Solution:** Inject the dynamic `total` into the STATS array at render time.

```tsx
// Before:
const STATS: StatItem[] = [
  ...
  {
    icon: <FileSearch className="w-5 h-5" />,
    value: 12847,  // ❌ Hardcoded
    suffix: '+',
    label: 'Quotes Analyzed',
    ...
  },
  ...
];

// After:
export function AnimatedStatsBar() {
  const { total } = useProjectedQuotes();
  
  const stats: StatItem[] = [
    ...
    {
      icon: <FileSearch className="w-5 h-5" />,
      value: total,  // ✅ Dynamic from hook
      suffix: '+',
      label: 'Quotes Analyzed',
      ...
    },
    ...
  ];
```

---

### File 5: `src/components/audit/ScannerHeroWindow.tsx` (MODIFY)

Replace hardcoded string in trust signals section (line 288).

```tsx
// Before:
<span>12,847+ Quotes Scanned</span>

// After:
import { useProjectedQuotes } from '@/hooks/useProjectedQuotes';

// Inside component:
const { total } = useProjectedQuotes();

// In JSX:
<span>{total.toLocaleString()}+ Quotes Scanned</span>
```

---

### File 6: `src/components/audit/scanner-modal/PathSelector.tsx` (MODIFY)

Replace hardcoded string in social proof section (line 101).

```tsx
// Before:
<span className="block text-lg font-bold text-orange-400">12,847+</span>

// After:
import { useProjectedQuotes } from '@/hooks/useProjectedQuotes';

// Inside component:
const { total } = useProjectedQuotes();

// In JSX:
<span className="block text-lg font-bold text-orange-400">{total.toLocaleString()}+</span>
```

---

## Files Summary

| File | Action | Changes |
|------|--------|---------|
| `src/hooks/useProjectedQuotes.ts` | CREATE | Shared hook with date-based calculation logic |
| `src/components/quote-scanner/UrgencyTicker.tsx` | MODIFY | Import hook, remove inline calculation |
| `src/components/quote-scanner/ScannerSocialProof.tsx` | MODIFY | Use hook for "Quotes Scanned" stat |
| `src/components/audit/AnimatedStatsBar.tsx` | MODIFY | Use hook for "Quotes Analyzed" stat |
| `src/components/audit/ScannerHeroWindow.tsx` | MODIFY | Use hook for trust signal text |
| `src/components/audit/scanner-modal/PathSelector.tsx` | MODIFY | Use hook for social proof stat |

---

## Expected Result

After implementation, **all 5 components** will display:
- **Total:** ~3,568 (as of Feb 8, 2026)
- **Today:** 12-28 (seeded daily random)

All numbers grow in perfect unison at 4.9 quotes/day.
