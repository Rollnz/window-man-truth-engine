# Phase 6: Executive Attribution & Revenue Lineage Layer

## Design Document

**Date:** January 23, 2026  
**Author:** Manus AI  
**Status:** Draft

---

## Core Principle

> **`lead_submission_success` remains the ONLY bidding conversion.**  
> Revenue events must NEVER overwrite or replace conversion events.

---

## 1. Revenue Event Taxonomy

The following post-conversion events track the lead's journey from conversion to revenue:

| Event Name | Stage | Description | Trigger Source |
|------------|-------|-------------|----------------|
| `opportunity_created` | Sales | Lead qualified and entered CRM pipeline | CRM webhook / manual |
| `deal_won` | Sales | Deal closed successfully | CRM webhook / manual |
| `revenue_confirmed` | Finance | Payment received and verified | Accounting system / manual |

### Event Flow

```
lead_submission_success (conversion) → opportunity_created → deal_won → revenue_confirmed
         ↓                                    ↓                  ↓              ↓
    wm_event_log                        wm_revenue_events   wm_revenue_events  wm_revenue_events
    (immutable)                         (append-only)       (append-only)      (append-only)
```

---

## 2. wm_revenue_events Schema

### Table Definition

```sql
CREATE TABLE public.wm_revenue_events (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ═══════════════════════════════════════════════════════════════════
    -- LINEAGE BINDING (required - links revenue to conversion)
    -- ═══════════════════════════════════════════════════════════════════
    lead_id uuid NOT NULL,                    -- FK to leads table (soft reference)
    conversion_event_id uuid NOT NULL,        -- FK to wm_event_log.event_id (the lead_submission_success)
    
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
    -- Traffic source
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
```

### Guardrail Indexes

```sql
-- Unique constraint: One revenue event per lead per stage
CREATE UNIQUE INDEX uix_wm_revenue_events_lead_stage
ON public.wm_revenue_events (lead_id, revenue_stage);

-- Unique constraint: Prevent duplicate revenue_event_id
CREATE UNIQUE INDEX uix_wm_revenue_events_event_id
ON public.wm_revenue_events (revenue_event_id);

-- Performance indexes
CREATE INDEX idx_wm_revenue_events_lead_id ON public.wm_revenue_events(lead_id);
CREATE INDEX idx_wm_revenue_events_conversion_event_id ON public.wm_revenue_events(conversion_event_id);
CREATE INDEX idx_wm_revenue_events_deal_id ON public.wm_revenue_events(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX idx_wm_revenue_events_event_time ON public.wm_revenue_events(event_time DESC);
CREATE INDEX idx_wm_revenue_events_stage ON public.wm_revenue_events(revenue_stage);
```

---

## 3. Guardrails

### 3.1 One Revenue Event Per Lead Per Stage

The unique constraint `uix_wm_revenue_events_lead_stage` ensures:
- A lead can only have ONE `opportunity_created` event
- A lead can only have ONE `deal_won` event
- A lead can only have ONE `revenue_confirmed` event

### 3.2 Lineage Key Requirement

Revenue writes require at least one lineage key. The `lead_id` is required (NOT NULL), ensuring every revenue event is traceable back to a conversion.

### 3.3 Append-Only Enforcement

```sql
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
```

---

## 4. Attribution Snapshot Layer

### 4.1 Snapshot Logic

When a revenue event is created, the attribution data is **frozen** from the original conversion event:

```sql
-- Function to populate attribution snapshot from conversion event
CREATE OR REPLACE FUNCTION public.populate_revenue_attribution()
RETURNS trigger AS $$
DECLARE
    conversion_record RECORD;
    session_record RECORD;
BEGIN
    -- Get conversion event data
    SELECT * INTO conversion_record
    FROM public.wm_event_log
    WHERE event_id = NEW.conversion_event_id
    LIMIT 1;
    
    -- Get session data if available
    IF conversion_record.session_id IS NOT NULL THEN
        SELECT * INTO session_record
        FROM public.wm_sessions
        WHERE id = conversion_record.session_id
        LIMIT 1;
    END IF;
    
    -- Populate attribution snapshot
    NEW.attr_source_tool := conversion_record.source_tool;
    NEW.attr_traffic_source := conversion_record.traffic_source;
    NEW.attr_campaign_id := conversion_record.campaign_id;
    NEW.attr_fbclid := conversion_record.fbclid;
    NEW.attr_gclid := conversion_record.gclid;
    NEW.attr_fbp := conversion_record.fbp;
    NEW.attr_fbc := conversion_record.fbc;
    NEW.attr_lead_score := conversion_record.lead_score;
    NEW.attr_intent_tier := conversion_record.intent_tier;
    
    -- Populate from session if available
    IF session_record IS NOT NULL THEN
        NEW.attr_utm_source := session_record.utm_source;
        NEW.attr_utm_medium := session_record.utm_medium;
        NEW.attr_utm_campaign := session_record.utm_campaign;
        NEW.attr_utm_term := session_record.utm_term;
        NEW.attr_utm_content := session_record.utm_content;
        NEW.attr_landing_page := session_record.landing_page;
        NEW.attr_referrer := session_record.referrer;
    END IF;
    
    -- Copy identity anchors from conversion
    NEW.email_sha256 := COALESCE(NEW.email_sha256, conversion_record.email_sha256);
    NEW.phone_sha256 := COALESCE(NEW.phone_sha256, conversion_record.phone_sha256);
    NEW.external_id := COALESCE(NEW.external_id, conversion_record.external_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-populate attribution on insert
CREATE TRIGGER trg_populate_revenue_attribution
BEFORE INSERT ON public.wm_revenue_events
FOR EACH ROW EXECUTE FUNCTION public.populate_revenue_attribution();
```

---

## 5. Executive Read Models

### 5.1 Daily Funnel Performance

```sql
CREATE VIEW public.v_daily_funnel_performance
WITH (security_invoker = true)
AS
SELECT
    DATE(e.event_time) AS date,
    COUNT(DISTINCT CASE WHEN e.event_name = 'lead_submission_success' THEN e.lead_id END) AS conversions,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.lead_id END) AS opportunities,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END) AS deals_won,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.lead_id END) AS revenue_confirmed,
    SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) AS total_deal_value,
    SUM(CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.revenue_amount ELSE 0 END) AS total_revenue
FROM public.wm_event_log e
LEFT JOIN public.wm_revenue_events r ON e.lead_id = r.lead_id
WHERE e.event_name = 'lead_submission_success'
GROUP BY DATE(e.event_time)
ORDER BY date DESC;
```

### 5.2 Campaign ROAS

```sql
CREATE VIEW public.v_campaign_roas
WITH (security_invoker = true)
AS
SELECT
    COALESCE(r.attr_utm_campaign, 'direct') AS campaign,
    COALESCE(r.attr_utm_source, 'organic') AS source,
    COALESCE(r.attr_utm_medium, 'none') AS medium,
    COUNT(DISTINCT r.lead_id) AS leads,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END) AS deals_won,
    SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) AS total_revenue,
    ROUND(
        SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) / 
        NULLIF(COUNT(DISTINCT r.lead_id), 0),
        2
    ) AS revenue_per_lead
FROM public.wm_revenue_events r
GROUP BY 
    COALESCE(r.attr_utm_campaign, 'direct'),
    COALESCE(r.attr_utm_source, 'organic'),
    COALESCE(r.attr_utm_medium, 'none')
ORDER BY total_revenue DESC;
```

### 5.3 Lead LTV

```sql
CREATE VIEW public.v_lead_ltv
WITH (security_invoker = true)
AS
SELECT
    r.lead_id,
    r.external_id,
    r.attr_source_tool AS acquisition_tool,
    r.attr_utm_campaign AS acquisition_campaign,
    MIN(e.event_time) AS conversion_date,
    MAX(CASE WHEN r.revenue_stage = 'deal_won' THEN r.event_time END) AS deal_date,
    MAX(CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.event_time END) AS revenue_date,
    SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) AS deal_value,
    SUM(CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.revenue_amount ELSE 0 END) AS confirmed_revenue,
    EXTRACT(DAY FROM MAX(CASE WHEN r.revenue_stage = 'deal_won' THEN r.event_time END) - MIN(e.event_time)) AS days_to_close
FROM public.wm_revenue_events r
JOIN public.wm_event_log e ON r.lead_id = e.lead_id AND e.event_name = 'lead_submission_success'
GROUP BY r.lead_id, r.external_id, r.attr_source_tool, r.attr_utm_campaign;
```

### 5.4 Source Profitability

```sql
CREATE VIEW public.v_source_profitability
WITH (security_invoker = true)
AS
SELECT
    COALESCE(r.attr_source_tool, 'unknown') AS source_tool,
    COUNT(DISTINCT r.lead_id) AS total_leads,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.lead_id END) AS opportunities,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END) AS deals_won,
    SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) AS total_revenue,
    ROUND(
        COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END)::numeric / 
        NULLIF(COUNT(DISTINCT r.lead_id), 0) * 100,
        2
    ) AS conversion_rate_pct,
    ROUND(
        SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) / 
        NULLIF(COUNT(DISTINCT r.lead_id), 0),
        2
    ) AS avg_revenue_per_lead
FROM public.wm_revenue_events r
GROUP BY COALESCE(r.attr_source_tool, 'unknown')
ORDER BY total_revenue DESC;
```

---

## 6. Safety Constraints Summary

| Constraint | Enforcement |
|------------|-------------|
| Revenue events never modify wm_event_log | Separate table, no FK mutations |
| Conversions remain immutable | wm_event_log has UPDATE/DELETE trigger |
| Revenue layer is append-only | wm_revenue_events has UPDATE/DELETE trigger |
| One revenue event per lead per stage | Unique index on (lead_id, revenue_stage) |
| Lineage required | lead_id is NOT NULL |
| Attribution frozen at insert | BEFORE INSERT trigger copies from conversion |

---

## 7. Backfill & Reconciliation Plan

### 7.1 Backfill Strategy

For existing leads with revenue data in CRM:

```sql
-- Backfill template (run once per stage)
INSERT INTO public.wm_revenue_events (
    lead_id,
    conversion_event_id,
    revenue_stage,
    deal_id,
    revenue_amount,
    currency,
    event_time,
    source_system,
    ingested_by
)
SELECT
    l.id AS lead_id,
    e.event_id AS conversion_event_id,
    'deal_won' AS revenue_stage,
    crm.deal_id,
    crm.deal_value AS revenue_amount,
    'USD' AS currency,
    crm.close_date AS event_time,
    'crm_backfill' AS source_system,
    'manual_migration' AS ingested_by
FROM external_crm_data crm
JOIN public.leads l ON crm.email = l.email
JOIN public.wm_event_log e ON l.id = e.lead_id AND e.event_name = 'lead_submission_success'
ON CONFLICT (lead_id, revenue_stage) DO NOTHING;
```

### 7.2 Reconciliation Queries

```sql
-- Find leads with conversions but no revenue events
SELECT 
    e.lead_id,
    e.event_time AS conversion_time,
    l.email
FROM public.wm_event_log e
JOIN public.leads l ON e.lead_id = l.id
LEFT JOIN public.wm_revenue_events r ON e.lead_id = r.lead_id
WHERE e.event_name = 'lead_submission_success'
  AND r.id IS NULL
ORDER BY e.event_time DESC;

-- Find revenue events without matching conversions (orphans)
SELECT 
    r.lead_id,
    r.revenue_stage,
    r.revenue_amount,
    r.event_time
FROM public.wm_revenue_events r
LEFT JOIN public.wm_event_log e ON r.lead_id = e.lead_id AND e.event_name = 'lead_submission_success'
WHERE e.id IS NULL;
```

---

## Next Steps

1. **Step 6B**: Execute the SQL migration to create `wm_revenue_events` table
2. **Step 6C**: Implement the attribution snapshot trigger
3. **Step 6D**: Create the executive read model views
4. **Step 6E**: Document backfill procedure for existing CRM data
