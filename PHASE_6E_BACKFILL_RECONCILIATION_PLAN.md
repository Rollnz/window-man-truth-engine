# Phase 6E: Backfill & Reconciliation Plan

## Purpose

This document provides a comprehensive plan for:
1. **Backfilling** historical revenue data from CRM into `wm_revenue_events`
2. **Reconciling** discrepancies between conversions and revenue events
3. **Ongoing monitoring** to ensure data integrity

---

## 1. Pre-Backfill Checklist

Before running any backfill operations, verify:

| Check | Query | Expected |
|-------|-------|----------|
| wm_revenue_events table exists | `SELECT COUNT(*) FROM wm_revenue_events;` | No error |
| Attribution trigger is active | `SELECT tgname FROM pg_trigger WHERE tgrelid = 'wm_revenue_events'::regclass;` | `trg_populate_revenue_attribution` |
| Append-only trigger is active | Same as above | `trg_reject_update_delete_revenue` |
| Unique constraint exists | `SELECT indexname FROM pg_indexes WHERE tablename = 'wm_revenue_events';` | `uix_wm_revenue_events_lead_stage` |

---

## 2. Backfill Strategy

### 2.1 Data Sources

Revenue data can come from:

| Source | Integration Method | Priority |
|--------|-------------------|----------|
| CRM (e.g., HubSpot, Salesforce) | API export → SQL import | High |
| Spreadsheet (manual tracking) | CSV → SQL import | Medium |
| Accounting system | API or manual | Low |

### 2.2 Required Mapping

For each revenue record, you need:

| CRM Field | wm_revenue_events Column | Required |
|-----------|-------------------------|----------|
| Contact Email | → leads.email → lead_id | ✅ Yes |
| Deal ID | deal_id | Recommended |
| Deal Name | deal_name | Optional |
| Deal Value | revenue_amount | ✅ Yes |
| Close Date | event_time | ✅ Yes |
| Deal Stage | revenue_stage | ✅ Yes |

### 2.3 Stage Mapping

Map your CRM stages to the three canonical stages:

| CRM Stage Examples | → wm_revenue_events Stage |
|-------------------|--------------------------|
| "Qualified", "Discovery", "Proposal" | `opportunity_created` |
| "Closed Won", "Contract Signed" | `deal_won` |
| "Paid", "Invoice Collected" | `revenue_confirmed` |

---

## 3. Backfill SQL Templates

### 3.1 Find Conversion Event IDs for Leads

First, create a mapping of lead emails to their conversion event IDs:

```sql
-- Create temporary mapping table
CREATE TEMP TABLE tmp_lead_conversion_map AS
SELECT 
    l.id AS lead_id,
    l.email,
    e.event_id AS conversion_event_id,
    e.event_time AS conversion_time
FROM public.leads l
JOIN public.wm_event_log e ON l.id = e.lead_id
WHERE e.event_name = 'lead_submission_success'
ORDER BY e.event_time DESC;

-- Verify the mapping
SELECT COUNT(*) AS mapped_leads FROM tmp_lead_conversion_map;
```

### 3.2 Backfill opportunity_created

```sql
-- Backfill opportunity_created from CRM data
-- Replace 'your_crm_export' with your actual data source

INSERT INTO public.wm_revenue_events (
    lead_id,
    conversion_event_id,
    revenue_stage,
    deal_id,
    deal_name,
    event_time,
    source_system,
    ingested_by
)
SELECT
    m.lead_id,
    m.conversion_event_id,
    'opportunity_created' AS revenue_stage,
    crm.deal_id,
    crm.deal_name,
    crm.opportunity_created_date AS event_time,
    'crm_backfill' AS source_system,
    'manual_migration' AS ingested_by
FROM your_crm_export crm
JOIN tmp_lead_conversion_map m ON LOWER(TRIM(crm.email)) = LOWER(TRIM(m.email))
WHERE crm.opportunity_created_date IS NOT NULL
ON CONFLICT (lead_id, revenue_stage) DO NOTHING;
```

### 3.3 Backfill deal_won

```sql
-- Backfill deal_won from CRM data
INSERT INTO public.wm_revenue_events (
    lead_id,
    conversion_event_id,
    revenue_stage,
    deal_id,
    deal_name,
    revenue_amount,
    currency,
    event_time,
    source_system,
    ingested_by
)
SELECT
    m.lead_id,
    m.conversion_event_id,
    'deal_won' AS revenue_stage,
    crm.deal_id,
    crm.deal_name,
    crm.deal_value AS revenue_amount,
    COALESCE(crm.currency, 'USD') AS currency,
    crm.close_date AS event_time,
    'crm_backfill' AS source_system,
    'manual_migration' AS ingested_by
FROM your_crm_export crm
JOIN tmp_lead_conversion_map m ON LOWER(TRIM(crm.email)) = LOWER(TRIM(m.email))
WHERE crm.deal_stage = 'Closed Won'
  AND crm.close_date IS NOT NULL
ON CONFLICT (lead_id, revenue_stage) DO NOTHING;
```

### 3.4 Backfill revenue_confirmed

```sql
-- Backfill revenue_confirmed from accounting data
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
    m.lead_id,
    m.conversion_event_id,
    'revenue_confirmed' AS revenue_stage,
    acc.invoice_id AS deal_id,
    acc.amount_paid AS revenue_amount,
    COALESCE(acc.currency, 'USD') AS currency,
    acc.payment_date AS event_time,
    'accounting_backfill' AS source_system,
    'manual_migration' AS ingested_by
FROM your_accounting_export acc
JOIN tmp_lead_conversion_map m ON LOWER(TRIM(acc.email)) = LOWER(TRIM(m.email))
WHERE acc.payment_date IS NOT NULL
ON CONFLICT (lead_id, revenue_stage) DO NOTHING;
```

---

## 4. Reconciliation Queries

### 4.1 Find Conversions Without Revenue Events (Orphan Conversions)

```sql
-- Leads that converted but have no revenue events
SELECT 
    e.lead_id,
    l.email,
    e.event_time AS conversion_time,
    e.source_tool,
    'No revenue events' AS status
FROM public.wm_event_log e
JOIN public.leads l ON e.lead_id = l.id
LEFT JOIN public.wm_revenue_events r ON e.lead_id = r.lead_id
WHERE e.event_name = 'lead_submission_success'
  AND r.id IS NULL
ORDER BY e.event_time DESC;
```

### 4.2 Find Revenue Events Without Conversions (Orphan Revenue)

```sql
-- Revenue events that don't have a matching conversion
SELECT 
    r.lead_id,
    r.revenue_stage,
    r.revenue_amount,
    r.event_time,
    r.deal_id,
    'No conversion event found' AS status
FROM public.wm_revenue_events r
LEFT JOIN public.wm_event_log e 
    ON r.lead_id = e.lead_id 
    AND e.event_name = 'lead_submission_success'
WHERE e.id IS NULL;
```

### 4.3 Find Leads with Incomplete Revenue Journey

```sql
-- Leads that have deal_won but no opportunity_created
SELECT 
    r.lead_id,
    MAX(CASE WHEN r.revenue_stage = 'opportunity_created' THEN 1 ELSE 0 END) AS has_opportunity,
    MAX(CASE WHEN r.revenue_stage = 'deal_won' THEN 1 ELSE 0 END) AS has_deal,
    MAX(CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN 1 ELSE 0 END) AS has_revenue
FROM public.wm_revenue_events r
GROUP BY r.lead_id
HAVING 
    -- Has deal but no opportunity
    (MAX(CASE WHEN r.revenue_stage = 'deal_won' THEN 1 ELSE 0 END) = 1
     AND MAX(CASE WHEN r.revenue_stage = 'opportunity_created' THEN 1 ELSE 0 END) = 0)
    OR
    -- Has revenue but no deal
    (MAX(CASE WHEN r.revenue_stage = 'revenue_confirmed' THEN 1 ELSE 0 END) = 1
     AND MAX(CASE WHEN r.revenue_stage = 'deal_won' THEN 1 ELSE 0 END) = 0);
```

### 4.4 Attribution Snapshot Verification

```sql
-- Check if attribution was properly populated
SELECT 
    r.lead_id,
    r.revenue_stage,
    CASE WHEN r.attr_source_tool IS NOT NULL THEN '✓' ELSE '✗' END AS has_source_tool,
    CASE WHEN r.attr_utm_campaign IS NOT NULL THEN '✓' ELSE '✗' END AS has_campaign,
    CASE WHEN r.email_sha256 IS NOT NULL THEN '✓' ELSE '✗' END AS has_email_hash,
    CASE WHEN r.external_id IS NOT NULL THEN '✓' ELSE '✗' END AS has_external_id
FROM public.wm_revenue_events r
WHERE r.attr_source_tool IS NULL
   OR r.email_sha256 IS NULL
   OR r.external_id IS NULL
ORDER BY r.event_time DESC
LIMIT 50;
```

---

## 5. Ongoing Monitoring

### 5.1 Daily Health Check Query

Run this daily to catch issues early:

```sql
SELECT
    'Total conversions (all time)' AS metric,
    COUNT(DISTINCT lead_id)::text AS value
FROM wm_event_log WHERE event_name = 'lead_submission_success'

UNION ALL

SELECT
    'Total revenue events (all time)',
    COUNT(*)::text
FROM wm_revenue_events

UNION ALL

SELECT
    'Orphan conversions (no revenue)',
    COUNT(DISTINCT e.lead_id)::text
FROM wm_event_log e
LEFT JOIN wm_revenue_events r ON e.lead_id = r.lead_id
WHERE e.event_name = 'lead_submission_success' AND r.id IS NULL

UNION ALL

SELECT
    'Orphan revenue (no conversion)',
    COUNT(DISTINCT r.lead_id)::text
FROM wm_revenue_events r
LEFT JOIN wm_event_log e ON r.lead_id = e.lead_id AND e.event_name = 'lead_submission_success'
WHERE e.id IS NULL

UNION ALL

SELECT
    'Total deal value',
    '$' || COALESCE(SUM(revenue_amount)::text, '0')
FROM wm_revenue_events WHERE revenue_stage = 'deal_won';
```

### 5.2 Weekly Reconciliation Report

```sql
-- Weekly summary for executive review
SELECT
    DATE_TRUNC('week', e.event_time)::date AS week,
    COUNT(DISTINCT e.lead_id) AS conversions,
    COUNT(DISTINCT r_opp.lead_id) AS opportunities,
    COUNT(DISTINCT r_deal.lead_id) AS deals,
    COALESCE(SUM(r_deal.revenue_amount), 0) AS revenue,
    ROUND(
        COUNT(DISTINCT r_deal.lead_id)::numeric / 
        NULLIF(COUNT(DISTINCT e.lead_id), 0) * 100,
        1
    ) AS conversion_to_deal_pct
FROM wm_event_log e
LEFT JOIN wm_revenue_events r_opp 
    ON e.lead_id = r_opp.lead_id AND r_opp.revenue_stage = 'opportunity_created'
LEFT JOIN wm_revenue_events r_deal 
    ON e.lead_id = r_deal.lead_id AND r_deal.revenue_stage = 'deal_won'
WHERE e.event_name = 'lead_submission_success'
  AND e.event_time > NOW() - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', e.event_time)::date
ORDER BY week DESC;
```

---

## 6. Edge Function for Live Revenue Writes

For ongoing revenue event creation (not backfill), create an edge function:

```typescript
// supabase/functions/record-revenue/index.ts
// This function should be called by CRM webhooks or manual triggers

interface RevenueEventRequest {
  lead_id: string;
  revenue_stage: 'opportunity_created' | 'deal_won' | 'revenue_confirmed';
  deal_id?: string;
  deal_name?: string;
  revenue_amount?: number;
  currency?: string;
}

// The function should:
// 1. Validate lead_id exists in leads table
// 2. Find the conversion_event_id from wm_event_log
// 3. Insert into wm_revenue_events (trigger handles attribution)
// 4. Return success/error with idempotency handling
```

---

## 7. Backfill Execution Checklist

When ready to run backfill:

- [ ] Export CRM data to CSV or temp table
- [ ] Create `tmp_lead_conversion_map` 
- [ ] Run backfill for `opportunity_created`
- [ ] Run backfill for `deal_won`
- [ ] Run backfill for `revenue_confirmed`
- [ ] Run reconciliation queries
- [ ] Verify attribution snapshot populated
- [ ] Check executive views show data
- [ ] Document any unmatched records

---

## 8. Troubleshooting

### Issue: Attribution not populated

**Cause:** Conversion event not found for the provided `conversion_event_id`

**Fix:** Verify the conversion_event_id exists:
```sql
SELECT * FROM wm_event_log WHERE event_id = 'your-conversion-event-id';
```

### Issue: Duplicate key violation

**Cause:** Trying to insert a second revenue event for the same lead + stage

**Fix:** This is expected behavior. Use `ON CONFLICT DO NOTHING` or check before insert.

### Issue: Lead not found

**Cause:** Email in CRM doesn't match email in leads table

**Fix:** Normalize emails before matching:
```sql
LOWER(TRIM(crm.email)) = LOWER(TRIM(leads.email))
```

---

## Summary

This plan provides:
1. **Backfill templates** for importing historical CRM data
2. **Reconciliation queries** to find data gaps
3. **Monitoring queries** for ongoing health checks
4. **Edge function spec** for live revenue writes

The system is designed to be:
- **Idempotent**: Duplicate inserts are safely ignored
- **Auditable**: All writes have source_system and ingested_by
- **Immutable**: Append-only, no updates or deletes
