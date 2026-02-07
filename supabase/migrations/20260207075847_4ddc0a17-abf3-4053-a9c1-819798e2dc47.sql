-- Create tracking_health_alerts table for storing system health alerts
CREATE TABLE public.tracking_health_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('emq_critical', 'failed_events_critical', 'error_rate_critical')),
  severity TEXT NOT NULL DEFAULT 'critical' CHECK (severity IN ('warning', 'critical')),
  message TEXT NOT NULL,
  metric_value NUMERIC,
  threshold NUMERIC,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for recent alerts
CREATE INDEX idx_health_alerts_created ON public.tracking_health_alerts(created_at DESC);

-- Index for unresolved alerts
CREATE INDEX idx_health_alerts_unresolved ON public.tracking_health_alerts(alert_type) 
  WHERE resolved_at IS NULL;

-- Enable RLS
ALTER TABLE public.tracking_health_alerts ENABLE ROW LEVEL SECURITY;

-- Admin read access policy
CREATE POLICY "Admin read access" ON public.tracking_health_alerts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin insert access policy
CREATE POLICY "Admin insert access" ON public.tracking_health_alerts
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin update access policy (for resolving alerts)
CREATE POLICY "Admin update access" ON public.tracking_health_alerts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add comment
COMMENT ON TABLE public.tracking_health_alerts IS 'Stores health alerts when tracking metrics breach thresholds';