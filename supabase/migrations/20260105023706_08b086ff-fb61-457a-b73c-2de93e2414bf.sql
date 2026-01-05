-- Create wm_sessions table for tracking user sessions
CREATE TABLE public.wm_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id TEXT NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  user_agent TEXT,
  ip_hash TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  landing_page TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_wm_sessions_anonymous_id ON public.wm_sessions(anonymous_id);
CREATE INDEX idx_wm_sessions_lead_id ON public.wm_sessions(lead_id);
CREATE INDEX idx_wm_sessions_created_at ON public.wm_sessions(created_at);

-- Enable RLS
ALTER TABLE public.wm_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for session creation)
CREATE POLICY "Allow anonymous insert on wm_sessions"
ON public.wm_sessions
FOR INSERT
WITH CHECK (true);

-- Deny public select (protect session data)
CREATE POLICY "Deny public select on wm_sessions"
ON public.wm_sessions
FOR SELECT
USING (false);

-- Deny public update
CREATE POLICY "Deny public update on wm_sessions"
ON public.wm_sessions
FOR UPDATE
USING (false);

-- Deny public delete
CREATE POLICY "Deny public delete on wm_sessions"
ON public.wm_sessions
FOR DELETE
USING (false);

-- Create wm_events table for tracking user events
CREATE TABLE public.wm_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.wm_sessions(id) ON DELETE CASCADE NOT NULL,
  event_name TEXT NOT NULL,
  event_category TEXT,
  event_data JSONB,
  page_path TEXT,
  page_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_wm_events_session_id ON public.wm_events(session_id);
CREATE INDEX idx_wm_events_event_name ON public.wm_events(event_name);
CREATE INDEX idx_wm_events_created_at ON public.wm_events(created_at);
CREATE INDEX idx_wm_events_event_category ON public.wm_events(event_category);

-- Enable RLS
ALTER TABLE public.wm_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for event logging)
CREATE POLICY "Allow anonymous insert on wm_events"
ON public.wm_events
FOR INSERT
WITH CHECK (true);

-- Deny public select (protect event data)
CREATE POLICY "Deny public select on wm_events"
ON public.wm_events
FOR SELECT
USING (false);

-- Deny public update
CREATE POLICY "Deny public update on wm_events"
ON public.wm_events
FOR UPDATE
USING (false);

-- Deny public delete
CREATE POLICY "Deny public delete on wm_events"
ON public.wm_events
FOR DELETE
USING (false);

-- Add trigger to update wm_sessions.updated_at
CREATE TRIGGER update_wm_sessions_updated_at
BEFORE UPDATE ON public.wm_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();