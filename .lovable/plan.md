

# Simplify AI Scanner: Remove Gamma Integration & Negotiation Section

## Overview

This plan implements the "Strict Funnel Strategy" by removing the Gamma.app presentation generation feature entirely and cleaning up the Negotiation section on the AI Scanner page. The goal is to create a focused user flow: **Upload → See Results → Chat with Expert → Save to Vault**.

---

## Summary of Changes

| Action | Files Affected |
|--------|----------------|
| Delete | 7 files (components, hook, edge functions) |
| Modify | 3 files (QuoteScanner.tsx, Comparison.tsx, config.toml) |
| Keep | QuoteQA component (AI Expert chat) |

---

## Detailed Changes

### 1. Remove from AI Scanner Page (`src/pages/QuoteScanner.tsx`)

**Remove imports:**
```typescript
// DELETE these imports:
import { NegotiationTools } from '@/components/quote-scanner/NegotiationTools';
import { GenerateProposalButton } from '@/components/quote-scanner/GenerateProposalButton';
```

**Remove components from render (lines 159-174):**

Before:
```typescript
{isUnlocked && analysisResult && (
  <>
    <GenerateProposalButton ... />
    <NegotiationTools />
    <QuoteQA ... />
  </>
)}
```

After:
```typescript
{isUnlocked && analysisResult && (
  <QuoteQA
    answer={qaAnswer}
    isAsking={isAskingQuestion}
    onAsk={askQuestion}
    disabled={!analysisResult}
  />
)}
```

---

### 2. Remove from Comparison Page (`src/pages/Comparison.tsx`)

**Remove import:**
```typescript
// DELETE this import:
import { GenerateComparisonReportButton } from "@/components/comparison/GenerateComparisonReportButton";
```

**Remove component usage (around lines 70-77):**

The `GenerateComparisonReportButton` component call will be deleted entirely.

---

### 3. Delete Frontend Files

| File | Reason |
|------|--------|
| `src/components/quote-scanner/GenerateProposalButton.tsx` | Gamma integration |
| `src/components/quote-scanner/NegotiationTools.tsx` | Links away from funnel |
| `src/components/quote-scanner/__tests__/NegotiationTools.test.tsx` | Test for deleted component |
| `src/components/comparison/GenerateComparisonReportButton.tsx` | Gamma integration |
| `src/hooks/usePresentationGenerator.ts` | Gamma polling logic |

---

### 4. Delete Edge Functions

| Function Folder | Description |
|-----------------|-------------|
| `supabase/functions/generate-presentation/` | Gamma API generation |
| `supabase/functions/get-presentation-status/` | Gamma status polling |

After deleting the code, these functions will be removed from the deployed Supabase project.

---

### 5. Update Edge Function Config (`supabase/config.toml`)

Remove the function entries for `generate-presentation` and `get-presentation-status`:

```toml
# DELETE these sections:
[functions.generate-presentation]
verify_jwt = false

[functions.get-presentation-status]
verify_jwt = false
```

---

## What Stays in Place

| Component | Location | Purpose |
|-----------|----------|---------|
| `QuoteQA` | AI Scanner results | "Ask the AI Expert" chat interface |
| `SoftInterceptionAnchor` | AI Scanner | Vault pivot CTA |
| `NoQuotePivotSection` | AI Scanner | No-quote lead capture |

The AI Expert chat (`QuoteQA`) remains immediately accessible below the results, allowing users to ask questions about their scan without leaving the page.

---

## User Flow After Changes

```text
┌─────────────────────────────────────────────────────┐
│                   AI Scanner Page                    │
├─────────────────────────────────────────────────────┤
│  1. Upload Quote                                     │
│           ↓                                         │
│  2. See AI Gradecard Results                        │
│           ↓                                         │
│  3. Ask the AI Expert (QuoteQA - inline chat)       │
│           ↓                                         │
│  4. Save to Vault (NoQuotePivotSection)             │
└─────────────────────────────────────────────────────┘
```

No external links. No 60-second waits. Pure funnel focus.

---

## Optional Cleanup (Manual)

The `GAMMA_API_KEY` secret will no longer be used. Consider removing it via Settings → Secrets in the Supabase dashboard to keep secrets tidy.

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Breaking comparison page | Low | Removing button cleanly |
| Orphaned WindowTriviaLoader | None | Used only by Gamma buttons |
| Missing tests | None | Deleting associated test file |

---

## Files Summary

**DELETE (7 files):**
1. `src/components/quote-scanner/GenerateProposalButton.tsx`
2. `src/components/quote-scanner/NegotiationTools.tsx`
3. `src/components/quote-scanner/__tests__/NegotiationTools.test.tsx`
4. `src/components/comparison/GenerateComparisonReportButton.tsx`
5. `src/hooks/usePresentationGenerator.ts`
6. `supabase/functions/generate-presentation/index.ts`
7. `supabase/functions/get-presentation-status/index.ts`

**MODIFY (2 files):**
1. `src/pages/QuoteScanner.tsx` - Remove imports and components
2. `src/pages/Comparison.tsx` - Remove import and button
3. `supabase/config.toml` - Remove function entries

