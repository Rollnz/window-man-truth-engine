-- Add full UTM parameter capture and landing page to wm_leads
ALTER TABLE public.wm_leads 
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS landing_page TEXT;

-- Add index for campaign-based reporting
CREATE INDEX IF NOT EXISTS idx_wm_leads_utm_campaign ON public.wm_leads(utm_campaign) WHERE utm_campaign IS NOT NULL;