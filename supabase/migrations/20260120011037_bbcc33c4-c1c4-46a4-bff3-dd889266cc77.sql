-- Phase 1B: Add Last Non-Direct Attribution columns
-- These preserve paid attribution even when users return via direct visits

ALTER TABLE public.wm_leads
ADD COLUMN IF NOT EXISTS last_non_direct_utm_source text,
ADD COLUMN IF NOT EXISTS last_non_direct_utm_medium text,
ADD COLUMN IF NOT EXISTS last_non_direct_gclid text,
ADD COLUMN IF NOT EXISTS last_non_direct_fbclid text,
ADD COLUMN IF NOT EXISTS last_non_direct_channel text,
ADD COLUMN IF NOT EXISTS last_non_direct_landing_page text;

-- Index for quick attribution lookups
CREATE INDEX IF NOT EXISTS idx_wm_leads_last_non_direct_gclid 
ON public.wm_leads (last_non_direct_gclid) 
WHERE last_non_direct_gclid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wm_leads_last_non_direct_fbclid 
ON public.wm_leads (last_non_direct_fbclid) 
WHERE last_non_direct_fbclid IS NOT NULL;

COMMENT ON COLUMN public.wm_leads.last_non_direct_channel IS 'Channel type: google_ads, meta_ads, organic_social, organic_search, email, referral';