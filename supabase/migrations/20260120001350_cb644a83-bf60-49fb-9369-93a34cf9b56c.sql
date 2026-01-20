-- Add 'qualified' value to lead_status enum (between 'mql' and 'appointment_set')
-- Note: PostgreSQL 14+ allows IF NOT EXISTS for enum values
DO $$ 
BEGIN
  -- Check if 'qualified' already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'qualified' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'lead_status')
  ) THEN
    ALTER TYPE lead_status ADD VALUE 'qualified' AFTER 'mql';
  END IF;
END $$;

-- Add utm_source column to wm_leads for UTM fallback attribution badges
ALTER TABLE public.wm_leads 
ADD COLUMN IF NOT EXISTS utm_source text;

-- Backfill existing leads with utm_source from the leads table first_touch column
-- This allows the CRM to display attribution badges even when click IDs are blocked
UPDATE public.wm_leads wl
SET utm_source = l.utm_source
FROM public.leads l
WHERE wl.lead_id = l.id 
  AND wl.utm_source IS NULL 
  AND l.utm_source IS NOT NULL;

-- Update the handle_new_lead_to_crm trigger function to include utm_source
-- This ensures new leads get the utm_source copied automatically
CREATE OR REPLACE FUNCTION public.handle_new_lead_to_crm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    gclid,
    fbclid,
    utm_source
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    NEW.name,
    NEW.client_id,
    NEW.source_tool,
    COALESCE(NEW.lead_score_total, 0),
    CASE 
      WHEN COALESCE(NEW.lead_score_total, 0) >= 45 THEN 'hot'::lead_quality
      WHEN COALESCE(NEW.lead_score_total, 0) >= 25 THEN 'warm'::lead_quality
      ELSE 'cold'::lead_quality
    END,
    'new'::lead_status,
    COALESCE(NEW.window_count, 0) * 500,
    NEW.gclid,
    NEW.fbc,
    NEW.utm_source
  )
  ON CONFLICT (email) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, wm_leads.phone),
    first_name = COALESCE(EXCLUDED.first_name, wm_leads.first_name),
    engagement_score = GREATEST(EXCLUDED.engagement_score, wm_leads.engagement_score),
    estimated_deal_value = GREATEST(EXCLUDED.estimated_deal_value, wm_leads.estimated_deal_value),
    updated_at = now(),
    gclid = COALESCE(EXCLUDED.gclid, wm_leads.gclid),
    fbclid = COALESCE(EXCLUDED.fbclid, wm_leads.fbclid),
    utm_source = COALESCE(EXCLUDED.utm_source, wm_leads.utm_source);
  
  RETURN NEW;
END;
$$;