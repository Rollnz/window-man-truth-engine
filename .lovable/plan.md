

# Dynamic Warning Bubbles on Before Card (Post-Analysis)

## What Changes

Add dynamic warning bubbles to the "Before" card after analysis completes. The bubbles show the 3 lowest-scoring categories from the AI results, positioned over the uploaded image preview.

## File Changes

### 1. `src/components/quote-scanner/QuoteUploadZone.tsx`

**New prop:** Accept `analysisResult` from parent so the component knows what scores came back.

```
interface QuoteUploadZoneProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
  hasResult: boolean;
  imagePreview: string | null;
  analysisResult?: QuoteAnalysisResult | null;  // NEW
}
```

**New logic:** A helper function that takes the analysis result, extracts the 5 category scores (safety, scope, price, finePrint, warranty), sorts them ascending, and returns the bottom 3 as callout configs:

```
function getTopWarnings(result: QuoteAnalysisResult): Array<{
  type: EnhancedCalloutType;
  heading: string;
  description: string;
}> {
  const categories = [
    { key: 'safety', score: result.safetyScore, heading: 'Safety Risk', type: 'missing' as const, desc: 'Impact ratings or design pressures missing' },
    { key: 'scope', score: result.scopeScore, heading: 'Scope Gaps', type: 'missing' as const, desc: 'Key line items missing from scope' },
    { key: 'price', score: result.priceScore, heading: 'Price Concern', type: 'price' as const, desc: 'Pricing outside fair market range' },
    { key: 'finePrint', score: result.finePrintScore, heading: 'Fine Print Alert', type: 'legal' as const, desc: 'Hidden clauses or risky terms found' },
    { key: 'warranty', score: result.warrantyScore, heading: 'Warranty Issue', type: 'warning' as const, desc: 'Inadequate warranty coverage detected' },
  ];
  return categories
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(c => ({
      type: c.score < 50 ? 'missing' as const : c.type,  // Force red for scores under 50
      heading: c.heading,
      description: `Score: ${c.score}/100 — ${c.desc}`,
    }));
}
```

**Color logic:** Scores below 50 force the `missing` type (red/rose bubble). Scores 50-69 use `warning` type (amber). This ensures critical issues appear as red bubbles, not yellow.

**New JSX block:** Inside the upload zone, after the image preview renders and when `imagePreview` exists, `!isAnalyzing`, and `analysisResult` exists, render 3 `EnhancedFloatingCallout` components at staggered positions:

- Warning 1: top-right area
- Warning 2: middle-left area  
- Warning 3: bottom-left area

These mirror the pre-upload callout positions but show real data.

### 2. `src/pages/QuoteScanner.tsx`

Pass `analysisResult` down to `QuoteUploadZone`:

```
<QuoteUploadZone
  ref={uploadRef}
  onFileSelect={handleFileSelect}
  isAnalyzing={isAnalyzing}
  hasResult={!!analysisResult}
  imagePreview={imageBase64}
  analysisResult={analysisResult}   // NEW
/>
```

## What Does NOT Change

- `EnhancedFloatingCallout` component (reused as-is)
- `QuoteAnalysisResult` interface (read-only)
- Analysis flow, API calls, tracking
- Pre-upload static callouts (still show before any upload)
- The "After" gradecard display

## Visual Behavior

| State | Before Card Shows |
|-------|-------------------|
| No upload yet | Sample document + 4 static callouts |
| Analyzing | Spinner overlay |
| Post-analysis | Uploaded image + 3 dynamic warning bubbles (red for low scores) + "Select Different File" button |

## Edge Cases

- If all 5 scores are high (80+), the 3 lowest still show but with amber/warning styling (not red)
- Bubbles use staggered animation delays (200ms, 400ms, 600ms) for visual polish
- Mobile: heading always visible, description hidden (existing EnhancedFloatingCallout behavior)

