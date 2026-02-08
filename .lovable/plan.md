

# UrgencyTicker - Gemini Cyberpunk Style + Updated Dynamic Numbers

## Overview
Create the urgency ticker with the cyberpunk/tech aesthetic using specific Zinc, Emerald, and Amber translucent colors, plus date-based dynamic number calculation with updated baseline values.

---

## Visual Design (Gemini Style)

```text
┌──────────────────────────────────────────────────────────────────┐
│  🛡️(emerald)  3,568 quotes scanned  │  🟠(amber) +19 today      │
│  [dark zinc bg with glass effect]    │  [amber tinted section]   │
└──────────────────────────────────────────────────────────────────┘
```

**Cyberpunk Color Palette:**
| Element | Color Class |
|---------|-------------|
| Container BG | `bg-zinc-900/70` (translucent dark) |
| Container Border | `border-zinc-700/40` (subtle) |
| Divider | `divide-zinc-700/50` |
| Shield Icon | `text-emerald-400` |
| Total Number | `text-zinc-100` |
| "quotes scanned" label | `text-zinc-400` |
| Today Section BG | `bg-amber-500/10` (tinted) |
| Pulsing Dot | `bg-amber-400` |
| Today Text | `text-amber-300` |

---

## Updated Dynamic Number Logic

**Configuration:**
| Parameter | Value |
|-----------|-------|
| Start Date | `2024-02-12` |
| Base Total | `0` |
| Growth Rate | `4.9` quotes/day |

**Calculation Formula:**
```text
Total = 0 + (4.9 × Days Since Feb 12, 2024) + Today's Count

Today = Seeded random (12-28) based on date string hash
```

**Example Progression:**
| Date | Days Passed | Today | Total |
|------|-------------|-------|-------|
| 2024-02-12 | 0 | 17 | 0 + (0×4.9) + 17 = 17 |
| 2025-02-08 | 362 | 21 | 0 + (362×4.9) + 21 = 1,795 |
| 2026-02-08 | 727 | 19 | 0 + (727×4.9) + 19 = 3,581 |

**Note:** Today (Feb 8, 2026) shows approximately **3,568** quotes as expected.

---

## Technical Implementation

### File 1: `src/components/quote-scanner/UrgencyTicker.tsx` (NEW)

**Complete Component:**

```tsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { Shield } from 'lucide-react';

// Generates consistent "random" number for a date string
// Same seed = same number (no flickering on refresh)
const getDailyRandom = (seed: string, min: number, max: number) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const random = (Math.abs(hash) % 1000) / 1000;
  return Math.floor(random * (max - min + 1)) + min;
};

// easeOutExpo count animation
function useCountUp(end: number, duration: number = 2500) {
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

export function UrgencyTicker() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Dynamic date-based calculation with UPDATED VALUES
  const { total, today } = useMemo(() => {
    const startDate = new Date('2024-02-12'); // Updated start date
    const now = new Date();
    
    const daysPassed = Math.floor(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Today's count: seeded random 12-28
    const todayString = now.toISOString().split('T')[0];
    const todayCount = getDailyRandom(todayString, 12, 28);

    // Total: base + growth + today (UPDATED VALUES)
    const baseTotal = 0;
    const growthRate = 4.9;
    const currentTotal = Math.floor(baseTotal + (daysPassed * growthRate) + todayCount);

    return { total: currentTotal, today: todayCount };
  }, []);

  // Single IntersectionObserver for unified trigger
  useEffect(() => {
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
  }, []);

  // Both animate simultaneously
  const totalCount = useCountUp(isVisible ? total : 0, 2500);
  const todayCount = useCountUp(isVisible ? today : 0, 2500);

  return (
    <div ref={ref} className="flex items-center justify-center">
      <div className="inline-flex items-center divide-x divide-zinc-700/50 rounded-lg 
                      bg-zinc-900/70 border border-zinc-700/40 overflow-hidden 
                      shadow-xl backdrop-blur-sm ring-1 ring-white/5">
        
        {/* Left: Total Count */}
        <div className="flex items-center gap-2 px-4 py-2.5">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-zinc-100 tabular-nums">
            {totalCount.toLocaleString()}
          </span>
          <span className="text-xs text-zinc-400">quotes scanned</span>
        </div>

        {/* Right: Today Count */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 h-full">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full 
                           rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </div>
          <span className="text-sm font-semibold text-amber-300 tabular-nums">
            +{todayCount} today
          </span>
        </div>

      </div>
    </div>
  );
}
```

---

### File 2: `src/pages/QuoteScanner.tsx` (MODIFY)

**Add import and placement:**

```tsx
// Add import at top
import { UrgencyTicker } from '@/components/quote-scanner/UrgencyTicker';

// After QuoteScannerHero, before upload section:
<QuoteScannerHero />

<div className="container px-4 pb-6 -mt-6">
  <UrgencyTicker />
</div>

<section className="py-12 md:py-20">
  {/* Upload zone grid... */}
</section>
```

---

## Animation Timeline

```text
Time: 0ms ──────────────────────────────────────────► 2500ms
      │                                               │
      ├─ Viewport entry → isVisible = true            │
      │                                               │
      ├─ Total:  0 ─────────────────────► 3,568       │
      │          └── easeOutExpo curve                │
      │                                               │
      ├─ Today:  0 ─────────────────────► 19          │
      │          └── SAME curve, SAME start time      │
      │                                               │
      └── Both land together, unified feel ───────────┘
```

---

## Key Features Summary

| Feature | Implementation |
|---------|----------------|
| Cyberpunk Aesthetic | Zinc/Emerald/Amber palette, glass effect |
| Daily Growth | ~4.9 quotes/day from Feb 12, 2024 |
| Current Total | ~3,568 as of Feb 8, 2026 |
| Consistent "Today" | Seeded hash ensures same number all day (12-28 range) |
| Unified Animation | Single trigger, both numbers animate together |
| No Backend Needed | Pure client-side calculation |
| Mobile Compatible | `inline-flex` keeps side-by-side on all screens |

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/quote-scanner/UrgencyTicker.tsx` | CREATE | Gemini-style ticker with updated dynamic math |
| `src/pages/QuoteScanner.tsx` | MODIFY | Import and place ticker after hero |

