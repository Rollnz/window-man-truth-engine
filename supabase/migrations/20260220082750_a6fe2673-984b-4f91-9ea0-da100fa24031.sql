
-- Step 1: Add ai_pre_analysis column to quote_files (strict NOT NULL)
ALTER TABLE public.quote_files 
ADD COLUMN IF NOT EXISTS ai_pre_analysis JSONB NOT NULL DEFAULT '{"status":"none"}'::jsonb;

-- Step 2: Performance index for "latest analyzed file per lead"
CREATE INDEX IF NOT EXISTS quote_files_lead_id_created_at_idx 
ON public.quote_files(lead_id, created_at DESC);

-- Step 3: Atomic claim RPC for race-condition-safe job claiming
CREATE OR REPLACE FUNCTION public.claim_quote_file_preanalysis(p_quote_file_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.quote_files
  SET ai_pre_analysis = jsonb_set(
        jsonb_set(ai_pre_analysis, '{status}', '"pending"', true),
        '{started_at}', to_jsonb(now()::text), true
      )
  WHERE id = p_quote_file_id
    AND (ai_pre_analysis->>'status') IN ('none','failed')
  RETURNING id;
$$;
