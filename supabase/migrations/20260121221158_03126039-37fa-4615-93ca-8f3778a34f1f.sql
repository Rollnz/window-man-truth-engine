-- Phase 5: Attribution & Intelligence Views (Corrected)
-- Additive: creates/updates views + adds one index for funnel queries.

-- Index to support journey reconstruction (partition by client_id, order by event_time, event_id)
CREATE INDEX IF NOT EXISTS idx_wm_event_log_funnel
ON public.wm_event_log (client_id, event_time, event_id);

-- View 1: v_event_log_enriched
CREATE OR REPLACE VIEW public.v_event_log_enriched AS
SELECT
    e.id AS row_id,
    e.event_id,
    e.event_name,
    e.event_type,
    e.event_time,
    e.client_id,
    e.lead_id,
    e.session_id,
    e.source_tool,
    e.source_system,
    e.ingested_by,
    -- Prefer event-time attribution, fallback to session-time attribution
    COALESCE(e.traffic_source, s.utm_source)  AS utm_source,
    COALESCE(e.traffic_medium, s.utm_medium)  AS utm_medium,
    COALESCE(e.campaign_id,   s.utm_campaign) AS utm_campaign,
    s.utm_term,
    s.utm_content,
    s.referrer,
    s.landing_page,
    -- Paid click IDs captured at event time
    e.fbclid,
    e.gclid,
    e.fbp,
    e.fbc,
    -- Payloads
    e.metadata,
    e.user_data,
    -- Lead fields
    l.email AS lead_email
FROM public.wm_event_log e
LEFT JOIN public.wm_sessions s ON e.session_id = s.id
LEFT JOIN public.leads l ON e.lead_id = l.id;

-- View 2: v_funnel_journeys
CREATE OR REPLACE VIEW public.v_funnel_journeys AS
SELECT
    client_id,
    event_id,
    event_name,
    event_time,
    source_tool,
    LAG(event_name, 1) OVER (
        PARTITION BY client_id
        ORDER BY event_time, event_id
    ) AS previous_event,
    LEAD(event_name, 1) OVER (
        PARTITION BY client_id
        ORDER BY event_time, event_id
    ) AS next_event
FROM public.v_event_log_enriched
WHERE client_id IS NOT NULL;

-- View 3: v_attribution_first_last_touch (correct last-touch)
CREATE OR REPLACE VIEW public.v_attribution_first_last_touch AS
WITH lead_events AS (
  SELECT lead_id, event_time, source_tool
  FROM public.v_event_log_enriched
  WHERE lead_id IS NOT NULL
)
SELECT
  lead_id,
  (ARRAY_AGG(source_tool ORDER BY event_time ASC) )[1] AS first_touch_tool,
  (ARRAY_AGG(source_tool ORDER BY event_time DESC))[1] AS last_touch_tool,
  MIN(event_time) AS first_touch_time,
  MAX(event_time) AS last_touch_time
FROM lead_events
GROUP BY lead_id;

-- View 4: v_meta_optimization_segments
CREATE OR REPLACE VIEW public.v_meta_optimization_segments AS
SELECT
    lead_id,
    MAX(CASE WHEN source_tool = 'scanner' THEN 1 ELSE 0 END) AS used_scanner,
    MAX(CASE WHEN source_tool = 'voice' THEN 1 ELSE 0 END) AS used_voice,
    MAX(CASE WHEN event_name = 'booking_confirmed' THEN 1 ELSE 0 END) AS booking_confirmed
FROM public.v_event_log_enriched
WHERE lead_id IS NOT NULL
GROUP BY lead_id;