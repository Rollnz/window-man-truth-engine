

# Match "Before" Box to Reference Screenshot -- Three Changes

## Overview

Three updates to the Before/After card area only. The hero header, counter pill, and everything above remain untouched.

---

## 1. Add `rotation` prop to `EnhancedFloatingCallout.tsx`

Add an optional `rotation` prop (number, degrees). Apply it as an inline `style={{ transform: 'rotate(Xdeg)' }}` merged with the existing animation styles. This gives callouts a scattered, hand-placed tilt.

- Props interface: add `rotation?: number`
- Apply via inline style on the root div

## 2. Update `QuoteUploadZone.tsx` -- Rotation + Dynamic Callouts

### A. Pass rotation values to the 4 static callouts

| Callout | Rotation |
|---------|----------|
| Price Warning (top-right) | -2 |
| Warranty Issue (left) | 2 |
| Missing Scope (bottom-left) | -1 |
| Legal Clause (bottom-right) | 1 |

### B. Accept `analysisResult` prop and swap callouts post-upload

- Add `analysisResult?: QuoteAnalysisResult` to the props interface (import the type from `useQuoteScanner`)
- When `analysisResult` is present AND `imagePreview` exists (post-upload state):
  - Hide the 4 static demo callouts
  - Map through `analysisResult.warnings` (up to 4) and render an `EnhancedFloatingCallout` for each, using pre-defined positions from the demo layout (top-right, left, bottom-left, bottom-right) and alternating rotation values
  - Type assignment: alternate between `warning`, `price`, `missing`, `legal` based on index

### C. Wire the prop in `QuoteScanner.tsx`

Pass `analysisResult={analysisResult}` from the parent page into `QuoteUploadZone`.

## 3. Create `AnalysisLoadingSequence.tsx`

New component: `src/components/quote-scanner/AnalysisLoadingSequence.tsx`

### Behavior
- Displays a vertical checklist of 4 steps:
  1. "Scanning document..."
  2. "Identifying line items..."
  3. "Checking market rates..."
  4. "Finalizing score"
- Each step appears every ~800ms with a fade-in animation
- Completed steps show a green checkmark icon; the active step shows a spinner; future steps are dimmed
- Uses `useEffect` with `setInterval` to advance through steps
- Props: `isActive: boolean`, `onComplete?: () => void`
- Calls `onComplete` after the last step finishes (after ~3.5s total)

### Integration in `QuoteScanner.tsx`
- In the right column, when `isAnalyzing` is true, render `AnalysisLoadingSequence` instead of `QuoteAnalysisResults`
- When `isAnalyzing` is false, show `QuoteAnalysisResults` as normal

---

## Files Summary

| File | Action |
|------|--------|
| `src/components/quote-scanner/EnhancedFloatingCallout.tsx` | Add `rotation` prop, apply as inline transform |
| `src/components/quote-scanner/QuoteUploadZone.tsx` | Add rotation to callouts, accept `analysisResult`, show dynamic callouts post-upload |
| `src/components/quote-scanner/AnalysisLoadingSequence.tsx` | **New file** -- step-by-step loading theater |
| `src/pages/QuoteScanner.tsx` | Pass `analysisResult` to `QuoteUploadZone`, conditionally render `AnalysisLoadingSequence` in right column |

## What Stays the Same

- Everything above the cards (hero, counter pill, badge) -- untouched
- All upload/drag-drop functionality
- `QuoteAnalysisResults` component internals
- GTM tracking, lead capture, session logic
- The `forwardRef` scroll behavior

