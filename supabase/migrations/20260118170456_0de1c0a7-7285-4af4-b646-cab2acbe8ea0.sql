-- Create job_heartbeats table for monitoring cron job health
CREATE TABLE public.job_heartbeats (
  job_name TEXT PRIMARY KEY,
  last_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_summary JSONB
);

-- Enable RLS
ALTER TABLE public.job_heartbeats ENABLE ROW LEVEL SECURITY;

-- Admin read policy
CREATE POLICY "Admins can read job heartbeats"
  ON public.job_heartbeats
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role can insert/update (for edge functions)
CREATE POLICY "Service role can manage heartbeats"
  ON public.job_heartbeats
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create RPC for retrying dead-lettered calls (admin only)
CREATE OR REPLACE FUNCTION public.rpc_retry_dead_letter(p_call_request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  -- Check admin role
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: admin role required');
  END IF;

  -- Reset the dead-lettered call
  UPDATE public.pending_calls
  SET 
    status = 'pending',
    attempt_count = 0,
    next_attempt_at = now(),
    last_error = NULL,
    updated_at = now()
  WHERE call_request_id = p_call_request_id
    AND status = 'dead_letter';

  GET DIAGNOSTICS v_affected = ROW_COUNT;

  IF v_affected = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Call not found or not in dead_letter status');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Call reset for retry');
END;
$$;

-- Grant execute to authenticated users (function checks role internally)
GRANT EXECUTE ON FUNCTION public.rpc_retry_dead_letter(UUID) TO authenticated;