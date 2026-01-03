# Analytics & Event Tracking

This document outlines the complete event tracking schema for the Window Truth Engine platform.

## Overview

The analytics system tracks user behavior across the platform to optimize conversion funnels and improve user experience. All events are stored in the `wm_events` table in Supabase and associated with sessions in `wm_sessions`.

## Event Schema

All events follow this base structure:

```typescript
interface AnalyticsEvent {
  event_name: string;           // Type of event
  tool_name: string;            // Tool or page identifier
  page_path?: string;           // URL path
  params?: Record<string, any>; // Event-specific data
  session_id: string;           // Session identifier
  timestamp: string;            // ISO timestamp
}
```

## Event Types

### 1. Page View Events

Tracked automatically on all routes using the `usePageTracking` hook.

**Event Name:** `page_view`

**Triggered:** On component mount for every page

**Data Structure:**
```typescript
{
  event_name: 'page_view',
  tool_name: string,  // e.g., 'reality-check', 'cost-calculator'
  page_path: string,  // e.g., '/reality-check'
  params: {
    referrer: string,   // Previous page or 'direct'
    search: string      // Query string
  }
}
```

**Tracked Pages (28 total):**
- `/` - home
- `/tools` - tools-overview
- `/reality-check` - reality-check
- `/cost-calculator` - cost-calculator
- `/expert` - expert
- `/comparison` - comparison
- `/risk-diagnostic` - risk-diagnostic
- `/fast-win` - fast-win
- `/evidence` - evidence
- `/vulnerability-test` - vulnerability-test
- `/intel` - intel
- `/claim-survival` - claim-survival
- `/kitchen-table-guide` - kitchen-table-guide
- `/sales-tactics-guide` - sales-tactics-guide
- `/spec-checklist-guide` - spec-checklist-guide
- `/insurance-savings-guide` - insurance-savings-guide
- `/quote-scanner` - quote-scanner
- `/calculate-your-estimate` - calculate-estimate
- `/analytics` - analytics
- `/auth` - auth
- `/vault` - vault
- `/privacy` - legal-privacy
- `/terms` - legal-terms
- `/disclaimer` - legal-disclaimer
- `/accessibility` - legal-accessibility
- `*` - not-found

### 2. Tool Completion Events

Tracked when users complete interactive tools.

**Event Name:** `tool_completed`

**Triggered:** When user reaches final results screen

#### Reality Check Tool

```typescript
{
  event_name: 'tool_completed',
  tool_name: 'reality-check',
  params: {
    score: number,              // Final assessment score (0-100)
    window_age: string,         // Age bracket selected
    energy_bill: string         // Energy bill range
  }
}
```

#### Vulnerability Test Tool

```typescript
{
  event_name: 'tool_completed',
  tool_name: 'vulnerability-test',
  params: {
    score: number,              // Quiz score (0-100)
    total_questions: number,    // Number of questions (5)
    vulnerability_level: string // 'Low', 'Moderate', 'High'
  }
}
```

#### Fast Win Finder Tool

```typescript
{
  event_name: 'tool_completed',
  tool_name: 'fast-win',
  params: {
    winning_product: string,    // Recommended product ID
    pain_point: string,         // Primary pain point selected
    budget_priority: string     // Budget vs quality preference
  }
}
```

#### Risk Diagnostic Tool

```typescript
{
  event_name: 'tool_completed',
  tool_name: 'risk-diagnostic',
  params: {
    overall_protection_score: number,      // Overall score (0-100)
    storm_protection: number,              // Storm category score
    security_protection: number,           // Security category score
    insurance_protection: number,          // Insurance category score
    warranty_protection: number            // Warranty category score
  }
}
```

#### Cost Calculator Tool

```typescript
{
  event_name: 'tool_completed',
  tool_name: 'cost-calculator',
  params: {
    year1_cost: number,         // Year 1 projected cost
    year5_cost: number,         // Year 5 projected cost
    window_age: string,         // Current window age
    window_count: number        // Number of windows
  }
}
```

### 3. Modal Events

Tracked for conversion modals to understand abandonment patterns.

#### Modal Open

```typescript
{
  event_name: 'modal_open',
  tool_name: string,          // Source tool that triggered modal
  params: {
    modal_type: string,       // 'lead_capture', 'consultation_booking', 'intel_lead'
    trigger_source: string    // What action opened the modal
  }
}
```

#### Modal Abandon

```typescript
{
  event_name: 'modal_abandon',
  tool_name: string,          // Source tool
  params: {
    modal_type: string,       // Type of modal
    time_spent_seconds: number // Time user spent before closing
  }
}
```

**Tracked Modals:**
1. `LeadCaptureModal` - Primary lead capture across 9 tools
2. `ConsultationBookingModal` - Expert consultation booking
3. `IntelLeadModal` - Intel resource unlock

### 4. Lead Capture Events

Tracked when users submit contact information.

```typescript
{
  event_name: 'lead_captured',
  tool_name: string,
  params: {
    lead_type: string,        // 'email_only', 'full_contact', 'booking'
    source_tool: string,      // Tool where capture originated
    has_phone: boolean,       // Whether phone provided
    has_address: boolean      // Whether address provided
  }
}
```

## Session Tracking

Sessions are tracked via the `useSessionData` hook and stored in `wm_sessions` table.

**Session Data:**
```typescript
{
  session_id: string,         // UUID
  user_agent: string,         // Browser info
  screen_resolution: string,  // Device resolution
  referrer: string,           // Entry source
  landing_page: string,       // First page visited
  started_at: timestamp,      // Session start
  last_activity: timestamp    // Last event time
}
```

## Analytics Dashboard Metrics

The Analytics page (`/analytics`) displays:

### KPI Cards
- Total page views
- Total tool completions
- Total modal opens
- Modal abandon count & rate
- Lead capture count & rate

### Charts

**Page Views Over Time**
- Line chart showing daily page views
- Filterable by date range

**Top Pages by Views**
- Bar chart of most visited pages
- Shows tool_name and view count

**Tool Completions**
- Bar chart of completion counts by tool
- Completion rate vs. page views

**Modal Funnel**
- Opens vs. Completions vs. Abandons
- Conversion rate calculation

**Tool Performance**
- Page views → Tool completions → Lead captures
- Funnel visualization per tool

## Implementation Details

### Client-Side Tracking

**Page Views:**
```typescript
// In every page component
import { usePageTracking } from '@/hooks/usePageTracking';

export default function MyPage() {
  usePageTracking('page-identifier');
  // ... component code
}
```

**Tool Completions:**
```typescript
import { logEvent } from '@/lib/windowTruthClient';

// When tool completes
logEvent({
  event_name: 'tool_completed',
  tool_name: 'my-tool',
  params: {
    // Tool-specific data
  }
});
```

**Modal Tracking:**
```typescript
// Modal components track open/abandon automatically
const [modalOpenTime, setModalOpenTime] = useState<number>(0);

useEffect(() => {
  if (isOpen) {
    const now = Date.now();
    setModalOpenTime(now);
    logEvent({
      event_name: 'modal_open',
      tool_name: sourceTool,
      params: { modal_type: 'lead_capture' }
    });
  }
}, [isOpen]);

const handleClose = () => {
  if (!isSuccess && modalOpenTime > 0) {
    const timeSpent = Math.round((Date.now() - modalOpenTime) / 1000);
    logEvent({
      event_name: 'modal_abandon',
      tool_name: sourceTool,
      params: {
        modal_type: 'lead_capture',
        time_spent_seconds: timeSpent
      }
    });
  }
  onClose();
};
```

### Backend Storage

Events are stored in Supabase via the `logEvent` function in `windowTruthClient.ts`:

```typescript
export async function logEvent(event: Partial<AnalyticsEvent>) {
  const sessionData = getSessionData();

  const { error } = await supabase
    .from('wm_events')
    .insert({
      session_id: sessionData.session_id,
      event_name: event.event_name,
      tool_name: event.tool_name,
      page_path: event.page_path,
      params: event.params,
      created_at: new Date().toISOString()
    });

  if (error) console.error('Error logging event:', error);
}
```

## Database Schema

### wm_sessions

```sql
CREATE TABLE wm_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,
  user_agent TEXT,
  screen_resolution TEXT,
  referrer TEXT,
  landing_page TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### wm_events

```sql
CREATE TABLE wm_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT REFERENCES wm_sessions(session_id),
  event_name TEXT NOT NULL,
  tool_name TEXT,
  page_path TEXT,
  params JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_session ON wm_events(session_id);
CREATE INDEX idx_events_name ON wm_events(event_name);
CREATE INDEX idx_events_tool ON wm_events(tool_name);
CREATE INDEX idx_events_created ON wm_events(created_at DESC);
```

## Privacy & Compliance

- No PII is stored in event params
- Session IDs are anonymous UUIDs
- Users can request data deletion
- GDPR/CCPA compliant
- Data retention: 2 years

## Future Enhancements

### Planned Events
- `vault_signup` - Vault subscription created
- `quote_uploaded` - User uploads contractor quote
- `expert_review_requested` - Expert review requested
- `contractor_contacted` - User contacts recommended contractor
- `purchase_completed` - Window installation booked

### Planned Metrics
- Conversion funnel completion rates
- User journey path analysis
- Cohort analysis by entry source
- A/B test result tracking
- Revenue attribution per source

## Testing

To verify event tracking:

1. Open browser DevTools
2. Navigate to Network tab
3. Filter by "wm_events"
4. Interact with tools/modals
5. Verify events are being sent to Supabase

Or use the Analytics dashboard (`/analytics`) to view real-time data.

---

**Last Updated:** 2025-01-03
