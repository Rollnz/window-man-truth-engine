

## Plan: Premium PowerToolFlow Callout Card

### Changes to `src/pages/Signup.tsx`

**1. Remove the `lg:hidden` PowerToolFlow wrapper** (lines 483-486).

**2. Insert a new Callout Card section between the upload zone's "I Have a Quote" column and the "Don't Have a Quote Yet?" section.** Restructure the Split Conversion Zone so the layout stacks vertically:

- "I Have a Quote" upload zone (full width or kept in grid)
- PowerToolFlow Callout Card (new, full width)
- "Don't Have a Quote Yet?" (moved below, full width, `max-w-2xl mx-auto`)

**3. The Callout Card implementation:**

```tsx
import { Sparkles, CheckCircle2 } from 'lucide-react';

{/* PowerToolFlow — Premium Callout Card */}
<AnimateOnScroll duration={600} threshold={0.2}>
  <section className="px-4 py-10 group">
    <div className="relative max-w-2xl mx-auto">
      {/* Ambient glow — GPU-only (opacity + blur) */}
      <div className="absolute -inset-4 rounded-3xl bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none" />

      {/* Card */}
      <div className="relative rounded-3xl border border-border/40 bg-card/40 backdrop-blur-sm p-8 text-center space-y-4 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/40">
        {/* Trust badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
          <Sparkles className="w-3 h-3 animate-pulse" />
          100% Free AI Demo
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
          Want to test the AI first?
        </h3>

        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Run a free demo scan to see how the Truth Engine catches hidden fees, inflated pricing, and missing scope items.
        </p>

        <PowerToolFlow />

        <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          Takes 30 seconds. No credit card required.
        </p>
      </div>
    </div>
  </section>
</AnimateOnScroll>
```

**Key design decisions:**

- **Scroll entrance**: `AnimateOnScroll` with `duration={600}` and `threshold={0.2}` -- slides up and fades in as user scrolls, breaking banner blindness
- **Glassmorphism**: `bg-card/40 backdrop-blur-sm rounded-3xl` -- premium frosted glass
- **Tactile hover**: `hover:-translate-y-1 hover:shadow-2xl hover:border-primary/40` -- card lifts and illuminates on hover, all GPU-accelerated (`transform` + `opacity` + `box-shadow`)
- **Ambient glow**: Absolute-positioned `blur-2xl` div behind card, fades in on `group-hover` via `opacity` transition only -- zero layout thrash
- **CRO badge**: Pulsing sparkle icon in a pill badge ("100% Free AI Demo") catches the eye instantly
- **Social proof**: `CheckCircle2` icon next to microcopy reinforces safety
- **Performance**: All animations use Tailwind CSS transitions on `transform`, `opacity`, `box-shadow` -- GPU-composited, zero Lighthouse impact

**4. "Don't Have a Quote Yet?" section** moves below the callout card, wrapped in `max-w-2xl mx-auto` for consistent width, deprioritized in the visual hierarchy.

### Files

| File | Action |
|------|--------|
| `src/pages/Signup.tsx` | Edit lines 483-559 |

