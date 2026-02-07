-- Improved backfill that uses wm_sessions.lead_id linkage (not just original_session_id)
CREATE OR REPLACE FUNCTION public.backfill_all_lead_scores(p_lookback_days integer DEFAULT NULL::integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_time TIMESTAMPTZ := clock_timestamp();
  v_leads_updated INTEGER := 0;
  v_leads_processed INTEGER := 0;
  v_cutoff_date TIMESTAMPTZ;
  v_error_message TEXT;
BEGIN
  IF p_lookback_days IS NOT NULL THEN
    v_cutoff_date := NOW() - (p_lookback_days || ' days')::INTERVAL;
  END IF;

  -- Calculate scores using BOTH linkage paths:
  -- 1. wm_leads.original_session_id → wm_events.session_id
  -- 2. wm_sessions.lead_id → wm_leads.lead_id → wm_events via session
  WITH session_scores AS (
    SELECT 
      e.session_id,
      SUM(public.get_event_score(e.event_name, e.event_category))::INTEGER AS total_score
    FROM public.wm_events e
    WHERE (v_cutoff_date IS NULL OR e.created_at >= v_cutoff_date)
    GROUP BY e.session_id
  ),
  -- Path 1: Direct via original_session_id
  direct_scores AS (
    SELECT 
      wl.id AS lead_id,
      COALESCE(ss.total_score, 0) AS score
    FROM public.wm_leads wl
    JOIN session_scores ss ON wl.original_session_id = ss.session_id
    WHERE wl.original_session_id IS NOT NULL
  ),
  -- Path 2: Via wm_sessions.lead_id linkage
  session_link_scores AS (
    SELECT 
      wl.id AS lead_id,
      SUM(COALESCE(ss.total_score, 0)) AS score
    FROM public.wm_leads wl
    JOIN public.wm_sessions ws ON ws.lead_id = wl.lead_id
    JOIN session_scores ss ON ss.session_id = ws.id
    WHERE wl.lead_id IS NOT NULL
    GROUP BY wl.id
  ),
  -- Combine both paths, taking max score per lead
  combined_scores AS (
    SELECT lead_id, MAX(score) as new_score
    FROM (
      SELECT lead_id, score FROM direct_scores
      UNION ALL
      SELECT lead_id, score FROM session_link_scores
    ) combined
    GROUP BY lead_id
  ),
  -- Final updates
  lead_updates AS (
    SELECT 
      cs.lead_id,
      cs.new_score::INTEGER,
      public.get_lead_quality(cs.new_score::INTEGER) AS new_quality
    FROM combined_scores cs
  )
  UPDATE public.wm_leads wl
  SET 
    engagement_score = lu.new_score,
    lead_quality = lu.new_quality,
    updated_at = NOW()
  FROM lead_updates lu
  WHERE wl.id = lu.lead_id
    AND (wl.engagement_score IS DISTINCT FROM lu.new_score 
         OR wl.lead_quality IS DISTINCT FROM lu.new_quality);

  GET DIAGNOSTICS v_leads_updated = ROW_COUNT;

  SELECT COUNT(*) INTO v_leads_processed
  FROM public.wm_leads
  WHERE (v_cutoff_date IS NULL OR created_at >= v_cutoff_date);

  RETURN jsonb_build_object(
    'status', 'success',
    'leads_processed', v_leads_processed,
    'leads_updated', v_leads_updated,
    'lookback_days', COALESCE(p_lookback_days, 0),
    'execution_time_ms', EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER,
    'executed_at', NOW()
  );

EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
  RETURN jsonb_build_object(
    'status', 'error',
    'error_message', v_error_message,
    'leads_processed', 0,
    'leads_updated', 0,
    'execution_time_ms', EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER,
    'executed_at', NOW()
  );
END;
$$;

-- Run the improved backfill
SELECT public.backfill_all_lead_scores();