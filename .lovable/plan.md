

## Fix and Deploy Two Edge Functions for /signup

### Task 1: Update `upload-quote` success response

**File:** `supabase/functions/upload-quote/index.ts` (lines 413-424)

Add `pending_scan_uuid` and `quote_analysis_id` fields (both set to `insertData.id`) to the success JSON response. This allows the `/signup` page's Flow A to receive the scan ID it needs for polling `orchestrate-quote-analysis`.

### Task 2: Create `qualify-flow-b` edge function

**File:** `supabase/functions/qualify-flow-b/index.ts` (new file)

A new edge function that:
- Accepts `account_id`, `is_homeowner`, `timeline`, `window_count`, `has_estimate`
- Scores the lead (homeowner: +30, timeline: up to +25, window count: up to +20, estimate status: up to +10)
- Qualifies if score >= 60 AND is_homeowner
- Inserts into `qualification_answers` table
- Returns score, qualification status, event type, and event value

**Config:** Add `[functions.qualify-flow-b]` with `verify_jwt = false` to `supabase/config.toml`.

### Task 3: Deploy both functions

Deploy `upload-quote` and `qualify-flow-b` to the connected backend project.

### Technical Notes

- The `qualify-flow-b` function uses the service role key (no JWT verification), consistent with other public-facing edge functions in this project.
- CORS headers follow the project's existing pattern.
- The `qualification_answers` table already exists in the database (confirmed from triggers referencing its columns).

