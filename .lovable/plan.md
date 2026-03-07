

# Plan: Scanner Brain Smoke Test

## Problem
The vitest config only includes `src/**/*.{test,spec}.*`. The test file lives at `scanner-brain/scoring.test.ts` (outside `src/`), so vitest won't find it unless we update the include pattern.

## Files to Change

### 1. Update `vitest.config.ts`
Add `scanner-brain/**/*.{test,spec}.{ts,tsx}` to the `include` array so vitest picks up the test.

### 2. Create `scanner-brain/scoring.test.ts`
~100 lines covering:

**Mock Strategy:** Two complete `ExtractionSignals` objects built with all 37 fields. Before scoring, each mock is validated against the Zod schema (`AnalysisContextSchema` won't help here — but TypeScript strict typing on the `ExtractionSignals` interface will catch missing fields at compile time, and the test explicitly checks output shapes).

**Test Cases:**

1. **"Good Quote"** — License present, compliance keywords, laminated glass, permits, labor warranty, 10 openings at $15,000 total ($1,500/opening), 20% deposit, safe payment terms.
   - Expect: No hard cap, grade B+ or higher (score ≥ 87), all pillar scores > 40, `pricePerOpening` = "$1,500"

2. **"Bad Quote"** — No license (triggers F.S. 489.119 hard cap → ceiling 25), no compliance, tempered-only risk, 60% deposit, payment before completion, contract traps.
   - Expect: Hard cap applied, ceiling = 25, grade = F, `overallScore` ≤ 25

3. **"Invalid Document"** — `isValidQuote: false`
   - Expect: Score 0, grade F, hardCap.applied = false

4. **`generateSafePreview` assertions** — Run on both Good and Bad scored results:
   - Good: `riskLevel` = 'acceptable', `hasCriticalCap` = false
   - Bad: `riskLevel` = 'critical', `hasCriticalCap` = true

5. **`generateForensicSummary` assertions** — Run on Bad result:
   - `riskLevel` = 'critical', `hardCapApplied` = true, `statuteCitations` includes "F.S. 489.119"

6. **`extractIdentity` assertion** — Good quote has `contractorName`, `licenseNumber`; Bad quote has nulls.

7. **`calculateLetterGrade` boundary checks** — Assert grade boundaries: 97→A+, 93→A, 60→D-, 59→F.

