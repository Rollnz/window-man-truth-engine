# Phase 3A: Server Container Triggers (GTM-PJZDXKH9)

## Key Trigger for Facebook CAPI - Lead

| Trigger Name | Event Type | Filter | Tags Using | Last Edited |
|-------------|------------|--------|------------|-------------|
| **Lead Captured Trigger** | Custom | Event Name contains `lead_captured` | **2** | 4 days ago |

## Important Finding: BLOCK - Supabase Write-back

| Trigger Name | Event Type | Tags Using | Last Edited |
|-------------|------------|------------|-------------|
| **BLOCK - Supabase Write-back** | Custom | **0** | 2 hours ago |

✅ **Supabase write-back is blocked** - No tags are using this trigger.

## All Server Container Triggers

| Trigger Name | Filter | Tags |
|-------------|--------|------|
| All Server Events | Event Name matches RegEx `.+` + User-Agent bot filter | 1 |
| BLOCK - Supabase Write-back | (none) | 0 |
| Booking Confirmed Trigger | Event Name contains `booking_confirmed` | 1 |
| GA4 Client Trigger | Client Name equals GA4 | 0 |
| High Intent Signal Trigger | Event Name contains `high_intent_signal` | 1 |
| Lead Captured Trigger | Event Name contains `lead_captured` | 2 |
| Page View Trigger | Event Name contains `page_view` | 0 |
| Tool Completed Trigger | Event Name contains `tool_completed` | 1 |
| Tool Started Trigger | Event Name contains `tool_started` | 1 |
| Trigger - Real Human Traffic | User-Agent bot filter | 1 |
| Voice Call Started Trigger | Event Name contains `voice_call_started` | 1 |

## Note on Lead Trigger

The `Lead Captured Trigger` fires on events containing `lead_captured` in the event name. This will match:
- `lead_captured` (from trackLeadCapture)
- `lead_submission_success` does NOT match this trigger

**Need to verify:** Does the server receive `lead_submission_success` or `lead_captured`? The GA4 tag forwards events to the server, so the event name should match what's sent from the browser.
