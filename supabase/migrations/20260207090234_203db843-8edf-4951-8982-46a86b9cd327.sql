-- ════════════════════════════════════════════════════════════════════════════
-- UNIFIED SCORING PLAN: Business Hierarchy Implementation
-- 
-- Tier 5: REVENUE (100 pts) - Sale closed, deposit received
-- Tier 4: HAND RAISER (60 pts) - Consultation, estimate request
-- Tier 3: ENGAGED (35 pts) - High-effort tools (scanner, audit, beat_quote)
-- Tier 2: CURIOUS (20 pts) - Lead captured (per user decision)
-- Tier 2 BASE: CURIOUS (10 pts) - Downloads, guides, quizzes
-- Tier 1: BROWSING (1-5 pts) - Page views, tool starts
-- ════════════════════════════════════════════════════════════════════════════

-- Step 1: Update get_event_score() with the new hierarchy
CREATE OR REPLACE FUNCTION public.get_event_score(event_name TEXT, event_category TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- ════════════════════════════════════════════════
  -- TIER 5: REVENUE (100 pts) - "The Best"
  -- ════════════════════════════════════════════════
  IF event_name IN ('sale_closed', 'deposit_received', 'deal_won') THEN 
    RETURN 100;
  
  -- ════════════════════════════════════════════════
  -- TIER 4: HAND RAISER (60 pts) - "Even Better"
  -- Actively asking for sales conversation
  -- ════════════════════════════════════════════════
  ELSIF event_name IN (
    'consultation_booked',
    'booking_confirmed',
    'request_estimate',
    'estimate_form_submitted',
    'voice_estimate_confirmed',
    'call_scheduled',
    'appointment_booked'
  ) THEN 
    RETURN 60;
  
  -- ════════════════════════════════════════════════
  -- TIER 3: ENGAGED (35 pts) - "Better"
  -- High-effort actions requiring work
  -- ════════════════════════════════════════════════
  ELSIF event_name IN (
    'quote_scanned',
    'quote_generated',
    'evidence_analyzed',
    'expert_chat_session',
    'roleplay_completed',
    'roleplay_game_completed',
    'document_uploaded',
    'sample_report_unlocked',
    'beat_quote_analyzed',
    'audit_completed',
    'quote_file_linked',
    'ai_analysis_requested'
  ) THEN 
    RETURN 35;
  
  -- ════════════════════════════════════════════════
  -- TIER 2+: CURIOUS+ (20 pts) - Lead capture
  -- User gave contact info (per user decision)
  -- ════════════════════════════════════════════════
  ELSIF event_name IN (
    'lead_captured',
    'email_captured',
    'vault_sync'
  ) THEN 
    RETURN 20;
  
  -- ════════════════════════════════════════════════
  -- TIER 2: CURIOUS (10 pts) - "Good"
  -- Gave contact info but not ready to buy
  -- ════════════════════════════════════════════════
  ELSIF event_name IN (
    'guide_downloaded',
    'fair_price_quiz_completed',
    'reality_check_completed',
    'risk_diagnostic_completed',
    'vulnerability_test_completed',
    'cost_calculator_completed',
    'fast_win_completed',
    'ebook_download',
    'intel_library_unlocked',
    'vault_email_sent'
  ) THEN 
    RETURN 10;
  
  -- ════════════════════════════════════════════════
  -- TIER 1: BROWSING (1-5 pts) - Passive engagement
  -- ════════════════════════════════════════════════
  ELSIF event_name LIKE '%_started' THEN RETURN 5;
  ELSIF event_name LIKE '%_viewed' THEN RETURN 2;
  ELSIF event_name = 'time_on_site_2min' THEN RETURN 5;
  ELSIF event_name = 'roleplay_chat_turn' THEN RETURN 2;
  ELSIF event_name = 'email_results_sent' THEN RETURN 5;
  
  -- ════════════════════════════════════════════════
  -- Category fallbacks
  -- ════════════════════════════════════════════════
  ELSIF event_category = 'conversion' THEN RETURN 35;
  ELSIF event_category = 'ai_tool' THEN RETURN 35;
  ELSIF event_category = 'tool' THEN RETURN 10;
  ELSIF event_category = 'vault' THEN RETURN 10;
  ELSIF event_category = 'engagement' THEN RETURN 3;
  
  -- Default for unknown events
  ELSE RETURN 1;
  END IF;
END;
$$;

-- Step 2: Update get_lead_quality() with new thresholds
CREATE OR REPLACE FUNCTION public.get_lead_quality(score INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- New hierarchy-aligned thresholds:
  -- qualified: 100+ (revenue event or multiple hot actions)
  -- hot: 60-99 (asked for estimate/consultation)
  -- engaged: 35-59 (used high-effort tool)
  -- curious: 10-34 (downloaded guide, gave email)
  -- window_shopper: 0-9 (just browsing)
  
  IF score >= 100 THEN RETURN 'qualified';
  ELSIF score >= 60 THEN RETURN 'hot';
  ELSIF score >= 35 THEN RETURN 'engaged';
  ELSIF score >= 10 THEN RETURN 'curious';
  ELSE RETURN 'window_shopper';
  END IF;
END;
$$;

-- Step 3: Also update score_to_level for consistency
CREATE OR REPLACE FUNCTION public.score_to_level(score integer)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN score >= 100 THEN 'Qualified'
    WHEN score >= 60 THEN 'Hot'
    WHEN score >= 35 THEN 'Engaged'
    WHEN score >= 10 THEN 'Curious'
    ELSE 'Window Shopper'
  END;
$$;

-- Step 4: Run backfill to recalculate all existing leads
SELECT public.backfill_all_lead_scores();