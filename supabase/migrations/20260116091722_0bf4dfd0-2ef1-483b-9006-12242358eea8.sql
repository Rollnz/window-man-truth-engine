-- Create lead_notes table for internal team notes
CREATE TABLE public.lead_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.wm_leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  admin_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_lead_notes_lead_id ON public.lead_notes(lead_id);
CREATE INDEX idx_lead_notes_created_at ON public.lead_notes(created_at DESC);

-- Add verified_social_url to wm_leads for storing confirmed social profiles
ALTER TABLE public.wm_leads 
ADD COLUMN IF NOT EXISTS verified_social_url TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS facebook_page_name TEXT,
ADD COLUMN IF NOT EXISTS facebook_ad_id TEXT;

-- Enable RLS on lead_notes
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_notes (admin-only access via edge functions)
CREATE POLICY "Deny public select on lead_notes"
  ON public.lead_notes FOR SELECT
  USING (false);

CREATE POLICY "Deny public insert on lead_notes"
  ON public.lead_notes FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny public update on lead_notes"
  ON public.lead_notes FOR UPDATE
  USING (false);

CREATE POLICY "Deny public delete on lead_notes"
  ON public.lead_notes FOR DELETE
  USING (false);

-- Update timestamp trigger for lead_notes
CREATE TRIGGER update_lead_notes_updated_at
  BEFORE UPDATE ON public.lead_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();