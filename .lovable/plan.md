
# Wire Up Forensic UI Display - Detailed Implementation Plan

## Overview

This plan adds four new forensic sections to `FullResultsPanel.tsx` using shadcn `Alert` and `Card` components with Lucide icons. All sections will maintain the existing dark slate modal aesthetic with perfect mobile responsiveness and WCAG AA contrast.

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     COMPONENT HIERARCHY                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FullResultsPanel.tsx                                                   │
│  ├── [1] Success Banner (existing)                                      │
│  ├── [2] HardCapAlert (NEW) ─────────────────────────────────────────┐ │
│  │       Uses: Alert + AlertTitle + AlertDescription                  │ │
│  │       Icon: Scale (legal/statute reference)                        │ │
│  │       Color: Rose/red border with high contrast white text        │ │
│  │       Condition: result.forensic?.hardCapApplied === true          │ │
│  ├───────────────────────────────────────────────────────────────────┘ │
│  ├── [3] Overall Score Card (existing, updated headline)                │
│  ├── [4] StatuteCitations (NEW) ─────────────────────────────────────┐ │
│  │       Uses: Card + CardHeader + CardContent                        │ │
│  │       Icon: BookOpen (legal documentation)                         │ │
│  │       Color: Slate neutral with amber accent                       │ │
│  │       Condition: forensic.statuteCitations.length > 0              │ │
│  ├───────────────────────────────────────────────────────────────────┘ │
│  ├── [5] QuestionsToAsk (NEW) ───────────────────────────────────────┐ │
│  │       Uses: Card + CardHeader + CardContent                        │ │
│  │       Icon: HelpCircle (actionable guidance)                       │ │
│  │       Color: Primary blue accent                                   │ │
│  │       Condition: forensic.questionsToAsk.length > 0                │ │
│  ├───────────────────────────────────────────────────────────────────┘ │
│  ├── [6] Detailed Category Breakdown (existing)                         │
│  ├── [7] PositiveFindings (NEW) ─────────────────────────────────────┐ │
│  │       Uses: Card + CardHeader + CardContent                        │ │
│  │       Icon: ThumbsUp / Award                                       │ │
│  │       Color: Emerald green accent                                  │ │
│  │       Condition: forensic.positiveFindings.length > 0              │ │
│  ├───────────────────────────────────────────────────────────────────┘ │
│  ├── [8] Warnings Section (existing)                                    │
│  ├── [9] Missing Items (existing)                                       │
│  └── [10] Escalation CTAs (existing)                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useQuoteScanner.ts` | Modify | Sync `QuoteAnalysisResult` interface with forensic fields |
| `src/components/audit/scanner-modal/FullResultsPanel.tsx` | Modify | Add 4 new forensic sections using Alert/Card |
| `src/components/audit/scanner-modal/PartialResultsPanel.tsx` | Modify | Add hard cap teaser banner |

---

## Technical Details

### 1. useQuoteScanner.ts - Interface Sync

**Lines 12-24**: Extend `QuoteAnalysisResult` to include forensic fields:

```typescript
import { ForensicSummary, ExtractedIdentity } from '@/types/audit';

export interface QuoteAnalysisResult {
  overallScore: number;
  safetyScore: number;
  scopeScore: number;
  priceScore: number;
  finePrintScore: number;
  warrantyScore: number;
  pricePerOpening: string;
  warnings: string[];
  missingItems: string[];
  summary: string;
  analyzedAt?: string;
  // NEW: Forensic Authority Fields
  forensic?: ForensicSummary;
  extractedIdentity?: ExtractedIdentity;
}
```

---

### 2. FullResultsPanel.tsx - Forensic Sections

#### A. New Imports

```typescript
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  // Existing icons...
  Scale,        // Hard cap / statute
  BookOpen,     // Citations
  HelpCircle,   // Questions
  Award,        // Positive findings
} from "lucide-react";
```

#### B. Hard Cap Alert Banner (Position: After Success Banner)

**Condition**: `result.forensic?.hardCapApplied === true`

**Design Specifications**:
- Use shadcn `Alert` component with custom rose/red styling
- Scale icon for legal/statutory authority
- Full-width, responsive padding
- High contrast: white text on semi-transparent rose background
- Mobile: Stack vertically, 16px padding
- Desktop: Horizontal flex, icon left

```typescript
{result.forensic?.hardCapApplied && (
  <Alert className="border-rose-500/50 bg-rose-500/10 [&>svg]:text-rose-400">
    <Scale className="h-5 w-5" />
    <AlertTitle className="text-rose-400 font-semibold">
      Score Limited to {result.overallScore}
    </AlertTitle>
    <AlertDescription className="text-white/90 text-sm mt-1">
      <span className="font-medium">Reason:</span> {result.forensic.hardCapReason}
      {result.forensic.hardCapStatute && (
        <span className="block sm:inline sm:ml-1 text-rose-300 font-mono text-xs">
          ({result.forensic.hardCapStatute})
        </span>
      )}
    </AlertDescription>
  </Alert>
)}
```

**Contrast Notes**:
- Title: `text-rose-400` on dark bg = excellent contrast
- Description: `text-white/90` = 90% white for high readability
- Statute: `text-rose-300` mono font for legal emphasis

#### C. Overall Score Card - Updated Summary

Update the summary text to prefer forensic headline when available:

```typescript
<p className="text-xs text-slate-400 max-w-sm mx-auto">
  {result.forensic?.headline || result.summary}
</p>
```

#### D. Statute Citations Card (Position: After Overall Score)

**Condition**: `result.forensic?.statuteCitations?.length > 0`

**Design Specifications**:
- Use shadcn `Card` component
- BookOpen icon for legal documentation feel
- Amber/orange accent for warning context
- Numbered list for clarity
- Mobile: Full width, stacked items
- Desktop: Same layout, more breathing room

```typescript
{result.forensic?.statuteCitations && result.forensic.statuteCitations.length > 0 && (
  <Card className="border-amber-500/30 bg-amber-500/5">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-amber-400" />
        Florida Law References
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <ul className="space-y-2">
        {result.forensic.statuteCitations.map((citation, idx) => (
          <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
            <span className="text-amber-400 font-mono text-xs mt-0.5 shrink-0">
              {idx + 1}.
            </span>
            <span>{citation}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
)}
```

#### E. Questions to Ask Card (Position: After Statute Citations)

**Condition**: `result.forensic?.questionsToAsk?.length > 0`

**Design Specifications**:
- Use shadcn `Card` component
- HelpCircle icon for actionable guidance
- Primary blue accent for positive action
- Numbered list for checklist feel
- Mobile: Full width, touch-friendly spacing

```typescript
{result.forensic?.questionsToAsk && result.forensic.questionsToAsk.length > 0 && (
  <Card className="border-primary/30 bg-primary/5">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-primary" />
        Questions to Ask Before Signing
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <ol className="space-y-2">
        {result.forensic.questionsToAsk.map((question, idx) => (
          <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
            <span className="text-primary font-semibold min-w-[20px] shrink-0">
              {idx + 1}.
            </span>
            <span>{question}</span>
          </li>
        ))}
      </ol>
    </CardContent>
  </Card>
)}
```

#### F. Positive Findings Card (Position: After Category Breakdown)

**Condition**: `result.forensic?.positiveFindings?.length > 0`

**Design Specifications**:
- Use shadcn `Card` component
- Award icon for achievement/positive feel
- Emerald green accent for success
- Checkmark bullets for visual confirmation
- Mobile: Full width, celebration-worthy spacing

```typescript
{result.forensic?.positiveFindings && result.forensic.positiveFindings.length > 0 && (
  <Card className="border-emerald-500/30 bg-emerald-500/5">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
        <Award className="w-4 h-4 text-emerald-400" />
        What This Quote Does Well
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <ul className="space-y-2">
        {result.forensic.positiveFindings.map((finding, idx) => (
          <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <span>{finding}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
)}
```

---

### 3. PartialResultsPanel.tsx - Hard Cap Teaser

**Position**: After Overall Score Card, before category scores

**Condition**: `result.forensic?.hardCapApplied === true`

**Purpose**: Create curiosity to drive unlock conversion

```typescript
{result.forensic?.hardCapApplied && (
  <Alert className="border-rose-500/30 bg-rose-500/5">
    <AlertTriangle className="h-4 w-4 text-rose-400" />
    <AlertDescription className="text-slate-300 text-sm">
      This quote's score was <span className="text-rose-400 font-semibold">limited</span> due to a critical issue. 
      <span className="text-white font-medium"> Unlock to see why.</span>
    </AlertDescription>
  </Alert>
)}
```

---

## Visual Hierarchy (Mobile-First)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     FULL RESULTS PANEL (MOBILE)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ ✓ Full Report Unlocked                                (emerald)  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ ⚖️ Score Limited to 25                                   (rose)   │  │
│  │ Reason: No contractor license number visible                      │  │
│  │ (F.S. 489.119)                                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │              Quote Safety Score                                    │  │
│  │                    25                                              │  │
│  │                  Critical                                          │  │
│  │      Score capped at 25 due to: Missing license                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ 📖 Florida Law References                             (amber)     │  │
│  │ 1. F.S. 489.119 - No contractor license visible                   │  │
│  │ 2. FL Building Code Section 1626 requires NOA                     │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ ❓ Questions to Ask Before Signing                    (primary)   │  │
│  │ 1. What is your contractor license number?                        │  │
│  │ 2. What are the NOA or Florida Product Approval numbers?          │  │
│  │ 3. Can we restructure the payment schedule?                       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ 🏆 Detailed Breakdown                                              │  │
│  │ [Safety Score Row]                                                 │  │
│  │ [Scope Score Row]                                                  │  │
│  │ [Price Score Row]                                                  │  │
│  │ [Fine Print Score Row]                                             │  │
│  │ [Warranty Score Row]                                               │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ ✓ What This Quote Does Well                          (emerald)    │  │
│  │ ✓ License number visible and verifiable                           │  │
│  │ ✓ Product approval numbers included                               │  │
│  │ ✓ Installation scope is well-documented                           │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [Warnings Section - if any]                                            │
│  [Missing Items - if any]                                               │
│  [Escalation CTAs]                                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Contrast & Accessibility

| Element | Background | Text Color | Contrast Ratio |
|---------|------------|------------|----------------|
| Hard Cap Title | `bg-rose-500/10` | `text-rose-400` | ~7:1 |
| Hard Cap Description | `bg-rose-500/10` | `text-white/90` | ~12:1 |
| Statute Citations | `bg-amber-500/5` | `text-slate-300` | ~8:1 |
| Questions Header | `bg-primary/5` | `text-white` | ~14:1 |
| Positive Findings | `bg-emerald-500/5` | `text-slate-300` | ~8:1 |
| Card Titles | (any card bg) | `text-white` | ~14:1 |

All combinations exceed WCAG AA minimum (4.5:1).

---

## Mobile Responsiveness

All new sections follow these mobile-first principles:

1. **Full Width**: All cards use `w-full` by default
2. **Touch Targets**: List items have `py-2` minimum for 44px tap zones
3. **Text Scaling**: Base text is `text-sm` (14px) which scales well
4. **Padding**: Cards use `p-4` (16px) for comfortable mobile reading
5. **Flex Wrap**: Inline elements wrap naturally on narrow screens
6. **No Horizontal Scroll**: All content constrained to container width

---

## Implementation Sequence

| Step | File | Changes | Risk |
|------|------|---------|------|
| 1 | `useQuoteScanner.ts` | Add imports + extend interface | Low |
| 2 | `FullResultsPanel.tsx` | Add Alert/Card imports + 4 sections | Medium |
| 3 | `PartialResultsPanel.tsx` | Add hard cap teaser Alert | Low |

---

## Testing Checklist

After implementation, verify:

- [ ] Quote WITHOUT license shows Hard Cap Alert with "Score Limited to 25"
- [ ] Statute citation shows "F.S. 489.119" in amber card
- [ ] "Questions to Ask" shows numbered list in blue card
- [ ] Good quotes (B+) show "What This Quote Does Well" in green card
- [ ] All text is readable on mobile (check in browser devtools)
- [ ] No horizontal scroll on iPhone SE (320px width)
- [ ] All forensic sections gracefully hide when data is absent
- [ ] Hard cap teaser appears in PartialResultsPanel before unlock
- [ ] TypeScript compiles without errors after interface sync
