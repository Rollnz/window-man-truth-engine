CREATE OR REPLACE FUNCTION public.claim_quote_file_preanalysis(p_quote_file_id uuid)
RETURNS uuid
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.quote_files
  SET ai_pre_analysis = jsonb_set(
        jsonb_set(ai_pre_analysis, '{status}', '"pending"', true),
        '{started_at}', to_jsonb(now()::text), true
      )
  WHERE id = p_quote_file_id
    AND (ai_pre_analysis->>'status') IN ('none', 'failed', 'pending')
  RETURNING id;
$$;