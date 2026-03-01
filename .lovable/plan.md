

## Phase 1 Security Patch Plan -- 4 Fixes

### Fix 1: IDOR in orchestrate-quote-analysis (P0)

**Problem**: The function uses `SUPABASE_SERVICE_ROLE_KEY` and blindly trusts `account_id` from the request body. Any user can pass any account_id.

**Solution**:
- Add `[functions.orchestrate-quote-analysis] verify_jwt = false` to `config.toml` (required for signing-keys compatibility)
- Rewrite the function to:
  1. Extract `Authorization: Bearer <jwt>` from the request header
  2. Create a client with `SUPABASE_ANON_KEY` + the user's auth header
  3. Call `supabase.auth.getClaims(token)` to get the authenticated `userId`
  4. Look up `accounts` WHERE `supabase_user_id = userId` to derive the real `account_id`
  5. Remove `account_id` from the request body entirely -- it's now server-derived
  6. Keep a separate service-role client for the privileged DB writes (ledger, attribution)

**Files changed**: `supabase/config.toml`, `supabase/functions/orchestrate-quote-analysis/index.ts`

---

### Fix 2: Schema Mismatch -- add account_id to quote_analyses (P0)

**Problem**: `quote_analyses.lead_id` is overloaded -- triggers and edge functions treat it as an account ID, but it's semantically a lead reference.

**Solution** (SQL migration):
```text
1. ALTER TABLE quote_analyses ADD COLUMN account_id UUID REFERENCES accounts(id)
2. CREATE INDEX idx_quote_analyses_account_id ON quote_analyses(account_id)
3. Backfill: UPDATE quote_analyses SET account_id = lead_id (since they currently hold account IDs)
4. Update RLS policies to include account_id-based access
```

Then update:
- **orchestrate-quote-analysis**: query by `.eq('account_id', account_id)` instead of `.eq('lead_id', account_id)`
- **Trigger 2** (`fn_auto_dispatch_call_on_quote_analyzed`): read `NEW.account_id` instead of `NEW.lead_id`
- **Frontend** (`useQuoteAnalyses.ts`): no change needed (RLS handles access; the hook doesn't filter by account_id)

---

### Fix 3: Trigger Column Validation -- handle_phone_confirmed (P0)

**Problem**: The trigger references `phone` and `supabase_user_id` on `accounts`.

**Audit result**: The `accounts` table **does** have columns named `phone` (text) and `supabase_user_id` (uuid). The current trigger matches the actual schema perfectly.

**Action**: No changes needed. The trigger is safe as-is.

---

### Fix 4: Unsafe Cast in Trigger 2 (P1)

**Problem**: `(NEW.analysis_json->>'overallScore')::int` will crash the entire UPDATE transaction if `overallScore` is missing, null, empty string, or non-numeric.

**Solution** (SQL migration): Replace the trigger function with a safe cast pattern:

```text
Before:
  (NEW.analysis_json->>'overallScore')::int

After:
  CASE
    WHEN NEW.analysis_json->>'overallScore' ~ '^\d+$'
    THEN (NEW.analysis_json->>'overallScore')::int
    ELSE NULL
  END
```

This regex-checks for digits before casting, returning NULL instead of crashing on malformed data.

---

### Implementation Sequence

1. **SQL Migration** (single migration, 2 parts):
   - Add `account_id` column to `quote_analyses` + backfill + index
   - Replace `fn_auto_dispatch_call_on_quote_analyzed` with safe-cast version using `account_id`

2. **Edge Function Update**: Rewrite `orchestrate-quote-analysis` with JWT auth + `account_id` ownership

3. **Config Update**: Add `verify_jwt = false` entry for `orchestrate-quote-analysis`

### Summary of Changes

| Fix | Severity | Files | Type |
|-----|----------|-------|------|
| IDOR auth | P0 | config.toml, orchestrate-quote-analysis/index.ts | Edge function |
| Schema mismatch | P0 | SQL migration, orchestrate-quote-analysis/index.ts | Migration + code |
| Trigger columns | P0 | None -- already correct | Audit only |
| Unsafe cast | P1 | SQL migration (trigger replacement) | Migration |

