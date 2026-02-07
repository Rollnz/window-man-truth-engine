-- ============================================================================
-- QUOTE ANALYSIS PERSISTENCE INFRASTRUCTURE
-- Tables, functions, triggers, and RLS policies
-- ============================================================================

-- ============================================================================
-- TABLE 1: quote_analyses
-- Stores AI Scanner results permanently for Vault access
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quote_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- File linkage (nullable - files not currently persisted)
  quote_file_id UUID REFERENCES public.quote_files(id) ON DELETE SET NULL,
  
  -- Session linkage (primary lookup for anonymous users)
  session_id TEXT NOT NULL,
  
  -- Lead linkage (populated when user signs up)
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  
  -- Deduplication key (SHA-256 hash of file bytes)
  image_hash TEXT NOT NULL,
  
  -- Indexed scores for queries
  overall_score INTEGER NOT NULL DEFAULT 0,
  safety_score INTEGER NOT NULL DEFAULT 0,
  scope_score INTEGER NOT NULL DEFAULT 0,
  price_score INTEGER NOT NULL DEFAULT 0,
  fine_print_score INTEGER NOT NULL DEFAULT 0,
  warranty_score INTEGER NOT NULL DEFAULT 0,
  
  -- Extracted data
  price_per_opening TEXT,
  warnings_count INTEGER NOT NULL DEFAULT 0,
  missing_items_count INTEGER NOT NULL DEFAULT 0,
  
  -- Full AI response (JSONB for flexibility)
  analysis_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Metadata for debugging/analytics
  ai_model_version TEXT DEFAULT 'gemini-3-flash-preview',
  processing_time_ms INTEGER,
  
  -- Constraint: unique hash prevents duplicate analyses
  CONSTRAINT uq_quote_analyses_hash UNIQUE (image_hash)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quote_analyses_session 
  ON public.quote_analyses(session_id);
  
CREATE INDEX IF NOT EXISTS idx_quote_analyses_lead 
  ON public.quote_analyses(lead_id) 
  WHERE lead_id IS NOT NULL;
  
CREATE INDEX IF NOT EXISTS idx_quote_analyses_created 
  ON public.quote_analyses(created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_quote_analyses_score 
  ON public.quote_analyses(overall_score DESC);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS set_quote_analyses_updated_at ON public.quote_analyses;
CREATE TRIGGER set_quote_analyses_updated_at
  BEFORE UPDATE ON public.quote_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.quote_analyses IS 
  'Permanent storage for AI Scanner results. Enables Vault persistence and deduplication.';
COMMENT ON COLUMN public.quote_analyses.image_hash IS 
  'SHA-256 hash of file bytes for deduplication. Same file = same hash = skip AI call.';
COMMENT ON COLUMN public.quote_analyses.session_id IS 
  'Anonymous session identifier. Used for pre-signup data access.';

-- ============================================================================
-- TABLE 2: quote_feedback
-- Quality improvement loop for AI accuracy
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quote_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Link to the analysis being reviewed
  analysis_id UUID NOT NULL REFERENCES public.quote_analyses(id) ON DELETE CASCADE,
  
  -- Who submitted (anonymous tracking)
  session_id TEXT NOT NULL,
  
  -- Feedback classification
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful', 'incorrect', 'unclear')),
  feedback_category TEXT CHECK (feedback_category IN ('score', 'warning', 'missing_item', 'summary', 'other')),
  
  -- Details
  item_text TEXT,
  correction_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for admin review
CREATE INDEX IF NOT EXISTS idx_quote_feedback_analysis 
  ON public.quote_feedback(analysis_id);
  
CREATE INDEX IF NOT EXISTS idx_quote_feedback_type 
  ON public.quote_feedback(feedback_type);

COMMENT ON TABLE public.quote_feedback IS 
  'User feedback on AI Scanner accuracy. Used to identify and fix systematic errors.';

-- ============================================================================
-- FUNCTION: link_quote_analyses_to_lead
-- Retroactively links anonymous quote analyses to a lead when user signs up
-- ============================================================================

CREATE OR REPLACE FUNCTION public.link_quote_analyses_to_lead(
  p_lead_id UUID,
  p_session_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_linked_count INTEGER := 0;
BEGIN
  -- Safety check: require both parameters
  IF p_lead_id IS NULL OR p_session_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Link any quote_analyses that match this session
  UPDATE public.quote_analyses
  SET 
    lead_id = p_lead_id,
    updated_at = now()
  WHERE session_id = p_session_id::text
    AND lead_id IS NULL;
  
  GET DIAGNOSTICS v_linked_count = ROW_COUNT;
  
  IF v_linked_count > 0 THEN
    RAISE LOG '[link_quote_analyses] SUCCESS: Linked % quote analysis record(s) to lead_id=% from session=%', 
      v_linked_count, p_lead_id, p_session_id;
  END IF;
  
  RETURN v_linked_count;
END;
$$;

COMMENT ON FUNCTION public.link_quote_analyses_to_lead IS 
  'Retroactively links anonymous quote analyses to a lead when user signs up. Called by handle_new_lead_to_crm trigger.';

-- ============================================================================
-- FUNCTION: handle_new_lead_to_crm (UPDATED WITH DEFENSIVE WRAPPER)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_lead_to_crm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_wm_lead_id uuid;
  validated_session_id uuid;
  session_exists boolean;
  v_linked_analyses INTEGER;
BEGIN
  -- Check if wm_lead already exists for this email
  SELECT id INTO existing_wm_lead_id
  FROM public.wm_leads
  WHERE email = NEW.email
  LIMIT 1;

  -- Validate session ID format AND verify it exists in wm_sessions
  IF NEW.client_id IS NOT NULL AND NEW.client_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT EXISTS(
      SELECT 1 FROM public.wm_sessions WHERE id = NEW.client_id::uuid
    ) INTO session_exists;
    
    IF session_exists THEN
      validated_session_id := NEW.client_id::uuid;
    ELSE
      validated_session_id := NULL;
    END IF;
  ELSE
    validated_session_id := NULL;
  END IF;

  IF existing_wm_lead_id IS NOT NULL THEN
    -- Update existing wm_lead with latest data
    UPDATE public.wm_leads
    SET 
      first_name = COALESCE(NEW.first_name, first_name),
      last_name = COALESCE(NEW.last_name, last_name),
      phone = COALESCE(NEW.phone, phone),
      city = COALESCE(NEW.city, city),
      state = COALESCE(NEW.state, state),
      zip = COALESCE(NEW.zip, zip),
      gclid = COALESCE(NEW.gclid, gclid),
      fbclid = COALESCE(NEW.fbc, fbclid),
      utm_source = COALESCE(NEW.utm_source, utm_source),
      utm_medium = COALESCE(NEW.utm_medium, utm_medium),
      utm_campaign = COALESCE(NEW.utm_campaign, utm_campaign),
      utm_content = COALESCE(NEW.utm_content, utm_content),
      utm_term = COALESCE(NEW.utm_term, utm_term),
      last_non_direct_utm_source = COALESCE(NEW.last_non_direct_utm_source, last_non_direct_utm_source),
      last_non_direct_utm_medium = COALESCE(NEW.last_non_direct_utm_medium, last_non_direct_utm_medium),
      last_non_direct_gclid = COALESCE(NEW.last_non_direct_gclid, last_non_direct_gclid),
      last_non_direct_fbclid = COALESCE(NEW.last_non_direct_fbclid, last_non_direct_fbclid),
      last_non_direct_channel = COALESCE(NEW.last_non_direct_channel, last_non_direct_channel),
      last_non_direct_landing_page = COALESCE(NEW.last_non_direct_landing_page, last_non_direct_landing_page),
      lead_id = COALESCE(lead_id, NEW.id),
      original_client_id = COALESCE(original_client_id, NEW.client_id),
      updated_at = now()
    WHERE id = existing_wm_lead_id;
  ELSE
    -- Insert new wm_lead
    INSERT INTO public.wm_leads (
      lead_id, email, first_name, last_name, phone, city, state, zip,
      original_source_tool, original_session_id, original_client_id,
      gclid, fbclid, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      last_non_direct_utm_source, last_non_direct_utm_medium,
      last_non_direct_gclid, last_non_direct_fbclid,
      last_non_direct_channel, last_non_direct_landing_page,
      landing_page, captured_at, status
    ) VALUES (
      NEW.id, NEW.email, NEW.first_name, NEW.last_name, NEW.phone,
      NEW.city, NEW.state, NEW.zip, NEW.source_tool, validated_session_id,
      NEW.client_id, NEW.gclid, NEW.fbc, NEW.utm_source, NEW.utm_medium,
      NEW.utm_campaign, NEW.utm_content, NEW.utm_term,
      NEW.last_non_direct_utm_source, NEW.last_non_direct_utm_medium,
      NEW.last_non_direct_gclid, NEW.last_non_direct_fbclid,
      NEW.last_non_direct_channel, NEW.last_non_direct_landing_page,
      NEW.source_page, now(), 'new'::lead_status
    );
  END IF;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- RETROACTIVE LINKING OF QUOTE ANALYSES (DEFENSIVE WRAPPER)
  -- CRITICAL: Wrapped in BEGIN...EXCEPTION to ensure Lead creation NEVER fails
  -- ═══════════════════════════════════════════════════════════════════════════
  IF validated_session_id IS NOT NULL THEN
    BEGIN
      v_linked_analyses := public.link_quote_analyses_to_lead(NEW.id, validated_session_id);
      IF v_linked_analyses > 0 THEN
        RAISE LOG '[handle_new_lead_to_crm] SUCCESS: Linked % quote_analyses to lead %', 
          v_linked_analyses, NEW.id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but DO NOT block lead creation
      RAISE LOG '[handle_new_lead_to_crm] WARNING: Failed to link quote_analyses for lead %. Error: %. Lead creation continues.', 
        NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- FUNCTION: trigger_index_quote_analyses (Global Search Integration)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_index_quote_analyses()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_title text;
  v_subtitle text;
  v_keywords text;
  v_payload jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.delete_search_index('quote_analysis', OLD.id);
    RETURN OLD;
  END IF;
  
  -- Build title
  v_title := 'Quote Analysis: Score ' || NEW.overall_score || '/100';
  
  -- Build subtitle
  v_subtitle := COALESCE(NEW.price_per_opening, 'Price not extracted') || 
                ' | ' || COALESCE(NEW.warnings_count, 0) || ' warnings';
  
  -- Build keywords
  v_keywords := LOWER(
    COALESCE(NEW.session_id, '') || ' ' ||
    COALESCE(NEW.lead_id::text, '') || ' ' ||
    COALESCE(NEW.id::text, '') || ' ' ||
    COALESCE(NEW.image_hash, '') || ' ' ||
    COALESCE(NEW.analysis_json->>'summary', '') || ' ' ||
    COALESCE(NEW.analysis_json->'extractedIdentity'->>'contractorName', '')
  );
  
  -- Build payload
  v_payload := jsonb_build_object(
    'overall_score', NEW.overall_score,
    'price_per_opening', NEW.price_per_opening,
    'warnings_count', NEW.warnings_count,
    'created_at', NEW.created_at
  );
  
  PERFORM public.upsert_search_index(
    'quote_analysis', NEW.id, NEW.lead_id, 
    v_title, v_subtitle, v_keywords, v_payload
  );
  RETURN NEW;
END;
$$;

-- Attach search index trigger
DROP TRIGGER IF EXISTS trg_index_quote_analyses ON public.quote_analyses;
CREATE TRIGGER trg_index_quote_analyses
  AFTER INSERT OR UPDATE OR DELETE ON public.quote_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_index_quote_analyses();

-- ============================================================================
-- RLS POLICIES FOR quote_analyses
-- ============================================================================

ALTER TABLE public.quote_analyses ENABLE ROW LEVEL SECURITY;

-- Allow INSERT from anyone (users can save before signing up)
DROP POLICY IF EXISTS "anon_insert_quote_analyses" ON public.quote_analyses;
CREATE POLICY "anon_insert_quote_analyses"
ON public.quote_analyses FOR INSERT
WITH CHECK (true);

-- Allow SELECT for service role, admins, or user's own lead's analyses
DROP POLICY IF EXISTS "select_own_quote_analyses" ON public.quote_analyses;
CREATE POLICY "select_own_quote_analyses"
ON public.quote_analyses FOR SELECT
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR lead_id IN (
    SELECT id FROM public.leads WHERE user_id = auth.uid()
  )
);

-- Service role only for UPDATE (for lead linking via trigger)
DROP POLICY IF EXISTS "service_update_quote_analyses" ON public.quote_analyses;
CREATE POLICY "service_update_quote_analyses"
ON public.quote_analyses FOR UPDATE
USING (auth.role() = 'service_role');

-- Service role only for DELETE
DROP POLICY IF EXISTS "service_delete_quote_analyses" ON public.quote_analyses;
CREATE POLICY "service_delete_quote_analyses"
ON public.quote_analyses FOR DELETE
USING (auth.role() = 'service_role');

-- ============================================================================
-- RLS POLICIES FOR quote_feedback
-- ============================================================================

ALTER TABLE public.quote_feedback ENABLE ROW LEVEL SECURITY;

-- Allow INSERT from anyone (we want feedback!)
DROP POLICY IF EXISTS "anon_insert_quote_feedback" ON public.quote_feedback;
CREATE POLICY "anon_insert_quote_feedback"
ON public.quote_feedback FOR INSERT
WITH CHECK (true);

-- SELECT only for admins (for quality review)
DROP POLICY IF EXISTS "admin_select_quote_feedback" ON public.quote_feedback;
CREATE POLICY "admin_select_quote_feedback"
ON public.quote_feedback FOR SELECT
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);