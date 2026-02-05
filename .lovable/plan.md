

# Edge Function Modularization with Architectural Safeguards

## Your 3 Safeguards - How They're Implemented

### Safeguard 1: deps.ts for Version Locking (Deno Best Practice)

A new `deps.ts` file will be the **single source of truth** for all external dependencies. Every module imports from here, guaranteeing version consistency.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         deps.ts (NEW FILE)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  // Pinned versions - change here, changes everywhere                   │
│  export { createClient } from "npm:@supabase/supabase-js@2.39.7";      │
│  export { z } from "npm:zod@3.22.4";                                   │
│  export type { SupabaseClient } from "npm:@supabase/supabase-js@2.39.7";│
│                                                                         │
│  // Re-export Zod types for schema definitions                         │
│  export type { ZodSchema } from "npm:zod@3.22.4";                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

All modules import like this:
```typescript
// scoring.ts
import { z, createClient } from "./deps.ts";  // NOT from npm: directly
```

---

### Safeguard 2: Explicit hardCapReason Flow (scoring.ts → forensic.ts)

The `scoring.ts` module will return a **HardCapResult** object that the `forensic.ts` module consumes directly:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATA FLOW: hardCapReason                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  scoring.ts                                                             │
│  └── scoreFromSignals() returns:                                        │
│      {                                                                  │
│        ...scores,                                                       │
│        hardCapApplied: true,                                            │
│        hardCapCeiling: 25,                                              │
│        hardCapReason: "No contractor license number visible",           │
│        hardCapStatute: "F.S. 489.119"                                   │
│      }                                                                  │
│           │                                                             │
│           ▼                                                             │
│  forensic.ts                                                            │
│  └── generateForensicSummary(signals, scoredResult)                     │
│      └── Uses scoredResult.hardCapReason to build:                      │
│          "Your score was capped at 25 due to: No contractor             │
│           license number visible (F.S. 489.119)"                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Safeguard 3: Frontend Type Sync (src/types/audit.ts)

The frontend types will be updated to match the new backend response structure **exactly**:

```typescript
// src/types/audit.ts - NEW ADDITIONS

/** Forensic summary from hybrid rubric analysis */
export interface ForensicSummary {
  headline: string;
  riskLevel: 'critical' | 'high' | 'moderate' | 'acceptable';
  statuteCitations: string[];
  questionsToAsk: string[];
  positiveFindings: string[];
  hardCapApplied: boolean;
  hardCapReason: string | null;
  hardCapStatute: string | null;
}

/** Extracted contractor identity for verification */
export interface ExtractedIdentity {
  contractorName: string | null;
  licenseNumber: string | null;
  noaNumbers: string[];
}

/** UPDATED: Result from quote analysis with forensic data */
export interface AuditAnalysisResult {
  // Existing fields (unchanged)
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
  analyzedAt: string;
  
  // NEW: Forensic Authority Fields
  forensic?: ForensicSummary;
  extractedIdentity?: ExtractedIdentity;
}
```

---

## File Structure After Modularization

```text
supabase/functions/quote-scanner/
├── deps.ts          (~15 lines)  ← SAFEGUARD 1: All pinned versions
├── index.ts         (~200 lines) ← Clean orchestrator
├── guards.ts        (~100 lines) ← Rate limit, IP, validation
├── schema.ts        (~180 lines) ← Zod schemas, JSON schema, types
├── rubric.ts        (~200 lines) ← EXTRACTION_RUBRIC, prompts
├── scoring.ts       (~350 lines) ← Hard caps, curve, scoring logic
└── forensic.ts      (~150 lines) ← Summary generator, citations

src/types/
└── audit.ts         (MODIFIED)   ← SAFEGUARD 3: Synced with backend
```

---

## Module Details

### 1. deps.ts (NEW - Safeguard 1)

```typescript
// Centralized dependency management - standard Deno practice
// Change versions HERE to update all modules simultaneously

export { createClient } from "npm:@supabase/supabase-js@2.39.7";
export type { SupabaseClient } from "npm:@supabase/supabase-js@2.39.7";
export { z } from "npm:zod@3.22.4";
export type { ZodSchema, ZodError } from "npm:zod@3.22.4";
```

### 2. guards.ts (Extracted from index.ts)

Moves these functions out of the main handler:
- `getClientIp(req: Request): string`
- `requireJson(req: Request): Promise<unknown>`
- `capBodySize(body: unknown, maxBytes: number): void`
- `checkRateLimit(identifier, endpoint, limit, windowMs)`
- `handleGuardError(error: unknown): Response`
- `corsHeaders` constant

### 3. schema.ts (Extracted from index.ts)

Contains all type definitions and validation:
- `AnalysisContextSchema` (Zod)
- `QuoteScannerRequestSchema` (Zod)
- `ExtractionSignalsJsonSchema` (JSON Schema for AI structured output)
- `ExtractionSignals` interface (TypeScript)
- `AnalysisData` interface
- `sanitizeForPrompt()` function

### 4. rubric.ts (Extracted from index.ts)

Contains the large string constants:
- `EXTRACTION_RUBRIC` (169-line AI prompt)
- `GRADING_RUBRIC` (question mode context)
- `USER_PROMPT_TEMPLATE()` function

### 5. scoring.ts (Enhanced - Safeguard 2)

This is where the **Hybrid Rubric** logic lives:

```typescript
// Types returned by scoring module
export interface HardCapResult {
  applied: boolean;
  ceiling: number;
  reason: string | null;
  statute: string | null;
}

export interface ScoredResult {
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
  // NEW: Hard cap details for forensic module
  hardCap: HardCapResult;
}

// Hard Caps (Florida Statute Alignment)
function applyHardCaps(signals: ExtractionSignals, warnings: string[]): HardCapResult {
  let ceiling = 100;
  let reason: string | null = null;
  let statute: string | null = null;

  // CAP 1: Missing License = Max 25 (F.S. 489.119)
  if (!signals.licenseNumberPresent) {
    ceiling = 25;
    reason = "No contractor license number visible";
    statute = "F.S. 489.119";
    warnings.push("CRITICAL: No license # found. Per F.S. 489.119, all Florida contractors must display their license number.");
  }

  // CAP 2: Owner-Builder Language = Max 25 (F.S. 489.103)
  if (signals.hasOwnerBuilderLanguage && ceiling > 25) {
    ceiling = 25;
    reason = "Owner-Builder language transfers all liability to homeowner";
    statute = "F.S. 489.103";
    warnings.push("CRITICAL: 'Owner-Builder' language transfers ALL liability to you.");
  }

  // CAP 3: Deposit > 50% = Max 55 (F.S. 501.137)
  if (signals.depositPercentage !== null && signals.depositPercentage > 50 && ceiling > 55) {
    ceiling = 55;
    reason = `Deposit of ${signals.depositPercentage}% exceeds 50%`;
    statute = "F.S. 501.137";
    warnings.push(`HIGH RISK: ${signals.depositPercentage}% deposit exceeds safe threshold.`);
  }

  // CAP 4: Tempered-Only = Max 30
  if (signals.hasTemperedOnlyRisk && !signals.hasLaminatedMention && ceiling > 30) {
    ceiling = 30;
    reason = "Tempered glass without impact/laminated specification";
    statute = null;
    warnings.push("CRITICAL: Quote mentions 'tempered' glass but NO impact/laminated language.");
  }

  // CAP 5: Payment Before Completion = Max 40 (F.S. 489.126)
  if (signals.hasPaymentBeforeCompletion && ceiling > 40) {
    ceiling = 40;
    reason = "Full payment required before work completion";
    statute = "F.S. 489.126";
    warnings.push("HIGH RISK: Contract requires full payment before work is complete.");
  }

  return {
    applied: ceiling < 100,
    ceiling,
    reason,
    statute,
  };
}

// Score Curving (makes 90+ rare)
function applyCurve(score: number): number {
  if (score <= 70) return score;
  const excess = score - 70;
  return Math.round(70 + (30 * Math.pow(excess / 30, 1.8)));
}
```

### 6. forensic.ts (NEW - Safeguard 2 Consumer)

Generates the authority-building forensic summary:

```typescript
import type { ExtractionSignals } from "./schema.ts";
import type { ScoredResult, HardCapResult } from "./scoring.ts";

export interface ForensicSummary {
  headline: string;
  riskLevel: 'critical' | 'high' | 'moderate' | 'acceptable';
  statuteCitations: string[];
  questionsToAsk: string[];
  positiveFindings: string[];
  hardCapApplied: boolean;
  hardCapReason: string | null;
  hardCapStatute: string | null;
}

export function generateForensicSummary(
  signals: ExtractionSignals,
  scored: ScoredResult
): ForensicSummary {
  const { hardCap } = scored;  // SAFEGUARD 2: Explicit pass from scoring
  
  const citations: string[] = [];
  const questions: string[] = [];
  const positives: string[] = [];

  // Build statute citations from hard cap
  if (hardCap.statute) {
    citations.push(`${hardCap.statute} - ${hardCap.reason}`);
  }

  // Add additional citations based on signals
  if (!signals.licenseNumberPresent) {
    questions.push("What is your contractor license number?");
  }
  if (signals.depositPercentage && signals.depositPercentage > 40) {
    citations.push("F.S. 501.137 addresses advance payment regulations");
    questions.push("Can we restructure the payment schedule?");
  }
  if (!signals.hasComplianceIdentifier) {
    citations.push("FL Building Code Section 1626 requires NOA documentation");
    questions.push("What are the NOA or Florida Product Approval numbers?");
  }

  // Positive findings for good quotes (B+ and above)
  if (scored.overallScore >= 75) {
    if (signals.licenseNumberPresent) {
      positives.push("License number visible and verifiable");
    }
    if (signals.hasNOANumber) {
      positives.push("Product approval numbers included");
    }
    if (signals.hasDetailedScope) {
      positives.push("Installation scope is well-documented");
    }
    if (signals.hasLaborWarranty) {
      positives.push("Labor warranty specified");
    }
  }

  // Determine risk level
  let riskLevel: ForensicSummary['riskLevel'];
  if (scored.overallScore <= 30) riskLevel = 'critical';
  else if (scored.overallScore <= 50) riskLevel = 'high';
  else if (scored.overallScore <= 70) riskLevel = 'moderate';
  else riskLevel = 'acceptable';

  // Generate headline
  let headline = "";
  if (hardCap.applied) {
    headline = `Score capped at ${hardCap.ceiling} due to: ${hardCap.reason}`;
  } else if (riskLevel === 'critical') {
    headline = "This quote has serious red flags. Do NOT sign without major revisions.";
  } else if (riskLevel === 'high') {
    headline = "This quote needs significant clarification before signing.";
  } else if (riskLevel === 'moderate') {
    headline = "This quote is acceptable but has gaps to address.";
  } else {
    headline = "This quote appears comprehensive. Verify license and NOA numbers before signing.";
  }

  return {
    headline,
    riskLevel,
    statuteCitations: citations.slice(0, 3),
    questionsToAsk: questions.slice(0, 5),
    positiveFindings: positives,
    hardCapApplied: hardCap.applied,
    hardCapReason: hardCap.reason,
    hardCapStatute: hardCap.statute,
  };
}
```

### 7. index.ts (Refactored Orchestrator)

Clean, focused handler that imports from modules:

```typescript
// Clean imports from local modules
import { createClient } from "./deps.ts";
import { corsHeaders, getClientIp, requireJson, capBodySize, checkRateLimit, handleGuardError } from "./guards.ts";
import { QuoteScannerRequestSchema, ExtractionSignalsJsonSchema, sanitizeForPrompt } from "./schema.ts";
import type { ExtractionSignals } from "./schema.ts";
import { EXTRACTION_RUBRIC, GRADING_RUBRIC, USER_PROMPT_TEMPLATE } from "./rubric.ts";
import { scoreFromSignals } from "./scoring.ts";
import { generateForensicSummary } from "./forensic.ts";
import { logAttributionEvent } from "../_shared/attributionLogger.ts";

Deno.serve(async (req) => {
  // 1. CORS handling
  // 2. Guard checks
  // 3. Zod validation
  // 4. Route by mode
  // 5. For analyze: AI call → parse → scoreFromSignals → generateForensicSummary
  // 6. Return response with forensic data included
});
```

---

## Frontend Type Updates (Safeguard 3)

File: `src/types/audit.ts`

**New interfaces to add:**

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// FORENSIC SUMMARY (Hybrid Rubric Output)
// ═══════════════════════════════════════════════════════════════════════════

/** Forensic summary from hybrid rubric analysis */
export interface ForensicSummary {
  headline: string;
  riskLevel: 'critical' | 'high' | 'moderate' | 'acceptable';
  statuteCitations: string[];
  questionsToAsk: string[];
  positiveFindings: string[];
  hardCapApplied: boolean;
  hardCapReason: string | null;
  hardCapStatute: string | null;
}

/** Extracted contractor identity for future verification */
export interface ExtractedIdentity {
  contractorName: string | null;
  licenseNumber: string | null;
  noaNumbers: string[];
}
```

**Update to AuditAnalysisResult:**

```typescript
/** Result from quote analysis (updated with forensic data) */
export interface AuditAnalysisResult {
  // Existing fields (unchanged)
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
  analyzedAt: string;
  
  // NEW: Forensic Authority Fields (Hybrid Rubric)
  forensic?: ForensicSummary;
  extractedIdentity?: ExtractedIdentity;
}
```

---

## Implementation Sequence

| Phase | Files | Lines Changed | Risk |
|-------|-------|---------------|------|
| 1 | `deps.ts` (create) | ~15 | Low |
| 2 | `guards.ts` (create) | ~100 | Low |
| 3 | `schema.ts` (create) | ~180 | Low |
| 4 | `rubric.ts` (create) | ~200 | Low |
| 5 | `scoring.ts` (create with hard caps) | ~350 | Medium |
| 6 | `forensic.ts` (create) | ~150 | Low |
| 7 | `index.ts` (refactor to orchestrator) | ~200 | Medium |
| 8 | `src/types/audit.ts` (sync types) | ~40 | Low |
| 9 | Deploy and test | - | - |

---

## Testing Checklist

After implementation:

- [ ] Edge function deploys without timeout (bundle size reduced)
- [ ] All modules import from `deps.ts` (no direct npm: imports elsewhere)
- [ ] Quote WITHOUT license shows: "Score capped at 25 due to: No contractor license number visible"
- [ ] Quote with Owner-Builder language shows: "Score capped at 25 due to: Owner-Builder language"
- [ ] Quote with 60% deposit shows: "Score capped at 55 due to: Deposit of 60% exceeds 50%"
- [ ] Quote with "payment before work begins" shows: "Score capped at 40 due to: Full payment required"
- [ ] Good quotes (B+) display "What This Quote Does Well" with positive findings
- [ ] Frontend types compile without errors after `audit.ts` update
- [ ] Cold start latency improved (target: < 2 seconds)

