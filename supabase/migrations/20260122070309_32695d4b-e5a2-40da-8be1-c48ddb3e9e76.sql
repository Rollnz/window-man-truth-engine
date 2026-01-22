-- Create function to cleanup test data older than 7 days
CREATE OR REPLACE FUNCTION public.cleanup_test_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_start_time TIMESTAMPTZ := clock_timestamp();
  v_cutoff_date TIMESTAMPTZ := NOW() - INTERVAL '7 days';
  v_consultations_deleted INTEGER := 0;
  v_deals_deleted INTEGER := 0;
  v_leads_deleted INTEGER := 0;
  v_wm_leads_deleted INTEGER := 0;
BEGIN
  -- Delete consultations with test emails first (FK safe)
  DELETE FROM public.consultations
  WHERE (email LIKE '%test%' OR email LIKE '%example%' OR email LIKE '%@test.com')
    AND created_at < v_cutoff_date;
  GET DIAGNOSTICS v_consultations_deleted = ROW_COUNT;

  -- Delete deals linked to test wm_leads
  DELETE FROM public.deals
  WHERE wm_lead_id IN (
    SELECT id FROM public.wm_leads 
    WHERE (email LIKE '%test%' OR email LIKE '%example%' OR email LIKE '%@test.com')
      AND created_at < v_cutoff_date
  );
  GET DIAGNOSTICS v_deals_deleted = ROW_COUNT;

  -- Delete leads with test emails
  DELETE FROM public.leads
  WHERE (email LIKE '%test%' OR email LIKE '%example%' OR email LIKE '%@test.com')
    AND created_at < v_cutoff_date;
  GET DIAGNOSTICS v_leads_deleted = ROW_COUNT;

  -- Delete wm_leads with test emails
  DELETE FROM public.wm_leads
  WHERE (email LIKE '%test%' OR email LIKE '%example%' OR email LIKE '%@test.com')
    AND created_at < v_cutoff_date;
  GET DIAGNOSTICS v_wm_leads_deleted = ROW_COUNT;

  -- Update heartbeat
  INSERT INTO public.job_heartbeats (job_name, last_run_at, last_summary)
  VALUES (
    'cleanup_test_data',
    now(),
    jsonb_build_object(
      'consultations_deleted', v_consultations_deleted,
      'deals_deleted', v_deals_deleted,
      'leads_deleted', v_leads_deleted,
      'wm_leads_deleted', v_wm_leads_deleted,
      'cutoff_date', v_cutoff_date,
      'execution_time_ms', EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER
    )
  )
  ON CONFLICT (job_name) DO UPDATE SET
    last_run_at = EXCLUDED.last_run_at,
    last_summary = EXCLUDED.last_summary;

  RETURN jsonb_build_object(
    'status', 'success',
    'consultations_deleted', v_consultations_deleted,
    'deals_deleted', v_deals_deleted,
    'leads_deleted', v_leads_deleted,
    'wm_leads_deleted', v_wm_leads_deleted,
    'cutoff_date', v_cutoff_date,
    'execution_time_ms', EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER,
    'executed_at', now()
  );
END;
$$;