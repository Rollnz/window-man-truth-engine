
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS has_quote text,
  ADD COLUMN IF NOT EXISTS timeline text,
  ADD COLUMN IF NOT EXISTS homeowner boolean,
  ADD COLUMN IF NOT EXISTS window_scope text,
  ADD COLUMN IF NOT EXISTS lead_score integer,
  ADD COLUMN IF NOT EXISTS lead_segment text,
  ADD COLUMN IF NOT EXISTS qualification_completed_at timestamptz;

NOTIFY pgrst, 'reload schema';
