# GTM Web Container Tag Configuration

## Container: Window-man-Truth-Engine (GTM-NHVFR5QZ)

### Critical Finding: Meta - Lead Conversion Tag

| Tag Name | Type | Firing Trigger | Exceptions | Last Edited |
|----------|------|----------------|------------|-------------|
| **Meta - Lead Conversion** | Custom HTML | `lead_submission_success` | Block - Lovable Domains, Exclude Admin and Lead Pages | **an hour ago** |

**✅ CONFIRMED: Meta - Lead Conversion fires ONLY on `lead_submission_success` trigger**

### All Tags in Container

| Tag Name | Type | Firing Trigger(s) | Last Edited |
|----------|------|-------------------|-------------|
| AW-17439985315 | Google Tag | Initialization - All Pages | 7 hours ago |
| G-adw - CE-Consultation Bookd | Google Ads Conversion Tracking | CE - Consultation Booked | 4 days ago |
| GA4 - Consultation Booked | Google Analytics: GA4 Event | CE - Consultation Booked | 4 days ago |
| GA4 - Lead Captured | Google Analytics: GA4 Event | CE- Lead_Captured | 6 hours ago |
| GA4 - Pageview | Google Tag | PageView | 4 days ago |
| GA4 - Widget Opened | Google Analytics: GA4 Event | Floating Chat Widget opened | 8 hours ago |
| GA4 Widget - Contact Info (Step 2) | Google Analytics: GA4 Event | Widget - Contact Info (Step 2) | 8 hours ago |
| GA4 Widget - Lead Completed (step 3) | Google Analytics: GA4 Event | Widget - Lead Completed (step 3) | 8 hours ago |
| GA4 Widget - Project info (Step 1) | Google Analytics: GA4 Event | Widget - Project info (Step 1) | 8 hours ago |
| **GAds - Lead Submission Success** | Google Ads Conversion Tracking | `lead_submission_success` | 4 days ago |
| Gadwords - CE-Lead_Captured | Google Ads Conversion Tracking | CE- Lead_Captured | 5 days ago |
| Google Ads- Conversion Linker | Conversion Linker | All Pages | 5 days ago |
| lead_submission_success | Google Ads Conversion Tracking | CE- Lead_Captured, lead_captured, quote_lead_captured | 4 days ago |
| Meta - High Engagement (60+) | Custom HTML | engagement_score | 4 days ago |
| **Meta - Lead Conversion** | Custom HTML | `lead_submission_success` | **an hour ago** |
| Meta Pixel - Base Code | Custom HTML | All Pages | 4 days ago |
| Microsoft Clarity- Official Pageview | Microsoft Clarity - Official | All Pages | 5 days ago |

### Tags Firing on `lead_submission_success` Trigger

| Tag Name | Type | Purpose |
|----------|------|---------|
| **Meta - Lead Conversion** | Custom HTML | ✅ Meta Pixel Lead event (fbq('track', 'Lead')) |
| **GAds - Lead Submission Success** | Google Ads Conversion Tracking | ✅ Google Ads Lead conversion |

## Verification Summary

✅ **Meta - Lead Conversion** fires ONLY on `lead_submission_success` trigger
✅ **GAds - Lead Submission Success** fires ONLY on `lead_submission_success` trigger
✅ Both tags have proper exceptions for lovable.app and admin pages
✅ No duplicate Meta Lead tags firing on other triggers

## Acceptance Gate Status

| Requirement | Status |
|-------------|--------|
| Meta Lead fires only on `lead_submission_success` | ✅ VERIFIED |
| Only ONE Meta Lead tag fires | ✅ VERIFIED |
| Exceptions configured | ✅ VERIFIED |


---

## Meta - Lead Conversion Tag HTML Code

```html
<script>
fbq('track', 'Lead', {
  value: {{DLV - value}},
  currency: {{DLV - currency}}
}, {
  eventID: '{{DLV - event_id}}'
});
</script>
```

### Tag Configuration Details

| Setting | Value |
|---------|-------|
| Tag Type | Custom HTML |
| Setup Tag | Meta Pixel - Base Code |
| Firing Trigger | `lead_submission_success` |
| Exceptions | Block - Lovable Domains, Exclude Admin and Lead Pages |

### Variables Used

| Variable | Purpose |
|----------|---------|
| `{{DLV - value}}` | Conversion value (15) |
| `{{DLV - currency}}` | Currency code (USD) |
| `{{DLV - event_id}}` | Deduplication ID for CAPI matching |

### ✅ VERIFIED: Meta - Lead Conversion Configuration

1. **Fires ONLY on `lead_submission_success`** - Confirmed
2. **Uses `eventID` for deduplication** - `{{DLV - event_id}}`
3. **Passes value and currency** - `{{DLV - value}}` and `{{DLV - currency}}`
4. **Has proper exceptions** - Blocks lovable.app and admin pages
5. **Setup tag ensures Meta Pixel loads first** - Meta Pixel - Base Code
