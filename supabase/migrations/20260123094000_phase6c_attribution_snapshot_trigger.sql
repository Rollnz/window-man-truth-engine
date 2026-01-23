-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 6C: Attribution Snapshot Layer
-- Purpose: Auto-populate attribution fields from conversion event on insert
-- 
-- BEHAVIOR:
-- When a revenue event is inserted, this trigger automatically copies
-- attribution data from the original conversion event (wm_event_log) and
-- session data (wm_sessions). This "freezes" the attribution at the time
-- of conversion, ensuring accurate ROAS and LTV calculations.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. ATTRIBUTION SNAPSHOT FUNCTION
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.populate_revenue_attribution()
RETURNS trigger AS $$
DECLARE
    v_conversion_record RECORD;
    v_session_record RECORD;
BEGIN
    -- ═══════════════════════════════════════════════════════════════════
    -- Step 1: Get conversion event data from wm_event_log
    -- ═══════════════════════════════════════════════════════════════════
    SELECT 
        event_id,
        lead_id,
        session_id,
        source_tool,
        traffic_source,
        campaign_id,
        fbclid,
        gclid,
        fbp,
        fbc,
        lead_score,
        intent_tier,
        email_sha256,
        phone_sha256,
        external_id
    INTO v_conversion_record
    FROM public.wm_event_log
    WHERE event_id = NEW.conversion_event_id
    LIMIT 1;
    
    -- If conversion event not found, log warning but continue
    IF v_conversion_record IS NULL THEN
        RAISE WARNING '[wm_revenue_events] Conversion event not found: %', NEW.conversion_event_id;
    END IF;
    
    -- ═══════════════════════════════════════════════════════════════════
    -- Step 2: Get session data if available
    -- ═══════════════════════════════════════════════════════════════════
    IF v_conversion_record.session_id IS NOT NULL THEN
        SELECT 
            utm_source,
            utm_medium,
            utm_campaign,
            utm_term,
            utm_content,
            landing_page,
            referrer
        INTO v_session_record
        FROM public.wm_sessions
        WHERE id = v_conversion_record.session_id
        LIMIT 1;
    END IF;
    
    -- ═══════════════════════════════════════════════════════════════════
    -- Step 3: Populate attribution snapshot (only if not already set)
    -- This allows manual override if values are provided at insert time
    -- ═══════════════════════════════════════════════════════════════════
    
    -- From conversion event
    NEW.attr_source_tool := COALESCE(NEW.attr_source_tool, v_conversion_record.source_tool);
    NEW.attr_traffic_source := COALESCE(NEW.attr_traffic_source, v_conversion_record.traffic_source);
    NEW.attr_campaign_id := COALESCE(NEW.attr_campaign_id, v_conversion_record.campaign_id);
    NEW.attr_fbclid := COALESCE(NEW.attr_fbclid, v_conversion_record.fbclid);
    NEW.attr_gclid := COALESCE(NEW.attr_gclid, v_conversion_record.gclid);
    NEW.attr_fbp := COALESCE(NEW.attr_fbp, v_conversion_record.fbp);
    NEW.attr_fbc := COALESCE(NEW.attr_fbc, v_conversion_record.fbc);
    NEW.attr_lead_score := COALESCE(NEW.attr_lead_score, v_conversion_record.lead_score);
    NEW.attr_intent_tier := COALESCE(NEW.attr_intent_tier, v_conversion_record.intent_tier);
    
    -- From session (if available)
    IF v_session_record IS NOT NULL THEN
        NEW.attr_utm_source := COALESCE(NEW.attr_utm_source, v_session_record.utm_source);
        NEW.attr_utm_medium := COALESCE(NEW.attr_utm_medium, v_session_record.utm_medium);
        NEW.attr_utm_campaign := COALESCE(NEW.attr_utm_campaign, v_session_record.utm_campaign);
        NEW.attr_utm_term := COALESCE(NEW.attr_utm_term, v_session_record.utm_term);
        NEW.attr_utm_content := COALESCE(NEW.attr_utm_content, v_session_record.utm_content);
        NEW.attr_landing_page := COALESCE(NEW.attr_landing_page, v_session_record.landing_page);
        NEW.attr_referrer := COALESCE(NEW.attr_referrer, v_session_record.referrer);
    END IF;
    
    -- ═══════════════════════════════════════════════════════════════════
    -- Step 4: Copy identity anchors from conversion (if not already set)
    -- ═══════════════════════════════════════════════════════════════════
    NEW.email_sha256 := COALESCE(NEW.email_sha256, v_conversion_record.email_sha256);
    NEW.phone_sha256 := COALESCE(NEW.phone_sha256, v_conversion_record.phone_sha256);
    NEW.external_id := COALESCE(NEW.external_id, v_conversion_record.external_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.populate_revenue_attribution() IS 
  'Phase 6C: Auto-populates attribution snapshot from conversion event and session data on revenue event insert.';


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. ATTRIBUTION SNAPSHOT TRIGGER
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop existing trigger if it exists (for idempotent migrations)
DROP TRIGGER IF EXISTS trg_populate_revenue_attribution ON public.wm_revenue_events;

-- Create trigger to auto-populate attribution on insert
CREATE TRIGGER trg_populate_revenue_attribution
BEFORE INSERT ON public.wm_revenue_events
FOR EACH ROW EXECUTE FUNCTION public.populate_revenue_attribution();

COMMENT ON TRIGGER trg_populate_revenue_attribution ON public.wm_revenue_events IS 
  'Phase 6C: Freezes attribution data from conversion event at revenue event creation time.';


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. VERIFICATION QUERIES (run after migration)
-- ═══════════════════════════════════════════════════════════════════════════

-- Verify function exists:
-- SELECT proname FROM pg_proc WHERE proname = 'populate_revenue_attribution';

-- Verify trigger exists:
-- SELECT tgname, tgtype FROM pg_trigger WHERE tgrelid = 'wm_revenue_events'::regclass;

-- Test the trigger (example - replace with real IDs):
-- INSERT INTO public.wm_revenue_events (
--     lead_id,
--     conversion_event_id,
--     revenue_stage,
--     deal_id,
--     revenue_amount,
--     source_system,
--     ingested_by
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000001',  -- replace with real lead_id
--     '00000000-0000-0000-0000-000000000002',  -- replace with real conversion_event_id
--     'deal_won',
--     'CRM-12345',
--     5000.00,
--     'manual',
--     'phase6c_test'
-- );
-- 
-- SELECT * FROM public.wm_revenue_events WHERE ingested_by = 'phase6c_test';
