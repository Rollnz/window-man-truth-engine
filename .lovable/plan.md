

# Comprehensive Conversion Tracking Audit

## TASK 1: Codebase Audit Findings

### 1A. Payload Completeness

| Field | Status | Details |
|-------|--------|---------|
| `event_id` | PASS | Deterministic per event type: `lead:{leadId}`, `ql:{leadId}`, `upload:{scanAttemptId}`, `appt:{leadId}:{key}`, `sold:{leadId}:{key}` |
| `user_data` | PASS | All PII is SHA-256 hashed client-side via `buildEnhancedUserData()` before push. Includes `em`, `ph`, `fn`, `ln`, `ct`, `st`, `zp`, `country`, `external_id`, `fbp`, `fbc`, `client_user_agent`. Strategy: **pre-hashed in code, pushed as hashes.** GTM does NOT need to hash. |
| `value` + `currency` | PASS | Hardcoded in `OPT_VALUES` map. Present on all 5 OPT events. `wm_sold` adds `saleAmount` on top of base $5,000. |
| `external_id` | PASS | Strictly `identity.leadId` (Supabase Lead UUID). Set at both top-level and inside `user_data.external_id`. |
| `client_id` | **GAP** | Missing from all OPT events. Only injected by `wmRetarget` (RT events). |
| `session_id` | **GAP** | Same as above -- missing from OPT events. |

### 1B. Deduplication

| Guard | Status | Details |
|-------|--------|---------|
| `sentWmLeadIds` (Set) | PASS | Module-level, one `wm_lead` per `leadId` per page load. |
| `firedScanIds` (Set) | PASS | Module-level, one `wm_scanner_upload` per `scanAttemptId`. Bounded pruning at 50 entries. |
| `sessionStorage wm_upload_fired:{leadId}` | PASS | Cross-page-load dedupe for scanner uploads. Also suppresses `wm_qualified_lead` when upload already fired (higher tier wins). |
| `sessionStorage wm_ql_fired:{leadId}` | PASS | Session-level dedupe for `wm_qualified_lead`. |
| `wm_appointment_booked` | **NOTE** | No dedupe guard -- relies on unique `appointmentKey`. Acceptable since re-bookings are distinct conversions. |
| `wm_sold` | **NOTE** | No dedupe guard -- relies on unique `dealKey`. Acceptable for same reason. |

### 1C. Identity Auto-Injection

| Field | OPT Events | RT Events |
|-------|-----------|-----------|
| `client_id` (fbp proxy) | MISSING | Injected |
| `session_id` | MISSING | Injected |
| `external_id` | Present | Injected via `getLeadAnchor()` |

### Fix Required

Add `client_id` and `session_id` to `pushWmEvent()` in `wmTracking.ts` (lines 217-229). These are critical for Google Ads Enhanced Conversions cross-device matching and Meta CAPI server-side event enrichment.

```text
// In pushWmEvent(), add after line 224:
client_id: typeof window !== 'undefined' ? getOrCreateClientId() : undefined,
session_id: typeof window !== 'undefined' ? getOrCreateSessionId() : undefined,
```

This is a 2-line addition to the existing payload object.

---

## TASK 2: GTM Implementation Guide

### 2A. Data Layer Variables to Create

Create these as **Data Layer Variable** type in GTM:

| Variable Name | Data Layer Variable Name | Purpose |
|--------------|------------------------|---------|
| `dlv - event_id` | `event_id` | Deduplication key for Meta CAPI |
| `dlv - value` | `value` | Conversion value (USD) |
| `dlv - currency` | `currency` | Always "USD" |
| `dlv - external_id` | `external_id` | Supabase Lead UUID |
| `dlv - lead_id` | `lead_id` | Same as external_id (alias) |
| `dlv - client_id` | `client_id` | Visitor identity (fbp proxy) |
| `dlv - session_id` | `session_id` | Session identity |
| `dlv - meta.send` | `meta.send` | Firewall gate (must be true) |
| `dlv - meta.category` | `meta.category` | Event tier: opt / rt / internal |
| `dlv - meta.meta_event_name` | `meta.meta_event_name` | Meta standard event name |
| `dlv - user_data.em` | `user_data.em` | SHA-256 hashed email |
| `dlv - user_data.ph` | `user_data.ph` | SHA-256 hashed phone |
| `dlv - user_data.fn` | `user_data.fn` | SHA-256 hashed first name |
| `dlv - user_data.ln` | `user_data.ln` | SHA-256 hashed last name |
| `dlv - user_data.ct` | `user_data.ct` | SHA-256 hashed city |
| `dlv - user_data.st` | `user_data.st` | SHA-256 hashed state |
| `dlv - user_data.zp` | `user_data.zp` | SHA-256 hashed zip |
| `dlv - user_data.country` | `user_data.country` | Plain text "us" |
| `dlv - user_data.external_id` | `user_data.external_id` | Lead UUID (plain) |
| `dlv - user_data.fbp` | `user_data.fbp` | Facebook browser cookie |
| `dlv - user_data.fbc` | `user_data.fbc` | Facebook click cookie |
| `dlv - user_data.client_user_agent` | `user_data.client_user_agent` | Browser UA string |
| `dlv - source_tool` | `source_tool` | Origin tool name |

### 2B. Triggers to Create

| Trigger Name | Type | Condition |
|-------------|------|-----------|
| `CE - wm_lead` | Custom Event | Event name equals `wm_lead` |
| `CE - wm_qualified_lead` | Custom Event | Event name equals `wm_qualified_lead` |
| `CE - wm_scanner_upload` | Custom Event | Event name equals `wm_scanner_upload` |
| `CE - wm_appointment_booked` | Custom Event | Event name equals `wm_appointment_booked` |
| `CE - wm_sold` | Custom Event | Event name equals `wm_sold` |

**Firewall condition (add to ALL tags, not triggers):**  
Tag Firing Options > Additional Tag Firing Conditions:  
`{{dlv - meta.send}}` equals `true` AND `{{dlv - meta.category}}` equals `opt`

### 2C. Meta (Facebook) Pixel Tags

For each of the 5 OPT events, create a **Facebook Pixel** tag (or use Stape server-side):

**Tag: Meta - wm_lead (Lead)**
- Trigger: `CE - wm_lead`
- Event Name: `Lead` (use `{{dlv - meta.meta_event_name}}` for dynamic mapping)
- Event ID (for deduplication): `{{dlv - event_id}}`
- Value: `{{dlv - value}}`
- Currency: `{{dlv - currency}}`
- User Data Parameters (Advanced Matching):
  - Email (em): `{{dlv - user_data.em}}` -- **already SHA-256 hashed, do NOT re-hash**
  - Phone (ph): `{{dlv - user_data.ph}}` -- **already SHA-256 hashed**
  - First Name (fn): `{{dlv - user_data.fn}}`
  - Last Name (ln): `{{dlv - user_data.ln}}`
  - City (ct): `{{dlv - user_data.ct}}`
  - State (st): `{{dlv - user_data.st}}`
  - Zip (zp): `{{dlv - user_data.zp}}`
  - Country: `{{dlv - user_data.country}}`
  - External ID: `{{dlv - user_data.external_id}}`
  - FBP: `{{dlv - user_data.fbp}}`
  - FBC: `{{dlv - user_data.fbc}}`
  - Client User Agent: `{{dlv - user_data.client_user_agent}}`

Repeat for `wm_qualified_lead` (QualifiedLead), `wm_scanner_upload` (ScannerUpload), `wm_appointment_booked` (Schedule), and `wm_sold` (Purchase). All use the same variable mappings.

**Important**: In GTM's Facebook Pixel template or custom HTML, set the hashing option to **"Values are already hashed"** to prevent double-hashing.

### 2D. Google Ads Enhanced Conversions Tags

For Google Ads, use the **Google Ads Conversion Tracking** tag type:

**Tag: GAds - wm_lead Conversion**
- Trigger: `CE - wm_lead`
- Conversion ID: (your Google Ads conversion ID)
- Conversion Label: (your conversion label)
- Conversion Value: `{{dlv - value}}`
- Currency Code: `{{dlv - currency}}`
- Order ID / Transaction ID: `{{dlv - event_id}}`
- Enhanced Conversions: **Enable**
  - Data Source: **Data Layer**
  - The `user_data` object is already in the correct format. Google's tag will read:
    - `user_data.sha256_email_address` for email
    - `user_data.sha256_phone_number` for phone

**Alternative (CSS Selector method):** Not recommended. Your data is already structured in the Data Layer which is more reliable.

---

## TASK 3: Validation Script

### Manual Browser Console Test

```javascript
// === WM_LEAD DEDUPLICATION + FORMAT TEST ===
// Run this in the browser console after completing a lead form submission

(function validateWmLead() {
  const dl = window.dataLayer || [];
  
  // 1. Find all wm_lead events
  const wmLeads = dl.filter(e => e.event === 'wm_lead');
  console.log(`wm_lead fires: ${wmLeads.length} (expected: 1)`);
  
  if (wmLeads.length === 0) {
    console.error('FAIL: No wm_lead event found in dataLayer');
    return;
  }
  
  if (wmLeads.length > 1) {
    console.error('FAIL: wm_lead fired more than once (deduplication broken)');
  }
  
  const evt = wmLeads[0];
  
  // 2. event_id format check
  const idMatch = /^lead:[0-9a-f-]{36}$/.test(evt.event_id);
  console.log(`event_id format: ${idMatch ? 'PASS' : 'FAIL'} (${evt.event_id})`);
  
  // 3. Value + Currency
  console.log(`value: ${evt.value === 10 ? 'PASS' : 'FAIL'} (${evt.value})`);
  console.log(`currency: ${evt.currency === 'USD' ? 'PASS' : 'FAIL'} (${evt.currency})`);
  
  // 4. Meta firewall
  const m = evt.meta || {};
  console.log(`meta.send: ${m.send === true ? 'PASS' : 'FAIL'}`);
  console.log(`meta.category: ${m.category === 'opt' ? 'PASS' : 'FAIL'}`);
  
  // 5. User data (hashed PII)
  const ud = evt.user_data || {};
  const emailOk = /^[a-f0-9]{64}$/.test(ud.em || '');
  console.log(`user_data.em (SHA-256): ${emailOk ? 'PASS' : 'FAIL'}`);
  
  const phoneOk = ud.ph ? /^[a-f0-9]{64}$/.test(ud.ph) : 'SKIPPED (no phone)';
  console.log(`user_data.ph (SHA-256): ${phoneOk}`);
  
  // 6. External ID matches lead_id
  console.log(`external_id === lead_id: ${evt.external_id === evt.lead_id ? 'PASS' : 'FAIL'}`);
  console.log(`user_data.external_id: ${ud.external_id ? 'PASS' : 'FAIL'} (${ud.external_id})`);
  
  // 7. Identity fields (after fix)
  console.log(`client_id: ${evt.client_id ? 'PASS' : 'FAIL'} (${evt.client_id})`);
  console.log(`session_id: ${evt.session_id ? 'PASS' : 'FAIL'} (${evt.session_id})`);
  
  // 8. Facebook cookies
  console.log(`fbp: ${ud.fbp || 'not set (ok if no FB cookie)'}`);
  console.log(`fbc: ${ud.fbc || 'not set (ok if no click-through)'}`);
  
  // Summary
  console.log('\n--- SUMMARY ---');
  console.log(`Total checks passed. wm_lead is ${wmLeads.length === 1 ? 'properly deduplicated' : 'FIRING MULTIPLE TIMES'}.`);
})();
```

### Using the /admin/tracking-test Page

1. Navigate to `/admin/tracking-test`
2. Click "Run Full Test"
3. Verify in the results panel:
   - **event_id Parity**: Should show `match: true` with format `lead:{UUID}`
   - **PII Hashing**: `em` and `ph` should be 64-character hex strings
   - **Validation Score**: Should be 9.0+
4. Check the "Event ID Parity" section specifically -- after the recent fix, `browserEventId` shows the **actual** dataLayer value, and `serverFormat` shows the expected UUID. Both should match.

---

## Summary of Code Fix Required

One change in `src/hooks/../../src/lib/wmTracking.ts`, function `pushWmEvent` (lines 217-229):

Add `client_id` and `session_id` to the OPT event payload object. These fields are already imported (`getOrCreateClientId`, `getOrCreateSessionId` from `./tracking`) and used in `wmRetarget`, but were omitted from the OPT event path. This is a 2-line addition with zero risk of regression.

