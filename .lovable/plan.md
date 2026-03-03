

# Assessment: `wm-analyze-quote` is Already Built

The function at `supabase/functions/wm-analyze-quote/index.ts` (585 lines) is **fully implemented and deployed**. Here's the audit against your checklist:

## Checklist Status

| Requirement | Status | Notes |
|---|---|---|
| Auth gate (Bearer WM_ANALYZE_QUOTE_SECRET) | **Done** (line 473-476) | Validates secret, returns 401 AUTH_FAILED |
| Zod body validation | **Done** (line 27-34) | file_url (HTTPS), mime_type, trace_id (UUID), opening_count, area_name, notes |
| Fetch file_url → base64 | **Done** (line 488-500) | Returns 502 FILE_FETCH_FAILED on error |
| Gemini call w/ EXTRACTION_RUBRIC + ExtractionSignalsJsonSchema | **Done** (line 509-525) | Uses `response_format: json_schema` for structured output |
| scoreFromSignals(signals, openingCountHint) | **Done** (line 551) | Full deterministic scoring inlined |
| generateForensicSummary() | **Done** (line 552) | Citations, questions, positive findings |
| extractIdentity() | **Done** (line 553) | Contractor name, license, NOA numbers |
| AnalysisEnvelope: meta | **Done** (line 558) | trace_id, model_used, processing_time_ms, timestamp |
| AnalysisEnvelope: preview | **Done** (line 559-564) | score, grade, risk_level, headline, counts |
| AnalysisEnvelope: full.dashboard | **Done** (line 566-572) | All pillar scores, warnings[], missing_items[], summary |
| AnalysisEnvelope: full.forensic | **Done** (line 573-578) | statute_citations, questions_to_ask, positive_findings, hard_cap |
| AnalysisEnvelope: full.extracted_identity | **Done** (line 579) | contractor_name, license_number, noa_numbers |
| INVALID_QUOTE 422 | **Done** (line 548) | |
| RATE_LIMITED 429 | **Done** (line 534-535) | |
| AI_UNAVAILABLE 500 | **Done** (line 528, 536) | |
| FILE_FETCH_FAILED 502 | **Done** (line 491, 499) | |
| config.toml verify_jwt = false | **Done** | Already wired |
| WM_ANALYZE_QUOTE_SECRET stored | **Done** | Secret was added via add_secret |

## One Gap: `analysis_version`

Your checklist says: *Set `analysis_version: "wm_rubric_v3"` (or semver)*. Currently it's `"2.2"` (line 558). This should be updated to a meaningful versioned identifier like `"wm_rubric_v3.0"` so Manus can track which rubric+scoring logic produced each result.

## Two Improvements Worth Making

### 1. Bump `analysis_version` to `"wm_rubric_v3.0"`

Single line change. This gives Manus a queryable version string that changes when you update rubric or scoring logic.

### 2. No separate `GEMINI_API_KEY` needed

Your checklist mentions a separate `GEMINI_API_KEY`. This is **not needed** — the function already uses `LOVABLE_API_KEY` (auto-provisioned) to call the Lovable AI Gateway, which routes to Gemini. The AI key concern is already handled. Two secrets remain correct: `LOVABLE_API_KEY` (auto) + `WM_ANALYZE_QUOTE_SECRET` (manual).

## What Manus Needs From You

Share this exact endpoint configuration:

```text
URL:     https://kffoximblqwcnznwvugu.supabase.co/functions/v1/wm-analyze-quote
Method:  POST
Auth:    Authorization: Bearer <WM_ANALYZE_QUOTE_SECRET value>
```

And the **response Zod schema** for Manus to validate:

```typescript
const AnalysisEnvelopeSchema = z.object({
  meta: z.object({
    trace_id: z.string().uuid(),
    analysis_version: z.string(),
    model_used: z.string(),
    processing_time_ms: z.number(),
    timestamp: z.string(),
  }),
  preview: z.object({
    score: z.number().int().min(0).max(100),
    grade: z.string(),
    risk_level: z.enum(["critical", "high", "moderate", "acceptable"]),
    headline: z.string(),
    warning_count: z.number().int(),
    missing_item_count: z.number().int(),
  }),
  full: z.object({
    dashboard: z.object({
      overall_score: z.number(),
      final_grade: z.string(),
      safety_score: z.number(),
      scope_score: z.number(),
      price_score: z.number(),
      fine_print_score: z.number(),
      warranty_score: z.number(),
      price_per_opening: z.string(),
      warnings: z.array(z.string()),
      missing_items: z.array(z.string()),
      summary: z.string(),
    }),
    forensic: z.object({
      headline: z.string(),
      risk_level: z.enum(["critical", "high", "moderate", "acceptable"]),
      statute_citations: z.array(z.string()),
      questions_to_ask: z.array(z.string()),
      positive_findings: z.array(z.string()),
      hard_cap_applied: z.boolean(),
      hard_cap_reason: z.string().nullable(),
      hard_cap_statute: z.string().nullable(),
    }),
    extracted_identity: z.object({
      contractor_name: z.string().nullable(),
      license_number: z.string().nullable(),
      noa_numbers: z.array(z.string()),
    }),
  }),
});
```

## Proposed Change

**File:** `supabase/functions/wm-analyze-quote/index.ts`

Update line 558: change `analysis_version: "2.2"` → `analysis_version: "wm_rubric_v3.0"`

That is the only code change needed. Everything else is already built and deployed.

