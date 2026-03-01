

## Add `finalGrade` Letter Grade to Quote Scanner

### Goal
Make `scoring.ts` the **single source of truth** for letter grades (A+ through F). The grade is calculated once, saved to `analysis_json`, and read blindly by all downstream consumers (SQL triggers, frontend, Phase 1 orchestrator).

### Changes (4 steps, 3 files)

---

### Step 1: `supabase/functions/quote-scanner/schema.ts`

Add `finalGrade` to two places:

- **`AnalysisContextSchema`** (Zod) -- add `finalGrade: z.string().optional()` after `overallScore`
- **`AnalysisData` interface** -- add `finalGrade: string` after `overallScore`

---

### Step 2: `supabase/functions/quote-scanner/scoring.ts`

- Add the `calculateLetterGrade(score: number): string` function near the top (after the `ScoredResult` interface). This contains the full A+ through F bracket logic.
- At the bottom of `scoreFromSignals()`, call `calculateLetterGrade(overallScore)` right before the return statement and include `finalGrade` in the returned object.

The grade brackets:
- 97+ = A+, 93+ = A, 90+ = A-, 87+ = B+, 83+ = B, 80+ = B-, 77+ = C+, 73+ = C, 70+ = C-, 67+ = D+, 63+ = D, 60+ = D-, below 60 = F

---

### Step 3: `supabase/functions/quote-scanner/index.ts`

- Add `finalGrade: scored.finalGrade` to the `responsePayload` object (line ~387)
- Optionally add `final_grade: scored.finalGrade` to the `wm_event_log` metadata block for analytics

---

### Step 4: Phase 1 SQL Trigger compatibility

No SQL changes needed now. When Phase 1 triggers are deployed, they will read the grade dynamically:

```text
NEW.analysis_json->>'finalGrade'
```

No `CASE WHEN` logic in SQL -- the grade is pre-computed by `scoring.ts`.

---

### Technical Notes

- The `ScoredResult` interface extends `AnalysisData`, so adding `finalGrade` to `AnalysisData` automatically makes it available on the scored result.
- Existing cached analyses (dedup hits) will not have `finalGrade` since they were stored before this change. New scans will include it.
- `calculateLetterGrade` is exported so it can be imported by other edge functions if needed.
- Zero risk of breaking existing functionality -- this is purely additive.

