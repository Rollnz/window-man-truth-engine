

# Plan: Create `/scanner-brain` Directory

## Key Finding
`generateSafePreview` does **not exist** anywhere in the codebase. Your barrel file references it, but it needs to either be created or removed. I'll create a minimal implementation that generates the blurred/teaser preview data (warning count, risk level, grade) since that's what the UI teaser screen needs.

## Files to Create (5 files)

### 1. `scanner-brain/schema.ts`
- Source: `supabase/functions/quote-scanner/schema.ts`
- Change: `import { z } from "./deps.ts"` → `import { z } from "zod"`
- Remove: `QuoteScannerRequestSchema` (edge-function-specific)
- Keep: `ExtractionSignals`, `AnalysisData`, `ExtractionSignalsJsonSchema`, `sanitizeForPrompt`, `AnalysisContextSchema`

### 2. `scanner-brain/rubric.ts`
- Source: `supabase/functions/quote-scanner/rubric.ts`
- Change: `import { sanitizeForPrompt } from "./schema.ts"` → `from "./schema"`
- Keep all exports unchanged

### 3. `scanner-brain/scoring.ts`
- Source: `supabase/functions/quote-scanner/scoring.ts`
- Change: `import type { ... } from "./schema.ts"` → `from "./schema"`
- **Add** `generateSafePreview(scored: ScoredResult)` — returns a preview-safe subset: `{ grade, warningCount, riskLevel, hasCriticalCap }` for the blurred teaser UI
- Export: `scoreFromSignals`, `calculateLetterGrade`, `generateSafePreview`, `ScoredResult`, `HardCapResult`

### 4. `scanner-brain/forensic.ts`
- Source: `supabase/functions/quote-scanner/forensic.ts`
- Change imports: drop `.ts` extensions
- Keep all exports unchanged

### 5. `scanner-brain/index.ts` (barrel)
Exactly as you specified, with `BRAIN_VERSION = "3.0.0"` and all re-exports including the new `generateSafePreview`.

## Zero Logic Changes
All scoring, forensic, and rubric logic is copied verbatim. The only new code is the ~10-line `generateSafePreview` helper.

