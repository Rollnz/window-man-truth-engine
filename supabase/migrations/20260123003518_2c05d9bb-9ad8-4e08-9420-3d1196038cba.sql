-- =============================================================
-- FIX SECURITY INVOKER VIEWS (PG17 compatible)
-- Drops in dependency order, removes raw PII, schema-qualifies tables
-- =============================================================

-- Drop ALL dependent views first (reverse dependency order)
DROP VIEW IF EXISTS public.v_meta_optimization_segments CASCADE;
DROP VIEW IF EXISTS public.v_attribution_first_last_touch CASCADE;
DROP VIEW IF EXISTS public.v_funnel_journeys CASCADE;
DROP VIEW IF EXISTS public.v_event_log_orphans CASCADE;
DROP VIEW IF EXISTS public.v_event_log_enriched CASCADE;


-- 1) v_event_log_enriched (REMOVES lead_email, keeps hashed identifiers)
CREATE VIEW public.v_event_log_enriched
WITH (security_invoker = true)
AS
SELECT
  e.id AS row_id,
  e.event_id,
  e.event_time,
  e.lead_id,
  e.session_id,
  e.event_name,
  e.event_type,
  e.client_id,
  e.source_tool,
  e.source_system,
  e.ingested_by,
  e.metadata,
  e.user_data,
  -- Hashed identity only (NO raw email)
  e.email_sha256,
  e.phone_sha256,
  -- Attribution from session
  s.utm_source,
  s.utm_medium,
  s.utm_campaign,
  s.utm_term,
  s.utm_content,
  s.referrer,
  s.landing_page,
  -- Click IDs from event
  e.fbclid,
  e.gclid,
  e.fbp,
  e.fbc
FROM public.wm_event_log e
LEFT JOIN public.wm_sessions s ON e.session_id = s.id;

COMMENT ON VIEW public.v_event_log_enriched IS 
  'Enriched event log with session attribution. Uses security_invoker for RLS. No raw PII exposed.';

GRANT SELECT ON public.v_event_log_enriched TO authenticated;


-- 2) v_event_log_orphans (standalone, no dependencies)
CREATE VIEW public.v_event_log_orphans
WITH (security_invoker = true)
AS
SELECT
  e.source_tool,
  e.source_system,
  CASE WHEN e.lead_id IS NULL THEN 'missing' ELSE 'present' END AS lead_id_status,
  CASE WHEN e.session_id IS NULL THEN 'missing' ELSE 'present' END AS session_id_status,
  COUNT(*) AS event_count
FROM public.wm_event_log e
GROUP BY e.source_tool, e.source_system, 
         CASE WHEN e.lead_id IS NULL THEN 'missing' ELSE 'present' END,
         CASE WHEN e.session_id IS NULL THEN 'missing' ELSE 'present' END;

COMMENT ON VIEW public.v_event_log_orphans IS 
  'Orphan event analysis for data quality monitoring. Uses security_invoker for RLS.';

GRANT SELECT ON public.v_event_log_orphans TO authenticated;


-- 3) v_attribution_first_last_touch
CREATE VIEW public.v_attribution_first_last_touch
WITH (security_invoker = true)
AS
SELECT
  e.lead_id,
  MIN(e.event_time) AS first_touch_time,
  MAX(e.event_time) AS last_touch_time,
  (ARRAY_AGG(e.source_tool ORDER BY e.event_time ASC))[1] AS first_touch_tool,
  (ARRAY_AGG(e.source_tool ORDER BY e.event_time DESC))[1] AS last_touch_tool
FROM public.wm_event_log e
WHERE e.lead_id IS NOT NULL
GROUP BY e.lead_id;

COMMENT ON VIEW public.v_attribution_first_last_touch IS 
  'First/last touch attribution per lead. Uses security_invoker for RLS.';

GRANT SELECT ON public.v_attribution_first_last_touch TO authenticated;


-- 4) v_funnel_journeys
CREATE VIEW public.v_funnel_journeys
WITH (security_invoker = true)
AS
SELECT
  e.event_id,
  e.event_time,
  e.client_id,
  e.event_name,
  e.source_tool,
  LAG(e.event_name) OVER (PARTITION BY e.client_id ORDER BY e.event_time) AS previous_event,
  LEAD(e.event_name) OVER (PARTITION BY e.client_id ORDER BY e.event_time) AS next_event
FROM public.wm_event_log e
WHERE e.client_id IS NOT NULL;

COMMENT ON VIEW public.v_funnel_journeys IS 
  'User journey sequences with previous/next event context. Uses security_invoker for RLS.';

GRANT SELECT ON public.v_funnel_journeys TO authenticated;


-- 5) v_meta_optimization_segments
CREATE VIEW public.v_meta_optimization_segments
WITH (security_invoker = true)
AS
SELECT
  e.lead_id,
  MAX(CASE WHEN e.source_tool = 'window-scanner' THEN 1 ELSE 0 END) AS used_scanner,
  MAX(CASE WHEN e.source_tool = 'voice-assistant' THEN 1 ELSE 0 END) AS used_voice,
  MAX(CASE WHEN e.event_name = 'booking_confirmed' THEN 1 ELSE 0 END) AS booking_confirmed
FROM public.wm_event_log e
WHERE e.lead_id IS NOT NULL
GROUP BY e.lead_id;

COMMENT ON VIEW public.v_meta_optimization_segments IS 
  'Meta optimization segments for ad targeting. Uses security_invoker for RLS.';

GRANT SELECT ON public.v_meta_optimization_segments TO authenticated;