# GTM Configuration Guide

This document outlines how to configure Google Tag Manager to handle the enhanced conversion events pushed by the Window Truth Engine application.

---

## Data Layer Events Reference

### 1. `lead_submission_success`

Fires when a user successfully submits any lead capture form.

**Payload:**
```javascript
{
  event: 'lead_submission_success',
  lead_id: 'uuid-xxx',
  value: 50,
  currency: 'USD',
  source_tool: 'quote-scanner',
  user_data: {
    sha256_email_address: 'e3b0c44298fc1c149afbf4c8996fb924...',
    sha256_phone_number: 'a665a45920422f9d417e4867efdc4fb8...'
  },
  lead_quality: 'hot',
  conversion_metadata: {
    window_count: 12,
    urgency_level: 'high',
    quote_amount: 45000,
    project_value: 50000
  },
  page_location: 'https://site.com/beat-your-quote',
  page_referrer: 'https://google.com/...',
  page_path: '/beat-your-quote'
}
```

---

### 2. `consultation_booked`

Fires when a user books a consultation (highest value conversion).

**Payload:**
```javascript
{
  event: 'consultation_booked',
  lead_id: 'uuid-xxx',
  value: 75,
  currency: 'USD',
  user_data: {
    sha256_email_address: '...',
    sha256_phone_number: '...'
  },
  conversion_metadata: {
    window_count: 12,
    estimated_project_value: 50000,
    urgency_level: 'immediate',
    preferred_callback_time: 'morning'
  }
}
```

---

### 3. `offline_conversion`

Fires when CRM status changes (for offline conversion import).

**Payload:**
```javascript
{
  event: 'offline_conversion',
  lead_id: 'uuid-xxx',
  conversion_action: 'closed_won',
  value: 15000,
  currency: 'USD',
  deal_value: 15000,
  gclid: 'CjwKCAiA...',
  fbclid: 'IwAR3...'
}
```

---

### 4. `form_abandonment`

Fires when user enters data but doesn't submit within 60 seconds.

**Payload:**
```javascript
{
  event: 'form_abandonment',
  form_id: 'lead_capture',
  source_tool: 'quote-scanner',
  fields_entered: ['email', 'phone'],
  time_on_form_seconds: 45
}
```

---

### 5. Micro-Conversion Events

**`form_start`** - User begins interacting with a form
**`form_step_complete`** - User completes a step in multi-step form
**`ai_scan_complete`** - AI analysis completes (success/error)

---

## GTM Setup Instructions

### Step 1: Create Data Layer Variables

Create the following variables in GTM:

| Variable Name | Data Layer Variable Name |
|--------------|--------------------------|
| DLV - lead_id | lead_id |
| DLV - value | value |
| DLV - currency | currency |
| DLV - source_tool | source_tool |
| DLV - lead_quality | lead_quality |
| DLV - user_data | user_data |
| DLV - sha256_email | user_data.sha256_email_address |
| DLV - sha256_phone | user_data.sha256_phone_number |
| DLV - gclid | gclid |
| DLV - fbclid | fbclid |

---

### Step 2: Create Triggers

#### Lead Submission Trigger
- Type: Custom Event
- Event name: `lead_submission_success`

#### Consultation Trigger
- Type: Custom Event
- Event name: `consultation_booked`

#### Offline Conversion Trigger
- Type: Custom Event
- Event name: `offline_conversion`

#### Form Abandonment Trigger
- Type: Custom Event
- Event name: `form_abandonment`

---

### Step 3: Configure Google Ads Conversion Tag

1. Create a **Google Ads Conversion Tracking** tag
2. Set Conversion ID and Label from your Google Ads account
3. Configure:
   - Transaction ID: `{{DLV - lead_id}}`
   - Conversion Value: `{{DLV - value}}`
   - Currency Code: `{{DLV - currency}}`

4. **Enhanced Conversions:**
   - Enable "Include user-provided data from your website"
   - Email: `{{DLV - sha256_email}}`
   - Phone: `{{DLV - sha256_phone}}`

5. Trigger: `lead_submission_success`

---

### Step 4: Configure Meta Pixel Tag

1. Create a **Meta Pixel (Facebook)** tag
2. Event: `Lead`
3. Configure parameters:
   - Event ID: `{{DLV - lead_id}}` (for deduplication with CAPI)
   - Value: `{{DLV - value}}`
   - Currency: `{{DLV - currency}}`
   - Content Name: `{{DLV - source_tool}}`

4. **Advanced Matching:**
   - em (hashed email): `{{DLV - sha256_email}}`
   - ph (hashed phone): `{{DLV - sha256_phone}}`

5. Trigger: `lead_submission_success`

---

### Step 5: Value-Based Bidding Setup

To enable value-based bidding in Google Ads:

1. In Google Ads, go to **Conversions** settings
2. Select your lead conversion action
3. Set **Value** to "Use different values for each conversion"
4. Enable **Enhanced Conversions**
5. The value from `{{DLV - value}}` will be used for Smart Bidding

---

### Step 6: Lead Quality Audiences

Create Custom Audiences based on lead quality:

1. **Hot Leads Audience:**
   - Trigger: `lead_submission_success`
   - Condition: `{{DLV - lead_quality}}` equals `hot` OR `qualified`

2. **High-Value Project Audience:**
   - Trigger: `lead_submission_success`
   - Condition: `{{DLV - value}}` greater than `40`

---

## Testing Checklist

- [ ] Open browser DevTools → Console
- [ ] Look for `[GTM] lead_submission_success event pushed` logs
- [ ] Use GTM Preview mode to verify events fire
- [ ] Check dataLayer contains `user_data` with hashed values
- [ ] Verify `value` is populated correctly per source tool
- [ ] Test consultation_booked fires separately
- [ ] Test form_abandonment fires after 60 seconds of inactivity
- [ ] Verify offline_conversion fires on CRM status change

---

## Conversion Values Reference

| Source Tool | Value ($) |
|------------|-----------|
| consultation_booked | 75 |
| quote-scanner | 50 |
| beat-your-quote | 45 |
| quote-builder | 40 |
| fair-price-quiz | 35 |
| expert-chat | 30 |
| comparison-tool | 25 |
| fast-win | 20 |
| risk-diagnostic | 20 |
| claim-survival-kit | 15 |
| vulnerability-test | 15 |
| intel-library | 10 |
| evidence-locker | 10 |
| default | 15 |

---

## Support

For issues with GTM configuration, check:
1. Browser console for `[GTM]` prefixed logs
2. GTM Preview mode for event payloads
3. Network tab for tag firing confirmation
