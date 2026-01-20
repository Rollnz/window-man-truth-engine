-- Phase 1: Server Authority for Primary Conversion
-- Add server-truth flags and timestamps to wm_leads

-- 1. Add qualified_cv_fired boolean (prevents cv_qualified_lead from ever double-firing)
ALTER TABLE public.wm_leads
ADD COLUMN IF NOT EXISTS qualified_cv_fired boolean DEFAULT false;

-- 2. Add captured_at timestamp (immutable once set)
ALTER TABLE public.wm_leads
ADD COLUMN IF NOT EXISTS captured_at timestamptz;

-- 3. Add qualified_at timestamp (immutable once set)
ALTER TABLE public.wm_leads
ADD COLUMN IF NOT EXISTS qualified_at timestamptz;

-- 4. Add disqualified_at timestamp for terminal state tracking
ALTER TABLE public.wm_leads
ADD COLUMN IF NOT EXISTS disqualified_at timestamptz;

-- 5. Add disqualification_reason enum for granular tracking
-- Using text instead of enum for flexibility
ALTER TABLE public.wm_leads
ADD COLUMN IF NOT EXISTS disqualification_reason text;

-- 6. Add constraint for valid disqualification reasons
ALTER TABLE public.wm_leads
ADD CONSTRAINT valid_disqualification_reason 
CHECK (disqualification_reason IS NULL OR disqualification_reason IN (
  'outside_service_area',
  'non_window_inquiry', 
  'duplicate',
  'price_shopper',
  'spam'
));

-- Create index on qualified_cv_fired for fast lookups
CREATE INDEX IF NOT EXISTS idx_wm_leads_qualified_cv_fired 
ON public.wm_leads(qualified_cv_fired) WHERE qualified_cv_fired = false;