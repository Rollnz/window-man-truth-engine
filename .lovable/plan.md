

# Background AI Pre-Analysis for Consultation Quote Uploads

## Summary

When a user uploads a competitor's quote during the Strategy Session booking, a new edge function (`analyze-consultation-quote`) runs in the background to generate a private "sales cheat sheet." The `save-lead` function triggers it fire-and-forget after the DB insert, so the user's booking flow stays under 500ms. Results are stored in a new `ai_pre_analysis` JSONB column on the `leads` table.

---

## Phase 1: Database Migration

Add `ai_pre_analysis` JSONB column to the `leads` table:

```sql
ALTER TABLE public.leads
ADD COLUMN ai_pre_analysis JSONB DEFAULT '{"status": "none"}'::jsonb;
```

The column stores this structure:
```text
{
  "status": "none" | "pending" | "completed" | "failed",
  "result": null | {
    "estimated_total_price": number | null,
    "window_brand_or_material": string,
    "detected_markup_level": "High" | "Average" | "Low" | "Unknown",
    "red_flags": string[],
    "sales_angle": string
  },
  "reason": string | null,
  "started_at": string | null,
  "completed_at": string | null,
  "model": string | null
}
```

No RLS changes needed -- the `leads` table is already private (anon INSERT only, no SELECT for anon/public). The column is only readable by admin edge functions using `service_role`.

---

## Phase 2: New Edge Function -- `analyze-consultation-quote`

**File:** `supabase/functions/analyze-consultation-quote/index.ts`

**Config:** Add to `supabase/config.toml`:
```text
[functions.analyze-consultation-quote]
verify_jwt = false
```

**Request contract** (from `save-lead`):
```text
POST with service_role Bearer token
{
  "leadId": "uuid",
  "quoteFileId": "uuid",
  "mimeType": "application/pdf" | "image/jpeg" | "image/png"
}
```

**Response:** Immediately returns `202 Accepted` with `{ "message": "Analysis started" }`, then continues processing.

**Logic flow:**

1. **Auth check:** Validate the Authorization header contains the service_role key (server-to-server only).

2. **Idempotency check:** Read `leads.ai_pre_analysis->>'status'` for this `leadId`. If already `pending` or `completed`, return `200 { "message": "Already processed" }` and skip.

3. **Set pending:** Update `leads.ai_pre_analysis` to `{"status": "pending", "started_at": "..."}`.

4. **Download file:** Use `service_role` Supabase client to read from `quote_files` table (get `file_path`), then download from `quotes` storage bucket via `storage.from('quotes').download(filePath)`.

5. **Size guard:** If file exceeds 10MB, fail gracefully.

6. **Convert to base64:** For images (JPEG/PNG), convert directly. For PDFs, pass the raw buffer as base64 with `application/pdf` MIME type (Gemini handles PDF natively).

7. **AI call:** Use Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`) with `google/gemini-2.5-flash` (fast, cheap, handles vision + PDF natively). NOT OpenAI -- this project already uses the Lovable AI Gateway exclusively with `LOVABLE_API_KEY`.

   - **System prompt:** "Sales Intel" persona -- extract pricing, brand/material, markup signals, red flags, and a sales angle. NOT the homeowner-facing scanner prompt.
   - **Tool calling:** Use structured output via `tools` + `tool_choice` to enforce the JSON schema (estimated_total_price, window_brand_or_material, detected_markup_level, red_flags, sales_angle).
   - **AbortController:** 45-second timeout on the AI call.

8. **Update DB:** On success, update `leads.ai_pre_analysis` to `{"status": "completed", "result": {...}, "completed_at": "...", "model": "google/gemini-2.5-flash"}`. On failure, set `{"status": "failed", "reason": "...", "completed_at": "..."}`.

9. **Observability:** `console.log` at each stage (file downloaded, AI invoked, DB updated). `console.error` on failures.

---

## Phase 3: Trigger from `save-lead`

**File:** `supabase/functions/save-lead/index.ts`

After the quote file linking block (around line 970, after `quoteFileLinked = true`), add a fire-and-forget call:

```typescript
// Check if the linked file has a mime type suitable for analysis
if (quoteFileLinked && fileData?.file_path) {
  // Fire-and-forget: trigger background AI pre-analysis
  const mimeType = /* get from quote_files record, already queried above */;
  fetch(`${supabaseUrl}/functions/v1/analyze-consultation-quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({
      leadId,
      quoteFileId,
      mimeType: mimeType || 'application/pdf',
    }),
  }).catch(err => {
    console.error('[save-lead] Failed to trigger AI pre-analysis (non-blocking):', err);
  });
  // NOT awaited -- save-lead returns 200 immediately
}
```

The `fileData` variable is already available from the existing quote alert block (line 930-933). We also need the MIME type, which we can add to the existing `select` query: change `.select('file_path, file_name')` to `.select('file_path, file_name, mime_type')`.

---

## Phase 4: Why These Choices

| Decision | Rationale |
|---|---|
| `google/gemini-2.5-flash` not `gpt-4o` | Project uses Lovable AI Gateway exclusively. Gemini 2.5 Flash handles PDF + image natively, is cheaper, and faster. No need for OpenAI. |
| Tool calling not `response_format` | Lovable AI Gateway supports tool calling for structured output. More reliable than asking for raw JSON. |
| Fire-and-forget `fetch` not `waitUntil` | Deno edge runtime does not guarantee `EdgeRuntime.waitUntil()` availability. The `analyze-consultation-quote` function is a separate invocation that runs independently -- `save-lead` just fires the HTTP call and catches immediate network errors. |
| No new RLS policies | `leads` table already blocks anon SELECT. The new column is invisible to clients by default. Admin functions use `service_role`. |
| Idempotency via status check | Prevents duplicate AI charges if `save-lead` retries or the user double-submits. |

---

## Files Modified

1. **Database migration** -- Add `ai_pre_analysis` JSONB column to `leads`
2. **`supabase/functions/analyze-consultation-quote/index.ts`** -- New edge function (Sales Intel AI analysis)
3. **`supabase/config.toml`** -- Add `[functions.analyze-consultation-quote]` with `verify_jwt = false`
4. **`supabase/functions/save-lead/index.ts`** -- Add fire-and-forget fetch trigger after quote file linking, add `mime_type` to the existing file query select

No frontend changes. No new dependencies. No new storage buckets.

---

## Acceptance Criteria

1. **Speed:** Client booking returns 200 in under 500ms, unaffected by AI processing
2. **State transitions:** `ai_pre_analysis.status` goes `none` -> `pending` -> `completed` (or `failed`)
3. **Accuracy:** Valid quote PDF produces populated `result` with `estimated_total_price` and `sales_angle`
4. **Error handling:** Corrupted file or non-quote image results in `failed` status with non-empty `reason`
5. **Idempotency:** Duplicate trigger for same lead does not produce duplicate AI charges

