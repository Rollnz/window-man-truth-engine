-- ═══════════════════════════════════════════════════════════════════════════
-- RPC: Atomic Claim Pending Calls
-- Uses FOR UPDATE SKIP LOCKED for safe concurrent claiming
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_claim_pending_calls(batch_size integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  call_request_id uuid,
  lead_id uuid,
  source_tool text,
  phone_e164 text,
  agent_id uuid,
  first_message text,
  payload jsonb,
  attempt_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    SELECT pc.id
    FROM public.pending_calls pc
    WHERE pc.status = 'pending'
      AND pc.scheduled_for <= now()
      AND pc.next_attempt_at <= now()
    ORDER BY pc.scheduled_for ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.pending_calls pc
  SET 
    status = 'processing',
    updated_at = now()
  FROM claimed c
  WHERE pc.id = c.id
  RETURNING 
    pc.id,
    pc.call_request_id,
    pc.lead_id,
    pc.source_tool,
    pc.phone_e164,
    pc.agent_id,
    pc.first_message,
    pc.payload,
    pc.attempt_count;
END;
$$;

-- Revoke public access, only service role can execute
REVOKE ALL ON FUNCTION public.rpc_claim_pending_calls(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rpc_claim_pending_calls(integer) FROM anon;
REVOKE ALL ON FUNCTION public.rpc_claim_pending_calls(integer) FROM authenticated;

COMMENT ON FUNCTION public.rpc_claim_pending_calls IS 
'Atomically claims pending calls for dispatch using FOR UPDATE SKIP LOCKED. Only callable by service role.';