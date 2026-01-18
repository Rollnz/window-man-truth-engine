-- =====================================================
-- Lead Scoring System: lead_activities + leads extensions
-- =====================================================

-- Create lead_activities table (append-only event log for scoring)
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  lead_id uuid NULL,
  user_id uuid NULL,
  session_id text NOT NULL,
  client_id text NOT NULL,
  event_name text NOT NULL,
  score_delta int NOT NULL DEFAULT 0,
  page_path text,
  section_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes for lead_activities
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id_created 
  ON public.lead_activities (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_user_id_created 
  ON public.lead_activities (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_client_id_created 
  ON public.lead_activities (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_session_event 
  ON public.lead_activities (session_id, event_name);

-- Enable RLS on lead_activities
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- RLS policy: Allow anonymous inserts (from edge function)
CREATE POLICY "Allow anonymous insert on lead_activities"
  ON public.lead_activities
  FOR INSERT
  WITH CHECK (true);

-- RLS policy: Admin can read all
CREATE POLICY "Admin can read lead_activities"
  ON public.lead_activities
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Add new columns to leads table if they don't exist
DO $$ 
BEGIN
  -- client_id for anonymous tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'leads' 
                 AND column_name = 'client_id') THEN
    ALTER TABLE public.leads ADD COLUMN client_id text;
  END IF;
  
  -- lead_score_total
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'leads' 
                 AND column_name = 'lead_score_total') THEN
    ALTER TABLE public.leads ADD COLUMN lead_score_total int DEFAULT 0;
  END IF;
  
  -- lead_score_last_7d (rolling window)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'leads' 
                 AND column_name = 'lead_score_last_7d') THEN
    ALTER TABLE public.leads ADD COLUMN lead_score_last_7d int DEFAULT 0;
  END IF;
  
  -- last_activity_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'leads' 
                 AND column_name = 'last_activity_at') THEN
    ALTER TABLE public.leads ADD COLUMN last_activity_at timestamptz;
  END IF;
  
  -- lead_status enum
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'leads' 
                 AND column_name = 'lead_status') THEN
    ALTER TABLE public.leads ADD COLUMN lead_status text DEFAULT 'curious';
  END IF;
  
  -- first_touch (attribution snapshot)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'leads' 
                 AND column_name = 'first_touch') THEN
    ALTER TABLE public.leads ADD COLUMN first_touch jsonb;
  END IF;
  
  -- last_touch (attribution snapshot)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'leads' 
                 AND column_name = 'last_touch') THEN
    ALTER TABLE public.leads ADD COLUMN last_touch jsonb;
  END IF;
  
  -- source_page
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'leads' 
                 AND column_name = 'source_page') THEN
    ALTER TABLE public.leads ADD COLUMN source_page text;
  END IF;
  
  -- last_evidence (for hot leads)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'leads' 
                 AND column_name = 'last_evidence') THEN
    ALTER TABLE public.leads ADD COLUMN last_evidence jsonb;
  END IF;
END $$;

-- Create index on leads.client_id for lookups
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON public.leads (client_id);
CREATE INDEX IF NOT EXISTS idx_leads_lead_status ON public.leads (lead_status);