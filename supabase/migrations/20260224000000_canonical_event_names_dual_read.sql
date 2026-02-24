-- ═══════════════════════════════════════════════════════════════════════════
-- Canonical Event Names: Dual-Read Migration
-- Date: 2026-02-24
-- Purpose: Update all 8 views and unique indexes to accept BOTH legacy event
--          names (lead_submission_success, scanner_upload_completed,
--          booking_confirmed) AND new canonical wm_* names (wm_lead,
--          wm_scanner_upload, wm_appointment_booked, etc.)
--
-- ZERO RISK: No data is deleted or modified. Existing historical data with
-- old names continues to appear in all dashboards. New canonical writes will
-- also appear immediately after backend writers are updated.
--
-- Run this BEFORE deploying backend code changes.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────
-- 1. v_duplicate_conversions
-- Detects duplicate wm_lead (or legacy lead_submission_success) per lead_id
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_duplicate_conversions AS
SELECT
  lead_id,
  event_name,
  COUNT(*) AS duplicate_count,
  ARRAY_AGG(event_id ORDER BY event_time) AS event_ids,
  ARRAY_AGG(event_time ORDER BY event_time) AS event_times,
  ARRAY_AGG(ingested_by ORDER BY event_time) AS ingested_by_sources
FROM public.wm_event_log
WHERE event_name IN ('wm_lead', 'lead_submission_success')
  AND lead_id IS NOT NULL
GROUP BY lead_id, event_name
HAVING COUNT(*) > 1;

COMMENT ON VIEW public.v_duplicate_conversions IS
  'Dual-read: detects duplicate conversions for both wm_lead and lead_submission_success. Should return 0 rows.';


-- ─────────────────────────────────────────────────────────────────────────
-- 2. v_ledger_health_summary
-- Daily health metrics — counts both old and new lead event names
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_ledger_health_summary AS
SELECT
  DATE(event_time) AS event_date,
  COUNT(*) AS total_events,
  COUNT(DISTINCT event_id) AS unique_event_ids,
  COUNT(*) - COUNT(DISTINCT event_id) AS potential_duplicates,
  COUNT(CASE WHEN event_name IN ('wm_lead', 'lead_submission_success') THEN 1 END) AS conversions,
  COUNT(DISTINCT CASE WHEN event_name IN ('wm_lead', 'lead_submission_success') THEN lead_id END) AS unique_converted_leads,
  COUNT(CASE WHEN lead_id IS NULL THEN 1 END) AS orphan_events,
  COUNT(DISTINCT ingested_by) AS writer_count,
  ARRAY_AGG(DISTINCT ingested_by) AS writers
FROM public.wm_event_log
GROUP BY DATE(event_time)
ORDER BY event_date DESC;

COMMENT ON VIEW public.v_ledger_health_summary IS
  'Dual-read: daily ledger health. Counts wm_lead and lead_submission_success as conversions.';


-- ─────────────────────────────────────────────────────────────────────────
-- 3. v_writer_activity
-- Track which systems are writing to the ledger
-- ─────────────────────────────────────────────────────────────────────────
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
  COUNT(CASE WHEN event_name IN ('wm_lead', 'lead_submission_success') THEN 1 END) AS conversion_writes
FROM public.wm_event_log
GROUP BY ingested_by, source_system, source_tool
ORDER BY event_count DESC;

COMMENT ON VIEW public.v_writer_activity IS
  'Dual-read: writer activity tracking. Counts both wm_lead and lead_submission_success as conversion writes.';


-- ─────────────────────────────────────────────────────────────────────────
-- 4. v_conversion_integrity_check
-- Verify each lead has exactly one wm_lead or lead_submission_success event
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_conversion_integrity_check AS
SELECT
  l.id AS lead_id,
  l.email,
  l.created_at AS lead_created_at,
  COUNT(e.id) AS conversion_event_count,
  ARRAY_AGG(DISTINCT e.event_name) FILTER (WHERE e.id IS NOT NULL) AS found_event_names,
  CASE
    WHEN COUNT(e.id) = 0 THEN 'MISSING'
    WHEN COUNT(e.id) = 1 THEN 'OK'
    ELSE 'DUPLICATE'
  END AS integrity_status
FROM public.leads l
LEFT JOIN public.wm_event_log e
  ON l.id = e.lead_id
  AND e.event_name IN ('wm_lead', 'lead_submission_success')
GROUP BY l.id, l.email, l.created_at
ORDER BY
  CASE
    WHEN COUNT(e.id) = 0 THEN 1
    WHEN COUNT(e.id) > 1 THEN 2
    ELSE 3
  END,
  l.created_at DESC;

COMMENT ON VIEW public.v_conversion_integrity_check IS
  'Dual-read: cross-check leads vs wm_lead or lead_submission_success events. Flags MISSING or DUPLICATE.';


-- ─────────────────────────────────────────────────────────────────────────
-- 5. v_daily_funnel_performance
-- Daily funnel metrics anchored to wm_lead or lead_submission_success
-- ─────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.v_daily_funnel_performance CASCADE;

CREATE VIEW public.v_daily_funnel_performance
WITH (security_invoker = true)
AS
SELECT
    DATE(e.event_time) AS date,
    COUNT(DISTINCT e.lead_id) AS conversions,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.lead_id END) AS opportunities,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END) AS deals_won,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.lead_id END) AS revenue_confirmed,
    SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) AS total_deal_value,
    SUM(CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.revenue_amount ELSE 0 END) AS total_confirmed_revenue,
    ROUND(
        COUNT(DISTINCT CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.lead_id END)::numeric /
        NULLIF(COUNT(DISTINCT e.lead_id), 0) * 100, 2
    ) AS lead_to_opportunity_pct,
    ROUND(
        COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END)::numeric /
        NULLIF(COUNT(DISTINCT CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.lead_id END), 0) * 100, 2
    ) AS opportunity_to_deal_pct,
    ROUND(
        SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) /
        NULLIF(COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END), 0), 2
    ) AS avg_deal_value
FROM public.wm_event_log e
LEFT JOIN public.wm_revenue_events r ON e.lead_id = r.lead_id
WHERE e.event_name IN ('wm_lead', 'lead_submission_success')
GROUP BY DATE(e.event_time)
ORDER BY date DESC;

COMMENT ON VIEW public.v_daily_funnel_performance IS
  'Dual-read: daily funnel performance. Anchored to wm_lead or lead_submission_success.';

GRANT SELECT ON public.v_daily_funnel_performance TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 6. v_lead_ltv
-- Individual lead lifetime value — dual-read anchor
-- ─────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.v_lead_ltv CASCADE;

CREATE VIEW public.v_lead_ltv
WITH (security_invoker = true)
AS
SELECT
    e.lead_id,
    r.external_id,
    r.attr_source_tool AS acquisition_tool,
    r.attr_utm_campaign AS acquisition_campaign,
    r.attr_utm_source AS acquisition_source,
    MIN(e.event_time) AS conversion_date,
    MAX(CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.event_time END) AS opportunity_date,
    MAX(CASE WHEN r.revenue_stage = 'deal_won' THEN r.event_time END) AS deal_date,
    MAX(CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.event_time END) AS revenue_date,
    MAX(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount END) AS deal_value,
    MAX(CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.revenue_amount END) AS confirmed_revenue,
    MAX(r.deal_id) AS deal_id,
    MAX(r.deal_name) AS deal_name,
    MAX(r.attr_lead_score) AS lead_score,
    MAX(r.attr_intent_tier) AS intent_tier,
    EXTRACT(DAY FROM
        MAX(CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.event_time END) -
        MIN(e.event_time)
    ) AS days_to_opportunity,
    EXTRACT(DAY FROM
        MAX(CASE WHEN r.revenue_stage = 'deal_won' THEN r.event_time END) -
        MIN(e.event_time)
    ) AS days_to_close,
    CASE
        WHEN MAX(CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN 1 END) = 1 THEN 'revenue_confirmed'
        WHEN MAX(CASE WHEN r.revenue_stage = 'deal_won' THEN 1 END) = 1 THEN 'deal_won'
        WHEN MAX(CASE WHEN r.revenue_stage = 'opportunity_created' THEN 1 END) = 1 THEN 'opportunity_created'
        ELSE 'converted'
    END AS current_stage
FROM public.wm_event_log e
LEFT JOIN public.wm_revenue_events r ON e.lead_id = r.lead_id
WHERE e.event_name IN ('wm_lead', 'lead_submission_success')
GROUP BY e.lead_id, r.external_id, r.attr_source_tool, r.attr_utm_campaign, r.attr_utm_source;

COMMENT ON VIEW public.v_lead_ltv IS
  'Dual-read: individual lead lifetime value. Anchored to wm_lead or lead_submission_success.';

GRANT SELECT ON public.v_lead_ltv TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 7. v_weekly_cohort_analysis
-- Weekly cohort performance — dual-read anchor
-- ─────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.v_weekly_cohort_analysis CASCADE;

CREATE VIEW public.v_weekly_cohort_analysis
WITH (security_invoker = true)
AS
SELECT
    DATE_TRUNC('week', e.event_time)::date AS cohort_week,
    COUNT(DISTINCT e.lead_id) AS cohort_size,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.lead_id END) AS opportunities,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END) AS deals_won,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.lead_id END) AS revenue_confirmed,
    SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) AS total_revenue,
    ROUND(
        COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END)::numeric /
        NULLIF(COUNT(DISTINCT e.lead_id), 0) * 100, 2
    ) AS cohort_conversion_pct,
    ROUND(
        SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) /
        NULLIF(COUNT(DISTINCT e.lead_id), 0), 2
    ) AS revenue_per_cohort_lead
FROM public.wm_event_log e
LEFT JOIN public.wm_revenue_events r ON e.lead_id = r.lead_id
WHERE e.event_name IN ('wm_lead', 'lead_submission_success')
GROUP BY DATE_TRUNC('week', e.event_time)::date
ORDER BY cohort_week DESC;

COMMENT ON VIEW public.v_weekly_cohort_analysis IS
  'Dual-read: weekly cohort analysis. Anchored to wm_lead or lead_submission_success.';

GRANT SELECT ON public.v_weekly_cohort_analysis TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 8. analytics_daily_overview
-- Expanded to count both canonical wm_* and legacy event names
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.analytics_daily_overview
WITH (security_invoker = true)
AS
SELECT
    DATE(s.created_at) AS date,
    COUNT(DISTINCT s.anonymous_id) AS visitors,
    COUNT(DISTINCT l.id) AS leads,
    ROUND(
        COUNT(DISTINCT l.id)::numeric /
        NULLIF(COUNT(DISTINCT s.anonymous_id), 0) * 100, 2
    ) AS conversion_rate,
    COUNT(DISTINCT CASE
        WHEN e.event_name IN ('wm_scanner_upload', 'scanner_upload_completed', 'quote_scanned') THEN e.id
    END) AS quote_scans,
    COUNT(DISTINCT CASE
        WHEN e.event_name IN ('cost_calculator_completed', 'calculator_completed') THEN e.id
    END) AS calculator_completions,
    COUNT(DISTINCT CASE
        WHEN e.event_name = 'risk_diagnostic_completed' THEN e.id
    END) AS risk_assessments,
    COUNT(DISTINCT CASE
        WHEN e.event_name IN ('wm_appointment_booked', 'consultation_booked', 'booking_confirmed') THEN e.id
    END) AS consultations_booked,
    -- Canonical wm_* event counts (new columns — will populate after backend update)
    COUNT(DISTINCT CASE WHEN e.event_name = 'wm_lead' THEN e.lead_id END) AS wm_leads,
    COUNT(DISTINCT CASE WHEN e.event_name = 'wm_qualified_lead' THEN e.lead_id END) AS wm_qualified_leads,
    COUNT(DISTINCT CASE WHEN e.event_name = 'wm_scanner_upload' THEN e.lead_id END) AS wm_scanner_uploads,
    COUNT(DISTINCT CASE WHEN e.event_name = 'wm_appointment_booked' THEN e.lead_id END) AS wm_appointments,
    COUNT(DISTINCT CASE WHEN e.event_name = 'wm_sold' THEN e.lead_id END) AS wm_sales
FROM public.wm_sessions s
LEFT JOIN public.leads l ON DATE(l.created_at) = DATE(s.created_at) AND l.lead_status != 'spam'
LEFT JOIN public.wm_event_log e ON e.session_id = s.id
WHERE s.created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(s.created_at)
ORDER BY date DESC;

COMMENT ON VIEW public.analytics_daily_overview IS
  'Dual-read: daily overview. Counts both canonical wm_* and legacy event names. New wm_* columns will populate after backend update.';


-- ─────────────────────────────────────────────────────────────────────────
-- 9. Unique Indexes — Drop old, create new covering canonical + legacy names
--
-- STRATEGY: Cannot change a partial WHERE clause without dropping the index.
-- We drop the single old index (uix_wm_event_log_lead_conversion) that was
-- set to 'lead_submission_success' and replace it with three targeted indexes.
-- ─────────────────────────────────────────────────────────────────────────

-- Drop old index (covers only lead_submission_success)
DROP INDEX IF EXISTS public.uix_wm_event_log_lead_conversion;

-- Index 1: One wm_lead per lead_id (canonical)
CREATE UNIQUE INDEX IF NOT EXISTS uix_wm_event_log_wm_lead
ON public.wm_event_log (lead_id, event_name)
WHERE event_name = 'wm_lead' AND lead_id IS NOT NULL;

COMMENT ON INDEX public.uix_wm_event_log_wm_lead IS
  'Enforces exactly one wm_lead event per lead_id. Canonical idempotency lock.';

-- Index 2: One lead_submission_success per lead_id (backward compat for historical data)
CREATE UNIQUE INDEX IF NOT EXISTS uix_wm_event_log_legacy_lead
ON public.wm_event_log (lead_id, event_name)
WHERE event_name = 'lead_submission_success' AND lead_id IS NOT NULL;

COMMENT ON INDEX public.uix_wm_event_log_legacy_lead IS
  'Enforces exactly one lead_submission_success per lead_id. Legacy backward-compat lock. Remove after full migration.';

-- Index 3: One wm_scanner_upload per lead_id (canonical upload deduplication)
CREATE UNIQUE INDEX IF NOT EXISTS uix_wm_event_log_wm_scanner_upload
ON public.wm_event_log (lead_id, event_name)
WHERE event_name = 'wm_scanner_upload' AND lead_id IS NOT NULL;

COMMENT ON INDEX public.uix_wm_event_log_wm_scanner_upload IS
  'Enforces exactly one wm_scanner_upload per lead_id.';


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (run after migration to confirm success)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Confirm all 8 views exist:
-- SELECT table_name FROM information_schema.views
-- WHERE table_schema = 'public'
-- AND table_name IN (
--   'v_duplicate_conversions', 'v_ledger_health_summary', 'v_writer_activity',
--   'v_conversion_integrity_check', 'v_daily_funnel_performance', 'v_lead_ltv',
--   'v_weekly_cohort_analysis', 'analytics_daily_overview'
-- )
-- ORDER BY table_name;
-- Expected: 8 rows

-- 2. Confirm new indexes exist:
-- SELECT indexname FROM pg_indexes
-- WHERE tablename = 'wm_event_log'
-- AND indexname IN (
--   'uix_wm_event_log_wm_lead',
--   'uix_wm_event_log_legacy_lead',
--   'uix_wm_event_log_wm_scanner_upload'
-- );
-- Expected: 3 rows

-- 3. Confirm old index is gone:
-- SELECT indexname FROM pg_indexes
-- WHERE tablename = 'wm_event_log'
-- AND indexname = 'uix_wm_event_log_lead_conversion';
-- Expected: 0 rows

-- 4. Admin dashboards still load (data counts preserved):
-- SELECT * FROM v_ledger_health_summary LIMIT 7;
-- SELECT integrity_status, COUNT(*) FROM v_conversion_integrity_check GROUP BY 1;
-- SELECT * FROM analytics_daily_overview LIMIT 7;
