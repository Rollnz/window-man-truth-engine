-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 5B: Identity & Event Uniqueness Constraints
-- Purpose: Enforce ledger integrity by preventing duplicate conversions
-- ═══════════════════════════════════════════════════════════════════════════

-- EXISTING: uix_wm_event_log_event_id already exists (from initial migration)
-- This prevents duplicate event_id values (replay protection)

-- NEW: Partial unique constraint on (lead_id, event_name) for lead_captured
-- This enforces: One conversion per lead for lead_captured events
-- Note: Using lead_captured (not lead_submission_success) as that's the canonical event name

CREATE UNIQUE INDEX IF NOT EXISTS uix_wm_event_log_lead_conversion
ON public.wm_event_log (lead_id, event_name)
WHERE event_name = 'lead_captured' AND lead_id IS NOT NULL;

COMMENT ON INDEX public.uix_wm_event_log_lead_conversion IS 
  'Phase 5B: Enforces exactly one lead_captured event per lead_id. Prevents duplicate conversions.';

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification query (run after migration):
-- SELECT COUNT(*) FROM public.wm_event_log 
-- WHERE event_name = 'lead_captured' 
-- GROUP BY lead_id HAVING COUNT(*) > 1;
-- Expected result: 0 rows (no duplicates)
-- ═══════════════════════════════════════════════════════════════════════════
