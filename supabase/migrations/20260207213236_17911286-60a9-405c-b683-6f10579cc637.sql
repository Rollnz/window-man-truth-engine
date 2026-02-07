-- Golden Thread Identity Consolidation Migration
-- Adds identity_version, 5 attribution columns, and fixes handle_new_lead_to_crm trigger

-- Phase 1: Add identity_version column to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS identity_version smallint DEFAULT 1;

COMMENT ON COLUMN public.leads.identity_version IS 
  '1 = legacy (mixed ID sources), 2 = Golden Thread (unified wte-anon-id)';

CREATE INDEX IF NOT EXISTS idx_leads_identity_version 
ON public.leads(identity_version);

-- Phase 2: Add 5 missing attribution columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS original_session_id uuid,
ADD COLUMN IF NOT EXISTS device_type text,
ADD COLUMN IF NOT EXISTS referrer text,
ADD COLUMN IF NOT EXISTS landing_page text,
ADD COLUMN IF NOT EXISTS ip_hash text;

-- Add indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_leads_original_session_id 
ON public.leads(original_session_id) WHERE original_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_device_type 
ON public.leads(device_type) WHERE device_type IS NOT NULL;

-- Phase 3: Add index on wm_sessions(anonymous_id) for efficient trigger lookups
CREATE INDEX IF NOT EXISTS idx_wm_sessions_anonymous_id 
ON public.wm_sessions(anonymous_id);

-- Phase 4: Fix handle_new_lead_to_crm trigger function
-- Changes session lookup from WHERE id = client_id to WHERE anonymous_id = client_id
CREATE OR REPLACE FUNCTION public.handle_new_lead_to_crm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  validated_session_id uuid;
  session_exists boolean := false;
  new_wm_lead_id uuid;
  existing_wm_lead_id uuid;
BEGIN
  -- Check if a wm_lead already exists for this email
  SELECT id INTO existing_wm_lead_id
  FROM public.wm_leads
  WHERE email = NEW.email
  LIMIT 1;

  IF existing_wm_lead_id IS NOT NULL THEN
    -- Update existing wm_lead with new data
    UPDATE public.wm_leads
    SET
      first_name = COALESCE(NEW.first_name, first_name),
      last_name = COALESCE(NEW.last_name, last_name),
      phone = COALESCE(NEW.phone, phone),
      city = COALESCE(NEW.city, city),
      state = COALESCE(NEW.state, state),
      zip = COALESCE(NEW.zip, zip),
      utm_source = COALESCE(NEW.utm_source, utm_source),
      utm_medium = COALESCE(NEW.utm_medium, utm_medium),
      utm_campaign = COALESCE(NEW.utm_campaign, utm_campaign),
      utm_content = COALESCE(NEW.utm_content, utm_content),
      utm_term = COALESCE(NEW.utm_term, utm_term),
      gclid = COALESCE(NEW.gclid, gclid),
      fbclid = COALESCE(NEW.fbc, fbclid),
      last_non_direct_utm_source = COALESCE(NEW.last_non_direct_utm_source, last_non_direct_utm_source),
      last_non_direct_utm_medium = COALESCE(NEW.last_non_direct_utm_medium, last_non_direct_utm_medium),
      last_non_direct_gclid = COALESCE(NEW.last_non_direct_gclid, last_non_direct_gclid),
      last_non_direct_fbclid = COALESCE(NEW.last_non_direct_fbclid, last_non_direct_fbclid),
      last_non_direct_channel = COALESCE(NEW.last_non_direct_channel, last_non_direct_channel),
      last_non_direct_landing_page = COALESCE(NEW.last_non_direct_landing_page, last_non_direct_landing_page),
      lead_id = NEW.id,
      updated_at = now()
    WHERE id = existing_wm_lead_id;
    
    RETURN NEW;
  END IF;

  -- GOLDEN THREAD FIX: Look up session by anonymous_id (visitor identity), not by id (session PK)
  -- This ensures client_id (Golden Thread UUID) correctly maps to session records
  IF NEW.client_id IS NOT NULL AND NEW.client_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT id INTO validated_session_id
    FROM public.wm_sessions 
    WHERE anonymous_id = NEW.client_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    session_exists := validated_session_id IS NOT NULL;
  ELSE
    validated_session_id := NULL;
    session_exists := false;
  END IF;

  -- Create new wm_lead record
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
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    gclid,
    fbclid,
    last_non_direct_utm_source,
    last_non_direct_utm_medium,
    last_non_direct_gclid,
    last_non_direct_fbclid,
    last_non_direct_channel,
    last_non_direct_landing_page,
    landing_page,
    status,
    captured_at
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
    NEW.utm_source,
    NEW.utm_medium,
    NEW.utm_campaign,
    NEW.utm_content,
    NEW.utm_term,
    NEW.gclid,
    NEW.fbc,
    NEW.last_non_direct_utm_source,
    NEW.last_non_direct_utm_medium,
    NEW.last_non_direct_gclid,
    NEW.last_non_direct_fbclid,
    NEW.last_non_direct_channel,
    NEW.last_non_direct_landing_page,
    NEW.source_page,
    'new',
    now()
  )
  RETURNING id INTO new_wm_lead_id;

  -- Link quote analyses to this lead if we have a valid session
  IF validated_session_id IS NOT NULL THEN
    UPDATE public.quote_analyses
    SET lead_id = NEW.id
    WHERE session_id = validated_session_id::text
      AND lead_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$;