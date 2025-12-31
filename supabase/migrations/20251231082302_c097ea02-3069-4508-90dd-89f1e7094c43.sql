-- SECURITY FIX: Remove overly permissive RLS policies on leads table
-- The save-lead edge function uses service role key which bypasses RLS
DROP POLICY IF EXISTS "Allow select on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow update on leads" ON public.leads;

-- Keep the anonymous INSERT policy (needed for lead capture)
-- Keep "Users can view their own leads by user_id" policy (correct)

-- SECURITY FIX: Add explicit deny policies on consultations for clarity
-- Currently relies on implicit deny, but explicit is safer
CREATE POLICY "Deny public select on consultations" ON public.consultations
  FOR SELECT USING (false);

CREATE POLICY "Deny public update on consultations" ON public.consultations
  FOR UPDATE USING (false);

CREATE POLICY "Deny public delete on consultations" ON public.consultations
  FOR DELETE USING (false);

-- SECURITY FIX: Remove permissive storage policies for claim-documents bucket
-- All access will go through the upload-document edge function with service role
DROP POLICY IF EXISTS "Allow read access to own claim documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to claim-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow update access to own claim documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete access to own claim documents" ON storage.objects;

-- Create rate_limits table for AI chat rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON public.rate_limits(identifier, endpoint, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup ON public.rate_limits(created_at);

-- Enable RLS on rate_limits (service role only access)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Cleanup function for old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;