

# Plan: External Analysis API (`wm-analyze-quote` Edge Function)

## Why This Exists

Manus (your external app) needs to call your Lovable analysis engine. Today, the `quote-scanner` edge function is tightly coupled to your frontend (expects base64, fires internal tracking, uses internal session/lead IDs). Manus needs a clean service-to-service endpoint that:

1. Accepts a `file_url` (signed S3 URL) instead of raw base64
2. Returns a structured **AnalysisEnvelope** with `preview` (safe for unauthenticated display) and `full` (complete dashboard data)
3. Authenticates via a shared secret (HMAC bearer token)
4. Returns `trace_id` and `analysis_version` for debugging

## What Should Be Included Beyond Your Spec

- **`envelope.meta`**: Include `analysis_version`, `trace_id`, `model_used`, `processing_time_ms` — Manus needs these for its own debugging/audit trail.
- **`envelope.preview`**: A sanitized subset (score, grade, warning count, risk level, headline) that Manus can show *before* the user unlocks the full report. This is NOT computed by blurring `full` — it's a distinct projection.
- **`envelope.full.dashboard`**: The complete structured data (pillar scores, warnings array, missing items, forensic summary, extracted identity, questions to ask). This is what populates the UI.
- **Input validation via Zod** on the Manus side request (not just shape — also `file_url` must be HTTPS, `mime_type` must be image/* or application/pdf).
- **Error contract**: Structured error responses with `code` + `message` so Manus can programmatically handle `INVALID_QUOTE`, `AI_UNAVAILABLE`, `RATE_LIMITED`, `AUTH_FAILED`.

## What This Does NOT Do

- Does NOT fire internal tracking events (no `wm_event_log`, no `logAttributionEvent`) — Manus has its own tracking
- Does NOT persist to `quote_analyses` table — Manus stores its own copy
- Does NOT touch the frontend or any existing edge functions

## Existing Modules to Reuse

| Module | Reuse |
|---|---|
| `supabase/functions/quote-scanner/schema.ts` | `ExtractionSignalsJsonSchema`, `ExtractionSignals` type, `sanitizeForPrompt()` |
| `supabase/functions/quote-scanner/rubric.ts` | `EXTRACTION_RUBRIC`, `USER_PROMPT_TEMPLATE` |
| `supabase/functions/quote-scanner/scoring.ts` | `scoreFromSignals()` — the deterministic engine |
| `supabase/functions/quote-scanner/forensic.ts` | `generateForensicSummary()`, `extractIdentity()` |
| `supabase/functions/quote-scanner/guards.ts` | `corsHeaders`, `handleGuardError` |

Zero new scoring logic. The AI is only used for extraction; everything else is deterministic reuse.

## Minimal Change Plan (3 steps)

### Step 1: Add shared secret

Use `add_secret` to request `WM_ANALYZE_QUOTE_SECRET` from you. This is the bearer token Manus will send in its `Authorization` header.

### Step 2: Create `supabase/functions/wm-analyze-quote/index.ts`

Single file, ~180 lines. Logic:

1. **Auth gate**: Verify `Authorization: Bearer <WM_ANALYZE_QUOTE_SECRET>` matches the secret. Return 401 if not.
2. **Parse + validate** request body with Zod:
   ```ts
   {
     file_url: string (HTTPS URL),
     mime_type: "image/png" | "image/jpeg" | "image/webp" | "application/pdf",
     opening_count?: number,
     area_name?: string,
     notes_from_calculator?: string,
     trace_id: string (UUID, required — Manus generates this)
   }
   ```
3. **Fetch the file** from `file_url` → convert to base64 (same format the AI gateway expects). Fail with `FILE_FETCH_FAILED` if the URL is unreachable or returns non-200.
4. **Call AI gateway** with `EXTRACTION_RUBRIC` + `ExtractionSignalsJsonSchema` (identical to `quote-scanner`).
5. **Run deterministic pipeline**: `scoreFromSignals()` → `generateForensicSummary()` → `extractIdentity()`.
6. **Build AnalysisEnvelope** and return:

```ts
{
  meta: {
    trace_id: string,
    analysis_version: "2.2",
    model_used: string,
    processing_time_ms: number,
    timestamp: string
  },
  preview: {
    score: number,
    grade: string,
    risk_level: "critical" | "high" | "moderate" | "acceptable",
    headline: string,
    warning_count: number,
    missing_item_count: number
  },
  full: {
    dashboard: {
      overall_score, final_grade, safety_score, scope_score,
      price_score, fine_print_score, warranty_score,
      price_per_opening, warnings[], missing_items[], summary
    },
    forensic: {
      headline, risk_level, statute_citations[],
      questions_to_ask[], positive_findings[],
      hard_cap_applied, hard_cap_reason, hard_cap_statute
    },
    extracted_identity: {
      contractor_name, license_number, noa_numbers[]
    }
  }
}
```

### Step 3: Wire config.toml

Add `[functions.wm-analyze-quote]` with `verify_jwt = false` (auth is handled by the shared secret, not Supabase JWT).

## Error Contract

| HTTP Status | Code | When |
|---|---|---|
| 401 | `AUTH_FAILED` | Missing or invalid bearer token |
| 400 | `VALIDATION_ERROR` | Bad request body (Zod details in response) |
| 422 | `INVALID_QUOTE` | AI determined document is not a window quote |
| 502 | `FILE_FETCH_FAILED` | Could not download from `file_url` |
| 429 | `RATE_LIMITED` | AI gateway rate limit |
| 500 | `AI_UNAVAILABLE` | AI gateway error |

## Events Fired

None. This is a stateless service-to-service API. Manus owns its own tracking.

## Definition of Done

- [ ] `WM_ANALYZE_QUOTE_SECRET` secret stored
- [ ] `POST /wm-analyze-quote` authenticates via bearer token
- [ ] Fetches image from `file_url`, runs extraction + deterministic scoring
- [ ] Returns `AnalysisEnvelope` with `meta`, `preview`, and `full` sections
- [ ] `preview` is a distinct projection, not blurred `full`
- [ ] `trace_id` round-trips from request to response
- [ ] Invalid quotes return 422 with `INVALID_QUOTE` code
- [ ] No internal tracking events fired
- [ ] No writes to `quote_analyses` table
- [ ] Edge function deploys and is callable from external origin

