# GTM Web Container Trigger State Table

## Container: Window-man-Truth-Engine (GTM-NHVFR5QZ)

### Critical Triggers for Meta Lead Conversion

| Trigger Name | Event Type | Filter | Tags Using | Last Edited |
|-------------|------------|--------|------------|-------------|
| `lead_submission_success` | Custom Event | (none) | **2** | 4 days ago |
| `lead_captured` | Custom Event | (none) | 1 | 2 days ago |
| `CE- Lead_Captured` | Custom Event | (none) | 3 | 7 days ago |

### Key Observation

The `lead_submission_success` trigger has **2 tags** associated with it. This is the trigger that the Meta - Lead Conversion tag should fire on.

### All Triggers in Container

| Trigger Name | Event Type | Filter | Tags | Last Edited |
|-------------|------------|--------|------|-------------|
| Block - Lovable Domains | Page View | Page Hostname contains lovable.app | 11 | 7 days ago |
| Call - Initiated on Site | Custom Event | (none) | 0 | 6 hours ago |
| CE - Consultation Booked | Custom Event | (none) | 2 | 7 days ago |
| CE- Lead_Captured | Custom Event | (none) | 3 | 7 days ago |
| engagement_score | Custom Event | DLV - engagement_score >= 60 | 1 | 5 days ago |
| Exclude Admin and Lead Pages | Page View | Page URL contains /admin/ | 11 | 5 days ago |
| Floating Chat Widget opened | Custom Event | (none) | 1 | 7 hours ago |
| form_start | Custom Event | (none) | 0 | 5 days ago |
| form_submit | Custom Event | (none) | 0 | 5 days ago |
| lead_captured | Custom Event | (none) | 1 | 2 days ago |
| lead_submission_success | Custom Event | (none) | 2 | 4 days ago |
| PageView | Page View | (none) | 1 | 8 days ago |
| quote_lead_captured | Custom Event | (none) | 1 | 5 days ago |
| Widget - Contact Info (Step 2) | Custom Event | DLV - step_index = 2 | 1 | 8 hours ago |
| Widget - Lead Completed (step 3) | Custom Event | DLV - step_index = 3 | 1 | 8 hours ago |
| Widget - Project info (Step 1) | Custom Event | DLV - step_index = 1 | 1 | 8 hours ago |

## Next Step

Need to verify which tags fire on `lead_submission_success` trigger to confirm Meta - Lead Conversion is one of them.
