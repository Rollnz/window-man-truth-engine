
# Forward-Compatible AI Pre-Analysis: Database Pivot + Sales Intel HUD

## Status: Steps 1-3 COMPLETE. Step 4 pending.

---

## ✅ Phase 1: Database Migration (DONE)

- Added `ai_pre_analysis JSONB NOT NULL DEFAULT '{"status":"none"}'` to `quote_files`
- Created index `quote_files_lead_id_created_at_idx` on `(lead_id, created_at DESC)`
- Created RPC `claim_quote_file_preanalysis` for atomic job claiming

## ✅ Phase 2: Edge Functions (DONE & DEPLOYED)

- `analyze-consultation-quote`: Uses atomic RPC claim, writes completed/failed to `quote_files`
- `admin-lead-detail`: Extracts `aiPreAnalysis` from files array with strict type guards

## ✅ Phase 3: Frontend (DONE)

- `useLeadDetail.ts`: Added types, state, useRef-based polling, merged duplicate interfaces
- `SalesIntelCard.tsx`: New component with skeleton placeholder, Number.isFinite guard, dark mode safe
- `LeadDetail.tsx`: SalesIntelCard placed as full-width banner above 3-pane grid

## ⏳ Phase 4: Drop old column (PENDING)

After confirming no runtime reads/writes remain on `leads.ai_pre_analysis`:

```sql
ALTER TABLE public.leads DROP COLUMN IF EXISTS ai_pre_analysis;
```

Wait until edge functions are confirmed working in production before executing.
