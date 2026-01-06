-- Add attribution columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS utm_medium text,
ADD COLUMN IF NOT EXISTS utm_campaign text,
ADD COLUMN IF NOT EXISTS utm_term text,
ADD COLUMN IF NOT EXISTS utm_content text;

-- Add click ID columns
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS fbc text,
ADD COLUMN IF NOT EXISTS fbp text,
ADD COLUMN IF NOT EXISTS gclid text,
ADD COLUMN IF NOT EXISTS msclkid text;

-- Add AI context columns
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS source_form text,
ADD COLUMN IF NOT EXISTS specific_detail text,
ADD COLUMN IF NOT EXISTS emotional_state text,
ADD COLUMN IF NOT EXISTS urgency_level text,
ADD COLUMN IF NOT EXISTS insurance_carrier text,
ADD COLUMN IF NOT EXISTS window_count integer;

-- Add index on common attribution fields for analytics queries
CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON public.leads(utm_source);
CREATE INDEX IF NOT EXISTS idx_leads_gclid ON public.leads(gclid);
CREATE INDEX IF NOT EXISTS idx_leads_source_tool ON public.leads(source_tool);