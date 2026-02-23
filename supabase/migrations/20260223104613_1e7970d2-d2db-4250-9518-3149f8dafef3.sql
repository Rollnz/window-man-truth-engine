
-- Phase 1A: Add 10 new attribution columns to leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS meta_placement TEXT,
  ADD COLUMN IF NOT EXISTS meta_campaign_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_adset_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_ad_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_site_source_name TEXT,
  ADD COLUMN IF NOT EXISTS meta_creative_id TEXT,
  ADD COLUMN IF NOT EXISTS gbraid TEXT,
  ADD COLUMN IF NOT EXISTS wbraid TEXT,
  ADD COLUMN IF NOT EXISTS ttclid TEXT,
  ADD COLUMN IF NOT EXISTS landing_page_url TEXT;

-- Phase 1B: Add 12 new columns to wm_leads (including missing msclkid)
ALTER TABLE public.wm_leads
  ADD COLUMN IF NOT EXISTS msclkid TEXT,
  ADD COLUMN IF NOT EXISTS meta_placement TEXT,
  ADD COLUMN IF NOT EXISTS meta_campaign_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_adset_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_ad_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_site_source_name TEXT,
  ADD COLUMN IF NOT EXISTS meta_creative_id TEXT,
  ADD COLUMN IF NOT EXISTS gbraid TEXT,
  ADD COLUMN IF NOT EXISTS wbraid TEXT,
  ADD COLUMN IF NOT EXISTS ttclid TEXT,
  ADD COLUMN IF NOT EXISTS landing_page_url TEXT;

-- Phase 1C: Replace handle_new_lead_to_crm() trigger with new attribution fields
CREATE OR REPLACE FUNCTION public.handle_new_lead_to_crm()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    -- Update existing wm_lead with new data (COALESCE preserves first-touch)
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
      msclkid = COALESCE(NEW.msclkid, msclkid),
      last_non_direct_utm_source = COALESCE(NEW.last_non_direct_utm_source, last_non_direct_utm_source),
      last_non_direct_utm_medium = COALESCE(NEW.last_non_direct_utm_medium, last_non_direct_utm_medium),
      last_non_direct_gclid = COALESCE(NEW.last_non_direct_gclid, last_non_direct_gclid),
      last_non_direct_fbclid = COALESCE(NEW.last_non_direct_fbclid, last_non_direct_fbclid),
      last_non_direct_channel = COALESCE(NEW.last_non_direct_channel, last_non_direct_channel),
      last_non_direct_landing_page = COALESCE(NEW.last_non_direct_landing_page, last_non_direct_landing_page),
      -- New attribution fields (COALESCE preserves first-touch)
      meta_placement = COALESCE(NEW.meta_placement, meta_placement),
      meta_campaign_id = COALESCE(NEW.meta_campaign_id, meta_campaign_id),
      meta_adset_id = COALESCE(NEW.meta_adset_id, meta_adset_id),
      meta_ad_id = COALESCE(NEW.meta_ad_id, meta_ad_id),
      meta_site_source_name = COALESCE(NEW.meta_site_source_name, meta_site_source_name),
      meta_creative_id = COALESCE(NEW.meta_creative_id, meta_creative_id),
      gbraid = COALESCE(NEW.gbraid, gbraid),
      wbraid = COALESCE(NEW.wbraid, wbraid),
      ttclid = COALESCE(NEW.ttclid, ttclid),
      landing_page_url = COALESCE(NEW.landing_page_url, landing_page_url),
      lead_id = NEW.id,
      updated_at = now()
    WHERE id = existing_wm_lead_id;
    
    RETURN NEW;
  END IF;

  -- GOLDEN THREAD FIX: Look up session by anonymous_id (visitor identity)
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
    msclkid,
    last_non_direct_utm_source,
    last_non_direct_utm_medium,
    last_non_direct_gclid,
    last_non_direct_fbclid,
    last_non_direct_channel,
    last_non_direct_landing_page,
    landing_page,
    -- New attribution fields
    meta_placement,
    meta_campaign_id,
    meta_adset_id,
    meta_ad_id,
    meta_site_source_name,
    meta_creative_id,
    gbraid,
    wbraid,
    ttclid,
    landing_page_url,
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
    NEW.msclkid,
    NEW.last_non_direct_utm_source,
    NEW.last_non_direct_utm_medium,
    NEW.last_non_direct_gclid,
    NEW.last_non_direct_fbclid,
    NEW.last_non_direct_channel,
    NEW.last_non_direct_landing_page,
    NEW.source_page,
    -- New attribution fields
    NEW.meta_placement,
    NEW.meta_campaign_id,
    NEW.meta_adset_id,
    NEW.meta_ad_id,
    NEW.meta_site_source_name,
    NEW.meta_creative_id,
    NEW.gbraid,
    NEW.wbraid,
    NEW.ttclid,
    NEW.landing_page_url,
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
$function$;
