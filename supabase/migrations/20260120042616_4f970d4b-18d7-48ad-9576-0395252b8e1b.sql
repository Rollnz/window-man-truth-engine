-- Add columns for manual dispatch tracking
ALTER TABLE public.pending_calls
  ADD COLUMN IF NOT EXISTS requested_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS reason text DEFAULT 'auto';

COMMENT ON COLUMN public.pending_calls.requested_by_user_id IS 'Admin user ID who initiated manual dispatch (null for auto-triggered calls)';
COMMENT ON COLUMN public.pending_calls.reason IS 'Dispatch reason: auto, manual_dispatch, recovery_sweep, hot_lead_followup';

-- Insert manual_dispatch agent (upsert on source_tool)
INSERT INTO public.call_agents (source_tool, agent_id, first_message_template, enabled)
VALUES (
  'manual_dispatch',
  'PLACEHOLDER_AGENT_ID',
  'Hi {first_name}, this is WindowMan AI following up on your window project. Do you have a quick minute?',
  true
)
ON CONFLICT (source_tool) DO UPDATE SET
  first_message_template = EXCLUDED.first_message_template,
  enabled = true,
  updated_at = now();