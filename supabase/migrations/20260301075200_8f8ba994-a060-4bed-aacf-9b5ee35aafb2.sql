
-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 1 Security Patch: Fix 2 (account_id column) + Fix 4 (safe cast)
-- ═══════════════════════════════════════════════════════════════════════════

-- FIX 2: Add account_id column to quote_analyses
ALTER TABLE public.quote_analyses 
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id);

-- Index for ownership lookups
CREATE INDEX IF NOT EXISTS idx_quote_analyses_account_id 
  ON public.quote_analyses(account_id);

-- Backfill ONLY rows where lead_id actually exists in accounts
UPDATE public.quote_analyses qa
  SET account_id = qa.lead_id
  FROM public.accounts a
  WHERE a.id = qa.lead_id
    AND qa.account_id IS NULL
    AND qa.lead_id IS NOT NULL;

-- RLS: Users can SELECT their own quote_analyses via account_id
CREATE POLICY "Users can read own quote_analyses"
  ON public.quote_analyses
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE supabase_user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- FIX 4: Replace trigger with safe-cast version using account_id
-- Uses pending_calls columns that actually exist in the schema
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_auto_dispatch_call_on_quote_analyzed()
RETURNS TRIGGER AS $$
DECLARE
  v_phone TEXT;
  v_verified TIMESTAMP;
  v_overall_score INT;
BEGIN
  IF NEW.analyzed_at IS NOT NULL AND NEW.analysis_json IS NOT NULL THEN
    
    -- Use account_id (with lead_id fallback for unbackfilled rows)
    SELECT phone, phone_verified_at 
    INTO v_phone, v_verified
    FROM public.accounts 
    WHERE id = COALESCE(NEW.account_id, NEW.lead_id);
    
    -- DEDUPLICATION: Prevent duplicate calls within 1 hour
    IF EXISTS (
      SELECT 1 FROM public.pending_calls
      WHERE account_id = COALESCE(NEW.account_id, NEW.lead_id)
      AND source_tool = 'quote_analysis'
      AND created_at > NOW() - INTERVAL '1 hour'
    ) THEN
      RETURN NEW;
    END IF;
    
    -- FIX 4: Safe cast for overallScore
    v_overall_score := CASE
      WHEN NEW.analysis_json->>'overallScore' ~ '^\d+$'
      THEN (NEW.analysis_json->>'overallScore')::int
      ELSE NULL
    END;
    
    -- PHONE VERIFICATION: Only call verified numbers
    IF v_phone IS NOT NULL AND v_verified IS NOT NULL THEN
      INSERT INTO public.pending_calls (
        account_id, source_tool, phone_e164, phone_hash, agent_id, 
        first_message, scheduled_for, next_attempt_at, call_request_id, payload
      )
      VALUES (
        COALESCE(NEW.account_id, NEW.lead_id),
        'quote_analysis',
        v_phone,
        md5(v_phone),
        'quote-analyzer',
        'Hi, I am calling about your quote analysis results.',
        NOW(),
        NOW(),
        gen_random_uuid()::text,
        jsonb_build_object(
          'quote_analysis_id', NEW.id,
          'overall_score', v_overall_score,
          'grade', NEW.analysis_json->>'finalGrade',
          'source', 'signup',
          'phone', v_phone,
          'is_vault_account', true
        )
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS tr_auto_dispatch_call_on_quote_analyzed ON public.quote_analyses;
CREATE TRIGGER tr_auto_dispatch_call_on_quote_analyzed
AFTER UPDATE OF analyzed_at ON public.quote_analyses
FOR EACH ROW
EXECUTE FUNCTION fn_auto_dispatch_call_on_quote_analyzed();
