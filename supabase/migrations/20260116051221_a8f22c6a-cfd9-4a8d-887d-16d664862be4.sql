-- Create app_role enum for CRM roles
CREATE TYPE public.lead_status AS ENUM (
  'new',
  'qualifying',
  'mql',
  'appointment_set',
  'sat',
  'closed_won',
  'closed_lost',
  'dead'
);

-- Create the CRM Leads Warehouse Table
CREATE TABLE public.wm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Link to original lead capture
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  
  -- Contact Info (denormalized for CRM display)
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Attribution (The Golden Thread)
  original_session_id UUID REFERENCES public.wm_sessions(id) ON DELETE SET NULL,
  original_source_tool TEXT,
  
  -- Lead Scoring
  engagement_score INTEGER DEFAULT 0,
  lead_quality TEXT DEFAULT 'cold' CHECK (lead_quality IN ('cold', 'warm', 'hot', 'qualified')),
  
  -- The Disposition (CRM Logic)
  status lead_status DEFAULT 'new' NOT NULL,
  
  -- Sales Metadata
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  estimated_deal_value NUMERIC DEFAULT 0,
  actual_deal_value NUMERIC,
  closed_at TIMESTAMP WITH TIME ZONE,
  assigned_to TEXT,
  
  -- Unique constraint on email
  CONSTRAINT wm_leads_email_unique UNIQUE (email)
);

-- Enable RLS
ALTER TABLE public.wm_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin access only (via edge function with service role)
CREATE POLICY "Deny public select on wm_leads"
ON public.wm_leads FOR SELECT
USING (false);

CREATE POLICY "Deny public insert on wm_leads"
ON public.wm_leads FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny public update on wm_leads"
ON public.wm_leads FOR UPDATE
USING (false);

CREATE POLICY "Deny public delete on wm_leads"
ON public.wm_leads FOR DELETE
USING (false);

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_wm_leads_updated_at
BEFORE UPDATE ON public.wm_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create wm_leads entry when a lead is captured
CREATE OR REPLACE FUNCTION public.handle_new_lead_to_crm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into wm_leads if email doesn't already exist
  INSERT INTO public.wm_leads (
    lead_id,
    email,
    first_name,
    phone,
    original_source_tool,
    engagement_score,
    lead_quality
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.name, ''),
    NEW.phone,
    NEW.source_tool,
    0,
    'cold'
  )
  ON CONFLICT (email) DO UPDATE SET
    lead_id = COALESCE(wm_leads.lead_id, NEW.id),
    first_name = COALESCE(NULLIF(NEW.name, ''), wm_leads.first_name),
    phone = COALESCE(NEW.phone, wm_leads.phone),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_lead_created_sync_to_crm
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_lead_to_crm();

-- Enable realtime for wm_leads
ALTER PUBLICATION supabase_realtime ADD TABLE public.wm_leads;

-- Create index for performance
CREATE INDEX idx_wm_leads_status ON public.wm_leads(status);
CREATE INDEX idx_wm_leads_created_at ON public.wm_leads(created_at DESC);
CREATE INDEX idx_wm_leads_lead_quality ON public.wm_leads(lead_quality);