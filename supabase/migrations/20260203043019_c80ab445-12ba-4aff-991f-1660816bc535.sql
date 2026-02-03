-- Enable pgcrypto for SHA-256 hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function: Auto-dispatch call when lead is created
CREATE OR REPLACE FUNCTION public.fn_auto_dispatch_call()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_phone_e164 TEXT;
  v_phone_hash TEXT;
  v_first_name TEXT;
  v_first_message TEXT;
  v_agent_id UUID;
  v_agent_ext_id TEXT;
  v_message_template TEXT;
  v_scheduled_for TIMESTAMPTZ;
  v_existing_call_id UUID;
BEGIN
  -- Step 1: Log start
  RAISE LOG '[AutoDispatch] Checking lead [%] source_tool=[%] phone=[****%]',
    NEW.id, NEW.source_tool, RIGHT(NEW.phone, 4);

  -- Step 2: Check for existing pending_call (deduplication)
  SELECT id INTO v_existing_call_id
  FROM public.pending_calls
  WHERE lead_id = NEW.id
  LIMIT 1;

  IF v_existing_call_id IS NOT NULL THEN
    RAISE LOG '[AutoDispatch] Skipping: Call already exists for lead [%] pending_call_id=[%]',
      NEW.id, v_existing_call_id;
    RETURN NEW;
  END IF;

  -- Step 3: Lookup call_agents for this source_tool
  SELECT id, agent_id, first_message_template
  INTO v_agent_id, v_agent_ext_id, v_message_template
  FROM public.call_agents
  WHERE source_tool = NEW.source_tool
    AND enabled = TRUE
  LIMIT 1;

  IF v_agent_id IS NULL THEN
    RAISE LOG '[AutoDispatch] Skipping: No enabled call_agent for source_tool=[%] lead=[%]',
      NEW.source_tool, NEW.id;
    RETURN NEW;
  END IF;

  -- Step 4: Normalize phone to E.164 (US-centric)
  v_phone_e164 := REGEXP_REPLACE(NEW.phone, '[^0-9+]', '', 'g');
  
  IF v_phone_e164 NOT LIKE '+%' THEN
    IF LENGTH(v_phone_e164) = 10 THEN
      v_phone_e164 := '+1' || v_phone_e164;
    ELSIF LENGTH(v_phone_e164) = 11 AND v_phone_e164 LIKE '1%' THEN
      v_phone_e164 := '+' || v_phone_e164;
    ELSE
      v_phone_e164 := '+' || v_phone_e164;
    END IF;
  END IF;

  -- Step 5: Compute SHA-256 hash for idempotency
  v_phone_hash := encode(digest(v_phone_e164, 'sha256'), 'hex');

  -- Step 6: Extract first name and interpolate template
  v_first_name := COALESCE(
    NEW.first_name,
    SPLIT_PART(COALESCE(NEW.name, ''), ' ', 1),
    ''
  );

  IF v_first_name = '' THEN
    -- Remove {first_name} placeholder if no name available
    v_first_message := REGEXP_REPLACE(v_message_template, '\{first_name\},?\s*', '', 'gi');
    v_first_message := REGEXP_REPLACE(v_first_message, '\s+', ' ', 'g');
    v_first_message := TRIM(v_first_message);
  ELSE
    v_first_message := REPLACE(v_message_template, '{first_name}', v_first_name);
  END IF;

  -- Step 7: Schedule for 2 minutes from now
  v_scheduled_for := NOW() + INTERVAL '2 minutes';

  -- Step 8: Insert into pending_calls
  INSERT INTO public.pending_calls (
    lead_id,
    source_tool,
    phone_e164,
    phone_hash,
    agent_id,
    first_message,
    payload,
    scheduled_for,
    next_attempt_at,
    status,
    reason
  ) VALUES (
    NEW.id,
    NEW.source_tool,
    v_phone_e164,
    v_phone_hash,
    v_agent_id,
    v_first_message,
    jsonb_build_object(
      'email', NEW.email,
      'first_name', v_first_name,
      'auto_dispatched', TRUE,
      'trigger_version', 'v1'
    ),
    v_scheduled_for,
    NOW(),
    'pending',
    'auto_trigger'
  );

  RAISE LOG '[AutoDispatch] Success: Auto-scheduled call for lead [%] phone=[****%] scheduled_for=[%]',
    NEW.id, RIGHT(v_phone_e164, 4), v_scheduled_for;

  RETURN NEW;

EXCEPTION WHEN unique_violation THEN
  -- Handle race condition with unique constraint
  RAISE LOG '[AutoDispatch] Skipping: Duplicate constraint hit for lead [%] (concurrent insert)',
    NEW.id;
  RETURN NEW;
WHEN OTHERS THEN
  -- Log error but don't fail the lead insert
  RAISE LOG '[AutoDispatch] ERROR for lead [%]: % %',
    NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- Trigger: Fire after lead insert when phone is present
DROP TRIGGER IF EXISTS tr_auto_dispatch_call ON public.leads;

CREATE TRIGGER tr_auto_dispatch_call
AFTER INSERT ON public.leads
FOR EACH ROW
WHEN (NEW.phone IS NOT NULL)
EXECUTE FUNCTION public.fn_auto_dispatch_call();

-- Add comment for documentation
COMMENT ON FUNCTION public.fn_auto_dispatch_call() IS 
'Auto-dispatches phone calls for new leads with phone numbers. 
Deduplicates against existing pending_calls. Logs all steps for debugging.
Version: v1 | Created: 2026-02-03';