-- Migration: Create tracking_failed_events table for resurrection queue

CREATE TABLE public.tracking_failed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event identification
  event_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'conversion',
  
  -- Original payload (for replay)
  event_payload JSONB NOT NULL,
  user_data JSONB,
  
  -- Failure context
  destination TEXT NOT NULL CHECK (destination IN ('meta_capi', 'google_ec', 'gtm_server', 'supabase')),
  error_message TEXT NOT NULL,
  error_code TEXT,
  http_status INTEGER,
  
  -- Retry tracking
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ,
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'retrying', 'resolved', 'dead_letter')),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Reference to source lead/session
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  session_id UUID
);

-- Indexes for efficient queries
CREATE INDEX idx_failed_events_status ON public.tracking_failed_events(status);
CREATE INDEX idx_failed_events_destination ON public.tracking_failed_events(destination);
CREATE INDEX idx_failed_events_next_retry ON public.tracking_failed_events(next_retry_at) WHERE status = 'pending';
CREATE INDEX idx_failed_events_created ON public.tracking_failed_events(created_at DESC);

-- RLS: Admin-only access
ALTER TABLE public.tracking_failed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read access" ON public.tracking_failed_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update access" ON public.tracking_failed_events
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access" ON public.tracking_failed_events
  FOR ALL TO service_role
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_tracking_failed_events
  BEFORE UPDATE ON public.tracking_failed_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Comment
COMMENT ON TABLE public.tracking_failed_events IS 
  'Resurrection Queue: Stores failed conversion events for retry. Supports Meta CAPI, Google Enhanced Conversions, and GTM Server failures.';