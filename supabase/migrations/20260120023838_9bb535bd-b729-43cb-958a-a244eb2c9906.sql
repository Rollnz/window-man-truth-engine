-- Drop and recreate rpc_claim_pending_calls with correct return type
-- agent_id is text in pending_calls table, not uuid
DROP FUNCTION IF EXISTS public.rpc_claim_pending_calls(integer);

CREATE OR REPLACE FUNCTION public.rpc_claim_pending_calls(batch_size integer DEFAULT 10)
 RETURNS TABLE(id uuid, call_request_id uuid, lead_id uuid, source_tool text, phone_e164 text, agent_id text, first_message text, payload jsonb, attempt_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;