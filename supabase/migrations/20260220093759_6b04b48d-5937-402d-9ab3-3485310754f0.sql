-- Phase 0A: Add file_kind discriminator for future vault images
ALTER TABLE public.quote_files
ADD COLUMN IF NOT EXISTS file_kind text NOT NULL DEFAULT 'quote';

-- Phase 0B: Expression index for AI status filtering
CREATE INDEX IF NOT EXISTS quote_files_lead_id_ai_status_idx
ON public.quote_files(lead_id, ((ai_pre_analysis->>'status')))
WHERE deleted_at IS NULL;

-- Phase 0C: Create batch RPC function for quote indicators
CREATE OR REPLACE FUNCTION public.get_quote_indicators(p_lead_ids uuid[])
RETURNS TABLE(
  lead_id uuid,
  has_quote_file boolean,
  has_analyzed_quote boolean,
  latest_quote_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH scoped AS (
    SELECT qf.lead_id, qf.ai_pre_analysis, qf.created_at
    FROM public.quote_files qf
    WHERE qf.lead_id = ANY(p_lead_ids)
      AND qf.deleted_at IS NULL
      AND qf.file_kind = 'quote'
  ),
  latest AS (
    SELECT DISTINCT ON (s.lead_id)
      s.lead_id,
      COALESCE(s.ai_pre_analysis->>'status', 'none') AS latest_quote_status
    FROM scoped s
    ORDER BY s.lead_id, s.created_at DESC
  ),
  agg AS (
    SELECT
      s.lead_id,
      TRUE AS has_quote_file,
      BOOL_OR(COALESCE(s.ai_pre_analysis->>'status','none') = 'completed') AS has_analyzed_quote
    FROM scoped s
    GROUP BY s.lead_id
  )
  SELECT
    agg.lead_id,
    agg.has_quote_file,
    agg.has_analyzed_quote,
    latest.latest_quote_status
  FROM agg
  LEFT JOIN latest USING (lead_id);
$$;