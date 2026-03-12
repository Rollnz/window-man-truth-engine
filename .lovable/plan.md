

## Plan: Build `StepProgressSequence` Component

### Create `src/components/ui/StepProgressSequence.tsx`

Prop-driven, reusable progress stepper with all five senior upgrades plus the three final requirements.

**Props:** `steps: ProgressStep[]`, `onComplete?`, `className?`, `title?`, `subtitle?`, `maxTimeoutBuffer?`

**Implementation details:**

- **SSR Safety:** `IntersectionObserver` wrapped inside `useEffect` with `typeof window === 'undefined'` guard
- **Memory Safety:** Every `setTimeout` and `observer` cleaned up in `useEffect` return functions. `onComplete` stored in a ref to avoid stale closures
- **Viewport trigger (50% visibility):** `IntersectionObserver` with `threshold: 0.5`, one-shot — disconnects after first intersection
- **One-shot only:** Observer disconnects on first trigger; no reset logic. Component stays in completed state permanently
- **Stays visible on completion:** No fade-out or collapse after finishing — prevents layout shift
- **Prop-driven steps:** `steps` array is a required prop, no hardcoded data
- **Smooth progress:** CSS `transition: width ${stepDuration}ms linear` makes the bar crawl smoothly per step rather than jumping
- **A11y:** `role="progressbar"`, `aria-valuenow/min/max`, `aria-live="polite"` on step list
- **Stuck protection:** Safety timer at `totalDuration * 1.2` shows "Taking longer than expected..." with a manual continue button
- **Tailwind native:** Uses `text-primary`, `text-muted-foreground`, `bg-green-500`, `bg-muted` — no custom CSS variables

### Edit `src/pages/Signup.tsx`

Add import and step data, insert between line 474 (PowerToolFlow close) and line 476 (Split Conversion Zone):

```tsx
import { StepProgressSequence } from '@/components/ui/StepProgressSequence';

const QUOTE_ANALYSIS_STEPS = [
  { id: 'ocr', label: 'Reading your quote...', duration: 2000 },
  { id: 'extract', label: 'Extracting line items...', duration: 2500 },
  { id: 'safety', label: 'Checking safety compliance...', duration: 2000 },
  { id: 'scope', label: 'Analyzing scope completeness...', duration: 2000 },
  { id: 'price', label: 'Evaluating pricing...', duration: 1500 },
  { id: 'finePrint', label: 'Reviewing fine print...', duration: 2000 },
  { id: 'report', label: 'Generating your report...', duration: 1500 },
];

{/* Between PowerToolFlow and Split Conversion Zone */}
<div className="lg:hidden px-4 pb-8">
  <StepProgressSequence
    steps={QUOTE_ANALYSIS_STEPS}
    title="Analyzing Your Quote"
    subtitle="Our AI is reviewing your document"
  />
</div>
```

### Files

| File | Action |
|---|---|
| `src/components/ui/StepProgressSequence.tsx` | Create |
| `src/pages/Signup.tsx` | Edit |

