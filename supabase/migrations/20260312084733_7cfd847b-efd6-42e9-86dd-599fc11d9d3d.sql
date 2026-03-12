
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS phone_change_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_change_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS phone_change_locked_at timestamptz;
