
# Simplified Deterministic Analysis Flow
## "Explain the Score" Gate Implementation

---

## Overview

This is a **simplification refactor** that replaces the complex Animation Theater with a deterministic flow:

1. **Upload** → User drops file (unchanged)
2. **Static Analysis State** → Brief "Analyzing..." with checklist (no timers)
3. **Partial Results** → Score + bars visible, explanations locked/blurred
4. **Lead Gate** → "See How This Score Was Calculated" form
5. **Full Results** → Unlock all explanations

---

## A. Component Architecture

### Components to CREATE

| Component | Props | Responsibilities | Section |
|-----------|-------|------------------|---------|
| `AnalyzingState` | `onComplete?: () => void` | Static checklist showing 5 rubric categories with check icons. Renders during API call, transitions automatically when analysis completes. | Step 2 |
| `PartialResultsPanel` | `result: AuditAnalysisResult`, `onUnlockClick: () => void` | Shows overall score, score label, 5 category bars with numeric values, "Missing from Quote" bullet list. Category explanations are blurred/locked. "Continue to Full Report" CTA at bottom. | Step 3 |
| `ExplainScoreGate` | `onSubmit: (data) => Promise<void>`, `isLoading: boolean` | Lead capture form with exact copy: "See How This Score Was Calculated". Fields: First Name, Last Name, Email, Phone. Micro-trust copy and "Unlock My Full Report" CTA. | Step 4 |
| `FullResultsPanel` | `result: AuditAnalysisResult` | Full results with all explanations visible. Expands each rubric section with "What was missing", "Why it matters", real-world implications. Escalation CTAs preserved. | Step 5 |
| `useDeterministicScanner` | - | Simplified state hook: `{ phase, result, analyzeFile, isLeadCaptured, captureLead, unlockResults }` | Core Hook |

### Components to REMOVE/DEPRECATE

| Component | Reason |
|-----------|--------|
| `useAnalysisTheater.ts` | No longer needed - no animation timing |
| `AnalysisTheater.tsx` | Replaced by `AnalyzingState` |
| `TheaterProgressBar.tsx` | No progress animation |
| `TheaterCheckmark.tsx` | Replaced by static checklist |
| `TeaserPanel.tsx` (planned) | Merged into `PartialResultsPanel` |

### Components to REUSE (unchanged)

| Component | Usage |
|-----------|-------|
| `NameInputPair` | First/Last name fields in gate |
| `useLeadFormSubmit` | Centralized lead submission logic |
| `useFormValidation` | Field validation |
| `compressImage()` | From useQuoteScanner for file processing |
| `QuoteAnalysisResults` | Reference for ScoreRow pattern |

---

## B. File Structure

```text
src/
├── components/
│   └── audit/
│       └── scanner-modal/
│           ├── AnalyzingState.tsx         # NEW: Static checklist during API call
│           ├── PartialResultsPanel.tsx    # NEW: Score visible, explanations locked
│           ├── ExplainScoreGate.tsx       # NEW: Lead capture with exact copy
│           ├── FullResultsPanel.tsx       # NEW: All explanations unlocked
│           ├── PathSelector.tsx           # KEEP: Step 0 fork
│           ├── AnalysisTheater.tsx        # DEPRECATE (keep file, mark deprecated)
│           ├── theater/                   # DEPRECATE (keep files, mark deprecated)
│           │   ├── TheaterProgressBar.tsx
│           │   └── TheaterCheckmark.tsx
│           └── index.ts                   # UPDATE: New exports
├── hooks/
│   └── audit/
│       ├── useDeterministicScanner.ts     # NEW: Simplified state machine
│       ├── useAnalysisTheater.ts          # DEPRECATE (mark with @deprecated)
│       └── index.ts                       # UPDATE: New exports
└── types/
    └── audit.ts                           # UPDATE: Add new interfaces
```

---

## C. Implementation Order

| # | Task | Files | Rationale |
|---|------|-------|-----------|
| **1** | Update types | `src/types/audit.ts` | Add `DeterministicPhase`, `ExplainScoreFormData`, remove theater-specific types from active use |
| **2** | `AnalyzingState` | `AnalyzingState.tsx` | Simplest component - static UI with no state. Shows during API call. |
| **3** | `PartialResultsPanel` | `PartialResultsPanel.tsx` | Adapt existing `QuoteAnalysisResults` pattern. Add blur overlay on explanations, keep scores visible. |
| **4** | `ExplainScoreGate` | `ExplainScoreGate.tsx` | Exact copy from spec. Reuses `NameInputPair`, `useFormValidation`, `useLeadFormSubmit`. |
| **5** | `FullResultsPanel` | `FullResultsPanel.tsx` | Extends `PartialResultsPanel` with full explanations. Adds "Why this matters" sections. |
| **6** | `useDeterministicScanner` | `useDeterministicScanner.ts` | Simple reducer: `idle` → `analyzing` → `partial` → `gated` → `unlocked`. Calls existing `heavyAIRequest`. |
| **7** | Deprecate theater | `useAnalysisTheater.ts`, `AnalysisTheater.tsx` | Add `@deprecated` JSDoc. No breaking changes to existing code. |
| **8** | Update barrel exports | `index.ts` files | Export new components, keep deprecated ones available |
| **9** | Wire to `/audit` page | `Audit.tsx` | Replace theater flow with deterministic flow |

---

## D. Analytics Integration Points

| Event | Component | GTM Function | Parameters |
|-------|-----------|--------------|------------|
| `quote_file_uploaded` | `useDeterministicScanner.analyzeFile()` | `trackEvent('quote_file_uploaded', {...})` | `file_type`, `file_size_kb` |
| `analysis_started` | `AnalyzingState` mount | `trackEvent('analysis_started', {...})` | `source_tool: 'audit-scanner'` |
| `analysis_complete` | `useDeterministicScanner` result received | `trackEvent('analysis_complete', {...})` | `score`, `warnings_count`, `missing_count` |
| `partial_results_viewed` | `PartialResultsPanel` mount | `trackEvent('partial_results_viewed', {...})` | `score`, `category_scores` |
| `explain_gate_opened` | `ExplainScoreGate` mount | `trackModalOpen({ modalName: 'explain_score_gate' })` | - |
| `lead_submission_success` | `ExplainScoreGate` submit success | `trackLeadSubmissionSuccess({...})` | `leadId`, `email`, `phone`, `value: 100`, deterministic `event_id` |
| `quote_analysis_complete` | `FullResultsPanel` mount | `trackQuoteUploadSuccess({...})` | `scanAttemptId`, `score`, `value: 50` |

**Deduplication**: All events use deterministic `event_id` format (e.g., `audit_lead:[uuid]`, `analysis_complete:[scanAttemptId]`) per EMQ 9.5+ standards.

---

## E. Potential Challenges

| Challenge | Technical Approach |
|-----------|-------------------|
| **Seamless transition from Analyzing → Partial Results** | `useDeterministicScanner` tracks `phase`. When API returns, set `result` and `phase = 'partial'` atomically. Component switches based on phase. |
| **Blur effect on explanations only** | Use CSS `filter: blur(4px)` + `opacity: 0.5` on explanation text elements. Keep score values crisp. Add "Lock" icon overlay. |
| **Exact gate copy preservation** | Gate component uses exact strings from spec. No dynamic text. Copy is hardcoded for precision. |
| **Backward compatibility** | Keep `useAnalysisTheater` and theater components with `@deprecated` tags. No breaking changes to existing imports. |
| **Fast mobile experience** | No animation timers = instant feedback. Static checklist renders immediately. Results appear as soon as API returns. |
| **Race condition elimination** | Single state machine controls flow. No parallel animation + API coordination. `phase` is the single source of truth. |

---

## Technical Details

### State Machine (useDeterministicScanner)

```text
Phases:
  'idle'      → Initial state, no file
  'analyzing' → API call in progress, show AnalyzingState
  'partial'   → Results received, show PartialResultsPanel
  'gated'     → User clicked "Continue", show ExplainScoreGate
  'unlocked'  → Lead captured, show FullResultsPanel

State Shape:
{
  phase: DeterministicPhase,
  file: File | null,
  result: AuditAnalysisResult | null,
  leadId: string | null,
  isLeadCaptured: boolean,
  isLoading: boolean,
  error: string | null
}

Actions:
  analyzeFile(file) → phase = 'analyzing', call API
  showGate() → phase = 'gated'
  captureLead(data) → save lead, phase = 'unlocked'
  reset() → initial state
```

### ExplainScoreGate - Exact Copy

**Headline**: "See How This Score Was Calculated"

**Sub-headline**: "We'll break down exactly what was missing, why it matters in Florida, and how it affects your real cost and risk."

**Fields**: First Name, Last Name, Email, Phone (2x2 grid)

**Micro-trust**: "Your report is saved to your WindowMan Vault so you can come back to it anytime. We only use your info to deliver the analysis and offer expert help if you want it."

**CTA**: "Unlock My Full Report" (Orange gradient button)

**Optional**: "No pressure. No obligation. No spam." (very small text)

### PartialResultsPanel - Visibility Rules

**VISIBLE (unlocked)**:
- Overall Score (e.g., 28/100)
- Score label (e.g., "Concern")
- 5 category bars with numeric scores
- "Missing from Quote (X)" bullet list

**BLURRED (locked)**:
- Category explanations (description text under each bar)
- "Why this matters" sections
- Prescriptive guidance

---

## Visual Theme (unchanged from Phase 1)

| Element | Color |
|---------|-------|
| Background | `slate-900` (Navy Blue) |
| CTA buttons | `from-orange-500 to-amber-500` gradient |
| Score bars | Color-coded: emerald (80+), amber (60-79), rose (<60) |
| Blur overlay | `bg-slate-900/80 backdrop-blur-sm` |
| Form inputs | `bg-white text-slate-900 border-slate-300` |
| Focus rings | `ring-primary/25` (Blue) |

---

## Success Criteria

1. User sees score **immediately** after API returns (no artificial delay)
2. Curiosity ("how was this calculated?") drives form completion
3. No animation timing dependencies
4. No race conditions between analysis + UI
5. Mobile experience feels fast and confident
6. Analytics events fire at correct moments with proper deduplication
