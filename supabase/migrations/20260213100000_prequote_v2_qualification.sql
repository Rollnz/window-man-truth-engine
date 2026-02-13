-- PreQuoteLeadModal V2: Qualification columns for multi-step CRO flow
-- Adds qualification fields to leads and wm_leads tables
-- Updates handle_new_lead_to_crm trigger to sync flow_version on INSERT
-- Seeds call_agents for V2 phone dispatch source tools

-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 1: Add V2 qualification columns to public.leads
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS flow_version text,
  ADD COLUMN IF NOT EXISTS timeline text,
  ADD COLUMN IF NOT EXISTS has_quote text,
  ADD COLUMN IF NOT EXISTS homeowner boolean,
  ADD COLUMN IF NOT EXISTS window_scope text,
  ADD COLUMN IF NOT EXISTS lead_score integer,
  ADD COLUMN IF NOT EXISTS lead_segment text,
  ADD COLUMN IF NOT EXISTS qualification_completed_at timestamptz;

COMMENT ON COLUMN public.leads.flow_version IS 'Lead capture flow version, e.g. prequote_v2';
COMMENT ON COLUMN public.leads.timeline IS 'Project timeline: 30days | 90days | 6months | research';
COMMENT ON COLUMN public.leads.has_quote IS 'Has written estimate: yes | getting | no';
COMMENT ON COLUMN public.leads.homeowner IS 'Is homeowner (true/false)';
COMMENT ON COLUMN public.leads.window_scope IS 'Window scope: 1_5 | 6_15 | 16_plus | whole_house';
COMMENT ON COLUMN public.leads.lead_score IS 'V2 qualification score (0-130)';
COMMENT ON COLUMN public.leads.lead_segment IS 'V2 qualification segment: HOT | WARM | NURTURE | LOW';
COMMENT ON COLUMN public.leads.qualification_completed_at IS 'When qualification flow was completed';

-- Indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_leads_lead_segment
  ON public.leads(lead_segment) WHERE lead_segment IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_flow_version
  ON public.leads(flow_version) WHERE flow_version IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_qualification_completed
  ON public.leads(qualification_completed_at) WHERE qualification_completed_at IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 2: Add matching V2 columns to public.wm_leads (CRM warehouse)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.wm_leads
  ADD COLUMN IF NOT EXISTS flow_version text,
  ADD COLUMN IF NOT EXISTS timeline text,
  ADD COLUMN IF NOT EXISTS has_quote text,
  ADD COLUMN IF NOT EXISTS homeowner boolean,
  ADD COLUMN IF NOT EXISTS window_scope text,
  ADD COLUMN IF NOT EXISTS lead_score integer,
  ADD COLUMN IF NOT EXISTS lead_segment text,
  ADD COLUMN IF NOT EXISTS qualification_completed_at timestamptz;

COMMENT ON COLUMN public.wm_leads.flow_version IS 'Lead capture flow version, e.g. prequote_v2';
COMMENT ON COLUMN public.wm_leads.timeline IS 'Project timeline: 30days | 90days | 6months | research';
COMMENT ON COLUMN public.wm_leads.has_quote IS 'Has written estimate: yes | getting | no';
COMMENT ON COLUMN public.wm_leads.homeowner IS 'Is homeowner (true/false)';
COMMENT ON COLUMN public.wm_leads.window_scope IS 'Window scope: 1_5 | 6_15 | 16_plus | whole_house';
COMMENT ON COLUMN public.wm_leads.lead_score IS 'V2 qualification score (0-130)';
COMMENT ON COLUMN public.wm_leads.lead_segment IS 'V2 qualification segment: HOT | WARM | NURTURE | LOW';
COMMENT ON COLUMN public.wm_leads.qualification_completed_at IS 'When qualification flow was completed';

CREATE INDEX IF NOT EXISTS idx_wm_leads_lead_segment
  ON public.wm_leads(lead_segment) WHERE lead_segment IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wm_leads_flow_version
  ON public.wm_leads(flow_version) WHERE flow_version IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 3: Update handle_new_lead_to_crm trigger to sync flow_version
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_lead_to_crm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  validated_session_id uuid;
  session_exists boolean := false;
  new_wm_lead_id uuid;
  existing_wm_lead_id uuid;
BEGIN
  -- Check if a wm_lead already exists for this email
  SELECT id INTO existing_wm_lead_id
  FROM public.wm_leads
  WHERE email = NEW.email
  LIMIT 1;

  IF existing_wm_lead_id IS NOT NULL THEN
    -- Update existing wm_lead with new data
    UPDATE public.wm_leads
    SET
      first_name = COALESCE(NEW.first_name, first_name),
      last_name = COALESCE(NEW.last_name, last_name),
      phone = COALESCE(NEW.phone, phone),
      city = COALESCE(NEW.city, city),
      state = COALESCE(NEW.state, state),
      zip = COALESCE(NEW.zip, zip),
      utm_source = COALESCE(NEW.utm_source, utm_source),
      utm_medium = COALESCE(NEW.utm_medium, utm_medium),
      utm_campaign = COALESCE(NEW.utm_campaign, utm_campaign),
      utm_content = COALESCE(NEW.utm_content, utm_content),
      utm_term = COALESCE(NEW.utm_term, utm_term),
      gclid = COALESCE(NEW.gclid, gclid),
      fbclid = COALESCE(NEW.fbc, fbclid),
      last_non_direct_utm_source = COALESCE(NEW.last_non_direct_utm_source, last_non_direct_utm_source),
      last_non_direct_utm_medium = COALESCE(NEW.last_non_direct_utm_medium, last_non_direct_utm_medium),
      last_non_direct_gclid = COALESCE(NEW.last_non_direct_gclid, last_non_direct_gclid),
      last_non_direct_fbclid = COALESCE(NEW.last_non_direct_fbclid, last_non_direct_fbclid),
      last_non_direct_channel = COALESCE(NEW.last_non_direct_channel, last_non_direct_channel),
      last_non_direct_landing_page = COALESCE(NEW.last_non_direct_landing_page, last_non_direct_landing_page),
      -- V2: Sync flow_version (COALESCE preserves existing)
      flow_version = COALESCE(NEW.flow_version, flow_version),
      lead_id = NEW.id,
      updated_at = now()
    WHERE id = existing_wm_lead_id;

    RETURN NEW;
  END IF;

  -- GOLDEN THREAD FIX: Look up session by anonymous_id (visitor identity), not by id (session PK)
  IF NEW.client_id IS NOT NULL AND NEW.client_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT id INTO validated_session_id
    FROM public.wm_sessions
    WHERE anonymous_id = NEW.client_id
    ORDER BY created_at DESC
    LIMIT 1;

    session_exists := validated_session_id IS NOT NULL;
  ELSE
    validated_session_id := NULL;
    session_exists := false;
  END IF;

  -- Create new wm_lead record
  INSERT INTO public.wm_leads (
    lead_id,
    email,
    first_name,
    last_name,
    phone,
    city,
    state,
    zip,
    original_source_tool,
    original_session_id,
    original_client_id,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    gclid,
    fbclid,
    last_non_direct_utm_source,
    last_non_direct_utm_medium,
    last_non_direct_gclid,
    last_non_direct_fbclid,
    last_non_direct_channel,
    last_non_direct_landing_page,
    landing_page,
    flow_version,
    status,
    captured_at
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.first_name,
    NEW.last_name,
    NEW.phone,
    NEW.city,
    NEW.state,
    NEW.zip,
    NEW.source_tool,
    validated_session_id,
    NEW.client_id,
    NEW.utm_source,
    NEW.utm_medium,
    NEW.utm_campaign,
    NEW.utm_content,
    NEW.utm_term,
    NEW.gclid,
    NEW.fbc,
    NEW.last_non_direct_utm_source,
    NEW.last_non_direct_utm_medium,
    NEW.last_non_direct_gclid,
    NEW.last_non_direct_fbclid,
    NEW.last_non_direct_channel,
    NEW.last_non_direct_landing_page,
    NEW.source_page,
    NEW.flow_version,
    'new',
    now()
  )
  RETURNING id INTO new_wm_lead_id;

  -- Link quote analyses to this lead if we have a valid session
  IF validated_session_id IS NOT NULL THEN
    UPDATE public.quote_analyses
    SET lead_id = NEW.id
    WHERE session_id = validated_session_id::text
      AND lead_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 4: Seed call_agents for V2 source tools
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.call_agents (source_tool, agent_id, first_message_template, enabled, agent_name)
VALUES
  ('prequote-v2:sample-report', '', 'Hi {first_name} — this is Window Man. You just checked out your sample report and scored as a hot lead. Quick question about your window project — do you have a minute?', false, 'PreQuote V2 - Sample Report'),
  ('prequote-v2:audit', '', 'Hi {first_name} — this is Window Man. You just ran through our audit tool and you''re clearly ready to move. Quick question about your project timeline?', false, 'PreQuote V2 - Audit'),
  ('prequote-v2:ai-scanner-sample', '', 'Hi {first_name} — this is Window Man. You were just looking at our AI scanner sample. Got a quick question about your windows?', false, 'PreQuote V2 - AI Scanner Sample')
ON CONFLICT (source_tool) DO NOTHING;
