-- Phase 1: Add gclid and fbclid columns to wm_leads for instant visual attribution
-- These are denormalized from leads table for faster CRM card rendering

ALTER TABLE public.wm_leads 
ADD COLUMN IF NOT EXISTS gclid text,
ADD COLUMN IF NOT EXISTS fbclid text;

-- Create index for filtering ad-sourced leads
CREATE INDEX IF NOT EXISTS idx_wm_leads_gclid ON public.wm_leads(gclid) WHERE gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wm_leads_fbclid ON public.wm_leads(fbclid) WHERE fbclid IS NOT NULL;

-- Update the trigger function to copy attribution data from leads to wm_leads
CREATE OR REPLACE FUNCTION public.handle_new_lead_to_crm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wm_leads (
    lead_id,
    first_name,
    last_name,
    email,
    phone,
    original_session_id,
    original_source_tool,
    engagement_score,
    lead_quality,
    status,
    estimated_deal_value,
    gclid,
    fbclid
  )
  SELECT
    NEW.id,
    split_part(COALESCE(NEW.name, ''), ' ', 1),
    CASE 
      WHEN position(' ' in COALESCE(NEW.name, '')) > 0 
      THEN substring(COALESCE(NEW.name, '') from position(' ' in COALESCE(NEW.name, '')) + 1)
      ELSE NULL
    END,
    NEW.email,
    NEW.phone,
    (SELECT id FROM public.wm_sessions WHERE lead_id = NEW.id LIMIT 1),
    NEW.source_tool,
    COALESCE(NEW.lead_score_total, 0),
    COALESCE(
      CASE 
        WHEN COALESCE(NEW.lead_score_total, 0) >= 100 THEN 'hot'
        WHEN COALESCE(NEW.lead_score_total, 0) >= 50 THEN 'warm'
        ELSE 'cold'
      END::text,
      'cold'
    )::lead_quality,
    'new'::lead_status,
    CASE 
      WHEN NEW.window_count IS NOT NULL THEN NEW.window_count * 800
      ELSE 5000
    END,
    NEW.gclid,
    -- Extract fbclid from fbc cookie format: fb.1.timestamp.fbclid
    CASE 
      WHEN NEW.fbc IS NOT NULL THEN split_part(NEW.fbc, '.', 4)
      ELSE NULL
    END
  ON CONFLICT (email) DO UPDATE SET
    lead_id = COALESCE(wm_leads.lead_id, EXCLUDED.lead_id),
    first_name = COALESCE(EXCLUDED.first_name, wm_leads.first_name),
    last_name = COALESCE(EXCLUDED.last_name, wm_leads.last_name),
    phone = COALESCE(EXCLUDED.phone, wm_leads.phone),
    original_session_id = COALESCE(wm_leads.original_session_id, EXCLUDED.original_session_id),
    original_source_tool = COALESCE(wm_leads.original_source_tool, EXCLUDED.original_source_tool),
    engagement_score = GREATEST(wm_leads.engagement_score, EXCLUDED.engagement_score),
    updated_at = now(),
    -- Update gclid/fbclid if they weren't set before
    gclid = COALESCE(wm_leads.gclid, EXCLUDED.gclid),
    fbclid = COALESCE(wm_leads.fbclid, EXCLUDED.fbclid);
  
  RETURN NEW;
END;
$$;

-- Backfill existing leads with attribution data
UPDATE public.wm_leads wl
SET 
  gclid = l.gclid,
  fbclid = CASE 
    WHEN l.fbc IS NOT NULL THEN split_part(l.fbc, '.', 4) 
    ELSE NULL 
  END
FROM public.leads l
WHERE wl.lead_id = l.id
  AND (wl.gclid IS NULL OR wl.fbclid IS NULL)
  AND (l.gclid IS NOT NULL OR l.fbc IS NOT NULL);