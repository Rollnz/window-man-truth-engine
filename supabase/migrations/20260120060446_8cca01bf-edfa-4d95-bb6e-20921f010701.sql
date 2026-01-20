-- Add outcome_timeline_written column for webhook idempotency
ALTER TABLE public.phone_call_logs
  ADD COLUMN IF NOT EXISTS outcome_timeline_written boolean DEFAULT false;

COMMENT ON COLUMN public.phone_call_logs.outcome_timeline_written IS 'True when timeline events (lead_notes/wm_events) have been written for this outcome. Prevents duplicate timeline entries on webhook retries.';