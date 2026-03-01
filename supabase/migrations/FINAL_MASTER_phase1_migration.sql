-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 1: FINAL MASTER SQL MIGRATION
-- Single Source of Truth: quote-scanner outputs 'finalGrade' in analysis_json
-- This migration contains all fixes, all safeguards, all integrations.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. ADD MISSING COLUMNS TO EXISTING TABLES
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;
ALTER TABLE public.pending_calls ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE public.quote_analyses ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ;

-- 2. CREATE NEW TABLES
CREATE TABLE IF NOT EXISTS public.pending_scans (
  scan_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  file_type TEXT CHECK (file_type IN ('pdf', 'image', 'unknown')),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending_claim' 
    CHECK (status IN ('pending_claim', 'claimed', 'processing', 'analyzed', 'failed', 'expired')),
  session_id UUID,
  client_id TEXT,
  claimed_at TIMESTAMP,
  analysis_started_at TIMESTAMP,
  analysis_completed_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_scans_account_id ON public.pending_scans(account_id);

CREATE TABLE IF NOT EXISTS public.qualification_answers (
  answer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  is_homeowner BOOLEAN,
  timeline TEXT CHECK (timeline IN ('now', 'within_month', 'several_months', 'exploring')),
  window_count TEXT CHECK (window_count IN ('1-5', '6-10', '11+', 'whole_house', 'custom')),
  custom_window_count INTEGER,
  has_estimate TEXT CHECK (has_estimate IN ('yes_one', 'yes_multiple', 'no', 'not_sure')),
  raw_score INTEGER,
  final_score INTEGER,
  qualifies_for_registration_completed BOOLEAN DEFAULT false,
  event_type TEXT CHECK (event_type IN ('lead', 'registration_completed')),
  pixel_value INTEGER,
  answered_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qualification_answers_account_id ON public.qualification_answers(account_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- SUPABASE NATIVE AUTH SYNC TRIGGER
-- Syncs auth.users.phone_confirmed_at → public.accounts.phone_verified_at
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_phone_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.accounts
  SET 
    phone_verified_at = NEW.phone_confirmed_at,
    phone = NEW.phone,
    account_status = 'active'
  WHERE supabase_user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_handle_phone_confirmed ON auth.users;
CREATE TRIGGER tr_handle_phone_confirmed
AFTER UPDATE OF phone_confirmed_at ON auth.users
FOR EACH ROW
WHEN (NEW.phone_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.handle_phone_confirmed();


-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGER 2: Auto-dispatch call when quote is analyzed (FLOW A)
-- ✅ Grade read from quote-scanner's 'finalGrade' (single source of truth)
-- ✅ 1-hour deduplication check
-- ✅ Phone verification check
-- ✅ Call-dispatcher context (phone + is_vault_account)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_auto_dispatch_call_on_quote_analyzed()
RETURNS TRIGGER AS $$
DECLARE
  v_phone TEXT;
  v_verified TIMESTAMP;
BEGIN
  IF NEW.analyzed_at IS NOT NULL AND NEW.analysis_json IS NOT NULL THEN
    
    SELECT phone, phone_verified_at 
    INTO v_phone, v_verified
    FROM public.accounts 
    WHERE id = NEW.lead_id;
    
    -- ✅ DEDUPLICATION: Prevent duplicate calls within 1 hour
    IF EXISTS (
      SELECT 1 FROM public.pending_calls
      WHERE account_id = NEW.lead_id
      AND call_type = 'quote_analysis'
      AND created_at > NOW() - INTERVAL '1 hour'
    ) THEN
      RETURN NEW; -- Silently ignore duplicate
    END IF;
    
    -- ✅ PHONE VERIFICATION: Only call verified numbers
    IF v_phone IS NOT NULL AND v_verified IS NOT NULL THEN
      INSERT INTO public.pending_calls (account_id, call_type, context)
      VALUES (
        NEW.lead_id,
        'quote_analysis',
        jsonb_build_object(
          'quote_analysis_id', NEW.id,
          -- ✅ SIMPLIFIED: Grade read directly from quote-scanner's finalGrade
          'overall_score', (NEW.analysis_json->>'overallScore')::int,
          'grade', NEW.analysis_json->>'finalGrade',  -- ← Single source of truth
          'source', 'signup',
          -- ✅ CALL-DISPATCHER CONTEXT: Direct data injection
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

DROP TRIGGER IF EXISTS tr_auto_dispatch_call_on_quote_analyzed ON public.quote_analyses;
CREATE TRIGGER tr_auto_dispatch_call_on_quote_analyzed
AFTER UPDATE OF analyzed_at ON public.quote_analyses
FOR EACH ROW
EXECUTE FUNCTION fn_auto_dispatch_call_on_quote_analyzed();


-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGER 3: Auto-dispatch call when user qualifies in Flow B
-- ✅ 1-hour deduplication check
-- ✅ Phone verification check
-- ✅ Call-dispatcher context (phone + is_vault_account)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_auto_dispatch_call_on_qualification_answers()
RETURNS TRIGGER AS $$
DECLARE
  v_phone TEXT;
  v_verified TIMESTAMP;
BEGIN
  -- Only dispatch if user qualifies (score 60+)
  IF NEW.qualifies_for_registration_completed THEN
    
    SELECT phone, phone_verified_at 
    INTO v_phone, v_verified 
    FROM public.accounts 
    WHERE id = NEW.account_id;
    
    -- ✅ DEDUPLICATION: Prevent duplicate calls within 1 hour
    IF EXISTS (
      SELECT 1 FROM public.pending_calls
      WHERE account_id = NEW.account_id
      AND call_type = 'qualification_inquiry'
      AND created_at > NOW() - INTERVAL '1 hour'
    ) THEN
      RETURN NEW; -- Silently ignore duplicate
    END IF;
    
    -- ✅ PHONE VERIFICATION: Only call verified numbers
    IF v_phone IS NOT NULL AND v_verified IS NOT NULL THEN
      INSERT INTO public.pending_calls (account_id, call_type, context)
      VALUES (
        NEW.account_id,
        'qualification_inquiry',
        jsonb_build_object(
          'answer_id', NEW.answer_id,
          'final_score', NEW.final_score,
          'timeline', NEW.timeline,
          'window_count', NEW.window_count,
          'is_homeowner', NEW.is_homeowner,
          'source', 'signup',
          -- ✅ CALL-DISPATCHER CONTEXT: Direct data injection
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

DROP TRIGGER IF EXISTS tr_auto_dispatch_call_on_qualification_answers ON public.qualification_answers;
CREATE TRIGGER tr_auto_dispatch_call_on_qualification_answers
AFTER INSERT ON public.qualification_answers
FOR EACH ROW
EXECUTE FUNCTION fn_auto_dispatch_call_on_qualification_answers();


-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.pending_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.pending_scans 
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users view own pending scans" ON public.pending_scans 
  FOR SELECT USING (account_id IN (SELECT id FROM public.accounts WHERE supabase_user_id = auth.uid()));

ALTER TABLE public.qualification_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.qualification_answers 
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users view own answers" ON public.qualification_answers 
  FOR SELECT USING (account_id IN (SELECT id FROM public.accounts WHERE supabase_user_id = auth.uid()));
CREATE POLICY "Users insert own answers" ON public.qualification_answers 
  FOR INSERT WITH CHECK (account_id IN (SELECT id FROM public.accounts WHERE supabase_user_id = auth.uid()));
