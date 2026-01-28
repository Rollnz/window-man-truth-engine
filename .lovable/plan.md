

# AI Scanner Layout: Side-by-Side CTAs with Results Below

## Overview

Restructure the `/ai-scanner` page layout to show two parallel conversion paths:
- **Before (Upload Zone)**: For users with quotes ready to scan
- **No Quote Pivot**: For users without quotes who need an alternative path

The "After" (Results) section moves below both, serving as the shared output area.

---

## Layout Structure

### Desktop (lg breakpoint)

```text
┌─────────────────────────┬─────────────────────────┐
│  Before                 │  No Quote               │
│  (Upload Zone)          │  (Pivot Section)        │
│  Compact ~200px         │  Matching height        │
└─────────────────────────┴─────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  After (Full Width - Results)                       │
│  Compact preview initially, expands on scan         │
└─────────────────────────────────────────────────────┘
```

### Mobile (stacked)

```text
┌─────────────────────────────────────────────────────┐
│  Before (Upload Zone)                               │
├─────────────────────────────────────────────────────┤
│  No Quote Pivot (condensed version)                 │
├─────────────────────────────────────────────────────┤
│  After (Results)                                    │
└─────────────────────────────────────────────────────┘
```

---

## Files to Modify

### 1. `src/pages/QuoteScanner.tsx`

**Restructure the main grid layout:**

Current structure (lines 120-191):
- 2-column grid: Upload | Results
- NoQuotePivotSection is in a separate section below

New structure:
- Row 1: 2-column grid: Upload | No Quote Pivot
- Row 2: Full-width Results section

```tsx
{/* Row 1: Two parallel CTAs */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
  {/* Left: Upload Zone */}
  <div className="space-y-4">
    <QuoteUploadZone ... />
  </div>

  {/* Right: No Quote Pivot (condensed) */}
  <div className="space-y-4">
    <NoQuotePivotCondensed ... />
  </div>
</div>

{/* Row 2: Results (full width, below both) */}
<div className="mt-8">
  <QuoteAnalysisResults ... />
  {/* Negotiation tools, QA, etc. when unlocked */}
</div>
```

**Remove the standalone NoQuotePivotSection** from the separate section (lines 198-213) since it's now integrated into the main grid.

---

### 2. `src/components/quote-scanner/QuoteUploadZone.tsx`

**Compact the height to match No Quote Pivot:**

Line 76 change:
```tsx
// FROM:
"min-h-[300px] md:min-h-[400px]"

// TO:
"min-h-[200px] md:min-h-[240px]"
```

**Remove visual storytelling elements** (they won't fit in compact space):
- Remove `SampleQuoteDocument` component (lines 119-121)
- Remove `FloatingCallout` components (lines 123-139)

Keep only the core upload CTA:
- Upload icon
- "Upload Your Estimate" heading
- "JPG, PNG, or PDF up to 10MB" subtext
- "Select File" button

---

### 3. Create `src/components/quote-scanner/vault-pivot/NoQuotePivotCondensed.tsx`

**New component: Condensed version of the pivot section for side-by-side layout**

Purpose: A more compact version of `NoQuotePivotSection` that fits next to the upload zone.

Content (condensed from the full version):
- WindowMan voice headline: "Don't have a quote yet?"
- Brief value prop (2-3 lines max)
- 1-2 key advantage bullets (not the full 3-card grid)
- Single CTA button to vault or estimate flow

Height target: Match the Upload Zone (~240px on desktop)

```tsx
export function NoQuotePivotCondensed() {
  return (
    <div className="p-6 rounded-xl border border-border/40 bg-background h-full flex flex-col justify-between">
      {/* Header */}
      <div className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
        Don't Have a Quote?
      </div>
      
      {/* Headline */}
      <h3 className="text-xl font-bold text-foreground mb-3">
        That's actually the best time to find me.
      </h3>
      
      {/* Brief value prop */}
      <p className="text-sm text-muted-foreground mb-4">
        I meet homeowners before they get quotes, not after. 
        That's when I can help you the most.
      </p>
      
      {/* CTA */}
      <Button className="w-full">
        Start Without a Quote
      </Button>
    </div>
  );
}
```

---

### 4. `src/components/quote-scanner/QuoteAnalysisResults.tsx`

**Create compact preview state:**

When `result` is null, show condensed version:
- Header label ("After: Your AI Quote Gradecard")
- Overall Score placeholder box
- 2 preview score rows (Safety, Price) with "?" values
- "Upload to Reveal" lock overlay

When `result` exists, expand to full version:
- All 5 score categories
- Warnings section
- Missing items section
- Timestamp

This allows natural height expansion without forcing equal heights.

---

## Visual Flow

### User WITH a quote:
1. Lands on page → sees Upload Zone (left) and No Quote option (right)
2. Clicks "Select File" → uploads quote
3. Analysis runs → Results section below expands with full gradecard
4. Can access negotiation tools, email drafts, etc.

### User WITHOUT a quote:
1. Lands on page → sees Upload Zone (left) and No Quote option (right)
2. Immediately sees the alternative path on the right
3. Clicks "Start Without a Quote" → enters vault/estimate flow
4. Never has to scroll to find their option

---

## Mobile Behavior

On mobile (< lg breakpoint):
1. Before (Upload) - visible immediately
2. No Quote Pivot - visible right below, no scrolling needed
3. Results - below both, starts compact

The stacked order ensures users see both options before any output area.

---

## Components Summary

| Component | Location | Purpose |
|-----------|----------|---------|
| `QuoteUploadZone` | Top-left (desktop) / First (mobile) | Primary CTA for users with quotes |
| `NoQuotePivotCondensed` | Top-right (desktop) / Second (mobile) | Alternative path for users without quotes |
| `QuoteAnalysisResults` | Full-width below (desktop) / Third (mobile) | Shared output area, expands on scan |

---

## Build Order

1. Create `NoQuotePivotCondensed.tsx` - new condensed component
2. Modify `QuoteUploadZone.tsx` - reduce height, remove storytelling elements
3. Modify `QuoteAnalysisResults.tsx` - add compact preview state
4. Modify `QuoteScanner.tsx` - restructure grid layout
5. Remove standalone `NoQuotePivotSection` from the page (it's now integrated)

---

## Technical Notes

- Use `items-stretch` on the top row grid to ensure equal heights between Upload and No Quote
- Results section uses natural height (no forced min-height) so it can expand
- Mobile uses `flex-col` ordering: Upload → No Quote → Results
- Existing analytics events remain unchanged (they fire on user actions, not layout)

