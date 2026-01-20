-- =============================================================================
-- GLOBAL SEARCH INDEX: Unified search across all CRM entities
-- =============================================================================
-- Performance targets: <300ms at 10k-100k rows
-- Indexes: GIN tsvector (FTS), GIN trigram (fuzzy), btree (entity lookup)
-- =============================================================================

-- Enable pg_trgm extension for fuzzy/partial matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- 1. CREATE THE INDEX TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.global_search_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,  -- 'lead','call','note','session','quote_upload','pending_call','consultation'
  entity_id uuid NOT NULL,    -- PK of source row
  lead_id uuid NULL,          -- optional: connect non-lead entities to a lead
  title text NULL,            -- display label (name, subject, etc.)
  subtitle text NULL,         -- secondary display (email, phone, etc.)
  keywords text NULL,         -- normalized searchable string (all IDs, names, emails, phones, etc.)
  payload jsonb NULL DEFAULT '{}'::jsonb,  -- small safe metadata for display (max 4KB recommended)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Generated tsvector for full-text search
  search_tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(keywords, ''))) STORED
);

-- Unique constraint: one index row per entity
CREATE UNIQUE INDEX IF NOT EXISTS idx_gsi_entity_unique 
  ON public.global_search_index(entity_type, entity_id);

-- =============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- GIN index on tsvector for full-text search (handles "john smith", "gmail.com")
CREATE INDEX IF NOT EXISTS idx_gsi_tsv 
  ON public.global_search_index USING GIN(search_tsv);

-- GIN trigram index for fuzzy/partial matching (handles "joh", "561555", partial strings)
CREATE INDEX IF NOT EXISTS idx_gsi_keywords_trgm 
  ON public.global_search_index USING GIN(keywords gin_trgm_ops);

-- btree on entity_type + updated_at for grouped/paginated results
CREATE INDEX IF NOT EXISTS idx_gsi_type_updated 
  ON public.global_search_index(entity_type, updated_at DESC);

-- btree on entity_id for exact lookups and joins
CREATE INDEX IF NOT EXISTS idx_gsi_entity_id 
  ON public.global_search_index(entity_id);

-- btree on lead_id for finding all related entities for a lead
CREATE INDEX IF NOT EXISTS idx_gsi_lead_id 
  ON public.global_search_index(lead_id) WHERE lead_id IS NOT NULL;

-- =============================================================================
-- 3. UPSERT FUNCTION FOR TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.upsert_search_index(
  p_entity_type text,
  p_entity_id uuid,
  p_lead_id uuid,
  p_title text,
  p_subtitle text,
  p_keywords text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.global_search_index (
    entity_type, entity_id, lead_id, title, subtitle, keywords, payload, updated_at
  ) VALUES (
    p_entity_type, p_entity_id, p_lead_id, p_title, p_subtitle, p_keywords, p_payload, now()
  )
  ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    lead_id = EXCLUDED.lead_id,
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    keywords = EXCLUDED.keywords,
    payload = EXCLUDED.payload,
    updated_at = now();
END;
$$;

-- =============================================================================
-- 4. DELETE FUNCTION FOR TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.delete_search_index(
  p_entity_type text,
  p_entity_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.global_search_index 
  WHERE entity_type = p_entity_type AND entity_id = p_entity_id;
END;
$$;

-- =============================================================================
-- 5. TRIGGER FUNCTIONS FOR EACH ENTITY TYPE
-- =============================================================================

-- Helper: extract digits only from a string
CREATE OR REPLACE FUNCTION public.extract_digits(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(coalesce(input, ''), '[^0-9]', '', 'g');
$$;

-- WM_LEADS trigger function
CREATE OR REPLACE FUNCTION public.trigger_index_wm_leads()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_subtitle text;
  v_keywords text;
  v_payload jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.delete_search_index('lead', OLD.id);
    RETURN OLD;
  END IF;
  
  -- Build title (name)
  v_title := NULLIF(TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')), '');
  IF v_title IS NULL OR v_title = '' THEN
    v_title := NEW.email;
  END IF;
  
  -- Build subtitle (email + phone)
  v_subtitle := COALESCE(NEW.email, '') || CASE WHEN NEW.phone IS NOT NULL THEN ' · ' || NEW.phone ELSE '' END;
  
  -- Build keywords (all searchable fields, normalized)
  v_keywords := LOWER(COALESCE(NEW.first_name, '') || ' ' || 
                       COALESCE(NEW.last_name, '') || ' ' || 
                       COALESCE(NEW.email, '') || ' ' || 
                       COALESCE(NEW.phone, '') || ' ' ||
                       public.extract_digits(NEW.phone) || ' ' ||
                       COALESCE(NEW.city, '') || ' ' ||
                       COALESCE(NEW.notes, '') || ' ' ||
                       COALESCE(NEW.gclid, '') || ' ' ||
                       COALESCE(NEW.fbclid, '') || ' ' ||
                       COALESCE(NEW.utm_source, '') || ' ' ||
                       COALESCE(NEW.utm_campaign, '') || ' ' ||
                       COALESCE(NEW.id::text, '') || ' ' ||
                       COALESCE(NEW.lead_id::text, '') || ' ' ||
                       COALESCE(NEW.original_session_id::text, ''));
  
  -- Build payload (small metadata for display)
  v_payload := jsonb_build_object(
    'status', NEW.status,
    'lead_quality', NEW.lead_quality,
    'engagement_score', NEW.engagement_score,
    'city', NEW.city,
    'utm_source', NEW.utm_source
  );
  
  PERFORM public.upsert_search_index('lead', NEW.id, NEW.lead_id, v_title, v_subtitle, v_keywords, v_payload);
  RETURN NEW;
END;
$$;

-- PHONE_CALL_LOGS trigger function
CREATE OR REPLACE FUNCTION public.trigger_index_phone_call_logs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_subtitle text;
  v_keywords text;
  v_payload jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.delete_search_index('call', OLD.id);
    RETURN OLD;
  END IF;
  
  v_title := 'Call: ' || NEW.call_status || CASE WHEN NEW.call_sentiment IS NOT NULL THEN ' (' || NEW.call_sentiment || ')' ELSE '' END;
  v_subtitle := COALESCE(LEFT(NEW.ai_notes, 100), 'No notes');
  
  v_keywords := LOWER(COALESCE(NEW.ai_notes, '') || ' ' ||
                       COALESCE(NEW.call_request_id::text, '') || ' ' ||
                       COALESCE(NEW.provider_call_id, '') || ' ' ||
                       COALESCE(NEW.source_tool, '') || ' ' ||
                       COALESCE(NEW.agent_id, '') || ' ' ||
                       NEW.call_status || ' ' ||
                       COALESCE(NEW.call_sentiment::text, ''));
  
  v_payload := jsonb_build_object(
    'call_status', NEW.call_status,
    'call_sentiment', NEW.call_sentiment,
    'call_duration_sec', NEW.call_duration_sec,
    'source_tool', NEW.source_tool
  );
  
  PERFORM public.upsert_search_index('call', NEW.id, NEW.lead_id, v_title, v_subtitle, v_keywords, v_payload);
  RETURN NEW;
END;
$$;

-- PENDING_CALLS trigger function
CREATE OR REPLACE FUNCTION public.trigger_index_pending_calls()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_subtitle text;
  v_keywords text;
  v_payload jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.delete_search_index('pending_call', OLD.id);
    RETURN OLD;
  END IF;
  
  v_title := 'Pending Call: ' || NEW.status || ' → ' || NEW.phone_e164;
  v_subtitle := LEFT(NEW.first_message, 100);
  
  v_keywords := LOWER(COALESCE(NEW.phone_e164, '') || ' ' ||
                       public.extract_digits(NEW.phone_e164) || ' ' ||
                       COALESCE(NEW.call_request_id::text, '') || ' ' ||
                       COALESCE(NEW.provider_call_id, '') || ' ' ||
                       COALESCE(NEW.source_tool, '') || ' ' ||
                       COALESCE(NEW.first_message, '') || ' ' ||
                       NEW.status);
  
  v_payload := jsonb_build_object(
    'status', NEW.status,
    'phone_e164', NEW.phone_e164,
    'scheduled_for', NEW.scheduled_for,
    'attempt_count', NEW.attempt_count
  );
  
  PERFORM public.upsert_search_index('pending_call', NEW.id, NEW.lead_id, v_title, v_subtitle, v_keywords, v_payload);
  RETURN NEW;
END;
$$;

-- LEAD_NOTES trigger function
CREATE OR REPLACE FUNCTION public.trigger_index_lead_notes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_subtitle text;
  v_keywords text;
  v_payload jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.delete_search_index('note', OLD.id);
    RETURN OLD;
  END IF;
  
  v_title := 'Note by ' || COALESCE(NEW.admin_email, 'Unknown');
  v_subtitle := LEFT(NEW.content, 150);
  
  v_keywords := LOWER(COALESCE(NEW.content, '') || ' ' ||
                       COALESCE(NEW.admin_email, '') || ' ' ||
                       COALESCE(NEW.lead_id::text, ''));
  
  v_payload := jsonb_build_object(
    'admin_email', NEW.admin_email
  );
  
  PERFORM public.upsert_search_index('note', NEW.id, NEW.lead_id, v_title, v_subtitle, v_keywords, v_payload);
  RETURN NEW;
END;
$$;

-- WM_SESSIONS trigger function
CREATE OR REPLACE FUNCTION public.trigger_index_wm_sessions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_subtitle text;
  v_keywords text;
  v_payload jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.delete_search_index('session', OLD.id);
    RETURN OLD;
  END IF;
  
  v_title := 'Session: ' || LEFT(NEW.anonymous_id, 16) || '...';
  v_subtitle := COALESCE(NEW.landing_page, 'Unknown landing page');
  
  v_keywords := LOWER(COALESCE(NEW.anonymous_id, '') || ' ' ||
                       COALESCE(NEW.id::text, '') || ' ' ||
                       COALESCE(NEW.landing_page, '') || ' ' ||
                       COALESCE(NEW.referrer, '') || ' ' ||
                       COALESCE(NEW.utm_source, '') || ' ' ||
                       COALESCE(NEW.utm_medium, '') || ' ' ||
                       COALESCE(NEW.utm_campaign, ''));
  
  v_payload := jsonb_build_object(
    'landing_page', NEW.landing_page,
    'utm_source', NEW.utm_source,
    'referrer', NEW.referrer
  );
  
  PERFORM public.upsert_search_index('session', NEW.id, NEW.lead_id, v_title, v_subtitle, v_keywords, v_payload);
  RETURN NEW;
END;
$$;

-- QUOTE_FILES trigger function
CREATE OR REPLACE FUNCTION public.trigger_index_quote_files()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_subtitle text;
  v_keywords text;
  v_payload jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.delete_search_index('quote_upload', OLD.id);
    RETURN OLD;
  END IF;
  
  v_title := 'Quote: ' || NEW.file_name;
  v_subtitle := COALESCE(NEW.source_page, 'Unknown source');
  
  v_keywords := LOWER(COALESCE(NEW.file_name, '') || ' ' ||
                       COALESCE(NEW.session_id, '') || ' ' ||
                       COALESCE(NEW.id::text, '') || ' ' ||
                       COALESCE(NEW.source_page, '') || ' ' ||
                       COALESCE(NEW.utm_source, ''));
  
  v_payload := jsonb_build_object(
    'file_name', NEW.file_name,
    'mime_type', NEW.mime_type,
    'file_size', NEW.file_size,
    'source_page', NEW.source_page
  );
  
  PERFORM public.upsert_search_index('quote_upload', NEW.id, NEW.lead_id, v_title, v_subtitle, v_keywords, v_payload);
  RETURN NEW;
END;
$$;

-- CONSULTATIONS trigger function
CREATE OR REPLACE FUNCTION public.trigger_index_consultations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_subtitle text;
  v_keywords text;
  v_payload jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.delete_search_index('consultation', OLD.id);
    RETURN OLD;
  END IF;
  
  v_title := 'Consultation: ' || NEW.name;
  v_subtitle := NEW.email || ' · ' || NEW.preferred_time;
  
  v_keywords := LOWER(COALESCE(NEW.name, '') || ' ' ||
                       COALESCE(NEW.email, '') || ' ' ||
                       COALESCE(NEW.phone, '') || ' ' ||
                       public.extract_digits(NEW.phone) || ' ' ||
                       COALESCE(NEW.notes, '') || ' ' ||
                       COALESCE(NEW.preferred_time, ''));
  
  v_payload := jsonb_build_object(
    'status', NEW.status,
    'preferred_time', NEW.preferred_time
  );
  
  PERFORM public.upsert_search_index('consultation', NEW.id, NEW.lead_id, v_title, v_subtitle, v_keywords, v_payload);
  RETURN NEW;
END;
$$;

-- =============================================================================
-- 6. CREATE TRIGGERS ON SOURCE TABLES
-- =============================================================================

-- wm_leads
DROP TRIGGER IF EXISTS trg_index_wm_leads ON public.wm_leads;
CREATE TRIGGER trg_index_wm_leads
  AFTER INSERT OR UPDATE OR DELETE ON public.wm_leads
  FOR EACH ROW EXECUTE FUNCTION public.trigger_index_wm_leads();

-- phone_call_logs
DROP TRIGGER IF EXISTS trg_index_phone_call_logs ON public.phone_call_logs;
CREATE TRIGGER trg_index_phone_call_logs
  AFTER INSERT OR UPDATE OR DELETE ON public.phone_call_logs
  FOR EACH ROW EXECUTE FUNCTION public.trigger_index_phone_call_logs();

-- pending_calls
DROP TRIGGER IF EXISTS trg_index_pending_calls ON public.pending_calls;
CREATE TRIGGER trg_index_pending_calls
  AFTER INSERT OR UPDATE OR DELETE ON public.pending_calls
  FOR EACH ROW EXECUTE FUNCTION public.trigger_index_pending_calls();

-- lead_notes
DROP TRIGGER IF EXISTS trg_index_lead_notes ON public.lead_notes;
CREATE TRIGGER trg_index_lead_notes
  AFTER INSERT OR UPDATE OR DELETE ON public.lead_notes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_index_lead_notes();

-- wm_sessions
DROP TRIGGER IF EXISTS trg_index_wm_sessions ON public.wm_sessions;
CREATE TRIGGER trg_index_wm_sessions
  AFTER INSERT OR UPDATE OR DELETE ON public.wm_sessions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_index_wm_sessions();

-- quote_files
DROP TRIGGER IF EXISTS trg_index_quote_files ON public.quote_files;
CREATE TRIGGER trg_index_quote_files
  AFTER INSERT OR UPDATE OR DELETE ON public.quote_files
  FOR EACH ROW EXECUTE FUNCTION public.trigger_index_quote_files();

-- consultations
DROP TRIGGER IF EXISTS trg_index_consultations ON public.consultations;
CREATE TRIGGER trg_index_consultations
  AFTER INSERT OR UPDATE OR DELETE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.trigger_index_consultations();

-- =============================================================================
-- 7. RLS POLICIES (admin-only access)
-- =============================================================================
ALTER TABLE public.global_search_index ENABLE ROW LEVEL SECURITY;

-- Deny all public access
CREATE POLICY "Deny public select on global_search_index"
  ON public.global_search_index FOR SELECT
  USING (false);

CREATE POLICY "Deny public insert on global_search_index"
  ON public.global_search_index FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny public update on global_search_index"
  ON public.global_search_index FOR UPDATE
  USING (false);

CREATE POLICY "Deny public delete on global_search_index"
  ON public.global_search_index FOR DELETE
  USING (false);

-- =============================================================================
-- 8. BACKFILL EXISTING DATA
-- =============================================================================

-- Backfill wm_leads
INSERT INTO public.global_search_index (entity_type, entity_id, lead_id, title, subtitle, keywords, payload, created_at, updated_at)
SELECT 
  'lead',
  id,
  lead_id,
  COALESCE(NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), ''), email),
  COALESCE(email, '') || CASE WHEN phone IS NOT NULL THEN ' · ' || phone ELSE '' END,
  LOWER(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(email, '') || ' ' || 
        COALESCE(phone, '') || ' ' || public.extract_digits(phone) || ' ' || COALESCE(city, '') || ' ' ||
        COALESCE(notes, '') || ' ' || COALESCE(gclid, '') || ' ' || COALESCE(fbclid, '') || ' ' ||
        COALESCE(utm_source, '') || ' ' || COALESCE(utm_campaign, '') || ' ' || id::text || ' ' ||
        COALESCE(lead_id::text, '') || ' ' || COALESCE(original_session_id::text, '')),
  jsonb_build_object('status', status, 'lead_quality', lead_quality, 'engagement_score', engagement_score, 'city', city, 'utm_source', utm_source),
  created_at,
  updated_at
FROM public.wm_leads
ON CONFLICT (entity_type, entity_id) DO NOTHING;

-- Backfill phone_call_logs
INSERT INTO public.global_search_index (entity_type, entity_id, lead_id, title, subtitle, keywords, payload, created_at, updated_at)
SELECT 
  'call',
  id,
  lead_id,
  'Call: ' || call_status || CASE WHEN call_sentiment IS NOT NULL THEN ' (' || call_sentiment || ')' ELSE '' END,
  COALESCE(LEFT(ai_notes, 100), 'No notes'),
  LOWER(COALESCE(ai_notes, '') || ' ' || call_request_id::text || ' ' || COALESCE(provider_call_id, '') || ' ' ||
        COALESCE(source_tool, '') || ' ' || COALESCE(agent_id, '') || ' ' || call_status || ' ' || COALESCE(call_sentiment::text, '')),
  jsonb_build_object('call_status', call_status, 'call_sentiment', call_sentiment, 'call_duration_sec', call_duration_sec, 'source_tool', source_tool),
  created_at,
  updated_at
FROM public.phone_call_logs
ON CONFLICT (entity_type, entity_id) DO NOTHING;

-- Backfill pending_calls
INSERT INTO public.global_search_index (entity_type, entity_id, lead_id, title, subtitle, keywords, payload, created_at, updated_at)
SELECT 
  'pending_call',
  id,
  lead_id,
  'Pending Call: ' || status || ' → ' || phone_e164,
  LEFT(first_message, 100),
  LOWER(COALESCE(phone_e164, '') || ' ' || public.extract_digits(phone_e164) || ' ' || call_request_id::text || ' ' ||
        COALESCE(provider_call_id, '') || ' ' || COALESCE(source_tool, '') || ' ' || COALESCE(first_message, '') || ' ' || status),
  jsonb_build_object('status', status, 'phone_e164', phone_e164, 'scheduled_for', scheduled_for, 'attempt_count', attempt_count),
  created_at,
  updated_at
FROM public.pending_calls
ON CONFLICT (entity_type, entity_id) DO NOTHING;

-- Backfill lead_notes
INSERT INTO public.global_search_index (entity_type, entity_id, lead_id, title, subtitle, keywords, payload, created_at, updated_at)
SELECT 
  'note',
  id,
  lead_id,
  'Note by ' || COALESCE(admin_email, 'Unknown'),
  LEFT(content, 150),
  LOWER(COALESCE(content, '') || ' ' || COALESCE(admin_email, '') || ' ' || lead_id::text),
  jsonb_build_object('admin_email', admin_email),
  created_at,
  updated_at
FROM public.lead_notes
ON CONFLICT (entity_type, entity_id) DO NOTHING;

-- Backfill wm_sessions
INSERT INTO public.global_search_index (entity_type, entity_id, lead_id, title, subtitle, keywords, payload, created_at, updated_at)
SELECT 
  'session',
  id,
  lead_id,
  'Session: ' || LEFT(anonymous_id, 16) || '...',
  COALESCE(landing_page, 'Unknown landing page'),
  LOWER(COALESCE(anonymous_id, '') || ' ' || id::text || ' ' || COALESCE(landing_page, '') || ' ' ||
        COALESCE(referrer, '') || ' ' || COALESCE(utm_source, '') || ' ' || COALESCE(utm_medium, '') || ' ' || COALESCE(utm_campaign, '')),
  jsonb_build_object('landing_page', landing_page, 'utm_source', utm_source, 'referrer', referrer),
  created_at,
  updated_at
FROM public.wm_sessions
ON CONFLICT (entity_type, entity_id) DO NOTHING;

-- Backfill quote_files
INSERT INTO public.global_search_index (entity_type, entity_id, lead_id, title, subtitle, keywords, payload, created_at, updated_at)
SELECT 
  'quote_upload',
  id,
  lead_id,
  'Quote: ' || file_name,
  COALESCE(source_page, 'Unknown source'),
  LOWER(COALESCE(file_name, '') || ' ' || COALESCE(session_id, '') || ' ' || id::text || ' ' || COALESCE(source_page, '') || ' ' || COALESCE(utm_source, '')),
  jsonb_build_object('file_name', file_name, 'mime_type', mime_type, 'file_size', file_size, 'source_page', source_page),
  created_at,
  created_at
FROM public.quote_files
ON CONFLICT (entity_type, entity_id) DO NOTHING;

-- Backfill consultations
INSERT INTO public.global_search_index (entity_type, entity_id, lead_id, title, subtitle, keywords, payload, created_at, updated_at)
SELECT 
  'consultation',
  id,
  lead_id,
  'Consultation: ' || name,
  email || ' · ' || preferred_time,
  LOWER(COALESCE(name, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, '') || ' ' || public.extract_digits(phone) || ' ' ||
        COALESCE(notes, '') || ' ' || COALESCE(preferred_time, '')),
  jsonb_build_object('status', status, 'preferred_time', preferred_time),
  created_at,
  created_at
FROM public.consultations
ON CONFLICT (entity_type, entity_id) DO NOTHING;