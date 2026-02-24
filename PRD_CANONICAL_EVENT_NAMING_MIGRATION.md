# PRD: Canonical Event Naming Migration & GTM Parity
## itswindowman.com — Full-Stack AdTech Completion

**Status:** Ready for Implementation  
**Date:** February 24, 2026  
**Repo:** github.com/Rollnz/window-man-truth-engine  
**Live Site:** https://itswindowman.com  

---

## 0. EXECUTIVE CONTEXT — READ FIRST

The tracking infrastructure is enterprise-grade and largely complete. The `wmTracking.ts` library correctly defines 5 OPT conversion events with hardcoded dollar values, proper hashing, and Meta CAPI structure. The server-side GTM container (`GTM-PJZDXKH9`) and web container (`GTM-NHVFR5QZ`) exist and have active tags for `wm_lead` and `wm_scanner_upload`.

**The single blocking problem:** The backend still writes legacy event names to `wm_event_log`, so:

1. Admin dashboards break (SQL views only look for old names)
2. EMQ scoring in `admin-tracking-health` only measures old-name events
3. The canonical `wm_*` writes never persist to the DB, making attribution invisible
4. Three of the five OPT events have **no GTM tags at all** (wm_qualified_lead, wm_appointment_booked, wm_sold)

**This PRD describes the complete work required to fix all of the above.** Nothing here is a design decision — the architecture is already decided. This is an execution plan.

---

## 1. CURRENT STATE vs TARGET STATE

### 1.1 The 5 Canonical Conversion Events

| wm_* Event | DB Value | Meta Event Name | DB Write? | GTM Web Tag? | GTM Server Tag? |
|---|---|---|---|---|---|
| `wm_lead` | $10 | `Lead` | ❌ writes `lead_submission_success` | ✅ exists | ✅ exists |
| `wm_qualified_lead` | $100 | `Lead` (custom: QualifiedLead) | ❌ never written | ❌ missing | ❌ missing |
| `wm_scanner_upload` | $500 | `ScannerUpload` | ❌ writes `scanner_upload_completed` | ✅ exists | ✅ exists |
| `wm_appointment_booked` | $1000 | `Schedule` | ❌ writes `booking_confirmed` | ❌ missing | ❌ missing |
| `wm_sold` | $5000 + sale_amount | `Purchase` | ❌ never written | ❌ missing | ❌ missing |

### 1.2 DataLayer Payloads — Already Correct

All 5 events already fire correct, fully-structured payloads from `wmTracking.ts`. No frontend tracking code changes are needed. The payload structure verified in production (via `Data Layer Technical Audit: itswindowman.com.md`) is:

```json
{
  "event": "wm_lead",
  "event_id": "<leadId>",
  "meta": {
    "send": true,
    "category": "opt",
    "meta_event_name": "Lead",
    "value": 10,
    "currency": "USD",
    "wm_tracking_version": "1.0.0"
  },
  "value": 10,
  "currency": "USD",
  "external_id": "<leadId>",
  "lead_id": "<leadId>",
  "user_data": {
    "em": "<sha256_email>",
    "ph": "<sha256_phone>",
    "sha256_email_address": "<sha256_email>",
    "sha256_phone_number": "<sha256_phone>",
    "fn": "<sha256_first_name>",
    "ln": "<sha256_last_name>",
    "fbp": "<fb_cookie>",
    "fbc": "<fb_click_id>",
    "country": "us",
    "external_id": "<leadId>",
    "client_user_agent": "<ua>"
  }
}
```

`wm_scanner_upload` additionally includes `scan_attempt_id`.  
`wm_sold` additionally includes `sale_amount`.  
`wm_appointment_booked` additionally includes `appointment_type`.

---

## 2. SCOPE OF WORK — COMPLETE INVENTORY

### Section A: Code Changes (Backend — Supabase Edge Functions)
### Section B: Code Changes (Frontend — TypeScript)
### Section C: SQL Migration
### Section D: GTM Configuration (Web Container)
### Section E: GTM Configuration (Server Container)
### Section F: Test File Updates

---

## 3. SECTION A: BACKEND CODE CHANGES

### A1 — `supabase/functions/save-lead/index.ts`

**Problem:** Two references to the legacy event name `lead_submission_success` must become `wm_lead`.

#### Change 1 — Idempotency Check (line ~1244)

```typescript
// BEFORE:
.eq('event_name', 'lead_submission_success')

// AFTER:
.eq('event_name', 'wm_lead')
```

#### Change 2 — Insert Payload (line ~1271)

```typescript
// BEFORE:
event_name: 'lead_submission_success',

// AFTER:
event_name: 'wm_lead',
```

**Also update the log messages** on lines ~1253, ~1332, ~1335 for consistency:
```typescript
// BEFORE:
console.log('[wm_event_log] lead_submission_success written for lead:', leadId);
// AFTER:
console.log('[wm_event_log] wm_lead written for lead:', leadId);
```

**No other changes to this file.** All other payload fields (user_data, hashes, attribution, etc.) are already correct.

---

### A2 — `supabase/functions/upload-quote/index.ts`

**Problem:** The `event_name` in the wm_event_log insert is `scanner_upload_completed`. Must become `wm_scanner_upload`.

#### Change — Insert Payload (line ~366)

```typescript
// BEFORE:
event_name: "scanner_upload_completed",

// AFTER:
event_name: "wm_scanner_upload",
```

**Also update the event_type** to match the canonical tier:
```typescript
// BEFORE:
event_type: "signal",

// AFTER:
event_type: "conversion",
```

**No other changes to this file.** The payload already includes `lead_id`, `session_id`, `client_id`, `source_tool`, `page_path`, and `metadata`.

---

### A3 — `supabase/functions/admin-tracking-health/index.ts`

**Problem:** The `CONVERSION_EVENT_NAMES` array (line ~60) only contains legacy names. The EMQ score is computed only against these events, so `wm_*` events are invisible to the health dashboard.

#### Change — Replace CONVERSION_EVENT_NAMES array

```typescript
// BEFORE:
const CONVERSION_EVENT_NAMES = [
  'lead_submission_success',
  'lead_captured',
  'booking_confirmed',
  'consultation_booked',
  'phone_lead_captured',
  'voice_estimate_confirmed',
  'cv_fallback',
];

// AFTER:
const CONVERSION_EVENT_NAMES = [
  // Canonical wm_* names (new)
  'wm_lead',
  'wm_qualified_lead',
  'wm_scanner_upload',
  'wm_appointment_booked',
  'wm_sold',
  // Legacy names (dual-read during transition — remove after DB migration is clean)
  'lead_submission_success',
  'lead_captured',
  'booking_confirmed',
  'consultation_booked',
  'phone_lead_captured',
  'voice_estimate_confirmed',
  'cv_fallback',
];
```

**No other changes to this file.**

---

## 4. SECTION B: FRONTEND CODE CHANGES

### B1 — `src/lib/highValueSignals.ts`

**Problem:** The `HighValueSignal` type and all pre-configured functions use legacy event names (`scanner_upload_completed`, `booking_confirmed`). These write to `wm_event_log` via the `log-event` edge function. They must match the canonical names.

#### Change 1 — Update Type Definition (line ~23)

```typescript
// BEFORE:
export type HighValueSignal = 
  | 'scanner_upload_completed'
  | 'booking_confirmed'
  | 'voice_estimate_confirmed'
  | 'voice_estimate_identity';

// AFTER:
export type HighValueSignal = 
  | 'wm_scanner_upload'
  | 'wm_appointment_booked'
  | 'voice_estimate_confirmed'
  | 'voice_estimate_identity';
```

#### Change 2 — `logScannerCompleted` function (line ~257-273)

```typescript
// BEFORE:
return logHighValueSignal({
  eventName: 'scanner_upload_completed',
  ...
});

// AFTER:
return logHighValueSignal({
  eventName: 'wm_scanner_upload',
  ...
});
```

#### Change 3 — `logBookingConfirmed` function (line ~290-308)

```typescript
// BEFORE:
return logHighValueSignal({
  eventName: 'booking_confirmed',
  ...
});

// AFTER:
return logHighValueSignal({
  eventName: 'wm_appointment_booked',
  ...
});
```

**No other changes to this file.** The `logHighValueSignal` orchestration logic, PII handling, and fetch call are all correct.

---

### B2 — `src/lib/wmTracking.ts`

**Problem:** The `LEGACY_BRIDGE` map (lines 104-110) and `fireLegacyBridge` function (lines 270-288) fire duplicate old-name events to the dataLayer. Every OPT event currently fires its canonical name PLUS its legacy name as an RT event. Once GTM triggers are updated to the `wm_*` names, this bridge is redundant and causes noise.

**⚠️ DEPENDENCY:** Do NOT remove the bridge until GTM Web Container triggers have been switched from legacy names to `wm_*` names. Remove bridge AFTER GTM is updated.

#### Change 1 — Delete LEGACY_BRIDGE constant (lines 104-110)

```typescript
// DELETE entirely:
/** Legacy bridge map — each OPT event also fires the old name as RT during transition */
const LEGACY_BRIDGE: Partial<Record<WmOptEvent, string>> = {
  wm_lead: 'lead_submission_success',
  wm_scanner_upload: 'quote_upload_success',
  wm_appointment_booked: 'booking_confirmed',
  wm_qualified_lead: 'phone_lead_captured',
};
```

#### Change 2 — Delete `fireLegacyBridge` function (lines 270-288)

```typescript
// DELETE entirely:
function fireLegacyBridge(
  optEventName: WmOptEvent,
  context?: WmEventContext,
): void { ... }
```

#### Change 3 — Remove all `fireLegacyBridge(...)` call sites

Remove the `fireLegacyBridge(...)` call from each of the 4 OPT emitters:
- Line ~322: `fireLegacyBridge('wm_lead', context);` → DELETE
- Line ~365: `fireLegacyBridge('wm_qualified_lead', context);` → DELETE
- Line ~406: `fireLegacyBridge('wm_scanner_upload', context);` → DELETE
- Line ~433: `fireLegacyBridge('wm_appointment_booked', context);` → DELETE

Note: `wmSold` has no bridge call, no change needed there.

---

### B3 — `src/hooks/useQuoteUpload.ts`

**Problem:** On successful upload (line ~206), a standalone `trackEvent('quote_upload_success', ...)` call fires. This is redundant because `wmScannerUpload` is called by the parent component (`useQuoteScanner`). It also fires with no `meta` object, bypassing the GTM firewall.

#### Change — Remove the standalone trackEvent call

```typescript
// BEFORE (lines ~206-211):
trackEvent('quote_upload_success', {
  event_category: 'tool',
  tool_name: 'beat-your-quote',
  file_id: result.file_id,
  file_size: result.file_size,
});

// AFTER:
// (deleted — wm_scanner_upload fired by parent after lead capture)
```

**Note:** The `quote_upload_started` and `quote_upload_failed` trackEvent calls are internal analytics events (no `meta.category = 'opt'`) and should be left as-is. Only the `quote_upload_success` call on success is redundant.

---

### B4 — `src/config/toolDeltaValues.ts`

**Problem:** The `booking` key references `booking_confirmed` as its event name (line ~42). This is a RT (retargeting) event used by `useTrackToolCompletion` for audience building. It must match so that any GTM triggers looking for the booking event find the correct name.

#### Change — Update booking eventName

```typescript
// BEFORE:
'booking': {
  eventName: 'booking_confirmed',
  description: 'User confirmed a booking/appointment',
  tier: 4,
},

// AFTER:
'booking': {
  eventName: 'wm_appointment_booked',
  description: 'User confirmed a booking/appointment',
  tier: 4,
},
```

**Note:** This is a RT tier-4 event entry. The `eventName` here is what gets pushed to the dataLayer as a retargeting signal via `wmRetarget()`. The OPT event `wm_appointment_booked` is separately fired by `wmAppointmentBooked()` in ConsultationBookingModal.tsx. Both can coexist.

---

## 5. SECTION C: SQL MIGRATION

Create a new migration file: `supabase/migrations/20260224000000_canonical_event_names_dual_read.sql`

This migration uses **dual-read WHERE clauses** so existing historical data (old names) and new canonical data (wm_* names) both appear in dashboards. **Zero risk — no data is deleted or modified.**

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- Canonical Event Names: Dual-Read Migration
-- Purpose: Update all views and unique index to accept BOTH legacy event names
--          AND new wm_* canonical names. Zero-risk — existing data untouched.
-- 
-- VIEWS UPDATED (8 total):
--   v_duplicate_conversions
--   v_ledger_health_summary
--   v_writer_activity
--   v_conversion_integrity_check
--   v_daily_funnel_performance
--   v_lead_ltv
--   v_weekly_cohort_analysis
--   analytics_daily_overview
--
-- INDEX UPDATED (1):
--   uix_wm_event_log_lead_conversion
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. v_duplicate_conversions
-- Detects duplicate wm_lead (or legacy lead_submission_success) per lead_id
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_duplicate_conversions AS
SELECT
  lead_id,
  event_name,
  COUNT(*) AS duplicate_count,
  ARRAY_AGG(event_id ORDER BY event_time) AS event_ids,
  ARRAY_AGG(event_time ORDER BY event_time) AS event_times,
  ARRAY_AGG(ingested_by ORDER BY event_time) AS ingested_by_sources
FROM public.wm_event_log
WHERE event_name IN ('wm_lead', 'lead_submission_success')
  AND lead_id IS NOT NULL
GROUP BY lead_id, event_name
HAVING COUNT(*) > 1;

COMMENT ON VIEW public.v_duplicate_conversions IS
  'Dual-read: detects duplicate conversions for both wm_lead and lead_submission_success. Should return 0 rows.';


-- ─────────────────────────────────────────────────────────────────────────
-- 2. v_ledger_health_summary
-- Daily health metrics — counts both old and new lead event names
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_ledger_health_summary AS
SELECT
  DATE(event_time) AS event_date,
  COUNT(*) AS total_events,
  COUNT(DISTINCT event_id) AS unique_event_ids,
  COUNT(*) - COUNT(DISTINCT event_id) AS potential_duplicates,
  COUNT(CASE WHEN event_name IN ('wm_lead', 'lead_submission_success') THEN 1 END) AS conversions,
  COUNT(DISTINCT CASE WHEN event_name IN ('wm_lead', 'lead_submission_success') THEN lead_id END) AS unique_converted_leads,
  COUNT(CASE WHEN lead_id IS NULL THEN 1 END) AS orphan_events,
  COUNT(DISTINCT ingested_by) AS writer_count,
  ARRAY_AGG(DISTINCT ingested_by) AS writers
FROM public.wm_event_log
GROUP BY DATE(event_time)
ORDER BY event_date DESC;

COMMENT ON VIEW public.v_ledger_health_summary IS
  'Dual-read: daily ledger health. Counts wm_lead and lead_submission_success as conversions.';


-- ─────────────────────────────────────────────────────────────────────────
-- 3. v_writer_activity
-- Track which systems are writing to the ledger
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_writer_activity AS
SELECT
  ingested_by,
  source_system,
  source_tool,
  COUNT(*) AS event_count,
  COUNT(DISTINCT event_name) AS unique_event_types,
  ARRAY_AGG(DISTINCT event_name) AS event_names,
  MIN(event_time) AS first_write,
  MAX(event_time) AS last_write,
  COUNT(CASE WHEN event_name IN ('wm_lead', 'lead_submission_success') THEN 1 END) AS conversion_writes
FROM public.wm_event_log
GROUP BY ingested_by, source_system, source_tool
ORDER BY event_count DESC;

COMMENT ON VIEW public.v_writer_activity IS
  'Dual-read: writer activity tracking. Counts both wm_lead and lead_submission_success as conversion writes.';


-- ─────────────────────────────────────────────────────────────────────────
-- 4. v_conversion_integrity_check
-- Verify each lead has exactly one wm_lead or lead_submission_success event
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_conversion_integrity_check AS
SELECT
  l.id AS lead_id,
  l.email,
  l.created_at AS lead_created_at,
  COUNT(e.id) AS conversion_event_count,
  ARRAY_AGG(DISTINCT e.event_name) FILTER (WHERE e.id IS NOT NULL) AS found_event_names,
  CASE
    WHEN COUNT(e.id) = 0 THEN 'MISSING'
    WHEN COUNT(e.id) = 1 THEN 'OK'
    ELSE 'DUPLICATE'
  END AS integrity_status
FROM public.leads l
LEFT JOIN public.wm_event_log e
  ON l.id = e.lead_id
  AND e.event_name IN ('wm_lead', 'lead_submission_success')
GROUP BY l.id, l.email, l.created_at
ORDER BY
  CASE
    WHEN COUNT(e.id) = 0 THEN 1
    WHEN COUNT(e.id) > 1 THEN 2
    ELSE 3
  END,
  l.created_at DESC;

COMMENT ON VIEW public.v_conversion_integrity_check IS
  'Dual-read: cross-check leads vs wm_lead or lead_submission_success events. Flags MISSING or DUPLICATE.';


-- ─────────────────────────────────────────────────────────────────────────
-- 5. v_daily_funnel_performance
-- Daily funnel metrics anchored to wm_lead or lead_submission_success
-- ─────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.v_daily_funnel_performance CASCADE;

CREATE VIEW public.v_daily_funnel_performance
WITH (security_invoker = true)
AS
SELECT
    DATE(e.event_time) AS date,
    COUNT(DISTINCT e.lead_id) AS conversions,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.lead_id END) AS opportunities,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END) AS deals_won,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.lead_id END) AS revenue_confirmed,
    SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) AS total_deal_value,
    SUM(CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.revenue_amount ELSE 0 END) AS total_confirmed_revenue,
    ROUND(
        COUNT(DISTINCT CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.lead_id END)::numeric /
        NULLIF(COUNT(DISTINCT e.lead_id), 0) * 100, 2
    ) AS lead_to_opportunity_pct,
    ROUND(
        COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END)::numeric /
        NULLIF(COUNT(DISTINCT CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.lead_id END), 0) * 100, 2
    ) AS opportunity_to_deal_pct,
    ROUND(
        SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) /
        NULLIF(COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END), 0), 2
    ) AS avg_deal_value
FROM public.wm_event_log e
LEFT JOIN public.wm_revenue_events r ON e.lead_id = r.lead_id
WHERE e.event_name IN ('wm_lead', 'lead_submission_success')
GROUP BY DATE(e.event_time)
ORDER BY date DESC;

COMMENT ON VIEW public.v_daily_funnel_performance IS
  'Dual-read: daily funnel performance. Anchored to wm_lead or lead_submission_success.';

GRANT SELECT ON public.v_daily_funnel_performance TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 6. v_lead_ltv
-- Individual lead lifetime value — dual-read anchor
-- ─────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.v_lead_ltv CASCADE;

CREATE VIEW public.v_lead_ltv
WITH (security_invoker = true)
AS
SELECT
    e.lead_id,
    r.external_id,
    r.attr_source_tool AS acquisition_tool,
    r.attr_utm_campaign AS acquisition_campaign,
    r.attr_utm_source AS acquisition_source,
    MIN(e.event_time) AS conversion_date,
    MAX(CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.event_time END) AS opportunity_date,
    MAX(CASE WHEN r.revenue_stage = 'deal_won' THEN r.event_time END) AS deal_date,
    MAX(CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.event_time END) AS revenue_date,
    MAX(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount END) AS deal_value,
    MAX(CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.revenue_amount END) AS confirmed_revenue,
    MAX(r.deal_id) AS deal_id,
    MAX(r.deal_name) AS deal_name,
    MAX(r.attr_lead_score) AS lead_score,
    MAX(r.attr_intent_tier) AS intent_tier,
    EXTRACT(DAY FROM
        MAX(CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.event_time END) -
        MIN(e.event_time)
    ) AS days_to_opportunity,
    EXTRACT(DAY FROM
        MAX(CASE WHEN r.revenue_stage = 'deal_won' THEN r.event_time END) -
        MIN(e.event_time)
    ) AS days_to_close,
    CASE
        WHEN MAX(CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN 1 END) = 1 THEN 'revenue_confirmed'
        WHEN MAX(CASE WHEN r.revenue_stage = 'deal_won' THEN 1 END) = 1 THEN 'deal_won'
        WHEN MAX(CASE WHEN r.revenue_stage = 'opportunity_created' THEN 1 END) = 1 THEN 'opportunity_created'
        ELSE 'converted'
    END AS current_stage
FROM public.wm_event_log e
LEFT JOIN public.wm_revenue_events r ON e.lead_id = r.lead_id
WHERE e.event_name IN ('wm_lead', 'lead_submission_success')
GROUP BY e.lead_id, r.external_id, r.attr_source_tool, r.attr_utm_campaign, r.attr_utm_source;

COMMENT ON VIEW public.v_lead_ltv IS
  'Dual-read: individual lead lifetime value. Anchored to wm_lead or lead_submission_success.';

GRANT SELECT ON public.v_lead_ltv TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 7. v_weekly_cohort_analysis
-- Weekly cohort performance — dual-read anchor
-- ─────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.v_weekly_cohort_analysis CASCADE;

CREATE VIEW public.v_weekly_cohort_analysis
WITH (security_invoker = true)
AS
SELECT
    DATE_TRUNC('week', e.event_time)::date AS cohort_week,
    COUNT(DISTINCT e.lead_id) AS cohort_size,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'opportunity_created' THEN r.lead_id END) AS opportunities,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END) AS deals_won,
    COUNT(DISTINCT CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN r.lead_id END) AS revenue_confirmed,
    SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) AS total_revenue,
    ROUND(
        COUNT(DISTINCT CASE WHEN r.revenue_stage = 'deal_won' THEN r.lead_id END)::numeric /
        NULLIF(COUNT(DISTINCT e.lead_id), 0) * 100, 2
    ) AS cohort_conversion_pct,
    ROUND(
        SUM(CASE WHEN r.revenue_stage = 'deal_won' THEN r.revenue_amount ELSE 0 END) /
        NULLIF(COUNT(DISTINCT e.lead_id), 0), 2
    ) AS revenue_per_cohort_lead
FROM public.wm_event_log e
LEFT JOIN public.wm_revenue_events r ON e.lead_id = r.lead_id
WHERE e.event_name IN ('wm_lead', 'lead_submission_success')
GROUP BY DATE_TRUNC('week', e.event_time)::date
ORDER BY cohort_week DESC;

COMMENT ON VIEW public.v_weekly_cohort_analysis IS
  'Dual-read: weekly cohort analysis. Anchored to wm_lead or lead_submission_success.';

GRANT SELECT ON public.v_weekly_cohort_analysis TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 8. analytics_daily_overview
-- Add wm_lead counting alongside existing lead tracking
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.analytics_daily_overview
WITH (security_invoker = true)
AS
SELECT
    DATE(s.created_at) AS date,
    COUNT(DISTINCT s.anonymous_id) AS visitors,
    COUNT(DISTINCT l.id) AS leads,
    ROUND(
        COUNT(DISTINCT l.id)::numeric /
        NULLIF(COUNT(DISTINCT s.anonymous_id), 0) * 100, 2
    ) AS conversion_rate,
    COUNT(DISTINCT CASE
        WHEN e.event_name IN ('wm_scanner_upload', 'scanner_upload_completed', 'quote_scanned') THEN e.id
    END) AS quote_scans,
    COUNT(DISTINCT CASE
        WHEN e.event_name IN ('cost_calculator_completed', 'calculator_completed') THEN e.id
    END) AS calculator_completions,
    COUNT(DISTINCT CASE
        WHEN e.event_name = 'risk_diagnostic_completed' THEN e.id
    END) AS risk_assessments,
    COUNT(DISTINCT CASE
        WHEN e.event_name IN ('wm_appointment_booked', 'consultation_booked') THEN e.id
    END) AS consultations_booked,
    -- New: canonical event counts
    COUNT(DISTINCT CASE WHEN e.event_name = 'wm_lead' THEN e.lead_id END) AS wm_leads,
    COUNT(DISTINCT CASE WHEN e.event_name = 'wm_qualified_lead' THEN e.lead_id END) AS wm_qualified_leads,
    COUNT(DISTINCT CASE WHEN e.event_name = 'wm_scanner_upload' THEN e.lead_id END) AS wm_scanner_uploads,
    COUNT(DISTINCT CASE WHEN e.event_name = 'wm_appointment_booked' THEN e.lead_id END) AS wm_appointments,
    COUNT(DISTINCT CASE WHEN e.event_name = 'wm_sold' THEN e.lead_id END) AS wm_sales
FROM public.wm_sessions s
LEFT JOIN public.leads l ON DATE(l.created_at) = DATE(s.created_at) AND l.lead_status != 'spam'
LEFT JOIN public.wm_event_log e ON e.session_id = s.id
WHERE s.created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(s.created_at)
ORDER BY date DESC;


-- ─────────────────────────────────────────────────────────────────────────
-- 9. Unique Index — Expand to cover wm_lead alongside lead_submission_success
--
-- The existing index `uix_wm_event_log_lead_conversion` only covers
-- `lead_submission_success`. We need to also protect `wm_lead` from duplicates.
-- We cannot change a partial WHERE clause on an existing index without dropping.
-- Strategy: drop the old index and create two new ones.
-- ─────────────────────────────────────────────────────────────────────────

-- Drop old index (idempotent, IF EXISTS)
DROP INDEX IF EXISTS public.uix_wm_event_log_lead_conversion;

-- New index 1: one wm_lead per lead_id
CREATE UNIQUE INDEX IF NOT EXISTS uix_wm_event_log_wm_lead
ON public.wm_event_log (lead_id, event_name)
WHERE event_name = 'wm_lead' AND lead_id IS NOT NULL;

COMMENT ON INDEX public.uix_wm_event_log_wm_lead IS
  'Enforces exactly one wm_lead event per lead_id. Canonical idempotency lock.';

-- New index 2: one lead_submission_success per lead_id (backward compat)
CREATE UNIQUE INDEX IF NOT EXISTS uix_wm_event_log_legacy_lead
ON public.wm_event_log (lead_id, event_name)
WHERE event_name = 'lead_submission_success' AND lead_id IS NOT NULL;

COMMENT ON INDEX public.uix_wm_event_log_legacy_lead IS
  'Enforces exactly one lead_submission_success per lead_id. Legacy idempotency lock — remove after full migration.';

-- New index 3: one wm_scanner_upload per lead_id
CREATE UNIQUE INDEX IF NOT EXISTS uix_wm_event_log_wm_scanner_upload
ON public.wm_event_log (lead_id, event_name)
WHERE event_name = 'wm_scanner_upload' AND lead_id IS NOT NULL;

COMMENT ON INDEX public.uix_wm_event_log_wm_scanner_upload IS
  'Enforces exactly one wm_scanner_upload per lead_id.';
```

---

## 6. SECTION D: GTM WEB CONTAINER (GTM-NHVFR5QZ)

This section describes what must be configured in the GTM UI. There is no code to write here — it is GTM container configuration.

### D1 — Existing Tags (Verify / Leave Alone)

These tags already exist and are working. Verify they use the correct firewall condition:

| Tag Name | Trigger Event | Verification |
|---|---|---|
| Meta Pixel — `wm_lead` | `wm_lead` | Must have condition: `meta.category equals opt` |
| Meta Pixel — `wm_scanner_upload` | `wm_scanner_upload` | Must have condition: `meta.category equals opt` |

### D2 — New Triggers Required (3)

Create three Custom Event triggers:

| Trigger Name | Trigger Type | Event Name Field | Additional Conditions |
|---|---|---|---|
| `CE - wm_qualified_lead` | Custom Event | `wm_qualified_lead` | None (GTM firewall handles opt filtering in tags) |
| `CE - wm_appointment_booked` | Custom Event | `wm_appointment_booked` | None |
| `CE - wm_sold` | Custom Event | `wm_sold` | None |

### D3 — New Variables Required (if not already present)

Check if these Data Layer Variables exist. Create if missing:

| Variable Name | Variable Type | Data Layer Key | Notes |
|---|---|---|---|
| `DLV - event_id` | Data Layer Variable | `event_id` | For CAPI deduplication — critical |
| `DLV - value` | Data Layer Variable | `value` | Monetary value for bidding |
| `DLV - currency` | Data Layer Variable | `currency` | Always "USD" |
| `DLV - user_data` | Data Layer Variable | `user_data` | Full object with em, ph, fn, ln, fbp, fbc |
| `DLV - lead_id` | Data Layer Variable | `lead_id` | For custom_data passthrough |
| `DLV - meta.category` | Data Layer Variable | `meta.category` | For GTM firewall condition |
| `DLV - sale_amount` | Data Layer Variable | `sale_amount` | wm_sold specific |
| `DLV - appointment_type` | Data Layer Variable | `appointment_type` | wm_appointment_booked specific |

### D4 — New GA4 Tag (Forwards to Server Container)

Create one GA4 Event tag that handles all three new events:

| Setting | Value |
|---|---|
| **Tag Name** | `GA4 - Mid & Low Funnel Events` |
| **Tag Type** | Google Analytics: GA4 Event |
| **Configuration Tag** | `GA4 - Base Config` (existing) |
| **Event Name** | `{{Event}}` (dynamic — reads the dataLayer event name) |
| **Firing Triggers** | `CE - wm_qualified_lead`, `CE - wm_appointment_booked`, `CE - wm_sold` |

**Event Parameters on this GA4 tag:**

| Parameter Name | Value |
|---|---|
| `event_id` | `{{DLV - event_id}}` |
| `lead_id` | `{{DLV - lead_id}}` |
| `value` | `{{DLV - value}}` |
| `currency` | `{{DLV - currency}}` |
| `user_data` | `{{DLV - user_data}}` |
| `sale_amount` | `{{DLV - sale_amount}}` |
| `appointment_type` | `{{DLV - appointment_type}}` |

**Important:** This GA4 tag sends to the server container. The server container then fires the Meta CAPI tags. The GA4 tag itself does NOT fire directly to Meta.

### D5 — Google Enhanced Conversions (Already Active — Verify Only)

Enhanced Conversions data is already included in every OPT event via `user_data.sha256_email_address` and `user_data.sha256_phone_number`. Verify the existing Google Ads Enhanced Conversions tag reads from:
- `user_data.sha256_email_address` → Enhanced Conversions email field
- `user_data.sha256_phone_number` → Enhanced Conversions phone field

No changes needed to EC unless the tags are broken.

---

## 7. SECTION E: GTM SERVER CONTAINER (GTM-PJZDXKH9)

### E1 — Existing Tags (Verify / Leave Alone)

| Tag Name | Trigger Event | Meta Event Name | Verify |
|---|---|---|---|
| Meta CAPI — `wm_lead` → `Lead` | `wm_lead` | `Lead` | event_id, value, user_data mapped |
| Meta CAPI — `wm_scanner_upload` → `ScannerUpload` | `wm_scanner_upload` | `ScannerUpload` | value=$500, event_id mapped |

### E2 — New Server-Side Variables (if not present)

| Variable Name | Variable Type | Event Data Key |
|---|---|---|
| `ED - event_id` | Event Data | `event_id` |
| `ED - value` | Event Data | `value` |
| `ED - currency` | Event Data | `currency` |
| `ED - user_data` | Event Data | `user_data` |
| `ED - lead_id` | Event Data | `lead_id` |
| `ED - sale_amount` | Event Data | `sale_amount` |
| `ED - appointment_type` | Event Data | `appointment_type` |

### E3 — New Server Triggers (3)

| Trigger Name | Condition |
|---|---|
| `Event - wm_qualified_lead` | Event Name equals `wm_qualified_lead` |
| `Event - wm_appointment_booked` | Event Name equals `wm_appointment_booked` |
| `Event - wm_sold` | Event Name equals `wm_sold` |

### E4 — New Meta CAPI Tags (3)

#### Tag 1: `Meta CAPI - QualifiedLead`

| Setting | Value |
|---|---|
| **Tag Name** | `Meta CAPI - QualifiedLead` |
| **Tag Type** | Facebook Conversion API (Stape.io template) |
| **Firing Trigger** | `Event - wm_qualified_lead` |
| **Meta Pixel ID** | `1908588773426244` |
| **API Access Token** | `{{CAPI Access Token}}` (existing variable) |
| **Meta Event Name** | `Lead` |
| **Action Source** | `website` |

**Parameter Mapping:**

| CAPI Field | Variable |
|---|---|
| **Event ID** (deduplication) | `{{ED - event_id}}` |
| Value | `{{ED - value}}` |
| Currency | `{{ED - currency}}` |
| Email (hashed) | `{{ED - user_data.em}}` |
| Phone (hashed) | `{{ED - user_data.ph}}` |
| External ID | `{{ED - lead_id}}` |
| custom_data.lead_id | `{{ED - lead_id}}` |
| custom_data.event_type | `qualified_lead` (static string — differentiates from wm_lead's Lead event) |

**Rationale:** Meta has no standard `QualifiedLead` event. We use `Lead` with `custom_data.event_type = "qualified_lead"`. This allows creating a Meta Custom Conversion filtered to this event_type, enabling separate optimization.

---

#### Tag 2: `Meta CAPI - Schedule`

| Setting | Value |
|---|---|
| **Tag Name** | `Meta CAPI - Schedule` |
| **Tag Type** | Facebook Conversion API (Stape.io template) |
| **Firing Trigger** | `Event - wm_appointment_booked` |
| **Meta Pixel ID** | `1908588773426244` |
| **Meta Event Name** | `Schedule` |
| **Action Source** | `website` |

**Parameter Mapping:**

| CAPI Field | Variable |
|---|---|
| **Event ID** (deduplication) | `{{ED - event_id}}` |
| Value | `{{ED - value}}` |
| Currency | `{{ED - currency}}` |
| Email (hashed) | `{{ED - user_data.em}}` |
| Phone (hashed) | `{{ED - user_data.ph}}` |
| External ID | `{{ED - lead_id}}` |
| custom_data.lead_id | `{{ED - lead_id}}` |
| custom_data.appointment_type | `{{ED - appointment_type}}` |

---

#### Tag 3: `Meta CAPI - Purchase`

| Setting | Value |
|---|---|
| **Tag Name** | `Meta CAPI - Purchase` |
| **Tag Type** | Facebook Conversion API (Stape.io template) |
| **Firing Trigger** | `Event - wm_sold` |
| **Meta Pixel ID** | `1908588773426244` |
| **Meta Event Name** | `Purchase` |
| **Action Source** | `website` |

**Parameter Mapping:**

| CAPI Field | Variable |
|---|---|
| **Event ID** (deduplication) | `{{ED - event_id}}` |
| Value | `{{ED - value}}` (this is $5000 + sale_amount, already computed in wmSold()) |
| Currency | `{{ED - currency}}` |
| Email (hashed) | `{{ED - user_data.em}}` |
| Phone (hashed) | `{{ED - user_data.ph}}` |
| External ID | `{{ED - lead_id}}` |
| custom_data.lead_id | `{{ED - lead_id}}` |
| custom_data.sale_amount | `{{ED - sale_amount}}` |

---

## 8. SECTION F: TEST FILE UPDATES

### F1 — `src/lib/__tests__/wmTracking.test.ts`

Remove all assertions that verify legacy bridge events fire. These tests will fail after the bridge is deleted in B2.

**Tests to delete:**

```typescript
// In describe('wmLead') — DELETE this test block:
it('fires legacy bridge lead_submission_success as RT (no value)', async () => {
  ...
  const bridge = mockDataLayer.find(e => e.event === 'lead_submission_success');
  expect(bridge).toBeDefined();
  ...
});

// In describe('wmQualifiedLead') — DELETE this test block:
it('fires legacy bridge phone_lead_captured as RT', async () => {
  ...
  const bridge = mockDataLayer.find(e => e.event === 'phone_lead_captured');
  expect(bridge).toBeDefined();
  ...
});

// In describe('wmScannerUpload') — DELETE this test block:
it('fires legacy bridge quote_upload_success as RT', async () => {
  ...
  const bridge = mockDataLayer.find(e => e.event === 'quote_upload_success');
  expect(bridge).toBeDefined();
  ...
});

// In describe('wmAppointmentBooked') — DELETE this test block:
it('fires legacy bridge booking_confirmed as RT', async () => {
  ...
  const bridge = mockDataLayer.find(e => e.event === 'booking_confirmed');
  expect(bridge).toBeDefined();
  ...
});
```

**Also update the meta field consistency test** to reflect that only 5 OPT events fire (no bridge events alongside them):

```typescript
// In describe('meta field structure'):
it('all OPT events include meta with wm_tracking_version', async () => {
  await wmLead({ leadId: 'a', email: 'a@b.com' });
  await wmQualifiedLead({ leadId: 'b', email: 'b@b.com' });
  await wmScannerUpload({ leadId: 'c' }, 'scan-meta');
  await wmAppointmentBooked({ leadId: 'd' }, 'key-1');
  await wmSold({ leadId: 'e' }, 1000, 'deal-1');

  // BEFORE: filters for wm_* prefix (was 5 OPT + up to 4 bridge events in mock)
  // AFTER: only wm_* events exist — bridge is gone
  const optEvents = mockDataLayer.filter(e =>
    typeof e.event === 'string' && (e.event as string).startsWith('wm_')
  );
  expect(optEvents.length).toBe(5); // This line stays the same — bridge events had old names
  ...
});
```

### F2 — `src/lib/__tests__/gtm-tracking.test.ts`

Remove legacy bridge assertions in this file:

```typescript
// In describe('wmLead') — DELETE:
it('should fire legacy bridge lead_submission_success as RT', async () => { ... });

// Any other bridge assertions — DELETE
```

---

## 9. DEDUPLICATION STRATEGY — HOW IT WORKS END-TO-END

Understanding this prevents breaking the system:

```
User Action
    │
    ▼
Browser fires wm_* event to dataLayer
    │  (event_id = deterministic UUID)
    ├──▶ GTM Web Container picks up
    │        ├──▶ GA4 tag sends to Server Container
    │        │        └──▶ Server CAPI tag → Meta (server-side)
    │        └──▶ Meta Pixel fires (browser-side)
    │
    └──▶ Both reach Meta Events Manager
             └──▶ Meta deduplicates by matching event_id + event_name
                  └──▶ Counts ONCE ✓

wm_lead event_id format: `<leadId>` (bare UUID — matches server-side CAPI event_id)
wm_qualified_lead:       `ql:<leadId>`
wm_scanner_upload:       `upload:<scanAttemptId>`
wm_appointment_booked:   `appt:<leadId>:<appointmentKey>`
wm_sold:                 `sold:<leadId>:<dealKey>`
```

The server-side CAPI (in save-lead, upload-quote edge functions) must use the **same event_id format** as the browser. The browser uses `identity.leadId` as the bare event_id for `wm_lead`. The edge function uses `crypto.randomUUID()` — **this is a known deduplication risk for wm_lead specifically.** The server writes a new UUID, the browser writes the leadId. Meta sees two different event_ids and counts twice.

**Resolution:** The `save-lead` edge function should set `event_id: leadId` (not a random UUID) so it matches the browser's event_id. This is the intent of `P0-B` in wmTracking.ts comments.

Add this to the save-lead edge function payload:

```typescript
// In eventLogPayload in save-lead/index.ts:
event_id: leadId,  // Use leadId as event_id to match browser-side wm_lead event_id
```

---

## 10. EMQ SCORING — PATH TO 9+

The `admin-tracking-health` edge function computes EMQ by measuring what percentage of conversion events have each PII field. After Section A3 is applied:

| Signal | Field in wm_event_log | Weight | Target |
|---|---|---|---|
| Email | `email_sha256` / `user_data.em` | 3.0 (highest) | 100% (all leads have email) |
| Phone | `phone_sha256` / `user_data.ph` | 2.5 | ~70% (phone optional but common) |
| FBP Cookie | `fbp` | 1.5 | ~80% (Meta Pixel cookie) |
| FBC Click ID | `fbc` | 1.0 | ~40% (only paid Meta clicks) |
| First Name | `user_data.fn` | 0.5 | ~60% |
| Last Name | `user_data.ln` | 0.5 | ~60% |

**Expected EMQ with current data:** ~8.5–9.2 depending on phone capture rate.

**To push above 9.0:** Increase phone capture rate on forms. The forms that use `wmLead` currently pass email; all forms must also pass `phone` when available from the lead object.

Verify each form's `wmLead()` call includes `phone` from the captured lead:

```typescript
// Every wmLead() call should look like this:
await wmLead({
  leadId: capturedLead.id,
  email: capturedLead.email,
  phone: capturedLead.phone,       // ← must be passed
  firstName: capturedLead.first_name,
  lastName: capturedLead.last_name,
  zipCode: capturedLead.zip,
}, context);
```

Check these files for missing phone passthrough:
- `src/components/conversion/EbookLeadModal.tsx`
- `src/components/conversion/KitchenTableGuideModal.tsx`
- `src/components/conversion/SalesTacticsGuideModal.tsx`
- `src/components/conversion/SpecChecklistGuideModal.tsx`
- `src/components/conversion/LeadCaptureModal.tsx`
- `src/components/quote-builder/LeadModal.tsx`
- `src/components/beat-your-quote/MissionInitiatedModal.tsx`

---

## 11. FORMS REUSE MAP

Multiple forms reuse the same underlying lead submission flow. Here is where each wm_lead fires from and what data it has access to:

| Form Component | Source Tool | Has Phone? | Has Name? | Notes |
|---|---|---|---|---|
| `PreQuoteLeadModalV2.tsx` | varies by page | ✅ | ✅ | Main lead modal — also fires wmQualifiedLead |
| `MissionInitiatedModal.tsx` | `beat-your-quote` | ✅ | ✅ | Beat Your Quote success modal |
| `ConsultationBookingModal.tsx` | varies | ✅ | ✅ | Also fires wmAppointmentBooked |
| `EbookLeadModal.tsx` | `intel-library` | ❌ | ❌ | Email only — no phone field |
| `KitchenTableGuideModal.tsx` | `kitchen-table-guide` | ❌ | ❌ | Email only |
| `SalesTacticsGuideModal.tsx` | varies | ❌ | ❌ | Email only |
| `SpecChecklistGuideModal.tsx` | varies | ❌ | ❌ | Email only |
| `LeadCaptureModal.tsx` | varies | varies | varies | Generic modal |
| `ScannerLeadCaptureModal.tsx` | `quote-scanner` | ✅ | ✅ | Always followed by wmScannerUpload |
| `QuizResults.tsx` (fair-price-quiz) | `fair-price-quiz` | varies | varies | Fires wmQualifiedLead only |
| `LeadModal.tsx` (quote-builder) | `quote-builder` | varies | varies | Quote builder gate |

**Action:** For email-only modals, the EMQ hit is acceptable (email hash alone gives high score). No UX change needed. However, if these forms collect phone at a later step, pass it to wmLead retroactively via the identity reconciliation system.

---

## 12. ADMIN PAGES — WHAT MUST KEEP WORKING

The following admin pages query the views and edge functions modified in this PRD. After the migration, verify all still function:

| Admin Page | Data Source | Dependent On |
|---|---|---|
| `/admin/tracking-health` | `admin-tracking-health` edge function | Section A3 (CONVERSION_EVENT_NAMES) |
| `/admin/analytics` | `admin-analytics` edge function + `analytics_daily_overview` | Section C (SQL migration) |
| `/admin/revenue` | `v_daily_funnel_performance`, `v_lead_ltv` | Section C (SQL migration) |
| `/admin/attribution` | `admin-attribution-roas`, `v_campaign_roas` | Unchanged |
| Any lead detail page | `admin-lead-detail` edge function | Unchanged |

---

## 13. IMPLEMENTATION ORDER

Execute in this exact sequence to avoid breaking production at any point:

### Phase 1 — Database First (zero-risk)
1. Deploy `supabase/migrations/20260224000000_canonical_event_names_dual_read.sql`
2. Verify admin dashboards still work (should show same data as before + new wm_* columns once new events start flowing)

### Phase 2 — Backend Writers (start writing canonical names)
3. Deploy `save-lead` edge function changes (A1)
4. Deploy `upload-quote` edge function changes (A2)
5. Deploy `admin-tracking-health` edge function changes (A3)
6. Submit a test lead and verify `wm_event_log` shows `wm_lead` not `lead_submission_success`
7. Upload a test quote and verify `wm_event_log` shows `wm_scanner_upload`

### Phase 3 — Frontend Signal Names (fix highValueSignals DB writes)
8. Deploy `highValueSignals.ts` changes (B1)
9. Deploy `useQuoteUpload.ts` changes (B3) — removes redundant trackEvent
10. Deploy `toolDeltaValues.ts` changes (B4) — updates booking RT event name

### Phase 4 — GTM Configuration (critical — do before removing bridge)
11. Configure GTM Web Container: add triggers CE-wm_qualified_lead, CE-wm_appointment_booked, CE-wm_sold (D2)
12. Configure GTM Web Container: add GA4 - Mid & Low Funnel Events tag (D4)
13. Configure GTM Server Container: add triggers + variables (E2, E3)
14. Configure GTM Server Container: add 3 Meta CAPI tags (E4)
15. Test all 5 events end-to-end in GTM Preview mode
16. Publish both GTM containers

### Phase 5 — Remove Legacy Bridge (ONLY after GTM is published)
17. Deploy `wmTracking.ts` changes (B2) — delete LEGACY_BRIDGE
18. Deploy test file updates (F1, F2)
19. Run `npm test` or `vitest` — all tests must pass

---

## 14. ACCEPTANCE CRITERIA

The work is complete when ALL of the following are true:

**Database:**
- [ ] `wm_event_log` receives `wm_lead` when a lead form is submitted
- [ ] `wm_event_log` receives `wm_scanner_upload` when a quote file is uploaded
- [ ] `wm_event_log` receives `wm_appointment_booked` when a booking is confirmed (via highValueSignals)
- [ ] All 8 SQL views return data without errors
- [ ] `v_conversion_integrity_check` shows OK for recent leads
- [ ] `uix_wm_event_log_wm_lead` prevents duplicate wm_lead writes for same lead_id

**GTM & Meta:**
- [ ] GTM Preview shows all 5 `wm_*` events triggering their respective tags
- [ ] Meta Events Manager Test Events tool receives all 5 events from server
- [ ] Each event shows `event_id` field populated (deduplication active)
- [ ] `wm_scanner_upload` shows value: 500 in Meta Events Manager
- [ ] No duplicate events in Meta Events Manager (one browser + one server = deduplicated to one)
- [ ] `wm_lead` and `wm_qualified_lead` both map to Meta `Lead` event (differentiated by custom_data.event_type)

**Admin Dashboard:**
- [ ] `/admin/tracking-health` EMQ score ≥ 9.0
- [ ] `/admin/tracking-health` shows wm_* events counted in conversion events
- [ ] `/admin/analytics` daily overview loads without errors
- [ ] `/admin/revenue` funnel performance loads without errors

**Code Quality:**
- [ ] No `lead_submission_success` in `save-lead` edge function
- [ ] No `scanner_upload_completed` in `upload-quote` edge function or `highValueSignals.ts`
- [ ] No `booking_confirmed` in `highValueSignals.ts`
- [ ] No `LEGACY_BRIDGE` or `fireLegacyBridge` in `wmTracking.ts`
- [ ] No `quote_upload_success` trackEvent call in `useQuoteUpload.ts`
- [ ] All vitest tests pass

---

## 15. FILES CHANGED SUMMARY

| File | Change | Phase |
|---|---|---|
| `supabase/migrations/20260224000000_canonical_event_names_dual_read.sql` | NEW — dual-read SQL migration | 1 |
| `supabase/functions/save-lead/index.ts` | `lead_submission_success` → `wm_lead` (2 references + logs) | 2 |
| `supabase/functions/upload-quote/index.ts` | `scanner_upload_completed` → `wm_scanner_upload`, event_type → `conversion` | 2 |
| `supabase/functions/admin-tracking-health/index.ts` | Add `wm_*` to CONVERSION_EVENT_NAMES | 2 |
| `src/lib/highValueSignals.ts` | `scanner_upload_completed` → `wm_scanner_upload`, `booking_confirmed` → `wm_appointment_booked` | 3 |
| `src/hooks/useQuoteUpload.ts` | Remove redundant `quote_upload_success` trackEvent call | 3 |
| `src/config/toolDeltaValues.ts` | `booking_confirmed` → `wm_appointment_booked` in booking tier | 3 |
| GTM Web Container `GTM-NHVFR5QZ` | 3 new triggers, 1 new GA4 tag, variables | 4 |
| GTM Server Container `GTM-PJZDXKH9` | 3 new triggers, 3 new Meta CAPI tags, variables | 4 |
| `src/lib/wmTracking.ts` | Delete LEGACY_BRIDGE, fireLegacyBridge, all 4 call sites | 5 |
| `src/lib/__tests__/wmTracking.test.ts` | Remove 4 bridge assertion test blocks | 5 |
| `src/lib/__tests__/gtm-tracking.test.ts` | Remove bridge assertion test blocks | 5 |

**Total: 10 code files + 1 SQL migration + GTM container configurations**

---

## 16. KNOWN NON-ISSUES (DO NOT CHANGE)

These items look like problems but are intentional:

1. **`wm_qualified_lead` has no DB write** — This event is pure dataLayer/GTM. It fires client-side only based on qualification scoring. The DB write would require a server endpoint that doesn't yet exist. The GTM path (browser → server container → Meta CAPI) is sufficient. Phase 6 can add a DB write if needed.

2. **`wm_sold` has no DB write** — Same as above. This is designed for admin-triggered offline signals. The `wm_revenue_events` table is the DB source of truth for revenue. `wm_sold` is a GTM signal for Meta CAPI.

3. **`gtm.ts` still has `trackScannerUploadCompleted`** — This legacy function in `src/lib/gtm.ts` is no longer called from any active code path (all callers use `wmScannerUpload` from `wmTracking.ts`). It can be deleted in a cleanup PR but is not blocking.

4. **`secondarySignalEvents.ts` still references `scanner_upload_completed`** — This is for voice AI tracking, a separate system. Leave it alone unless voice AI tracking is being migrated in this PRD (it is not).

5. **`src/components/sample-report/PreQuoteLeadModal.tsx` mentions `lead_submission_success`** — This is a code comment, not an active event name. Leave it.

---

*End of PRD*
