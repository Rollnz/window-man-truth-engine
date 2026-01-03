-- Enable pgcrypto for gen_random_uuid if not already present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- wm_sessions: anonymous/known session tracker
CREATE TABLE IF NOT EXISTS public.wm_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  entry_point text,
  device_type text,
  user_agent text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  gclid text,
  fbclid text,
  msclkid text,
  ip_hash text,
  geo_zip text,
  lead_id uuid
);

-- wm_events: append-only event stream
CREATE TABLE IF NOT EXISTS public.wm_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  session_id uuid NOT NULL REFERENCES public.wm_sessions(id) ON DELETE CASCADE,
  lead_id uuid,
  event_name text NOT NULL,
  event_source text DEFAULT 'server',
  page_path text,
  tool_name text,
  params jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- wm_quotes: logical quote/case container
CREATE TABLE IF NOT EXISTS public.wm_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  session_id uuid NOT NULL REFERENCES public.wm_sessions(id) ON DELETE CASCADE,
  lead_id uuid,
  status text DEFAULT 'open',
  source text,
  vendor_name text,
  total_price numeric,
  window_count integer,
  confidence_score integer,
  flags_count integer DEFAULT 0
);

-- wm_files: uploaded and derived artifacts
CREATE TABLE IF NOT EXISTS public.wm_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  session_id uuid NOT NULL REFERENCES public.wm_sessions(id) ON DELETE CASCADE,
  lead_id uuid,
  quote_id uuid REFERENCES public.wm_quotes(id),
  kind text NOT NULL, -- quote_upload|ocr_text|analysis_json|quote_autopsy_pdf|other
  storage_bucket text DEFAULT 'quotes',
  storage_path text NOT NULL,
  file_name text,
  mime_type text,
  size_bytes bigint,
  sha256 text,
  derived_from_file_id uuid REFERENCES public.wm_files(id),
  meta jsonb DEFAULT '{}'::jsonb
);

-- Indexes for wm_sessions
CREATE INDEX IF NOT EXISTS idx_wm_sessions_last_seen ON public.wm_sessions (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_wm_sessions_lead_id ON public.wm_sessions (lead_id);

-- Indexes for wm_events
CREATE INDEX IF NOT EXISTS idx_wm_events_session_created ON public.wm_events (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wm_events_lead_created ON public.wm_events (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wm_events_name_created ON public.wm_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wm_events_params_gin ON public.wm_events USING GIN (params);

-- Indexes for wm_quotes
CREATE INDEX IF NOT EXISTS idx_wm_quotes_session_created ON public.wm_quotes (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wm_quotes_lead_created ON public.wm_quotes (lead_id, created_at DESC);

-- Indexes for wm_files
CREATE UNIQUE INDEX IF NOT EXISTS idx_wm_files_unique_storage_path ON public.wm_files (storage_bucket, storage_path);
CREATE INDEX IF NOT EXISTS idx_wm_files_lead_kind_created ON public.wm_files (lead_id, kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wm_files_quote_kind_created ON public.wm_files (quote_id, kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wm_files_meta_gin ON public.wm_files USING GIN (meta);
