-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 6B: Executive Attribution & Revenue Lineage Layer
-- Purpose: Create wm_revenue_events table for post-conversion revenue tracking
-- 
-- CORE PRINCIPLE:
-- - lead_submission_success remains the ONLY bidding conversion
-- - Revenue events NEVER overwrite or replace conversion events
-- - This table is APPEND-ONLY and SEPARATE from wm_event_log
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. CREATE wm_revenue_events TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.wm_revenue_events (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ═══════════════════════════════════════════════════════════════════
    -- LINEAGE BINDING (required - links revenue to conversion)
    -- ═══════════════════════════════════════════════════════════════════
    lead_id uuid NOT NULL,                    -- Soft FK to leads table
    conversion_event_id uuid NOT NULL,        -- Soft FK to wm_event_log.event_id
    
    -- ═══════════════════════════════════════════════════════════════════
    -- REVENUE EVENT IDENTITY
    -- ═══════════════════════════════════════════════════════════════════
    revenue_event_id uuid NOT NULL DEFAULT gen_random_uuid(),
    revenue_stage text NOT NULL,              -- 'opportunity_created' | 'deal_won' | 'revenue_confirmed'
    event_time timestamptz NOT NULL DEFAULT now(),
    
    -- ═══════════════════════════════════════════════════════════════════
    -- DEAL & REVENUE DATA
    -- ═══════════════════════════════════════════════════════════════════
    deal_id text NULL,                        -- CRM deal/opportunity ID
    deal_name text NULL,                      -- Human-readable deal name
    revenue_amount numeric(12,2) NULL,        -- Revenue value
    currency text NOT NULL DEFAULT 'USD',     -- ISO 4217 currency code
    
    -- ═══════════════════════════════════════════════════════════════════
    -- IDENTITY ANCHORS (for cross-platform matching)
    -- ═══════════════════════════════════════════════════════════════════
    external_id text NULL,                    -- Same as lead_id (for CAPI compatibility)
    email_sha256 text NULL,                   -- SHA256 hash of normalized email
    phone_sha256 text NULL,                   -- SHA256 hash of E.164 phone
    
    -- ═══════════════════════════════════════════════════════════════════
    -- ATTRIBUTION SNAPSHOT (frozen at conversion time)
    -- ═══════════════════════════════════════════════════════════════════
    -- Traffic source (UTM)
    attr_utm_source text NULL,
    attr_utm_medium text NULL,
    attr_utm_campaign text NULL,
    attr_utm_term text NULL,
    attr_utm_content text NULL,
    
    -- Click IDs
    attr_fbclid text NULL,
    attr_gclid text NULL,
    attr_fbp text NULL,
    attr_fbc text NULL,
    
    -- Conversion context
    attr_source_tool text NULL,               -- Tool that captured the lead
    attr_landing_page text NULL,              -- First landing page
    attr_referrer text NULL,                  -- Original referrer
    attr_traffic_source text NULL,            -- Derived traffic source
    attr_campaign_id text NULL,               -- Campaign ID if available
    
    -- Scoring at conversion
    attr_lead_score int NULL,
    attr_intent_tier int NULL,
    
    -- ═══════════════════════════════════════════════════════════════════
    -- PROVENANCE
    -- ═══════════════════════════════════════════════════════════════════
    source_system text NOT NULL DEFAULT 'manual',  -- 'crm' | 'manual' | 'webhook'
    ingested_by text NOT NULL DEFAULT 'unknown',   -- Function/service that wrote this
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,   -- Additional context
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    
    -- ═══════════════════════════════════════════════════════════════════
    -- CONSTRAINTS
    -- ═══════════════════════════════════════════════════════════════════
    CONSTRAINT chk_revenue_stage CHECK (
        revenue_stage IN ('opportunity_created', 'deal_won', 'revenue_confirmed')
    ),
    CONSTRAINT chk_currency CHECK (
        currency ~ '^[A-Z]{3}$'
    )
);

COMMENT ON TABLE public.wm_revenue_events IS 
  'Phase 6: Append-only revenue lineage table. Links post-conversion revenue events to leads. Attribution frozen at insert. NEVER modifies wm_event_log.';


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. GUARDRAIL INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

-- Unique constraint: One revenue event per lead per stage
-- This prevents duplicate opportunity_created, deal_won, or revenue_confirmed per lead
CREATE UNIQUE INDEX uix_wm_revenue_events_lead_stage
ON public.wm_revenue_events (lead_id, revenue_stage);

COMMENT ON INDEX public.uix_wm_revenue_events_lead_stage IS 
  'Phase 6B: Enforces exactly one revenue event per lead per stage. Prevents duplicate revenue records.';

-- Unique constraint: Prevent duplicate revenue_event_id
CREATE UNIQUE INDEX uix_wm_revenue_events_event_id
ON public.wm_revenue_events (revenue_event_id);

COMMENT ON INDEX public.uix_wm_revenue_events_event_id IS 
  'Phase 6B: Prevents duplicate revenue_event_id values (replay protection).';

-- Performance indexes
CREATE INDEX idx_wm_revenue_events_lead_id 
ON public.wm_revenue_events(lead_id);

CREATE INDEX idx_wm_revenue_events_conversion_event_id 
ON public.wm_revenue_events(conversion_event_id);

CREATE INDEX idx_wm_revenue_events_deal_id 
ON public.wm_revenue_events(deal_id) 
WHERE deal_id IS NOT NULL;

CREATE INDEX idx_wm_revenue_events_event_time 
ON public.wm_revenue_events(event_time DESC);

CREATE INDEX idx_wm_revenue_events_stage 
ON public.wm_revenue_events(revenue_stage);

-- Attribution query optimization
CREATE INDEX idx_wm_revenue_events_utm_campaign 
ON public.wm_revenue_events(attr_utm_campaign) 
WHERE attr_utm_campaign IS NOT NULL;

CREATE INDEX idx_wm_revenue_events_source_tool 
ON public.wm_revenue_events(attr_source_tool) 
WHERE attr_source_tool IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. APPEND-ONLY ENFORCEMENT
-- ═══════════════════════════════════════════════════════════════════════════

-- Append-only enforcement function
CREATE OR REPLACE FUNCTION public.reject_update_delete_on_revenue_events()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'wm_revenue_events is append-only. UPDATE and DELETE are forbidden.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Append-only trigger
CREATE TRIGGER trg_reject_update_delete_revenue
BEFORE UPDATE OR DELETE ON public.wm_revenue_events
FOR EACH ROW EXECUTE FUNCTION public.reject_update_delete_on_revenue_events();


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE public.wm_revenue_events ENABLE ROW LEVEL SECURITY;

-- RLS policies: deny SELECT/INSERT for anon and authenticated (service role only)
CREATE POLICY "deny_anon_select" ON public.wm_revenue_events
AS RESTRICTIVE FOR SELECT TO anon USING (false);

CREATE POLICY "deny_anon_insert" ON public.wm_revenue_events
AS RESTRICTIVE FOR INSERT TO anon WITH CHECK (false);

CREATE POLICY "deny_auth_select" ON public.wm_revenue_events
AS RESTRICTIVE FOR SELECT TO authenticated USING (false);

CREATE POLICY "deny_auth_insert" ON public.wm_revenue_events
AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);

-- Belt-and-suspenders: deny UPDATE/DELETE for anon and authenticated
CREATE POLICY "deny_anon_update" ON public.wm_revenue_events
AS RESTRICTIVE FOR UPDATE TO anon USING (false);

CREATE POLICY "deny_anon_delete" ON public.wm_revenue_events
AS RESTRICTIVE FOR DELETE TO anon USING (false);

CREATE POLICY "deny_auth_update" ON public.wm_revenue_events
AS RESTRICTIVE FOR UPDATE TO authenticated USING (false);

CREATE POLICY "deny_auth_delete" ON public.wm_revenue_events
AS RESTRICTIVE FOR DELETE TO authenticated USING (false);


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. VERIFICATION QUERIES (run after migration)
-- ═══════════════════════════════════════════════════════════════════════════

-- Verify table exists:
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'wm_revenue_events';

-- Verify indexes:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'wm_revenue_events';

-- Verify constraints:
-- SELECT conname, contype FROM pg_constraint WHERE conrelid = 'wm_revenue_events'::regclass;

-- Verify trigger:
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'wm_revenue_events'::regclass;
