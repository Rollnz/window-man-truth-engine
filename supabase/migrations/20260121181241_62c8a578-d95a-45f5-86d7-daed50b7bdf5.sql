-- 1. Create wm_event_log table
CREATE TABLE public.wm_event_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity (soft references, no FKs)
    client_id text NULL,
    lead_id uuid NULL,
    session_id uuid NULL,
    
    -- Event identity
    event_id uuid NOT NULL,
    event_name text NOT NULL,
    event_type text NOT NULL DEFAULT 'unknown',
    event_time timestamptz NOT NULL DEFAULT now(),
    
    -- External reference (GTM/CAPI compatible)
    external_id text NULL,
    
    -- Attribution (all nullable)
    source_tool text NULL,
    page_path text NULL,
    funnel_stage text NULL,
    intent_tier int NULL,
    
    -- Traffic attribution
    traffic_source text NULL,
    traffic_medium text NULL,
    campaign_id text NULL,
    fbclid text NULL,
    gclid text NULL,
    fbp text NULL,
    fbc text NULL,
    
    -- Scoring snapshot
    lead_score int NULL,
    
    -- Payloads
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    user_data jsonb NULL,
    
    -- Provenance
    source_system text NOT NULL DEFAULT 'web',
    ingested_by text NOT NULL DEFAULT 'unknown',
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.wm_event_log IS 'Append-only event ledger for attribution, CAPI replay, and audit. Does not control production logic.';

-- 2. Minimal indexes only (5 total)
CREATE UNIQUE INDEX uix_wm_event_log_event_id ON public.wm_event_log(event_id);
CREATE INDEX idx_wm_event_log_client_id ON public.wm_event_log(client_id);
CREATE INDEX idx_wm_event_log_lead_id ON public.wm_event_log(lead_id);
CREATE INDEX idx_wm_event_log_event_time_desc ON public.wm_event_log(event_time DESC);
CREATE INDEX idx_wm_event_log_metadata_gin ON public.wm_event_log USING GIN (metadata);

-- 3. Append-only enforcement function
CREATE OR REPLACE FUNCTION public.reject_update_delete_on_event_log()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'wm_event_log is append-only. UPDATE and DELETE are forbidden.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Append-only trigger
CREATE TRIGGER trg_reject_update_delete
BEFORE UPDATE OR DELETE ON public.wm_event_log
FOR EACH ROW EXECUTE FUNCTION public.reject_update_delete_on_event_log();

-- 5. Enable RLS
ALTER TABLE public.wm_event_log ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies: deny SELECT/INSERT for anon and authenticated
CREATE POLICY "deny_anon_select" ON public.wm_event_log
AS RESTRICTIVE FOR SELECT TO anon USING (false);

CREATE POLICY "deny_anon_insert" ON public.wm_event_log
AS RESTRICTIVE FOR INSERT TO anon WITH CHECK (false);

CREATE POLICY "deny_auth_select" ON public.wm_event_log
AS RESTRICTIVE FOR SELECT TO authenticated USING (false);

CREATE POLICY "deny_auth_insert" ON public.wm_event_log
AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);

-- 7. Belt-and-suspenders: deny UPDATE/DELETE for anon and authenticated (defense-in-depth)
CREATE POLICY "deny_anon_update" ON public.wm_event_log
AS RESTRICTIVE FOR UPDATE TO anon USING (false);

CREATE POLICY "deny_anon_delete" ON public.wm_event_log
AS RESTRICTIVE FOR DELETE TO anon USING (false);

CREATE POLICY "deny_auth_update" ON public.wm_event_log
AS RESTRICTIVE FOR UPDATE TO authenticated USING (false);

CREATE POLICY "deny_auth_delete" ON public.wm_event_log
AS RESTRICTIVE FOR DELETE TO authenticated USING (false);