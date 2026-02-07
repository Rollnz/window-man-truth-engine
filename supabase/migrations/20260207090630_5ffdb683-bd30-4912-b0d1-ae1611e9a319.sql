-- Update the lead_quality check constraint to include window_shopper
ALTER TABLE public.wm_leads DROP CONSTRAINT IF EXISTS wm_leads_lead_quality_check;
ALTER TABLE public.wm_leads ADD CONSTRAINT wm_leads_lead_quality_check 
  CHECK (lead_quality IS NULL OR lead_quality IN ('window_shopper', 'cold', 'curious', 'engaged', 'warm', 'hot', 'qualified'));

-- Now run the backfill
SELECT public.backfill_all_lead_scores();