-- =====================================================
-- Truth Engine Scoring Ledger v2
-- Append-only, deduplicated, anti-cheat backend scoring
-- =====================================================

-- 1) Add scoring columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_score integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS high_intent_reached_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS qualified_reached_at timestamptz DEFAULT NULL;

-- 2) Create the append-only scoring ledger table
CREATE TABLE IF NOT EXISTS public.wte_score_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_id text,
  event_type text NOT NULL,
  source_entity_type text NOT NULL,
  source_entity_id text NOT NULL,
  points integer NOT NULL CHECK (points > 0),
  event_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- At least one identity must be present
  CONSTRAINT at_least_one_identity CHECK (
    user_id IS NOT NULL OR anon_id IS NOT NULL
  )
);

-- 3) Unique constraint on event_id for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS uix_wte_score_events_event_id 
ON public.wte_score_events(event_id);

-- 4) Performance indexes
CREATE INDEX IF NOT EXISTS idx_wte_score_events_user_id 
ON public.wte_score_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wte_score_events_anon_id 
ON public.wte_score_events(anon_id, created_at DESC) WHERE anon_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wte_score_events_event_type 
ON public.wte_score_events(event_type);

-- 5) Enable RLS
ALTER TABLE public.wte_score_events ENABLE ROW LEVEL SECURITY;

-- 6) RLS Policies - Server-mediated only (no direct client access)
-- Deny all anonymous access
CREATE POLICY "deny_anon_all" ON public.wte_score_events
  FOR ALL TO anon USING (false) WITH CHECK (false);

-- Authenticated users can only SELECT their own rows (for debugging/display)
CREATE POLICY "users_select_own" ON public.wte_score_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- No direct INSERT/UPDATE/DELETE for authenticated users (must go through Edge Function)
CREATE POLICY "deny_auth_insert" ON public.wte_score_events
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "deny_auth_update" ON public.wte_score_events
  FOR UPDATE TO authenticated USING (false);

CREATE POLICY "deny_auth_delete" ON public.wte_score_events
  FOR DELETE TO authenticated USING (false);

-- 7) Immutability trigger (prevent updates/deletes)
CREATE OR REPLACE FUNCTION public.reject_update_delete_on_score_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RAISE EXCEPTION 'wte_score_events is append-only. UPDATE and DELETE are forbidden.';
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_immutable_score_events ON public.wte_score_events;
CREATE TRIGGER trg_immutable_score_events
  BEFORE UPDATE OR DELETE ON public.wte_score_events
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_update_delete_on_score_events();

-- 8) Helper function: score_to_level (deterministic level mapping)
CREATE OR REPLACE FUNCTION public.score_to_level(score integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN score >= 150 THEN 'Qualified'
    WHEN score >= 100 THEN 'High Intent'
    WHEN score >= 50 THEN 'Warming Up'
    ELSE 'Just Starting'
  END;
$$;

-- 9) Helper function: get_score_points (server-side point mapping)
-- This is the ONLY place where event_type -> points mapping exists
CREATE OR REPLACE FUNCTION public.get_score_points(p_event_type text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_event_type
    WHEN 'QUOTE_UPLOADED' THEN 50
    WHEN 'LEAD_CAPTURED' THEN 100
    ELSE NULL  -- Unknown event types get NULL (will be rejected)
  END;
$$;