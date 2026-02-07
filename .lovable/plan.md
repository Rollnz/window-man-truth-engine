
# Phase 1: Tracking Health Tab Implementation Plan

## Overview

This plan adds a **Data Health** tab to the existing Attribution Dashboard (`/admin/attribution`) with lazy-loaded health metrics, 3 summary cards, and a resurrection queue for failed events.

---

## Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    AttributionDashboard.tsx                         │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                         <Tabs>                                 │ │
│  │  ┌─────────────┐  ┌──────────────────────────────────────────┐ │ │
│  │  │ Attribution │  │ Data Health ● (status indicator)         │ │ │
│  │  │   (active)  │  │                                          │ │ │
│  │  └─────────────┘  └──────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                     <TabsContent>                              │ │
│  │                                                                │ │
│  │  [Attribution Tab]     [Data Health Tab - LAZY LOADED]        │ │
│  │  - Summary Cards       - <TrackingHealthView />               │ │
│  │  - Funnel              - Only fetches when tab selected       │ │
│  │  - Events Table        - Receives dateRange prop              │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Migration

### New Table: `tracking_failed_events`

This table stores events that failed to send to external APIs (Meta CAPI, Google) for later retry.

```sql
-- Migration: Create tracking_failed_events table for resurrection queue

CREATE TABLE public.tracking_failed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event identification
  event_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'conversion',
  
  -- Original payload (for replay)
  event_payload JSONB NOT NULL,
  user_data JSONB,
  
  -- Failure context
  destination TEXT NOT NULL CHECK (destination IN ('meta_capi', 'google_ec', 'gtm_server', 'supabase')),
  error_message TEXT NOT NULL,
  error_code TEXT,
  http_status INTEGER,
  
  -- Retry tracking
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ,
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'retrying', 'resolved', 'dead_letter')),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Reference to source lead/session
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  session_id UUID
);

-- Indexes for efficient queries
CREATE INDEX idx_failed_events_status ON public.tracking_failed_events(status);
CREATE INDEX idx_failed_events_destination ON public.tracking_failed_events(destination);
CREATE INDEX idx_failed_events_next_retry ON public.tracking_failed_events(next_retry_at) WHERE status = 'pending';
CREATE INDEX idx_failed_events_created ON public.tracking_failed_events(created_at DESC);

-- RLS: Admin-only access
ALTER TABLE public.tracking_failed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read access" ON public.tracking_failed_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access" ON public.tracking_failed_events
  FOR ALL TO service_role
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_tracking_failed_events
  BEFORE UPDATE ON public.tracking_failed_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Comment
COMMENT ON TABLE public.tracking_failed_events IS 
  'Resurrection Queue: Stores failed conversion events for retry. Supports Meta CAPI, Google Enhanced Conversions, and GTM Server failures.';
```

---

## Edge Function: `admin-tracking-health`

### Purpose
Aggregates health metrics from existing views and the new `tracking_failed_events` table.

### Response Schema
```typescript
interface TrackingHealthResponse {
  // System Status
  systemStatus: 'healthy' | 'degraded' | 'critical';
  statusReason: string;
  
  // EMQ Score (Event Match Quality)
  emqScore: {
    overall: number;      // 0-10 scale
    breakdown: {
      email: number;      // % of events with hashed email
      phone: number;      // % of events with hashed phone
      firstName: number;  // % with fn
      lastName: number;   // % with ln
      fbp: number;        // % with _fbp cookie
      fbc: number;        // % with _fbc click ID
    };
    trend: 'up' | 'down' | 'stable';
    previousScore: number;
  };
  
  // Fix Queue (Resurrection)
  fixQueue: {
    pendingCount: number;
    deadLetterCount: number;
    resolvedToday: number;
    oldestPending: string | null;  // ISO date
    byDestination: Record<string, number>;
  };
  
  // Diagnostics (from existing views)
  diagnostics: {
    orphanEvents: number;
    duplicateEvents: number;
    conversionIntegrity: {
      ok: number;
      missing: number;
    };
    errorRate: number;  // % of cv_ events that are cv_fallback
  };
  
  // Cost Impact (calculated)
  costImpact: {
    lostAttributedRevenue: number;  // $ estimate
    potentialRecovery: number;      // $ if queue resolved
  };
}
```

### Implementation Location
`supabase/functions/admin-tracking-health/index.ts`

### Data Sources
- `v_ledger_health_summary` - daily orphan/duplicate counts
- `v_conversion_integrity_check` - lead-to-conversion matching
- `wm_event_log` - EMQ field presence analysis
- `tracking_failed_events` - resurrection queue counts

---

## Frontend Components

### 1. Tab Infrastructure in `AttributionDashboard.tsx`

**Changes:**
- Wrap content in `<Tabs>` from shadcn/ui
- Add two tabs: "Attribution" (default) and "Data Health"
- Add status indicator dot to Data Health tab label

```tsx
// New state
const [activeTab, setActiveTab] = useState<'attribution' | 'health'>('attribution');
const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'critical' | null>(null);

// Tab structure
<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
  <TabsList>
    <TabsTrigger value="attribution">Attribution</TabsTrigger>
    <TabsTrigger value="health" className="flex items-center gap-2">
      Data Health
      {healthStatus && (
        <span className={cn(
          "w-2 h-2 rounded-full",
          healthStatus === 'healthy' && "bg-green-500",
          healthStatus === 'degraded' && "bg-amber-500",
          healthStatus === 'critical' && "bg-red-500"
        )} />
      )}
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value="attribution">
    {/* Existing attribution content */}
  </TabsContent>
  
  <TabsContent value="health">
    <TrackingHealthView 
      dateRange={dateRange} 
      onStatusChange={setHealthStatus}
    />
  </TabsContent>
</Tabs>
```

### 2. `TrackingHealthView.tsx` Component

**Location:** `src/components/admin/TrackingHealthView.tsx`

**Key Features:**
- Lazy loading: Only fetches data when mounted (tab selected)
- Receives `dateRange` prop from parent
- Progressive disclosure: 3 cards visible, details in collapsible

**Props Interface:**
```typescript
interface TrackingHealthViewProps {
  dateRange: DateRange;
  onStatusChange?: (status: 'healthy' | 'degraded' | 'critical') => void;
}
```

**Card Layout:**
```text
┌──────────────────┬──────────────────┬──────────────────┐
│  System Status   │    EMQ Score     │    Fix Queue     │
│  ●  Healthy      │      9.2/10      │   3 Pending      │
│                  │   ↑ from 8.8     │  [Retry All]     │
│  All systems     │                  │                  │
│  operational     │  Email: 100%     │  0 Dead Letter   │
│                  │  Phone: 94%      │                  │
└──────────────────┴──────────────────┴──────────────────┘
```

### 3. Summary Cards

**Card 1: System Status**
- Green dot + "Healthy" when: EMQ >= 8.5, error_rate < 2%, orphans < 5%
- Amber dot + "Degraded" when: EMQ 7-8.5 OR error_rate 2-5%
- Red dot + "Critical" when: EMQ < 7 OR error_rate > 5% OR pending_queue > 50

**Card 2: EMQ Score**
- Large number display (e.g., "9.2/10")
- Trend indicator (up/down arrow with previous score)
- Expandable breakdown showing email/phone/fn/ln percentages

**Card 3: Fix Queue**
- Count of pending failed events
- "Retry All" button (triggers edge function)
- Dead letter count (events that exceeded max retries)

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/YYYYMMDD_tracking_health_phase1.sql` | Create | New table + indexes + RLS |
| `supabase/functions/admin-tracking-health/index.ts` | Create | Health metrics aggregation endpoint |
| `src/pages/admin/AttributionDashboard.tsx` | Modify | Add Tabs wrapper, lazy health tab |
| `src/components/admin/TrackingHealthView.tsx` | Create | Main health view component |
| `src/components/admin/HealthStatusCard.tsx` | Create | System status card |
| `src/components/admin/EMQScoreCard.tsx` | Create | EMQ breakdown card |
| `src/components/admin/FixQueueCard.tsx` | Create | Resurrection queue card |

---

## Technical Details

### Lazy Loading Implementation

The `TrackingHealthView` component will use a `useEffect` that triggers on mount:

```typescript
const [hasLoaded, setHasLoaded] = useState(false);

useEffect(() => {
  // Only fetch on first render (when tab becomes active)
  if (!hasLoaded) {
    fetchHealthMetrics();
    setHasLoaded(true);
  }
}, [hasLoaded]);

// Re-fetch when dateRange changes (but only if already loaded)
useEffect(() => {
  if (hasLoaded) {
    fetchHealthMetrics();
  }
}, [dateRange]);
```

### EMQ Score Calculation

The EMQ score is calculated as a weighted average of field presence:

```typescript
const calculateEMQ = (metrics: FieldPresenceMetrics): number => {
  const weights = {
    email: 3.0,      // Most important
    phone: 2.5,      // Very important
    fbp: 1.5,        // Browser ID
    fbc: 1.0,        // Click ID (not always present)
    firstName: 0.5,  // Nice to have
    lastName: 0.5,   // Nice to have
  };
  
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const score = Object.entries(weights).reduce((sum, [field, weight]) => {
    return sum + (metrics[field] / 100) * weight;
  }, 0);
  
  return (score / totalWeight) * 10;  // Scale to 0-10
};
```

### Cost Impact Calculation

```typescript
const calculateCostImpact = (pendingCount: number, avgConversionValue: number = 75) => {
  const estimatedConversionRate = 0.15;  // 15% of leads convert
  return {
    lostAttributedRevenue: pendingCount * avgConversionValue * estimatedConversionRate,
    potentialRecovery: pendingCount * avgConversionValue * estimatedConversionRate * 0.8,  // 80% recovery rate
  };
};
```

---

## Health Status Logic

```typescript
const determineStatus = (metrics: HealthMetrics): 'healthy' | 'degraded' | 'critical' => {
  const { emqScore, diagnostics, fixQueue } = metrics;
  
  // Critical conditions
  if (
    emqScore.overall < 7 ||
    diagnostics.errorRate > 5 ||
    fixQueue.pendingCount > 50
  ) {
    return 'critical';
  }
  
  // Degraded conditions
  if (
    emqScore.overall < 8.5 ||
    diagnostics.errorRate > 2 ||
    fixQueue.pendingCount > 10 ||
    diagnostics.orphanEvents > (diagnostics.totalEvents * 0.05)
  ) {
    return 'degraded';
  }
  
  return 'healthy';
};
```

---

## Deprecation Note

After Phase 1 is complete and validated, the standalone `/admin/attribution-health` page (`AttributionHealthDashboard.tsx`) can be deprecated and redirected to `/admin/attribution?tab=health`.

---

## Implementation Order

1. **Database Migration** - Create `tracking_failed_events` table
2. **Edge Function** - Build `admin-tracking-health` endpoint
3. **TrackingHealthView** - Create main component with cards
4. **Tab Infrastructure** - Modify AttributionDashboard to add tabs
5. **Status Indicator** - Add health dot to tab label
6. **Testing** - Verify lazy loading and date range sync
