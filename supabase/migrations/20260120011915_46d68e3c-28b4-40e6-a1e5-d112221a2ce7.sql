-- Add last_non_direct columns to leads table to capture from save-lead edge function
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS last_non_direct_utm_source text,
ADD COLUMN IF NOT EXISTS last_non_direct_utm_medium text,
ADD COLUMN IF NOT EXISTS last_non_direct_gclid text,
ADD COLUMN IF NOT EXISTS last_non_direct_fbclid text,
ADD COLUMN IF NOT EXISTS last_non_direct_channel text,
ADD COLUMN IF NOT EXISTS last_non_direct_landing_page text;

-- Add indexes for click ID lookups (attribution reporting)
CREATE INDEX IF NOT EXISTS idx_leads_last_non_direct_gclid 
ON public.leads(last_non_direct_gclid) WHERE last_non_direct_gclid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_last_non_direct_fbclid 
ON public.leads(last_non_direct_fbclid) WHERE last_non_direct_fbclid IS NOT NULL;

-- Update the handle_new_lead_to_crm trigger to sync last_non_direct attribution
CREATE OR REPLACE FUNCTION public.handle_new_lead_to_crm()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into wm_leads (CRM warehouse) when a new lead is created
  INSERT INTO public.wm_leads (
    lead_id,
    email,
    phone,
    first_name,
    original_session_id,
    original_source_tool,
    engagement_score,
    lead_quality,
    status,
    estimated_deal_value,
    captured_at,
    -- First-touch / Last-touch attribution
    gclid,
    fbclid,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    -- Last non-direct attribution (Phase 1B)
    last_non_direct_utm_source,
    last_non_direct_utm_medium,
    last_non_direct_gclid,
    last_non_direct_fbclid,
    last_non_direct_channel,
    last_non_direct_landing_page
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    NEW.name,
    NEW.client_id,
    NEW.source_tool,
    COALESCE(NEW.lead_score_total, 0),
    CASE 
      WHEN COALESCE(NEW.lead_score_total, 0) >= 45 THEN 'hot'
      WHEN COALESCE(NEW.lead_score_total, 0) >= 25 THEN 'warm'
      ELSE 'cold'
    END,
    'new'::lead_status,
    COALESCE(NEW.window_count, 0) * 500,
    now(),
    -- First-touch / Last-touch
    NEW.gclid,
    NEW.fbc,
    NEW.utm_source,
    NEW.utm_medium,
    NEW.utm_campaign,
    NEW.utm_content,
    NEW.utm_term,
    -- Last non-direct (preserved paid attribution)
    NEW.last_non_direct_utm_source,
    NEW.last_non_direct_utm_medium,
    NEW.last_non_direct_gclid,
    NEW.last_non_direct_fbclid,
    NEW.last_non_direct_channel,
    NEW.last_non_direct_landing_page
  )
  ON CONFLICT (email) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, wm_leads.phone),
    first_name = COALESCE(EXCLUDED.first_name, wm_leads.first_name),
    engagement_score = GREATEST(EXCLUDED.engagement_score, wm_leads.engagement_score),
    estimated_deal_value = GREATEST(EXCLUDED.estimated_deal_value, wm_leads.estimated_deal_value),
    updated_at = now(),
    -- Update first-touch/last-touch (COALESCE preserves existing)
    gclid = COALESCE(wm_leads.gclid, EXCLUDED.gclid),
    fbclid = COALESCE(wm_leads.fbclid, EXCLUDED.fbclid),
    utm_source = COALESCE(wm_leads.utm_source, EXCLUDED.utm_source),
    utm_medium = COALESCE(wm_leads.utm_medium, EXCLUDED.utm_medium),
    utm_campaign = COALESCE(wm_leads.utm_campaign, EXCLUDED.utm_campaign),
    utm_content = COALESCE(wm_leads.utm_content, EXCLUDED.utm_content),
    utm_term = COALESCE(wm_leads.utm_term, EXCLUDED.utm_term),
    -- CRITICAL: Last non-direct uses EXCLUDED (newer) when present, preserving paid attribution
    last_non_direct_utm_source = COALESCE(EXCLUDED.last_non_direct_utm_source, wm_leads.last_non_direct_utm_source),
    last_non_direct_utm_medium = COALESCE(EXCLUDED.last_non_direct_utm_medium, wm_leads.last_non_direct_utm_medium),
    last_non_direct_gclid = COALESCE(EXCLUDED.last_non_direct_gclid, wm_leads.last_non_direct_gclid),
    last_non_direct_fbclid = COALESCE(EXCLUDED.last_non_direct_fbclid, wm_leads.last_non_direct_fbclid),
    last_non_direct_channel = COALESCE(EXCLUDED.last_non_direct_channel, wm_leads.last_non_direct_channel),
    last_non_direct_landing_page = COALESCE(EXCLUDED.last_non_direct_landing_page, wm_leads.last_non_direct_landing_page);
  
  RETURN NEW;
END;
$function$;