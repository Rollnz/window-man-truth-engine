ALTER TABLE public.leads
ADD COLUMN ai_pre_analysis JSONB DEFAULT '{"status": "none"}'::jsonb;