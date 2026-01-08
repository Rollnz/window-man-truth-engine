-- Migration: Add server-side fallback attribution columns to leads table
-- Purpose: Enable attribution tracking when client-side JavaScript is blocked or disabled
-- Context: Edge Function save-lead attempts to insert these columns but they don't exist
-- Date: 2026-01-08

-- Add fallback attribution columns for server-side tracking
-- These columns capture attribution data parsed from the HTTP Referer header
-- when client-side tracking is unavailable (ad blockers, privacy tools, JS disabled)

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS fallback_referer TEXT,
ADD COLUMN IF NOT EXISTS fallback_utm_source TEXT,
ADD COLUMN IF NOT EXISTS fallback_utm_medium TEXT,
ADD COLUMN IF NOT EXISTS fallback_utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS fallback_utm_term TEXT,
ADD COLUMN IF NOT EXISTS fallback_utm_content TEXT,
ADD COLUMN IF NOT EXISTS fallback_gclid TEXT,
ADD COLUMN IF NOT EXISTS fallback_msclkid TEXT,
ADD COLUMN IF NOT EXISTS fallback_fbc TEXT,
ADD COLUMN IF NOT EXISTS fallback_fbp TEXT;

-- Add partial indexes for analytics queries
-- These indexes only store rows where fallback values exist (not NULL)
-- This optimizes queries measuring attribution coverage gaps

CREATE INDEX IF NOT EXISTS idx_leads_fallback_utm_source
  ON public.leads(fallback_utm_source)
  WHERE fallback_utm_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_fallback_referer
  ON public.leads(fallback_referer)
  WHERE fallback_referer IS NOT NULL;

-- Optional: Add index for measuring overall fallback usage
CREATE INDEX IF NOT EXISTS idx_leads_has_fallback_data
  ON public.leads(created_at)
  WHERE fallback_referer IS NOT NULL;

-- Comment on columns for documentation
COMMENT ON COLUMN public.leads.fallback_referer IS
  'HTTP Referer header captured server-side when lead is created';

COMMENT ON COLUMN public.leads.fallback_utm_source IS
  'UTM source parsed from referer when client-side attribution unavailable';

COMMENT ON COLUMN public.leads.fallback_gclid IS
  'Google Click ID parsed from referer when client-side attribution unavailable';

COMMENT ON COLUMN public.leads.fallback_fbc IS
  'Facebook Click ID (fbclid) parsed from referer when client-side attribution unavailable';
