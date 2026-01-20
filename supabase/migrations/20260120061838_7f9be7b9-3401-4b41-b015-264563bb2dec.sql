-- ═══════════════════════════════════════════════════════════════════════════
-- WEBHOOK RECEIPTS TABLE
-- Persistent audit log of all inbound webhooks for debugging and dead-letter analysis
-- ═══════════════════════════════════════════════════════════════════════════

-- Create correlation_status enum for type safety
CREATE TYPE public.webhook_correlation_status AS ENUM (
  'unprocessed',
  'matched',
  'unmatched', 
  'invalid',
  'duplicate',
  'processed'
);

-- Create webhook_receipts table
CREATE TABLE public.webhook_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'phonecallbot',
  received_at timestamptz NOT NULL DEFAULT now(),
  
  -- Raw data preservation (conditional based on env var)
  headers jsonb NOT NULL,
  raw_body text, -- NULL when STORE_WEBHOOK_RAW_BODY != 'true'
  raw_body_sha256 text NOT NULL, -- Always stored for integrity verification
  parsed_payload jsonb, -- Redacted version when raw_body is NULL
  
  -- Correlation identifiers
  provider_call_id text,
  call_request_id text,
  
  -- Signature verification results
  signature_valid boolean,
  signature_mode text, -- 'ENFORCE' | 'LOG_ONLY' | 'DISABLED' | 'NO_SECRET'
  signature_error text,
  
  -- Idempotency / dedupe
  idempotency_key text, -- sha256(provider_call_id + status + recording_url + duration + call_request_id)
  
  -- Correlation tracking
  correlation_status public.webhook_correlation_status NOT NULL DEFAULT 'unprocessed',
  matched_phone_call_log_id uuid,
  correlation_step text, -- 'provider_call_id' | 'call_request_id_log' | 'call_request_id_pending' | null
  
  -- Error tracking
  error_code text,
  error_message text,
  
  -- Retention
  retention_until timestamptz NOT NULL DEFAULT (now() + interval '45 days')
);

-- Comments
COMMENT ON TABLE public.webhook_receipts IS 'Persistent audit log of all inbound webhooks for debugging and dead-letter analysis';
COMMENT ON COLUMN public.webhook_receipts.signature_mode IS 'Signature verification mode: ENFORCE, LOG_ONLY, DISABLED, NO_SECRET';
COMMENT ON COLUMN public.webhook_receipts.correlation_status IS 'Outcome of correlation attempt: matched, unmatched, invalid, duplicate, processed';
COMMENT ON COLUMN public.webhook_receipts.idempotency_key IS 'SHA256 hash for deduplication: provider_call_id + status + recording_url + duration + call_request_id';
COMMENT ON COLUMN public.webhook_receipts.correlation_step IS 'Which correlation step matched: provider_call_id, call_request_id_log, call_request_id_pending';
COMMENT ON COLUMN public.webhook_receipts.retention_until IS 'Cleanup job will delete rows where retention_until < now()';

-- Indexes for query performance
CREATE INDEX idx_webhook_receipts_received_at ON public.webhook_receipts (received_at DESC);
CREATE INDEX idx_webhook_receipts_provider_call_id ON public.webhook_receipts (provider_call_id) WHERE provider_call_id IS NOT NULL;
CREATE INDEX idx_webhook_receipts_call_request_id ON public.webhook_receipts (call_request_id) WHERE call_request_id IS NOT NULL;
CREATE INDEX idx_webhook_receipts_correlation_status ON public.webhook_receipts (correlation_status);

-- Retention index: simple index on retention_until for cleanup queries (no predicate needed)
CREATE INDEX idx_webhook_receipts_retention ON public.webhook_receipts (retention_until);

-- Unique index for idempotency dedupe (prevents spam)
CREATE UNIQUE INDEX idx_webhook_receipts_idempotency ON public.webhook_receipts (idempotency_key) WHERE idempotency_key IS NOT NULL;

-- RLS: Use proven pattern from this repo (has_role exists per db-functions)
ALTER TABLE public.webhook_receipts ENABLE ROW LEVEL SECURITY;

-- Admin-only read access
CREATE POLICY "admin_read_webhook_receipts" ON public.webhook_receipts
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Deny all public modifications (service role only for inserts)
CREATE POLICY "deny_public_insert_webhook_receipts" ON public.webhook_receipts
  FOR INSERT WITH CHECK (false);

CREATE POLICY "deny_public_update_webhook_receipts" ON public.webhook_receipts
  FOR UPDATE USING (false);

CREATE POLICY "deny_public_delete_webhook_receipts" ON public.webhook_receipts
  FOR DELETE USING (false);

-- ═══════════════════════════════════════════════════════════════════════════
-- RETENTION CLEANUP FUNCTION
-- Deletes webhook_receipts older than 45 days (retention_until < now())
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.cleanup_webhook_receipts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted_count INTEGER;
  v_start_time TIMESTAMPTZ := clock_timestamp();
BEGIN
  -- Delete expired receipts
  DELETE FROM public.webhook_receipts
  WHERE retention_until < now();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Update heartbeat
  INSERT INTO public.job_heartbeats (job_name, last_run_at, last_summary)
  VALUES (
    'cleanup_webhook_receipts',
    now(),
    jsonb_build_object(
      'deleted_count', v_deleted_count,
      'execution_time_ms', EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER
    )
  )
  ON CONFLICT (job_name) DO UPDATE SET
    last_run_at = EXCLUDED.last_run_at,
    last_summary = EXCLUDED.last_summary;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'deleted_count', v_deleted_count,
    'execution_time_ms', EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER,
    'executed_at', now()
  );
END;
$$;

COMMENT ON FUNCTION public.cleanup_webhook_receipts IS 'Deletes webhook_receipts older than 45 days. Run periodically via cron or manual trigger.';