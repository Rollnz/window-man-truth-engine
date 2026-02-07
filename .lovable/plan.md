
# Deep Backend Automation Layer - Implementation Plan

## Overview
Complete the self-healing tracking pipeline by implementing three critical automation features:
1. **Retry Logic** - Backend function to re-process failed events
2. **Auto-Enrichment** - IP-based geo data enrichment for missing address fields
3. **Real-Time Alerts** - Critical threshold monitoring with logging

---

## Current State Analysis

| Component | Status | Notes |
|-----------|--------|-------|
| Dashboard UI | ✅ Done | Attribution & Health tabs working |
| `tracking_failed_events` table | ✅ Done | Schema includes `event_payload`, `status`, `retry_count` |
| Universal PII Translator | ✅ Done | `log-event` extracts/hashes all PII variations |
| Retry Button | ❌ Placeholder | Shows "Coming soon" toast |
| Geo Enrichment | ❌ Missing | No IP-to-City/State lookup |
| Health Alerts | ❌ Missing | No threshold-based notifications |

---

## Phase 1: Retry Logic (Edge Function)

### New File: `supabase/functions/admin-retry-failed-events/index.ts`

**Purpose:** Re-process failed conversion events by replaying them to their original destination.

**Endpoint Flow:**
```text
Admin clicks "Retry All"
    ↓
Frontend calls POST /admin-retry-failed-events
    ↓
Edge function:
  1. Verify admin auth
  2. Query pending events (status = 'pending' OR 'retrying')
  3. For each event:
     a. Extract original payload
     b. Re-send to destination (meta_capi, google_ec, gtm_server)
     c. On success: Update status → 'resolved'
     d. On failure: Increment retry_count, set next_retry_at
     e. If retry_count >= max_retries: Move to 'dead_letter'
  4. Return summary
```

**Key Implementation Details:**

```typescript
// Retry destinations
async function retryToDestination(event: FailedEvent): Promise<boolean> {
  switch (event.destination) {
    case 'meta_capi':
      return await sendToMetaCAPI(event.event_payload, event.user_data);
    case 'google_ec':
      return await sendToGoogleEC(event.event_payload);
    case 'gtm_server':
      return await sendToGTMServer(event.event_payload);
    case 'supabase':
      return await replayToSupabase(event.event_payload);
    default:
      return false;
  }
}

// Exponential backoff for next_retry_at
function calculateNextRetry(retryCount: number): Date {
  const delayMinutes = Math.pow(2, retryCount) * 5; // 5, 10, 20, 40, 80 min
  return new Date(Date.now() + delayMinutes * 60 * 1000);
}
```

**Response Schema:**
```json
{
  "success": true,
  "processed": 15,
  "resolved": 12,
  "failed": 2,
  "dead_lettered": 1
}
```

### Frontend Update: `src/components/admin/tracking-health/TrackingHealthView.tsx`

Replace placeholder `handleRetryAll` with actual API call:

```typescript
const handleRetryAll = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-retry-failed-events`,
    {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ retryAll: true })
    }
  );
  const result = await response.json();
  toast({
    title: `Retry Complete`,
    description: `${result.resolved} resolved, ${result.failed} still pending`,
  });
  fetchHealthData(); // Refresh
};
```

---

## Phase 2: Auto-Enrichment (IP Geo Lookup)

### Update: `supabase/functions/save-lead/index.ts`

**Goal:** When `city`, `state`, or `zip` is missing, use the client's IP address to auto-fill these fields.

**Free API Option:** ip-api.com (no API key required, 45 requests/minute)

```typescript
// New helper function
async function enrichGeoFromIP(clientIp: string): Promise<{
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
}> {
  if (clientIp === 'unknown' || clientIp.startsWith('127.') || clientIp.startsWith('192.168.')) {
    return { city: null, state: null, country: null, zip: null };
  }
  
  try {
    const response = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,country,regionName,city,zip`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        city: data.city || null,
        state: data.regionName || null,  // Full state name (e.g., "Florida")
        country: data.country || null,
        zip: data.zip || null,
      };
    }
  } catch (error) {
    console.error('[save-lead] Geo enrichment failed:', error);
  }
  
  return { city: null, state: null, country: null, zip: null };
}
```

**Integration Point (around line 545):**
```typescript
// EMQ 9.5+: Address fields for improved matching
// Priority: User-provided > AI Context > IP Geo Enrichment
let city = aiContext?.city || null;
let state = aiContext?.state || (sessionData as Record<string, unknown>)?.state as string || null;
let zip = aiContext?.zip_code || null;

// Auto-enrich missing geo data from IP (only if not already provided)
if (!city || !state) {
  const geoData = await enrichGeoFromIP(clientIp);
  city = city || geoData.city;
  state = state || geoData.state;
  zip = zip || geoData.zip;
  
  if (geoData.city || geoData.state) {
    console.log('[save-lead] Geo enriched from IP:', { 
      city: geoData.city, 
      state: geoData.state,
      source: 'ip-api' 
    });
  }
}

const leadRecord = {
  // ...existing fields...
  city,
  state,
  zip,
  // NEW: Track enrichment source
  geo_source: city || state ? (aiContext?.city ? 'user' : 'ip') : null,
};
```

**Benefits:**
- EMQ Score improves (address fields contribute to matching)
- Better lead qualification (geographic targeting)
- No additional cost (free API tier)

---

## Phase 3: Real-Time Alerts (Database Trigger)

### New Migration: Create Alert Logging Infrastructure

```sql
-- Create tracking_health_alerts table
CREATE TABLE public.tracking_health_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('emq_critical', 'failed_events_critical', 'error_rate_critical')),
  severity TEXT NOT NULL DEFAULT 'critical' CHECK (severity IN ('warning', 'critical')),
  message TEXT NOT NULL,
  metric_value NUMERIC,
  threshold NUMERIC,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for recent alerts
CREATE INDEX idx_health_alerts_created ON public.tracking_health_alerts(created_at DESC);
CREATE INDEX idx_health_alerts_unresolved ON public.tracking_health_alerts(alert_type) 
  WHERE resolved_at IS NULL;

-- RLS: Admin-only
ALTER TABLE public.tracking_health_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read access" ON public.tracking_health_alerts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

### New Edge Function: `supabase/functions/check-tracking-health/index.ts`

**Purpose:** Scheduled health check that logs alerts when thresholds are breached.

```typescript
// Thresholds
const THRESHOLDS = {
  EMQ_CRITICAL: 4.0,      // Score below 4.0 triggers alert
  EMQ_WARNING: 7.0,       // Score below 7.0 triggers warning
  FAILED_EVENTS_CRITICAL: 10,
  ERROR_RATE_CRITICAL: 5, // Percentage
};

async function checkHealth(supabase: any) {
  const alerts: Array<{type: string; severity: string; message: string; value: number; threshold: number}> = [];
  
  // Check EMQ Score (using existing admin-tracking-health logic)
  const emqScore = await calculateEMQScore(supabase);
  
  if (emqScore < THRESHOLDS.EMQ_CRITICAL) {
    alerts.push({
      type: 'emq_critical',
      severity: 'critical',
      message: `EMQ Score dropped to ${emqScore}/10 (threshold: ${THRESHOLDS.EMQ_CRITICAL})`,
      value: emqScore,
      threshold: THRESHOLDS.EMQ_CRITICAL,
    });
  }
  
  // Check Failed Events Queue
  const { count: pendingCount } = await supabase
    .from('tracking_failed_events')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'retrying']);
  
  if (pendingCount && pendingCount > THRESHOLDS.FAILED_EVENTS_CRITICAL) {
    alerts.push({
      type: 'failed_events_critical',
      severity: 'critical',
      message: `${pendingCount} failed events in queue (threshold: ${THRESHOLDS.FAILED_EVENTS_CRITICAL})`,
      value: pendingCount,
      threshold: THRESHOLDS.FAILED_EVENTS_CRITICAL,
    });
  }
  
  // Insert alerts (deduped by type - only one active alert per type)
  for (const alert of alerts) {
    // Check if unresolved alert of same type exists
    const { data: existing } = await supabase
      .from('tracking_health_alerts')
      .select('id')
      .eq('alert_type', alert.type)
      .is('resolved_at', null)
      .limit(1);
    
    if (!existing || existing.length === 0) {
      await supabase.from('tracking_health_alerts').insert({
        alert_type: alert.type,
        severity: alert.severity,
        message: alert.message,
        metric_value: alert.value,
        threshold: alert.threshold,
      });
      console.log(`[check-tracking-health] ALERT: ${alert.message}`);
    }
  }
  
  return { alerts_created: alerts.length };
}
```

**Invocation Options:**
1. **Cron Job (Recommended):** Run every 15 minutes via Supabase pg_cron
2. **Manual:** Admin can trigger via dashboard button
3. **Webhook:** External monitoring service calls endpoint

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/admin-retry-failed-events/index.ts` | **Create** | Retry logic edge function |
| `supabase/functions/check-tracking-health/index.ts` | **Create** | Health monitoring & alerting |
| `supabase/functions/save-lead/index.ts` | **Modify** | Add IP geo enrichment |
| `src/components/admin/tracking-health/TrackingHealthView.tsx` | **Modify** | Wire up retry button |
| `supabase/config.toml` | **Modify** | Register new functions |
| New migration | **Create** | `tracking_health_alerts` table |

---

## Data Flow Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRACKING SELF-HEALING LOOP                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [User Submits Form]                                                       │
│          │                                                                  │
│          ▼                                                                  │
│   ┌──────────────┐    Missing Geo?    ┌──────────────┐                     │
│   │  save-lead   │ ─────────────────► │  IP-API.com  │                     │
│   │  (Enhanced)  │ ◄───────────────── │  Geo Lookup  │                     │
│   └──────────────┘    City/State      └──────────────┘                     │
│          │                                                                  │
│          ▼                                                                  │
│   ┌──────────────┐    Success         ┌──────────────┐                     │
│   │  log-event   │ ─────────────────► │ wm_event_log │                     │
│   │   (PII →)    │                    │   (Ledger)   │                     │
│   └──────────────┘                    └──────────────┘                     │
│          │                                                                  │
│          │ Failure                                                          │
│          ▼                                                                  │
│   ┌──────────────┐                                                          │
│   │   tracking   │ ◄──── [1] Error detected                                │
│   │failed_events │                                                          │
│   └──────────────┘                                                          │
│          │                                                                  │
│          │ [2] Admin clicks "Retry"                                        │
│          ▼                                                                  │
│   ┌──────────────┐    Re-send         ┌──────────────┐                     │
│   │ admin-retry  │ ─────────────────► │ Meta CAPI /  │                     │
│   │failed-events │ ◄───────────────── │ Google EC    │                     │
│   └──────────────┘    Result          └──────────────┘                     │
│          │                                                                  │
│          │ Success: status → 'resolved'                                    │
│          │ Failure: retry_count++ → next_retry_at                          │
│          │                                                                  │
│   ┌──────────────┐    [3] Cron check                                       │
│   │   check-     │ ─────────────────► IF EMQ < 4.0 OR failed > 10          │
│   │tracking-     │                    THEN log alert                        │
│   │   health     │                                                          │
│   └──────────────┘                                                          │
│          │                                                                  │
│          ▼                                                                  │
│   ┌──────────────┐                                                          │
│   │  tracking_   │  (Future: Email via notify-dead-letter pattern)         │
│   │health_alerts │                                                          │
│   └──────────────┘                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Expected Impact

| Metric | Before | After |
|--------|--------|-------|
| Failed Event Recovery | Manual only | Automated retry with backoff |
| Geo Data Coverage | ~30% (user-provided) | ~90% (IP enrichment fallback) |
| EMQ Score (Address) | 0% (missing) | ~80% (enriched) |
| Alert Response Time | Unknown (no alerts) | Logged within 15 min |

---

## Technical Notes

### Retry Backoff Strategy
- Retry 1: 5 minutes
- Retry 2: 10 minutes
- Retry 3: 20 minutes
- Retry 4: 40 minutes
- Retry 5: 80 minutes (dead letter if fails)

### IP Geo API Rate Limits
- ip-api.com: 45 requests/minute (free tier)
- Alternative: ipinfo.io (50k requests/month free)
- Fallback: Skip enrichment on API failure (non-blocking)

### Alert Deduplication
- Only one active alert per `alert_type`
- New alerts only created if no unresolved alert exists
- Admin can mark alerts as resolved in future UI

---

## Implementation Order

1. **Migration:** Create `tracking_health_alerts` table
2. **Edge Function:** `admin-retry-failed-events` (enables Retry button)
3. **Edge Function:** `check-tracking-health` (alert logging)
4. **save-lead Update:** IP geo enrichment
5. **Frontend:** Wire up retry button in TrackingHealthView
6. **Config:** Register new functions in `supabase/config.toml`
