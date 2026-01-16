-- ═══════════════════════════════════════════════════════════════════════════
-- AUTOMATED LEAD SCORING ENGINE
-- Updates wm_leads.engagement_score based on wm_events activity
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to calculate engagement score from event name
CREATE OR REPLACE FUNCTION public.get_event_score(event_name TEXT, event_category TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Tool completion events (highest value)
  IF event_name = 'quote_scanned' THEN RETURN 25;
  ELSIF event_name = 'quote_generated' THEN RETURN 25;
  ELSIF event_name = 'evidence_analyzed' THEN RETURN 20;
  ELSIF event_name = 'fair_price_quiz_completed' THEN RETURN 20;
  ELSIF event_name = 'reality_check_completed' THEN RETURN 15;
  ELSIF event_name = 'risk_diagnostic_completed' THEN RETURN 15;
  ELSIF event_name = 'fast_win_completed' THEN RETURN 15;
  ELSIF event_name = 'vulnerability_test_completed' THEN RETURN 15;
  ELSIF event_name = 'cost_calculator_completed' THEN RETURN 15;
  ELSIF event_name = 'roleplay_completed' THEN RETURN 20;
  
  -- Lead capture events (high value)
  ELSIF event_name = 'lead_captured' THEN RETURN 30;
  ELSIF event_name = 'consultation_booked' THEN RETURN 50;
  ELSIF event_name = 'guide_downloaded' THEN RETURN 15;
  
  -- AI interaction events (medium-high value)
  ELSIF event_name = 'expert_chat_session' THEN RETURN 20;
  ELSIF event_name = 'roleplay_chat_turn' THEN RETURN 5;
  ELSIF event_name = 'ai_analysis_requested' THEN RETURN 10;
  
  -- Vault/engagement events (medium value)
  ELSIF event_name = 'vault_sync' THEN RETURN 15;
  ELSIF event_name = 'document_uploaded' THEN RETURN 20;
  ELSIF event_name = 'email_results_sent' THEN RETURN 10;
  
  -- Tool start events (lower value)
  ELSIF event_name LIKE '%_started' THEN RETURN 5;
  ELSIF event_name LIKE '%_viewed' THEN RETURN 2;
  
  -- Category-based fallbacks
  ELSIF event_category = 'tool' THEN RETURN 10;
  ELSIF event_category = 'vault' THEN RETURN 10;
  ELSIF event_category = 'conversion' THEN RETURN 25;
  ELSIF event_category = 'engagement' THEN RETURN 5;
  
  -- Time-based events
  ELSIF event_name = 'time_on_site_2min' THEN RETURN 10;
  
  -- Default for unknown events
  ELSE RETURN 2;
  END IF;
END;
$$;

-- Function to determine lead quality from score
CREATE OR REPLACE FUNCTION public.get_lead_quality(score INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF score >= 150 THEN RETURN 'qualified';
  ELSIF score >= 100 THEN RETURN 'hot';
  ELSIF score >= 50 THEN RETURN 'warm';
  ELSE RETURN 'cold';
  END IF;
END;
$$;

-- Function to recalculate and update lead score from all session events
CREATE OR REPLACE FUNCTION public.update_lead_score_from_session(p_session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_score INTEGER := 0;
  v_lead_quality TEXT;
BEGIN
  -- Calculate total score from all events in this session
  SELECT COALESCE(SUM(public.get_event_score(event_name, event_category)), 0)
  INTO v_total_score
  FROM public.wm_events
  WHERE session_id = p_session_id;
  
  -- Determine lead quality
  v_lead_quality := public.get_lead_quality(v_total_score);
  
  -- Update wm_leads if there's a lead linked to this session
  UPDATE public.wm_leads
  SET 
    engagement_score = v_total_score,
    lead_quality = v_lead_quality,
    updated_at = NOW()
  WHERE original_session_id = p_session_id;
  
  -- Also check if we can link via wm_sessions -> lead_id
  UPDATE public.wm_leads wl
  SET 
    engagement_score = GREATEST(wl.engagement_score, v_total_score),
    lead_quality = public.get_lead_quality(GREATEST(wl.engagement_score, v_total_score)),
    updated_at = NOW()
  FROM public.wm_sessions ws
  WHERE ws.id = p_session_id
    AND ws.lead_id IS NOT NULL
    AND wl.lead_id = ws.lead_id
    AND wl.original_session_id IS DISTINCT FROM p_session_id;
END;
$$;

-- Trigger function to update lead score when new events are inserted
CREATE OR REPLACE FUNCTION public.handle_new_event_scoring()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_score INTEGER;
  v_new_total INTEGER;
  v_lead_quality TEXT;
BEGIN
  -- Get score for this specific event
  v_event_score := public.get_event_score(NEW.event_name, NEW.event_category);
  
  -- Update any wm_leads linked to this session (add to existing score)
  UPDATE public.wm_leads
  SET 
    engagement_score = engagement_score + v_event_score,
    lead_quality = public.get_lead_quality(engagement_score + v_event_score),
    updated_at = NOW()
  WHERE original_session_id = NEW.session_id;
  
  -- Also update via wm_sessions -> lead_id linkage
  UPDATE public.wm_leads wl
  SET 
    engagement_score = wl.engagement_score + v_event_score,
    lead_quality = public.get_lead_quality(wl.engagement_score + v_event_score),
    updated_at = NOW()
  FROM public.wm_sessions ws
  WHERE ws.id = NEW.session_id
    AND ws.lead_id IS NOT NULL
    AND wl.lead_id = ws.lead_id
    AND wl.original_session_id IS DISTINCT FROM NEW.session_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on wm_events for real-time scoring
DROP TRIGGER IF EXISTS on_event_inserted_update_lead_score ON public.wm_events;
CREATE TRIGGER on_event_inserted_update_lead_score
AFTER INSERT ON public.wm_events
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_event_scoring();

-- Function to backfill scores for existing leads (one-time or manual use)
CREATE OR REPLACE FUNCTION public.backfill_all_lead_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Loop through all unique sessions that have linked leads
  FOR v_session_id IN 
    SELECT DISTINCT original_session_id 
    FROM public.wm_leads 
    WHERE original_session_id IS NOT NULL
  LOOP
    PERFORM public.update_lead_score_from_session(v_session_id);
  END LOOP;
END;
$$;