-- Fix backfill function to handle bigint from SUM properly
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
  -- Calculate cutoff date if lookback specified
  IF p_lookback_days IS NOT NULL THEN
    v_cutoff_date := NOW() - (p_lookback_days || ' days')::INTERVAL;
  END IF;

  -- Set-based update: Calculate scores for all leads in a single query
  -- This CTE computes the total score per session from wm_events
  WITH session_scores AS (
    SELECT 
      e.session_id,
      SUM(public.get_event_score(e.event_name, e.event_category))::INTEGER AS total_score
    FROM public.wm_events e
    WHERE (v_cutoff_date IS NULL OR e.created_at >= v_cutoff_date)
    GROUP BY e.session_id
  ),
  -- Join to wm_leads via original_session_id
  lead_updates AS (
    SELECT 
      wl.id AS lead_id,
      COALESCE(ss.total_score, 0)::INTEGER AS new_score,
      public.get_lead_quality(COALESCE(ss.total_score, 0)::INTEGER) AS new_quality
    FROM public.wm_leads wl
    LEFT JOIN session_scores ss ON wl.original_session_id = ss.session_id
    WHERE (v_cutoff_date IS NULL OR wl.created_at >= v_cutoff_date)
  )
  -- Perform the bulk update
  UPDATE public.wm_leads wl
  SET 
    engagement_score = lu.new_score,
    lead_quality = lu.new_quality,
    updated_at = NOW()
  FROM lead_updates lu
  WHERE wl.id = lu.lead_id
    AND (wl.engagement_score IS DISTINCT FROM lu.new_score 
         OR wl.lead_quality IS DISTINCT FROM lu.new_quality);

  -- Get count of updated rows
  GET DIAGNOSTICS v_leads_updated = ROW_COUNT;

  -- Count total leads processed (for reference)
  SELECT COUNT(*) INTO v_leads_processed
  FROM public.wm_leads
  WHERE (v_cutoff_date IS NULL OR created_at >= v_cutoff_date);

  -- Return success statistics
  RETURN jsonb_build_object(
    'status', 'success',
    'leads_processed', v_leads_processed,
    'leads_updated', v_leads_updated,
    'lookback_days', COALESCE(p_lookback_days, 0),
    'scope', CASE WHEN p_lookback_days IS NULL THEN 'all_time' ELSE p_lookback_days || '_days' END,
    'execution_time_ms', EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER,
    'executed_at', NOW()
  );

EXCEPTION WHEN OTHERS THEN
  -- Capture error details
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

-- Now run the backfill
SELECT public.backfill_all_lead_scores();