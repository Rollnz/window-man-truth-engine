

## Phase 1 Security Patch Plan -- 4 Fixes ✅ COMPLETED

### Fix 1: IDOR in orchestrate-quote-analysis (P0) ✅

**Status**: DEPLOYED  
- Added `verify_jwt = false` to `config.toml`
- Rewrote function to derive `account_id` from JWT via `getClaims()` → `accounts.supabase_user_id`
- Removed `account_id` from request body
- Service-role client used only for privileged writes (ledger, attribution)

### Fix 2: Schema Mismatch -- account_id on quote_analyses (P0) ✅

**Status**: MIGRATED & DEPLOYED  
- Added `account_id` UUID column with FK to `accounts(id)`
- Created index `idx_quote_analyses_account_id`
- Backfilled from `lead_id` (only valid FK references)
- Added RLS policy for user SELECT via `account_id`
- Edge function queries by `.eq('account_id', account_id)`
- Trigger uses `COALESCE(NEW.account_id, NEW.lead_id)` for backward compatibility

### Fix 3: Trigger Column Validation -- handle_phone_confirmed (P0) ✅

**Status**: NO CHANGES NEEDED  
- Audited: `accounts.phone` (text) and `accounts.supabase_user_id` (uuid) exist and match trigger

### Fix 4: Unsafe Cast in Trigger 2 (P1) ✅

**Status**: MIGRATED  
- Replaced `(NEW.analysis_json->>'overallScore')::int` with safe regex-guarded cast
- Also fixed trigger to use actual `pending_calls` columns (`source_tool`, `phone_e164`, etc.) instead of non-existent `call_type`/`context`
