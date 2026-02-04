

# XRayScannerBackground - Mobile-Optimized Implementation

## Summary
Create a reusable, mobile-optimized `XRayScannerBackground` wrapper component with scroll-driven X-ray scanner visual effects that work across all device sizes with appropriate performance optimizations.

---

## Component Architecture

### Visual Layers (All Devices)

```text
┌─────────────────────────────────────────────────┐
│  Layer 1: Scrolling Contract Text               │  ← 3% desktop / 2% mobile opacity
│  ─────────────────────────────────────────────  │
│  Layer 2: Green Scan Bar + Glow                 │  ← Scroll-driven, reduced glow on mobile
│  ─────────────────────────────────────────────  │
│  Layer 3: Red Flag Badges                       │  ← Scale 0.8 on mobile, safe positioning
│  ─────────────────────────────────────────────  │
│  Layer 4: {children}                            │  ← Actual content (z-10)
└─────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/ui/XRayScannerBackground.tsx` | Create | Reusable scanner effect wrapper |
| `src/components/audit/UploadZoneXRay.tsx` | Modify | Wrap content with scanner background |

---

## File 1: `src/components/ui/XRayScannerBackground.tsx`

### Props Interface

```tsx
interface XRayScannerBackgroundProps {
  children: ReactNode;
  contractLines?: string[];
  redFlags?: Array<{ top: string; left: string; label: string; delay: number }>;
  className?: string;
  padding?: string;
}
```

### Key Technical Implementation

**1. Scroll-Driven Animation (NOT timer-based)**
```tsx
const progress = Math.max(0, Math.min(1, scrollPosition / scrollRange));
// Scan bar follows scroll position
style={{ top: `${scanProgress * 100}%` }}
```

**2. IntersectionObserver for Performance**
```tsx
const [isInView, setIsInView] = useState(false);
const sectionRef = useRef<HTMLElement>(null);

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => setIsInView(entry.isIntersecting),
    { threshold: 0.1 }
  );
  if (sectionRef.current) observer.observe(sectionRef.current);
  return () => observer.disconnect();
}, []);
```

**3. Reduced Motion Support**
```tsx
const prefersReducedMotion = useReducedMotion();
// Skip all animations when user prefers reduced motion
```

### Default Contract Lines
```tsx
const DEFAULT_CONTRACT_LINES = [
  "ADMIN FEE – $1,950",
  "EMERGENCY RUSH – $3,200",
  "PERMIT PROCESSING – $875",
  "DISPOSAL FEE – $650",
  "WEEKEND SURCHARGE – $1,400",
  "CONSULTATION CHARGE – $550",
  "MATERIAL HANDLING – $925",
  "INSPECTION FEE – $780",
];
```

### Default Red Flags
```tsx
const DEFAULT_RED_FLAGS = [
  { top: '15%', left: '20%', label: '🚩 Markup 40%', delay: 0 },
  { top: '35%', left: '60%', label: '🚩 Junk Fee', delay: 0.2 },
  { top: '55%', left: '30%', label: '🚩 Double Counting', delay: 0.4 },
  { top: '75%', left: '70%', label: '🚩 Unnecessary', delay: 0.6 },
];
```

### Mobile-Optimized CSS (Inline Styles)

```css
@keyframes scroll-horizontal {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.animate-scroll-horizontal {
  animation: scroll-horizontal 60s linear infinite;
  will-change: transform;
}

.animate-scroll-horizontal-delayed {
  animation: scroll-horizontal 60s linear infinite;
  animation-delay: -30s;
  will-change: transform;
}

/* Pause animation when not animating (controlled by isInView) */
.animation-paused {
  animation-play-state: paused;
}

/* Mobile red flag optimization */
@media (max-width: 767px) {
  .red-flag-badge {
    transform: scale(0.8);
    white-space: nowrap;
  }
}

@media (prefers-reduced-motion: reduce) {
  .animate-scroll-horizontal,
  .animate-scroll-horizontal-delayed {
    animation: none;
  }
}
```

### Layer Implementation Details

**Layer 1: Contract Text (Background Texture)**
```tsx
<div 
  className={cn(
    "absolute inset-0 overflow-hidden pointer-events-none",
    "opacity-[0.03] md:opacity-[0.03]", // 3% desktop, 2% mobile could be opacity-[0.02]
    "transform-gpu" // Force GPU acceleration
  )}
  aria-hidden="true"
>
  <div className={cn(
    "whitespace-nowrap text-xs md:text-sm leading-relaxed",
    isInView ? "animate-scroll-horizontal" : "animation-paused"
  )}>
    {/* Duplicated text for seamless loop */}
    {[...contractLines, ...contractLines].map((line, i) => (
      <span key={i} className="inline-block px-8 text-foreground/50">
        {line}
      </span>
    ))}
  </div>
</div>
```

**Layer 2: Scan Bar (Scroll-Driven)**
```tsx
<div
  className={cn(
    "absolute left-0 right-0 h-1 bg-success transform-gpu",
    "shadow-[0_0_20px_hsl(var(--success))]", // Base glow
    "md:shadow-[0_0_40px_hsl(var(--success))]" // Enhanced glow on desktop
  )}
  style={{ top: `${scanProgress * 100}%` }}
  aria-hidden="true"
/>
```

**Layer 3: Red Flags (Appear as Scan Passes)**
```tsx
{redFlags.map((flag, index) => {
  const flagProgress = scanProgress * 100;
  const flagPosition = parseFloat(flag.top);
  const isVisible = flagProgress > flagPosition - 10 && flagProgress < flagPosition + 10;
  
  // Safe left positioning for mobile
  const safeLeft = `clamp(10%, ${flag.left}, 85%)`;
  
  return (
    <div
      key={index}
      className={cn(
        "absolute px-2 py-1 rounded text-xs font-bold",
        "bg-destructive text-destructive-foreground",
        "transition-opacity duration-300 pointer-events-none",
        "red-flag-badge", // For mobile scaling
        isVisible ? "opacity-100" : "opacity-0"
      )}
      style={{ 
        top: flag.top, 
        left: safeLeft,
        transitionDelay: `${flag.delay}s`
      }}
      aria-hidden="true"
    >
      {flag.label}
    </div>
  );
})}
```

---

## File 2: `src/components/audit/UploadZoneXRay.tsx`

### Changes Required

Replace the outer `<section>` wrapper with `<XRayScannerBackground>`:

**Before:**
```tsx
<section className="relative py-16 md:py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
  {/* Grid background */}
  <div className="absolute inset-0 opacity-20">...</div>
  
  <div className="container relative px-4 mx-auto max-w-7xl">
    {/* Content */}
  </div>
</section>
```

**After:**
```tsx
import { XRayScannerBackground } from '@/components/ui/XRayScannerBackground';

<XRayScannerBackground
  className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
  padding="py-16 md:py-24"
>
  {/* Grid background - kept inside */}
  <div className="absolute inset-0 opacity-20">...</div>
  
  <div className="container relative px-4 mx-auto max-w-7xl z-10">
    {/* Content - add z-10 to ensure it's above scanner layers */}
  </div>
</XRayScannerBackground>
```

---

## Performance Optimizations Summary

| Optimization | Implementation | Benefit |
|--------------|----------------|---------|
| GPU Acceleration | `transform-gpu` class | Offloads rendering to GPU |
| Animation Hints | `will-change: transform` | Browser pre-optimizes layers |
| Viewport Pause | IntersectionObserver | Stops animation when off-screen |
| Mobile Opacity | `opacity-[0.02]` on mobile | Reduces compositing cost |
| Reduced Glow | Smaller `shadow` on mobile | Less GPU blur processing |
| Reduced Motion | `prefers-reduced-motion` check | Respects system settings |

---

## Accessibility

- All decorative layers have `aria-hidden="true"`
- Respects `prefers-reduced-motion` system preference
- Content remains fully accessible with `z-10` stacking
- Pointer events disabled on all scanner layers

---

## Testing Checklist

After implementation:
1. Scroll through /audit page on desktop - verify scan bar follows scroll
2. Test on mobile device - verify smooth animation without jank
3. Check red flags appear/disappear correctly as scan passes
4. Enable reduced motion in OS - verify all animations disabled
5. Test battery usage on mobile (optional) - verify animation pauses when off-screen
6. Verify content remains clickable above scanner layers

