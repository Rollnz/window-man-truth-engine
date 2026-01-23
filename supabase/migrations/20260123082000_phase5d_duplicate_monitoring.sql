-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 5D: Duplicate Detection & Monitoring Views
-- Purpose: Provide visibility into ledger health and catch any integrity violations
-- ═══════════════════════════════════════════════════════════════════════════

-- View 1: v_duplicate_conversions
-- Detects any duplicate lead_submission_success events per lead_id
-- Should return 0 rows if constraints are working correctly
CREATE OR REPLACE VIEW public.v_duplicate_conversions AS
SELECT
  lead_id,
  event_name,
  COUNT(*) AS duplicate_count,
  ARRAY_AGG(event_id ORDER BY event_time) AS event_ids,
  ARRAY_AGG(event_time ORDER BY event_time) AS event_times,
  ARRAY_AGG(ingested_by ORDER BY event_time) AS ingested_by_sources
FROM public.wm_event_log
WHERE event_name = 'lead_submission_success'
  AND lead_id IS NOT NULL
GROUP BY lead_id, event_name
HAVING COUNT(*) > 1;

COMMENT ON VIEW public.v_duplicate_conversions IS 
  'Phase 5D: Detects duplicate conversions. Should return 0 rows if constraints are working.';

-- View 2: v_duplicate_event_ids
-- Detects any duplicate event_id values (should be impossible with unique constraint)
CREATE OR REPLACE VIEW public.v_duplicate_event_ids AS
SELECT
  event_id,
  COUNT(*) AS duplicate_count,
  ARRAY_AGG(id ORDER BY created_at) AS row_ids,
  ARRAY_AGG(event_name ORDER BY created_at) AS event_names,
  ARRAY_AGG(ingested_by ORDER BY created_at) AS ingested_by_sources
FROM public.wm_event_log
WHERE event_id IS NOT NULL
GROUP BY event_id
HAVING COUNT(*) > 1;

COMMENT ON VIEW public.v_duplicate_event_ids IS 
  'Phase 5D: Detects duplicate event_ids. Should return 0 rows with unique constraint.';

-- View 3: v_ledger_health_summary
-- Daily summary of ledger health metrics
CREATE OR REPLACE VIEW public.v_ledger_health_summary AS
SELECT
  DATE(event_time) AS event_date,
  COUNT(*) AS total_events,
  COUNT(DISTINCT event_id) AS unique_event_ids,
  COUNT(*) - COUNT(DISTINCT event_id) AS potential_duplicates,
  COUNT(CASE WHEN event_name = 'lead_submission_success' THEN 1 END) AS conversions,
  COUNT(DISTINCT CASE WHEN event_name = 'lead_submission_success' THEN lead_id END) AS unique_converted_leads,
  COUNT(CASE WHEN lead_id IS NULL THEN 1 END) AS orphan_events,
  COUNT(DISTINCT ingested_by) AS writer_count,
  ARRAY_AGG(DISTINCT ingested_by) AS writers
FROM public.wm_event_log
GROUP BY DATE(event_time)
ORDER BY event_date DESC;

COMMENT ON VIEW public.v_ledger_health_summary IS 
  'Phase 5D: Daily ledger health metrics. Monitor for potential_duplicates > 0.';

-- View 4: v_writer_activity
-- Track which systems are writing to the ledger
CREATE OR REPLACE VIEW public.v_writer_activity AS
SELECT
  ingested_by,
  source_system,
  source_tool,
  COUNT(*) AS event_count,
  COUNT(DISTINCT event_name) AS unique_event_types,
  ARRAY_AGG(DISTINCT event_name) AS event_names,
  MIN(event_time) AS first_write,
  MAX(event_time) AS last_write,
  COUNT(CASE WHEN event_name = 'lead_submission_success' THEN 1 END) AS conversion_writes
FROM public.wm_event_log
GROUP BY ingested_by, source_system, source_tool
ORDER BY event_count DESC;

COMMENT ON VIEW public.v_writer_activity IS 
  'Phase 5D: Track writer activity. Alert if unexpected writers appear.';

-- View 5: v_conversion_integrity_check
-- Verify each lead has exactly one conversion event
CREATE OR REPLACE VIEW public.v_conversion_integrity_check AS
SELECT
  l.id AS lead_id,
  l.email,
  l.created_at AS lead_created_at,
  COUNT(e.id) AS conversion_event_count,
  CASE 
    WHEN COUNT(e.id) = 0 THEN 'MISSING'
    WHEN COUNT(e.id) = 1 THEN 'OK'
    ELSE 'DUPLICATE'
  END AS integrity_status
FROM public.leads l
LEFT JOIN public.wm_event_log e 
  ON l.id = e.lead_id 
  AND e.event_name = 'lead_submission_success'
GROUP BY l.id, l.email, l.created_at
ORDER BY 
  CASE 
    WHEN COUNT(e.id) = 0 THEN 1
    WHEN COUNT(e.id) > 1 THEN 2
    ELSE 3
  END,
  l.created_at DESC;

COMMENT ON VIEW public.v_conversion_integrity_check IS 
  'Phase 5D: Cross-check leads vs conversion events. Flags MISSING or DUPLICATE.';

-- ═══════════════════════════════════════════════════════════════════════════
-- Quick Health Check Queries (run manually):
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- 1. Check for duplicate conversions:
--    SELECT * FROM v_duplicate_conversions;
--    Expected: 0 rows
--
-- 2. Check for duplicate event_ids:
--    SELECT * FROM v_duplicate_event_ids;
--    Expected: 0 rows
--
-- 3. Daily health summary:
--    SELECT * FROM v_ledger_health_summary LIMIT 7;
--    Watch: potential_duplicates should be 0
--
-- 4. Writer activity audit:
--    SELECT * FROM v_writer_activity;
--    Alert: If 'gtm-forwarder' appears, investigate immediately
--
-- 5. Conversion integrity:
--    SELECT integrity_status, COUNT(*) FROM v_conversion_integrity_check GROUP BY 1;
--    Expected: All 'OK' (or 'MISSING' for very new leads)
-- ═══════════════════════════════════════════════════════════════════════════
