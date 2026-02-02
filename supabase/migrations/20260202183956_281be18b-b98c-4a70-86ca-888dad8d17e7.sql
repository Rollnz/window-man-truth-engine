-- Fix handle_new_lead_to_crm trigger to check if session exists before using it
-- The issue: validated_session_id is being set even when the session doesn't exist in wm_sessions
-- This causes FK constraint violations when the lead is captured before a session record exists

CREATE OR REPLACE FUNCTION public.handle_new_lead_to_crm()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  existing_wm_lead_id uuid;
  validated_session_id uuid;
  session_exists boolean;
BEGIN
  -- Check if wm_lead already exists for this email
  SELECT id INTO existing_wm_lead_id
  FROM public.wm_leads
  WHERE email = NEW.email
  LIMIT 1;

  -- Validate session ID format AND verify it exists in wm_sessions
  IF NEW.client_id IS NOT NULL AND NEW.client_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    -- Check if session actually exists before using it as FK
    SELECT EXISTS(
      SELECT 1 FROM public.wm_sessions WHERE id = NEW.client_id::uuid
    ) INTO session_exists;
    
    IF session_exists THEN
      validated_session_id := NEW.client_id::uuid;
    ELSE
      validated_session_id := NULL;
    END IF;
  ELSE
    validated_session_id := NULL;
  END IF;

  IF existing_wm_lead_id IS NOT NULL THEN
    -- Update existing wm_lead with latest data (including new EMQ fields)
    UPDATE public.wm_leads
    SET 
      first_name = COALESCE(NEW.first_name, first_name),
      last_name = COALESCE(NEW.last_name, last_name),
      phone = COALESCE(NEW.phone, phone),
      city = COALESCE(NEW.city, city),
      state = COALESCE(NEW.state, state),
      zip = COALESCE(NEW.zip, zip),
      gclid = COALESCE(NEW.gclid, gclid),
      fbclid = COALESCE(NEW.fbc, fbclid),
      utm_source = COALESCE(NEW.utm_source, utm_source),
      utm_medium = COALESCE(NEW.utm_medium, utm_medium),
      utm_campaign = COALESCE(NEW.utm_campaign, utm_campaign),
      utm_content = COALESCE(NEW.utm_content, utm_content),
      utm_term = COALESCE(NEW.utm_term, utm_term),
      last_non_direct_utm_source = COALESCE(NEW.last_non_direct_utm_source, last_non_direct_utm_source),
      last_non_direct_utm_medium = COALESCE(NEW.last_non_direct_utm_medium, last_non_direct_utm_medium),
      last_non_direct_gclid = COALESCE(NEW.last_non_direct_gclid, last_non_direct_gclid),
      last_non_direct_fbclid = COALESCE(NEW.last_non_direct_fbclid, last_non_direct_fbclid),
      last_non_direct_channel = COALESCE(NEW.last_non_direct_channel, last_non_direct_channel),
      last_non_direct_landing_page = COALESCE(NEW.last_non_direct_landing_page, last_non_direct_landing_page),
      lead_id = COALESCE(lead_id, NEW.id),
      original_client_id = COALESCE(original_client_id, NEW.client_id),
      updated_at = now()
    WHERE id = existing_wm_lead_id;
  ELSE
    -- Insert new wm_lead with EMQ fields
    INSERT INTO public.wm_leads (
      lead_id,
      email,
      first_name,
      last_name,
      phone,
      city,
      state,
      zip,
      original_source_tool,
      original_session_id,
      original_client_id,
      gclid,
      fbclid,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      last_non_direct_utm_source,
      last_non_direct_utm_medium,
      last_non_direct_gclid,
      last_non_direct_fbclid,
      last_non_direct_channel,
      last_non_direct_landing_page,
      landing_page,
      captured_at,
      status
    ) VALUES (
      NEW.id,
      NEW.email,
      NEW.first_name,
      NEW.last_name,
      NEW.phone,
      NEW.city,
      NEW.state,
      NEW.zip,
      NEW.source_tool,
      validated_session_id,
      NEW.client_id,
      NEW.gclid,
      NEW.fbc,
      NEW.utm_source,
      NEW.utm_medium,
      NEW.utm_campaign,
      NEW.utm_content,
      NEW.utm_term,
      NEW.last_non_direct_utm_source,
      NEW.last_non_direct_utm_medium,
      NEW.last_non_direct_gclid,
      NEW.last_non_direct_fbclid,
      NEW.last_non_direct_channel,
      NEW.last_non_direct_landing_page,
      NEW.source_page,
      now(),
      'new'::lead_status
    );
  END IF;

  RETURN NEW;
END;
$function$;