-- Phase 5C: Financial-grade idempotency constraint for lead conversions
-- Ensures exactly one lead_submission_success event per lead in the ledger

CREATE UNIQUE INDEX IF NOT EXISTS uix_wm_event_log_lead_conversion
ON public.wm_event_log (lead_id, event_name)
WHERE event_name = 'lead_submission_success'
  AND lead_id IS NOT NULL;

COMMENT ON INDEX public.uix_wm_event_log_lead_conversion IS
  'Phase 5: Enforces exactly one lead_submission_success per lead_id. Financial-grade idempotency lock.';