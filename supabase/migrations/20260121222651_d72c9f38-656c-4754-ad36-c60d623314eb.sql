-- Phase 1: Attribution Infrastructure Add-ons
-- 1) Performance index for event_name + event_time queries
CREATE INDEX IF NOT EXISTS idx_wm_event_log_event_time
ON public.wm_event_log (event_name, event_time DESC);

-- 2) Diagnostic view: track orphan events (missing lead_id/session_id)
CREATE OR REPLACE VIEW public.v_event_log_orphans AS
SELECT
  source_system,
  source_tool,
  CASE WHEN lead_id IS NULL THEN 'missing' ELSE 'present' END AS lead_id_status,
  CASE WHEN session_id IS NULL THEN 'missing' ELSE 'present' END AS session_id_status,
  COUNT(*) AS event_count
FROM public.wm_event_log
GROUP BY 1, 2, 3, 4
ORDER BY event_count DESC;