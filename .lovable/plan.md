
# Database Trigger: Auto-Dispatch Call on Lead Insert

## Overview
Create a PL/pgSQL trigger that automatically schedules a phone call whenever a new lead with a phone number is inserted into the `leads` table. This ensures 100% coverage without relying on frontend code.

## Migration Details

### Function: `fn_auto_dispatch_call()`

The function will:

1. **Guard Clause**: Exit early if `NEW.phone IS NULL`
2. **Deduplication Check**: Query `pending_calls` for existing `lead_id`
3. **Agent Lookup**: Find enabled `call_agents` row matching `NEW.source_tool`
4. **Phone Normalization**: Convert to E.164 format (US-centric: 10 digits → +1XXX)
5. **Phone Hash**: SHA-256 hash for idempotency constraint
6. **Template Interpolation**: Replace `{first_name}` in message template
7. **Insert**: Create `pending_calls` row with 2-minute delay
8. **Observability**: `RAISE LOG` at each step for debugging

### Trigger: `tr_auto_dispatch_call`

- **Event**: `AFTER INSERT ON leads`
- **For Each**: `ROW`
- **Condition**: `WHEN (NEW.phone IS NOT NULL)`

---

## SQL Migration

```sql
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
```

---

## Log Output Examples

You'll see these in your Supabase Database Logs:

| Scenario | Log Message |
|----------|-------------|
| Start | `[AutoDispatch] Checking lead [abc-123] source_tool=[quote-scanner] phone=[****5678]` |
| Already exists | `[AutoDispatch] Skipping: Call already exists for lead [abc-123] pending_call_id=[def-456]` |
| No agent | `[AutoDispatch] Skipping: No enabled call_agent for source_tool=[unknown-tool] lead=[abc-123]` |
| Success | `[AutoDispatch] Success: Auto-scheduled call for lead [abc-123] phone=[****5678] scheduled_for=[2026-02-03 14:02:00]` |
| Race condition | `[AutoDispatch] Skipping: Duplicate constraint hit for lead [abc-123] (concurrent insert)` |
| Error | `[AutoDispatch] ERROR for lead [abc-123]: <error message> <error code>` |

---

## Technical Notes

### Phone Normalization Logic
Mirrors the edge function:
- Strips non-digits (except leading `+`)
- 10 digits → `+1XXXXXXXXXX` (US)
- 11 digits starting with `1` → `+1XXXXXXXXXX`
- Already has `+` → keep as-is

### Payload Fields
The `payload` JSONB includes:
- `email` - for reference
- `first_name` - extracted name
- `auto_dispatched: true` - marks this as trigger-created (vs app-created)
- `trigger_version: v1` - for future migrations

### Safety Guarantees
1. **Non-blocking**: Errors don't fail the lead insert (caught in EXCEPTION)
2. **Idempotent**: Checks `lead_id` first, handles unique constraint race
3. **Observable**: Every code path has a `RAISE LOG`
4. **Fallback-safe**: If no `call_agent` exists, silently skips

---

## Verification Steps

After deployment:

1. **Create a test lead** with phone number
2. **Check Database Logs** for `[AutoDispatch]` messages
3. **Query pending_calls** to confirm row was created:
   ```sql
   SELECT * FROM pending_calls 
   WHERE reason = 'auto_trigger' 
   ORDER BY created_at DESC LIMIT 5;
   ```
4. **Test deduplication** by checking that frontend-triggered calls don't create duplicates
