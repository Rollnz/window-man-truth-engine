

# Add Rotating Value Props to /audit Scanner Section + 5 CRO Upgrades

## Placement

Inside `UploadZoneXRay.tsx`, between the subtitle paragraph (line 446-449) and the Before/After column labels grid (line 452). This is the "decision zone" -- the last thing a user reads before deciding whether to upload.

## 5 CRO Improvements Over the /ai-scanner Version

### 1. Urgency-First Ordering
Reorder VALUE_PROPS so the highest-converting messages rotate first. Lead with loss aversion ("80% contain hidden errors"), then social proof ("only unbiased review"), then empowerment ("negotiate with facts"). Current order buries the strongest hooks.

### 2. Audit-Specific Copy
Swap generic scanner language for audit-specific phrasing that matches the page's "X-Ray" theme. E.g., "Translates Contractor Jargon" becomes "Our AI X-Ray decodes contractor jargon into plain English red flags." Matches the visual metaphor users already see.

### 3. Icon-Enhanced Chips Instead of Plain Text
Instead of a single rotating line of text, render the current value prop as a styled chip/badge with the emoji as a colored icon element (not raw emoji). This gives it visual weight and stops it from looking like a disclaimer. Chips feel clickable and premium.

### 4. Fade-Up Entry Animation Tied to Scroll
The current version only fades in/out on a timer. Add an initial `AnimateOnScroll` wrapper so the prop line fades up from invisible as the section enters the viewport -- giving it a "reveal" moment that draws the eye. After the initial reveal, the rotation timer kicks in.

### 5. Progress Dots / Count Indicator
Add small dot indicators below the text (like carousel dots) showing which of the 7 props is active. This creates implicit "there's more" curiosity and keeps users watching longer. Each dot lights up as the prop rotates, adding micro-interaction without distraction.

## Technical Plan

### Extract Shared Code
Create `src/components/ui/RotatingValueProp.tsx` with `VALUE_PROPS`, `renderHighlighted`, and the `RotatingValueProp` component extracted from `ScanPipelineStrip.tsx`. Both pages import from the shared file. This avoids code duplication.

The shared component accepts:
- `active: boolean` -- controls timer start
- `variant?: 'light' | 'dark'` -- light for /ai-scanner, dark for /audit (slate bg)
- `showDots?: boolean` -- enables the progress dot indicators (CRO #5)

### Update UploadZoneXRay.tsx

Import `RotatingValueProp` and place it after the subtitle `<p>` tag (line 449) and before the Before/After labels grid (line 452):

```
<p className="text-lg text-slate-400 ...">
  Stop guessing... before you sign.
</p>

{/* NEW: Rotating value propositions */}
<RotatingValueProp active={true} variant="dark" showDots />

<div className="grid grid-cols-1 lg:grid-cols-2 ...">
  {/* Before / After labels */}
```

### Update ScanPipelineStrip.tsx

Replace the inline `VALUE_PROPS`, `renderHighlighted`, and `RotatingValueProp` with an import from the shared file. No visual change on /ai-scanner.

### Updated VALUE_PROPS (Audit-Optimized Order + Copy)

```typescript
const VALUE_PROPS = [
  "{80%} of quotes contain hidden errors. Find yours before you sign.",
  "The only {unbiased}, non-commissioned review in the industry.",
  "100% {Private} — Your contractor will never know you scanned this.",
  "Our AI X-Ray decodes contractor jargon into plain English {red flags}.",
  "Shift the power dynamic. Negotiate with {facts}, not feelings.",
  "Faster (and more accurate) than getting a {second opinion}.",
  "See exactly what your contractor is hoping you {won't notice}.",
];
```

### Dot Indicators

Below the rotating text, render 7 small circles. The active one uses `bg-primary`, the rest use `bg-slate-700`. Transition opacity on change. Total height: ~8px, no layout shift.

```tsx
<div className="flex justify-center gap-1.5 mt-2">
  {VALUE_PROPS.map((_, i) => (
    <div
      key={i}
      className={cn(
        "w-1.5 h-1.5 rounded-full transition-colors duration-300",
        i === index ? "bg-primary" : "bg-slate-700"
      )}
    />
  ))}
</div>
```

## Files Changed

| File | Change |
|------|--------|
| `src/components/ui/RotatingValueProp.tsx` | **New** -- extracted shared component with VALUE_PROPS, renderHighlighted, dot indicators, dark/light variant |
| `src/components/audit/UploadZoneXRay.tsx` | Import and place `RotatingValueProp` between subtitle and Before/After grid |
| `src/components/quote-scanner/ScanPipelineStrip.tsx` | Replace inline VALUE_PROPS/RotatingValueProp with import from shared component |

