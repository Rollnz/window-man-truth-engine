-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 6D: Executive Read Models
-- Purpose: Create production views for ROAS, LTV, funnel performance, and profitability
-- 
-- VIEWS CREATED:
-- 1. v_daily_funnel_performance - Daily conversion → opportunity → deal → revenue
-- 2. v_campaign_roas - Campaign-level revenue attribution
-- 3. v_lead_ltv - Individual lead lifetime value
-- 4. v_source_profitability - Tool/source revenue performance
-- 5. v_revenue_pipeline - Current pipeline status
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. DAILY FUNNEL PERFORMANCE
-- Shows daily progression from conversion through revenue stages
-- ═══════════════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public.v_daily_funnel_performance CASCADE;

CREATE VIEW public.v_daily_funnel_performance
WITH (security_invoker = true)
AS
SELECT
    DATE(e.event_time) AS date,
    
    -- Conversion metrics
    COUNT(DISTINCT e.lead_id) AS conversions,
    
    -- Pipeline metrics (from revenue events)
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.lead_id END) AS opportunities,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END) AS deals_won,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.lead_id END) AS revenue_confirmed,
    
    -- Revenue metrics
    SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) AS total_deal_value,
    SUM(CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.revenue_amount ELSE 0 END) AS total_confirmed_revenue,
    
    -- Conversion rates
    ROUND(
        COUNT(DISTINCT CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.lead_id END)::numeric / 
        NULLIF(COUNT(DISTINCT e.lead_id), 0) * 100,
        2
    ) AS lead_to_opportunity_pct,
    
    ROUND(
        COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END)::numeric / 
        NULLIF(COUNT(DISTINCT CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.lead_id END), 0) * 100,
        2
    ) AS opportunity_to_deal_pct,
    
    -- Average deal value
    ROUND(
        SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) / 
        NULLIF(COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END), 0),
        2
    ) AS avg_deal_value

FROM public.wm_event_log e
LEFT JOIN public.wm_revenue_events r ON e.lead_id = r.lead_id
WHERE e.event_name = 'lead_submission_success'
GROUP BY DATE(e.event_time)
ORDER BY date DESC;

COMMENT ON VIEW public.v_daily_funnel_performance IS 
  'Phase 6D: Daily funnel metrics from conversion through revenue. Shows conversion rates and deal values.';

GRANT SELECT ON public.v_daily_funnel_performance TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. CAMPAIGN ROAS (Return on Ad Spend)
-- Shows revenue attribution by campaign/source/medium
-- ═══════════════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public.v_campaign_roas CASCADE;

CREATE VIEW public.v_campaign_roas
WITH (security_invoker = true)
AS
SELECT
    COALESCE(r.attr_utm_campaign, '(direct)') AS campaign,
    COALESCE(r.attr_utm_source, '(organic)') AS source,
    COALESCE(r.attr_utm_medium, '(none)') AS medium,
    
    -- Lead counts
    COUNT(DISTINCT r.lead_id) AS total_leads,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.lead_id END) AS opportunities,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END) AS deals_won,
    
    -- Revenue
    SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) AS total_revenue,
    SUM(CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.revenue_amount ELSE 0 END) AS confirmed_revenue,
    
    -- Per-lead metrics
    ROUND(
        SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) / 
        NULLIF(COUNT(DISTINCT r.lead_id), 0),
        2
    ) AS revenue_per_lead,
    
    -- Conversion rate
    ROUND(
        COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END)::numeric / 
        NULLIF(COUNT(DISTINCT r.lead_id), 0) * 100,
        2
    ) AS lead_to_deal_pct,
    
    -- Average deal size
    ROUND(
        SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) / 
        NULLIF(COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END), 0),
        2
    ) AS avg_deal_size

FROM public.wm_revenue_events r
GROUP BY 
    COALESCE(r.attr_utm_campaign, '(direct)'),
    COALESCE(r.attr_utm_source, '(organic)'),
    COALESCE(r.attr_utm_medium, '(none)')
ORDER BY total_revenue DESC;

COMMENT ON VIEW public.v_campaign_roas IS 
  'Phase 6D: Campaign-level ROAS metrics. Shows revenue per lead and conversion rates by campaign.';

GRANT SELECT ON public.v_campaign_roas TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. LEAD LTV (Lifetime Value)
-- Shows individual lead value and journey metrics
-- ═══════════════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public.v_lead_ltv CASCADE;

CREATE VIEW public.v_lead_ltv
WITH (security_invoker = true)
AS
SELECT
    e.lead_id,
    r.external_id,
    
    -- Acquisition info
    r.attr_source_tool AS acquisition_tool,
    r.attr_utm_campaign AS acquisition_campaign,
    r.attr_utm_source AS acquisition_source,
    
    -- Timeline
    MIN(e.event_time) AS conversion_date,
    MAX(CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.event_time END) AS opportunity_date,
    MAX(CASE WHEN r.revenue_stage = 'deal_won' THEN r.event_time END) AS deal_date,
    MAX(CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.event_time END) AS revenue_date,
    
    -- Revenue values
    MAX(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount END) AS deal_value,
    MAX(CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.revenue_amount END) AS confirmed_revenue,
    
    -- Deal info
    MAX(r.deal_id) AS deal_id,
    MAX(r.deal_name) AS deal_name,
    
    -- Scoring at conversion
    MAX(r.attr_lead_score) AS lead_score,
    MAX(r.attr_intent_tier) AS intent_tier,
    
    -- Velocity metrics
    EXTRACT(DAY FROM 
        MAX(CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.event_time END) - 
        MIN(e.event_time)
    ) AS days_to_opportunity,
    
    EXTRACT(DAY FROM 
        MAX(CASE WHEN r.revenue_stage = 'deal_won' THEN r.event_time END) - 
        MIN(e.event_time)
    ) AS days_to_close,
    
    -- Current stage
    CASE
        WHEN MAX(CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN 1 END) = 1 THEN 'revenue_confirmed'
        WHEN MAX(CASE WHEN r.revenue_stage = 'deal_won' THEN 1 END) = 1 THEN 'deal_won'
        WHEN MAX(CASE WHEN r.revenue_stage = 'opportunity_created' THEN 1 END) = 1 THEN 'opportunity_created'
        ELSE 'converted'
    END AS current_stage

FROM public.wm_event_log e
LEFT JOIN public.wm_revenue_events r ON e.lead_id = r.lead_id
WHERE e.event_name = 'lead_submission_success'
GROUP BY e.lead_id, r.external_id, r.attr_source_tool, r.attr_utm_campaign, r.attr_utm_source;

COMMENT ON VIEW public.v_lead_ltv IS 
  'Phase 6D: Individual lead lifetime value with journey timeline and velocity metrics.';

GRANT SELECT ON public.v_lead_ltv TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. SOURCE PROFITABILITY
-- Shows revenue performance by acquisition tool/source
-- ═══════════════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public.v_source_profitability CASCADE;

CREATE VIEW public.v_source_profitability
WITH (security_invoker = true)
AS
SELECT
    COALESCE(r.attr_source_tool, '(unknown)') AS source_tool,
    
    -- Volume metrics
    COUNT(DISTINCT r.lead_id) AS total_leads,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.lead_id END) AS opportunities,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END) AS deals_won,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.lead_id END) AS revenue_confirmed,
    
    -- Revenue metrics
    SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) AS total_deal_value,
    SUM(CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.revenue_amount ELSE 0 END) AS total_confirmed_revenue,
    
    -- Conversion rates
    ROUND(
        COUNT(DISTINCT CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.lead_id END)::numeric / 
        NULLIF(COUNT(DISTINCT r.lead_id), 0) * 100,
        2
    ) AS lead_to_opportunity_pct,
    
    ROUND(
        COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END)::numeric / 
        NULLIF(COUNT(DISTINCT r.lead_id), 0) * 100,
        2
    ) AS lead_to_deal_pct,
    
    -- Per-lead metrics
    ROUND(
        SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) / 
        NULLIF(COUNT(DISTINCT r.lead_id), 0),
        2
    ) AS avg_revenue_per_lead,
    
    -- Average deal size
    ROUND(
        SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) / 
        NULLIF(COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END), 0),
        2
    ) AS avg_deal_size,
    
    -- Average lead score
    ROUND(AVG(r.attr_lead_score), 1) AS avg_lead_score

FROM public.wm_revenue_events r
GROUP BY COALESCE(r.attr_source_tool, '(unknown)')
ORDER BY total_deal_value DESC;

COMMENT ON VIEW public.v_source_profitability IS 
  'Phase 6D: Source/tool profitability analysis. Shows which acquisition sources generate the most revenue.';

GRANT SELECT ON public.v_source_profitability TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. REVENUE PIPELINE
-- Shows current pipeline status and expected revenue
-- ═══════════════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public.v_revenue_pipeline CASCADE;

CREATE VIEW public.v_revenue_pipeline
WITH (security_invoker = true)
AS
SELECT
    r.revenue_stage,
    COUNT(DISTINCT r.lead_id) AS lead_count,
    SUM(r.revenue_amount) AS total_value,
    ROUND(AVG(r.revenue_amount), 2) AS avg_value,
    MIN(r.event_time) AS earliest_event,
    MAX(r.event_time) AS latest_event,
    
    -- By source breakdown
    ARRAY_AGG(DISTINCT r.attr_source_tool) FILTER (WHERE r.attr_source_tool IS NOT NULL) AS source_tools,
    ARRAY_AGG(DISTINCT r.attr_utm_campaign) FILTER (WHERE r.attr_utm_campaign IS NOT NULL) AS campaigns

FROM public.wm_revenue_events r
GROUP BY r.revenue_stage
ORDER BY 
    CASE r.revenue_stage
        WHEN 'opportunity_created' THEN 1
        WHEN 'deal_won' THEN 2
        WHEN 'revenue_confirmed' THEN 3
    END;

COMMENT ON VIEW public.v_revenue_pipeline IS 
  'Phase 6D: Current revenue pipeline status by stage. Shows total value and lead counts per stage.';

GRANT SELECT ON public.v_revenue_pipeline TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 6. WEEKLY COHORT ANALYSIS
-- Shows conversion cohort performance over time
-- ═══════════════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public.v_weekly_cohort_analysis CASCADE;

CREATE VIEW public.v_weekly_cohort_analysis
WITH (security_invoker = true)
AS
SELECT
    DATE_TRUNC('week', e.event_time)::date AS cohort_week,
    
    -- Cohort size
    COUNT(DISTINCT e.lead_id) AS cohort_size,
    
    -- Progression
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.lead_id END) AS opportunities,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END) AS deals_won,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.lead_id END) AS revenue_confirmed,
    
    -- Revenue
    SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) AS total_revenue,
    
    -- Cohort conversion rate
    ROUND(
        COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END)::numeric / 
        NULLIF(COUNT(DISTINCT e.lead_id), 0) * 100,
        2
    ) AS cohort_conversion_pct,
    
    -- Revenue per lead in cohort
    ROUND(
        SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) / 
        NULLIF(COUNT(DISTINCT e.lead_id), 0),
        2
    ) AS revenue_per_cohort_lead

FROM public.wm_event_log e
LEFT JOIN public.wm_revenue_events r ON e.lead_id = r.lead_id
WHERE e.event_name = 'lead_submission_success'
GROUP BY DATE_TRUNC('week', e.event_time)::date
ORDER BY cohort_week DESC;

COMMENT ON VIEW public.v_weekly_cohort_analysis IS 
  'Phase 6D: Weekly cohort analysis showing conversion progression and revenue per cohort.';

GRANT SELECT ON public.v_weekly_cohort_analysis TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (run after migration)
-- ═══════════════════════════════════════════════════════════════════════════

-- List all Phase 6D views:
-- SELECT table_name FROM information_schema.views 
-- WHERE table_schema = 'public' 
-- AND table_name IN (
--     'v_daily_funnel_performance',
--     'v_campaign_roas',
--     'v_lead_ltv',
--     'v_source_profitability',
--     'v_revenue_pipeline',
--     'v_weekly_cohort_analysis'
-- );
