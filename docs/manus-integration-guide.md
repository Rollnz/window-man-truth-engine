# Manus ↔ Lovable Integration Guide

## Endpoint

```
URL:    https://kffoximblqwcnznwvugu.supabase.co/functions/v1/wm-analyze-quote
Method: POST
```

## Authentication

```
Authorization: Bearer <WM_ANALYZE_QUOTE_SECRET>
Content-Type: application/json
```

Returns `401` with `{ "error_code": "AUTH_FAILED" }` on invalid/missing token.

---

## Request Schema

```typescript
const RequestSchema = z.object({
  file_url: z.string().url(),           // HTTPS signed URL to the quote file
  mime_type: z.enum([
    "image/png", "image/jpeg", "image/webp", "application/pdf"
  ]),
  trace_id: z.string().uuid(),          // Manus-generated, returned in response
  opening_count: z.number().int().min(1).max(200).optional(),
  area_name: z.string().max(100).optional(),
  notes_from_calculator: z.string().max(2000).optional(),
});
```

### Example Request

```json
{
  "file_url": "https://storage.example.com/quotes/abc123.png?token=...",
  "mime_type": "image/png",
  "trace_id": "8f42b1c3-5d9e-4a7b-b2e1-9c3f4d5a6e7b",
  "opening_count": 8,
  "area_name": "South Florida",
  "notes_from_calculator": "User estimated $1,200/window"
}
```

---

## Response Schema (Success — 200)

```typescript
const AnalysisEnvelopeSchema = z.object({
  meta: z.object({
    trace_id: z.string().uuid(),
    analysis_version: z.string(),       // Currently "wm_rubric_v3.0"
    model_used: z.string(),             // e.g. "google/gemini-2.5-flash"
    processing_time_ms: z.number(),
    timestamp: z.string(),              // ISO 8601
  }),

  preview: z.object({
    score: z.number().int().min(0).max(100),
    grade: z.string(),                  // "A+", "A", "B", "C", "D", "F"
    risk_level: z.enum(["critical", "high", "moderate", "acceptable"]),
    headline: z.string(),               // One-line summary safe for UI
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
      price_per_opening: z.string(),    // e.g. "$1,250"
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

---

## Error Codes

| HTTP | `error_code` | Meaning | Manus Action |
|------|-------------|---------|-------------|
| 401 | `AUTH_FAILED` | Invalid or missing Bearer token | **Hard fail** — alert ops, do not retry |
| 400 | `VALIDATION_ERROR` | Request body failed Zod validation | Fix payload, do not retry |
| 422 | `INVALID_QUOTE` | AI determined file is not a window quote | Show "not a quote" UX, allow re-upload |
| 429 | `RATE_LIMITED` | Too many requests | Retry after 60s backoff |
| 500 | `AI_UNAVAILABLE` | AI gateway error or model failure | Retry with exponential backoff (max 3) |
| 502 | `FILE_FETCH_FAILED` | Could not download `file_url` | Refresh signed URL, retry once |

All error responses follow this shape:

```json
{
  "error_code": "FILE_FETCH_FAILED",
  "message": "Human-readable description"
}
```

---

## Retry Strategy

```
FILE_FETCH_FAILED (502):
  → Refresh the signed S3/storage URL
  → Retry once with the new URL
  → If still fails: hard fail, keep file in temp for manual review

AI_UNAVAILABLE (500):
  → Retry up to 3 times
  → Backoff: 2s → 8s → 30s (exponential)
  → After 3 failures: show "try again later" UX, keep file in temp

RATE_LIMITED (429):
  → Wait 60 seconds
  → Retry once

AUTH_FAILED (401):
  → Never retry — configuration error, alert immediately

INVALID_QUOTE (422):
  → Never retry — user uploaded wrong file
  → Surface re-upload UX

VALIDATION_ERROR (400):
  → Never retry — fix the request payload
```

---

## Manus Persistence

After a successful `200` response, store:

| Column | Source |
|--------|--------|
| `trace_id` | `meta.trace_id` |
| `analysis_version` | `meta.analysis_version` |
| `model_used` | `meta.model_used` |
| `processing_time_ms` | `meta.processing_time_ms` |
| `full_json` | Entire response (JSON column) |

### Rendering Rules

- **Email-verified users** → Show `preview` only + CTA to phone-unlock
- **Phone-verified users** → Render `full.dashboard` + `full.forensic`

---

## Versioning Contract

When `analysis_version` changes (e.g. `wm_rubric_v3.0` → `wm_rubric_v4.0`), the scoring logic or extraction rubric has been updated. Store this value per-analysis so you can:

1. Compare results across rubric versions
2. Re-analyze older quotes with newer logic if needed
3. Debug scoring discrepancies
