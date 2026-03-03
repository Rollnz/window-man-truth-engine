

# Plan: End-to-End Test for `wm-analyze-quote`

## What We'll Build

A Deno test file at `supabase/functions/wm-analyze-quote/index.test.ts` that validates the full pipeline via live HTTP calls.

## Test Cases (4 tests)

1. **401 on missing auth** — POST with no Authorization header → expect `AUTH_FAILED`
2. **401 on wrong auth** — POST with bad Bearer token → expect `AUTH_FAILED`
3. **400 on invalid body** — POST with valid auth but missing `trace_id`/`mime_type` → expect `VALIDATION_ERROR`
4. **Full pipeline** — POST with valid auth, a real image URL, `opening_count: 5`, `area_name: "South Florida"` → expect either:
   - **200** with full `AnalysisEnvelope` (meta, preview, full.dashboard, full.forensic, full.extracted_identity validated)
   - **422** `INVALID_QUOTE` (if AI determines the test image isn't a window quote — which is the correct behavior for a stock photo)

## Technical Details

- Uses `dotenv/load.ts` to read `WM_ANALYZE_QUOTE_SECRET` from `.env` (secret must also be in local `.env` for test runner)
- Test image: a public Unsplash/Wikipedia URL (not a real quote, so 422 is the expected happy path)
- Validates `trace_id` round-trips, `analysis_version === "wm_rubric_v3.0"`, and all envelope field types
- All response bodies consumed to prevent Deno resource leaks

## Single File

`supabase/functions/wm-analyze-quote/index.test.ts` (~80 lines)

Run via the Supabase test tool targeting `wm-analyze-quote`.

