-- Create leads table for capturing user emails and session data
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  source_tool TEXT NOT NULL DEFAULT 'expert-system',
  session_data JSONB,
  chat_history JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on email for quick lookups
CREATE INDEX idx_leads_email ON public.leads(email);

-- CRITICAL: Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Allow anonymous inserts (prevents 401 errors)
CREATE POLICY "Allow anonymous insert on leads" ON public.leads
  FOR INSERT WITH CHECK (true);

-- Allow select for upsert logic (service role will bypass anyway)
CREATE POLICY "Allow select on leads" ON public.leads
  FOR SELECT USING (true);

-- Allow update for upsert pattern
CREATE POLICY "Allow update on leads" ON public.leads
  FOR UPDATE USING (true);

-- Create consultations table
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_time TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on lead_id for quick lookups
CREATE INDEX idx_consultations_lead_id ON public.consultations(lead_id);

-- CRITICAL: Enable RLS
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Allow anonymous inserts
CREATE POLICY "Allow anonymous insert on consultations" ON public.consultations
  FOR INSERT WITH CHECK (true);