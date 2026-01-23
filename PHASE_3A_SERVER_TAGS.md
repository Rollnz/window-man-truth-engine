# Phase 3A: Server Container Tags (GTM-PJZDXKH9)

## Tags Overview

| Tag Name | Type | Firing Trigger | Exceptions | Last Edited |
|----------|------|----------------|------------|-------------|
| **Facebook CAPI - All Events** | Facebook Conversion API | All Server Events | Booking Confirmed, High Intent Signal, Lead Captured, Tool Completed, Tool Started, Voice Call Started | 5 hours ago |
| **Facebook CAPI - Lead** | Facebook Conversion API | Lead Captured Trigger | (none) | 5 hours ago |
| GA4 - Passthrough | Google Analytics: GA4 | Trigger - Real Human Traffic | (none) | 10 hours ago |
| Supabase Event Logger | HTTP Request | **(NO TRIGGERS)** | (none) | 2 hours ago |

## Key Findings

### 1. Facebook CAPI - Lead Tag
- **Fires on:** `Lead Captured Trigger` (Event Name contains `lead_captured`)
- **Type:** Facebook Conversion API (stape-io)
- **Last Edited:** 5 hours ago

### 2. Supabase Event Logger
- **NO TRIGGERS** - ✅ Disabled as required
- This confirms the Supabase write-back loop is blocked

### 3. Facebook CAPI - All Events
- Fires on all server events EXCEPT specific triggers
- Lead Captured Trigger is in the exceptions list
- This means Lead events are handled ONLY by Facebook CAPI - Lead tag

## Next Step
Open Facebook CAPI - Lead tag to audit the full mapping configuration.
