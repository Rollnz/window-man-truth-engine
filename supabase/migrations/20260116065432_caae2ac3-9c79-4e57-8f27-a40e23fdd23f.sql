-- =============================================
-- QUOTE FILES TABLE - Infrastructure for Beat Your Quote
-- =============================================

-- Create the quote_files table for storing uploaded quote metadata
CREATE TABLE public.quote_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Session-based anonymous linking (primary key for anonymous users)
  session_id TEXT NOT NULL,
  
  -- Optional link to lead (populated after lead capture)
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  
  -- File metadata
  file_path TEXT NOT NULL,               -- Storage path: quotes/{session_id}/{filename}
  file_name TEXT NOT NULL,               -- Original sanitized filename
  file_size BIGINT NOT NULL,             -- File size in bytes
  mime_type TEXT NOT NULL,               -- application/pdf, image/jpeg, image/png
  
  -- Attribution tracking
  source_page TEXT DEFAULT 'beat-your-quote',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Soft delete support
  deleted_at TIMESTAMPTZ
);

-- Index for fast session lookups
CREATE INDEX idx_quote_files_session_id ON public.quote_files(session_id);

-- Index for lead association queries
CREATE INDEX idx_quote_files_lead_id ON public.quote_files(lead_id) WHERE lead_id IS NOT NULL;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.quote_files ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert (so they can upload before signing up)
CREATE POLICY "Allow anonymous insert on quote_files"
ON public.quote_files
FOR INSERT
WITH CHECK (true);

-- Deny public select (only accessible via service_role in Edge Functions)
CREATE POLICY "Deny public select on quote_files"
ON public.quote_files
FOR SELECT
USING (false);

-- Deny public update
CREATE POLICY "Deny public update on quote_files"
ON public.quote_files
FOR UPDATE
USING (false);

-- Deny public delete
CREATE POLICY "Deny public delete on quote_files"
ON public.quote_files
FOR DELETE
USING (false);

-- =============================================
-- STORAGE BUCKET - quotes
-- =============================================

-- Create private storage bucket for quote uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quotes',
  'quotes',
  false,
  10485760,  -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
);

-- =============================================
-- STORAGE POLICIES
-- =============================================

-- Allow Edge Functions (using service_role) full access
CREATE POLICY "Service role full access to quotes bucket"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'quotes')
WITH CHECK (bucket_id = 'quotes');

-- Allow anonymous uploads via Edge Function (authenticated context)
CREATE POLICY "Allow authenticated upload to quotes bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'quotes');