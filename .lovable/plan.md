

## Fix: Add `'ai-scanner'` to SOURCE_TOOLS Enum

### Problem
The `/ai-scanner` page sends `sourceTool: 'ai-scanner'` to the `save-lead` edge function, but `'ai-scanner'` is not in the allowed `SOURCE_TOOLS` enum. The backend rejects it with a 400 validation error.

### Changes (3 files)

**1. `src/types/sourceTool.ts`** -- Add `'ai-scanner'` to the array.

**2. `supabase/functions/_shared/sourceTools.ts`** -- Add `'ai-scanner'` to the array (backend mirror).

**3. `src/pages/QuoteScanner.tsx` (line 323)** -- Change `leadValue: 75` to `leadValue: 100` to match the Tier 5 VBB standard established in the earlier fix.

### Deployment
The `save-lead` edge function imports from `_shared/sourceTools.ts`, so redeploying `save-lead` (and `update-lead-qualification` if it shares the import) will pick up the new enum value automatically.

### Verification
- Submit a lead from `/ai-scanner` -- expect 200 from `save-lead`.
- Confirm `source_tool = 'ai-scanner'` is persisted in the `leads` table.
- Confirm `value: 100` in the tracking payload.

