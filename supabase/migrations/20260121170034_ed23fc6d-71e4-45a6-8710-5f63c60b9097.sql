-- =============================================================
-- Fix TEXT->UUID mismatch: Add original_client_id, cleanup triggers
-- =============================================================

-- A) Schema: Add new TEXT column for client identifiers
ALTER TABLE public.wm_leads 
ADD COLUMN IF NOT EXISTS original_client_id TEXT NULL;

-- A) Index on original_client_id for lookups
CREATE INDEX IF NOT EXISTS idx_wm_leads_original_client_id 
ON public.wm_leads (original_client_id) 
WHERE original_client_id IS NOT NULL;

-- B) Trigger cleanup: Drop duplicate trigger, keep on_new_lead_sync_to_crm
DROP TRIGGER IF EXISTS on_lead_created_sync_to_crm ON public.leads;

-- C) Update function: handle_new_lead_to_crm
CREATE OR REPLACE FUNCTION public.handle_new_lead_to_crm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_quality TEXT;
  v_engagement_score INT;
  v_client_id_is_uuid BOOLEAN;
  v_session_exists BOOLEAN;
  v_original_session_id UUID;
BEGIN
  -- Determine lead_quality from engagement score (lead_score_total)
  v_engagement_score := COALESCE(NEW.lead_score_total, 0);
  
  IF v_engagement_score >= 45 THEN
    v_lead_quality := 'hot';
  ELSIF v_engagement_score >= 25 THEN
    v_lead_quality := 'warm';
  ELSE
    v_lead_quality := 'cold';
  END IF;

  -- Check if client_id is valid UUID format
  v_client_id_is_uuid := FALSE;
  v_original_session_id := NULL;
  
  IF NEW.client_id IS NOT NULL AND NEW.client_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    v_client_id_is_uuid := TRUE;
    
    -- Only set original_session_id if session actually exists
    SELECT EXISTS(
      SELECT 1 FROM public.wm_sessions WHERE id = NEW.client_id::uuid
    ) INTO v_session_exists;
    
    IF v_session_exists THEN
      v_original_session_id := NEW.client_id::uuid;
    END IF;
  END IF;

  -- Upsert into wm_leads
  INSERT INTO public.wm_leads (
    lead_id,
    email,
    first_name,
    phone,
    original_client_id,
    original_session_id,
    original_source_tool,
    engagement_score,
    lead_quality,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    gclid,
    fbclid,
    landing_page,
    last_non_direct_utm_source,
    last_non_direct_utm_medium,
    last_non_direct_gclid,
    last_non_direct_fbclid,
    last_non_direct_channel,
    last_non_direct_landing_page,
    captured_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.name,
    NEW.phone,
    NEW.client_id,
    v_original_session_id,
    NEW.source_tool,
    v_engagement_score,
    v_lead_quality,
    NEW.utm_source,
    NEW.utm_medium,
    NEW.utm_campaign,
    NEW.utm_content,
    NEW.utm_term,
    NEW.gclid,
    NEW.fbc,
    NEW.source_page,
    NEW.last_non_direct_utm_source,
    NEW.last_non_direct_utm_medium,
    NEW.last_non_direct_gclid,
    NEW.last_non_direct_fbclid,
    NEW.last_non_direct_channel,
    NEW.last_non_direct_landing_page,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    lead_id = COALESCE(wm_leads.lead_id, EXCLUDED.lead_id),
    first_name = COALESCE(EXCLUDED.first_name, wm_leads.first_name),
    phone = COALESCE(EXCLUDED.phone, wm_leads.phone),
    original_client_id = COALESCE(EXCLUDED.original_client_id, wm_leads.original_client_id),
    original_session_id = COALESCE(EXCLUDED.original_session_id, wm_leads.original_session_id),
    original_source_tool = COALESCE(wm_leads.original_source_tool, EXCLUDED.original_source_tool),
    engagement_score = GREATEST(wm_leads.engagement_score, EXCLUDED.engagement_score),
    lead_quality = CASE
      WHEN GREATEST(wm_leads.engagement_score, EXCLUDED.engagement_score) >= 45 THEN 'hot'
      WHEN GREATEST(wm_leads.engagement_score, EXCLUDED.engagement_score) >= 25 THEN 'warm'
      ELSE 'cold'
    END,
    utm_source = COALESCE(EXCLUDED.utm_source, wm_leads.utm_source),
    utm_medium = COALESCE(EXCLUDED.utm_medium, wm_leads.utm_medium),
    utm_campaign = COALESCE(EXCLUDED.utm_campaign, wm_leads.utm_campaign),
    utm_content = COALESCE(EXCLUDED.utm_content, wm_leads.utm_content),
    utm_term = COALESCE(EXCLUDED.utm_term, wm_leads.utm_term),
    gclid = COALESCE(EXCLUDED.gclid, wm_leads.gclid),
    fbclid = COALESCE(EXCLUDED.fbclid, wm_leads.fbclid),
    landing_page = COALESCE(wm_leads.landing_page, EXCLUDED.landing_page),
    last_non_direct_utm_source = COALESCE(EXCLUDED.last_non_direct_utm_source, wm_leads.last_non_direct_utm_source),
    last_non_direct_utm_medium = COALESCE(EXCLUDED.last_non_direct_utm_medium, wm_leads.last_non_direct_utm_medium),
    last_non_direct_gclid = COALESCE(EXCLUDED.last_non_direct_gclid, wm_leads.last_non_direct_gclid),
    last_non_direct_fbclid = COALESCE(EXCLUDED.last_non_direct_fbclid, wm_leads.last_non_direct_fbclid),
    last_non_direct_channel = COALESCE(EXCLUDED.last_non_direct_channel, wm_leads.last_non_direct_channel),
    last_non_direct_landing_page = COALESCE(EXCLUDED.last_non_direct_landing_page, wm_leads.last_non_direct_landing_page),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Ensure the remaining trigger exists
DROP TRIGGER IF EXISTS on_new_lead_sync_to_crm ON public.leads;
CREATE TRIGGER on_new_lead_sync_to_crm
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_lead_to_crm();