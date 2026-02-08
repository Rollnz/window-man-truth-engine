

# Updated Analytics Dashboard Migration — Optimized Indexes

## Index Optimizations Applied

Your requested changes have been incorporated:

### 1. Session Index — Composite with DESC ordering
```sql
-- OLD (single column):
CREATE INDEX IF NOT EXISTS idx_sessions_anonymous_id ON public.wm_sessions (anonymous_id);

-- NEW (composite for efficient sorting):
CREATE INDEX IF NOT EXISTS idx_sessions_client_created_desc 
    ON public.wm_sessions (anonymous_id, created_at DESC);
```

**Why this is faster:** The Attribution Gaps view uses a LATERAL join that finds the first session per client ordered by `created_at ASC`. With a descending index, Postgres can efficiently seek to the first row without scanning all sessions for that client.

### 2. Event Index — For Ghost Lead Detection
```sql
-- NEW (enables efficient JOIN in orphaned_events view):
CREATE INDEX IF NOT EXISTS idx_events_session_id 
    ON public.wm_events (session_id);
```

**Why this is needed:** The `analytics_orphaned_events` view joins `wm_events` to `wm_sessions` on `session_id`. Without this index, the join requires a full table scan.

---

## Complete SQL Migration (Ready to Execute)

```sql
-- Analytics Dashboard Views & AI-Ready Schema Migration
-- Adds analytics views for Truth Engine dashboard + prepares schema for AI features

-- ============================================================
-- PART 1: AI-Ready Columns on Leads Table
-- ============================================================
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS ai_psych_profile text,
ADD COLUMN IF NOT EXISTS ai_sales_hook text;

COMMENT ON COLUMN public.leads.ai_psych_profile IS 'AI-generated psychological profile for personalized outreach';
COMMENT ON COLUMN public.leads.ai_sales_hook IS 'AI-generated sales hook based on lead behavior and context';

-- ============================================================
-- PART 2: Analytics Daily Overview View
-- ============================================================
CREATE OR REPLACE VIEW public.analytics_daily_overview
WITH (security_invoker = true)
AS
SELECT
    DATE(s.created_at) AS date,
    COUNT(DISTINCT s.anonymous_id) AS visitors,
    COUNT(DISTINCT l.id) AS leads,
    ROUND(
        COUNT(DISTINCT l.id)::numeric / 
        NULLIF(COUNT(DISTINCT s.anonymous_id), 0) * 100,
        2
    ) AS conversion_rate,
    COUNT(DISTINCT CASE 
        WHEN e.event_name = 'quote_scanned' THEN e.id 
    END) AS quote_scans,
    COUNT(DISTINCT CASE 
        WHEN e.event_name IN ('cost_calculator_completed', 'calculator_completed') THEN e.id 
    END) AS calculator_completions,
    COUNT(DISTINCT CASE 
        WHEN e.event_name = 'risk_diagnostic_completed' THEN e.id 
    END) AS risk_assessments,
    COUNT(DISTINCT CASE 
        WHEN e.event_name = 'consultation_booked' THEN e.id 
    END) AS consultations_booked
FROM public.wm_sessions s
LEFT JOIN public.leads l ON DATE(l.created_at) = DATE(s.created_at) AND l.lead_status != 'spam'
LEFT JOIN public.wm_events e ON e.session_id = s.id
WHERE s.created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(s.created_at)
ORDER BY date DESC;

-- ============================================================
-- PART 3: Attribution Breakdown View
-- ============================================================
CREATE OR REPLACE VIEW public.analytics_attribution_breakdown
WITH (security_invoker = true)
AS
SELECT
    COALESCE(l.utm_source, '(direct)') AS utm_source,
    COALESCE(l.utm_medium, '(none)') AS utm_medium,
    COALESCE(l.utm_campaign, '(no campaign)') AS utm_campaign,
    COUNT(*) AS lead_count,
    COUNT(CASE WHEN l.lead_status = 'qualified' THEN 1 END) AS qualified_count,
    ROUND(
        COUNT(CASE WHEN l.lead_status = 'qualified' THEN 1 END)::numeric / 
        NULLIF(COUNT(*), 0) * 100,
        1
    ) AS qualification_rate,
    DATE(MIN(l.created_at)) AS first_seen,
    DATE(MAX(l.created_at)) AS last_seen
FROM public.leads l
WHERE l.created_at >= NOW() - INTERVAL '90 days'
  AND l.lead_status != 'spam'
GROUP BY 
    COALESCE(l.utm_source, '(direct)'),
    COALESCE(l.utm_medium, '(none)'),
    COALESCE(l.utm_campaign, '(no campaign)')
ORDER BY lead_count DESC;

-- ============================================================
-- PART 4: Tool Performance View
-- ============================================================
CREATE OR REPLACE VIEW public.analytics_tool_performance
WITH (security_invoker = true)
AS
SELECT
    l.source_tool,
    COUNT(*) AS total_leads,
    COUNT(CASE WHEN l.lead_status = 'qualified' THEN 1 END) AS qualified_leads,
    ROUND(
        COUNT(CASE WHEN l.lead_status = 'qualified' THEN 1 END)::numeric / 
        NULLIF(COUNT(*), 0) * 100,
        2
    ) AS qualification_rate,
    ROUND(AVG(l.lead_score_total), 1) AS avg_engagement_score
FROM public.leads l
WHERE l.created_at >= NOW() - INTERVAL '30 days'
  AND l.lead_status != 'spam'
GROUP BY l.source_tool
ORDER BY total_leads DESC;

-- ============================================================
-- PART 5: Attribution Gaps Detection View (Attribution Time Machine)
-- ============================================================
CREATE OR REPLACE VIEW public.analytics_attribution_gaps
WITH (security_invoker = true)
AS
SELECT 
    l.id AS lead_id,
    l.email,
    l.utm_source AS current_utm_source,
    l.utm_medium AS current_utm_medium,
    l.client_id,
    l.created_at AS lead_created_at,
    first_session.utm_source AS first_touch_utm_source,
    first_session.utm_medium AS first_touch_utm_medium,
    first_session.utm_campaign AS first_touch_utm_campaign,
    first_session.landing_page AS first_touch_landing_page,
    first_session.created_at AS first_touch_time,
    'Missing attribution can be healed from first touch' AS fix_reason
FROM public.leads l
CROSS JOIN LATERAL (
    SELECT 
        s.utm_source, 
        s.utm_medium, 
        s.utm_campaign,
        s.landing_page,
        s.created_at
    FROM public.wm_sessions s
    WHERE s.anonymous_id = l.client_id
      AND s.utm_source IS NOT NULL
    ORDER BY s.created_at ASC
    LIMIT 1
) first_session
WHERE 
    l.utm_source IS NULL 
    AND l.client_id IS NOT NULL
    AND first_session.utm_source IS NOT NULL
    AND l.created_at >= NOW() - INTERVAL '90 days'
    AND l.lead_status != 'spam';

-- ============================================================
-- PART 6: Orphaned Events Detection View (Ghost Lead Resurrector)
-- ============================================================
CREATE OR REPLACE VIEW public.analytics_orphaned_events
WITH (security_invoker = true)
AS
SELECT 
    e.id AS event_id,
    e.event_name,
    e.session_id,
    e.event_data,
    e.created_at,
    s.anonymous_id AS client_id,
    'Event exists but no matching lead found' AS issue
FROM public.wm_events e
JOIN public.wm_sessions s ON e.session_id = s.id
WHERE 
    e.event_name IN ('lead_submission_success', 'lead_captured', 'consultation_booked', 'form_submission')
    AND e.created_at >= NOW() - INTERVAL '30 days'
    AND NOT EXISTS (
        SELECT 1 FROM public.leads l 
        WHERE l.original_session_id = e.session_id
           OR l.client_id = s.anonymous_id
    )
ORDER BY e.created_at DESC
LIMIT 100;

-- ============================================================
-- PART 7: Spam Signals Detection View
-- ============================================================
CREATE OR REPLACE VIEW public.analytics_spam_signals
WITH (security_invoker = true)
AS
SELECT 
    l.id AS lead_id,
    l.email,
    l.ip_hash,
    l.created_at,
    l.lead_score_total,
    l.device_type,
    COUNT(*) OVER (PARTITION BY l.ip_hash) AS leads_from_same_ip,
    CASE 
        WHEN l.lead_score_total = 0 THEN 'zero_engagement'
        WHEN COUNT(*) OVER (PARTITION BY l.ip_hash) > 3 THEN 'ip_cluster'
        WHEN l.email LIKE '%test%' OR l.email LIKE '%fake%' OR l.email LIKE '%example.com' THEN 'suspicious_email'
        ELSE 'other'
    END AS spam_indicator
FROM public.leads l
WHERE 
    l.created_at >= NOW() - INTERVAL '30 days'
    AND l.lead_status != 'spam'
    AND (
        l.lead_score_total = 0 
        OR l.email LIKE '%test%' 
        OR l.email LIKE '%fake%'
        OR l.email LIKE '%example.com'
    )
ORDER BY l.created_at DESC;

-- ============================================================
-- PART 8: Blocked Traffic Table for Spam Management
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blocked_traffic (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_hash text NOT NULL,
    reason text NOT NULL DEFAULT 'spam',
    blocked_at timestamptz NOT NULL DEFAULT now(),
    blocked_by uuid REFERENCES auth.users(id),
    expires_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocked_traffic_ip_hash ON public.blocked_traffic (ip_hash);

-- Enable RLS on blocked_traffic
ALTER TABLE public.blocked_traffic ENABLE ROW LEVEL SECURITY;

-- Only admins can manage blocked traffic
CREATE POLICY "Admins can view blocked_traffic"
    ON public.blocked_traffic FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert blocked_traffic"
    ON public.blocked_traffic FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete blocked_traffic"
    ON public.blocked_traffic FOR DELETE
    USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- PART 9: Performance Indexes (OPTIMIZED per user request)
-- ============================================================

-- OPTIMIZED: Composite index for session lookups with chronological ordering
-- Supports the Attribution Gaps view's LATERAL join efficiently
CREATE INDEX IF NOT EXISTS idx_sessions_client_created_desc 
    ON public.wm_sessions (anonymous_id, created_at DESC);

-- NEW: Index for Ghost Lead detection - wm_events by session_id
CREATE INDEX IF NOT EXISTS idx_events_session_id 
    ON public.wm_events (session_id);

-- Index for lead lookups by client_id (Golden Thread)
CREATE INDEX IF NOT EXISTS idx_leads_client_id 
    ON public.leads (client_id) 
    WHERE client_id IS NOT NULL;

-- Index for spam detection by IP
CREATE INDEX IF NOT EXISTS idx_leads_ip_hash 
    ON public.leads (ip_hash) 
    WHERE ip_hash IS NOT NULL;
```

---

## Summary of Changes

| Component | Status |
|-----------|--------|
| AI Columns (`ai_psych_profile`, `ai_sales_hook`) | ✅ Included |
| 6 Analytics Views | ✅ Included |
| `blocked_traffic` Table + RLS | ✅ Included |
| Session Index (composite DESC) | ✅ **OPTIMIZED** |
| Events Index (session_id) | ✅ **ADDED** |
| Lead Indexes (client_id, ip_hash) | ✅ Included |

---

## Next Steps After Migration Approval

Once the database migration is approved and executed, I will proceed with:

1. **Step 0** — Update `attribution.ts` with early capture fallback
2. **Step 2** — Create edge functions (`admin-analytics`, `admin-fix-attribution`, etc.)
3. **Step 3** — Create `useAnalyticsDashboard` hook
4. **Step 4** — Build all UI components and replace `Analytics.tsx`

