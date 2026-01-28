

# EMQ 9.5+ Audit: Database Schema & Lead Capture Architecture

## Executive Summary

Your current implementation is **well-architected** for EMQ compliance with most required parameters already in place. However, there are **3 critical gaps** that prevent achieving EMQ 9.5+:

| Gap | Impact | Priority |
|-----|--------|----------|
| Missing `zip` column in leads/wm_leads | Prevents address matching | HIGH |
| Missing `state` column in leads/wm_leads | Prevents address matching | HIGH |
| `client_user_agent` not persisted | Prevents device matching | MEDIUM |

---

## 1. Schema Audit: Current Table Structures

### `leads` Table (Primary Contact Identity)

| Column | Present | EMQ Required | Status |
|--------|---------|--------------|--------|
| `id` (UUID) | ✅ | ✅ external_id | ✅ |
| `email` | ✅ | ✅ em | ✅ |
| `phone` | ✅ | ✅ ph | ✅ |
| `first_name` | ✅ | ✅ fn | ✅ |
| `last_name` | ✅ | ✅ ln | ✅ |
| `utm_source` | ✅ | ✅ | ✅ |
| `utm_medium` | ✅ | ✅ | ✅ |
| `utm_campaign` | ✅ | ✅ | ✅ |
| `utm_term` | ✅ | ✅ | ✅ |
| `utm_content` | ✅ | ✅ | ✅ |
| `fbc` | ✅ | ✅ | ✅ |
| `fbp` | ✅ | ✅ | ✅ |
| `gclid` | ✅ | ✅ | ✅ |
| `msclkid` | ✅ | ✅ | ✅ |
| `client_id` | ✅ | ✅ | ✅ |
| `zip` | ❌ | ✅ zp | **MISSING** |
| `state` | ❌ | ✅ st | **MISSING** |
| `city` | ❌ (only in wm_leads) | ✅ ct | **PARTIAL** |
| `client_user_agent` | ❌ | ✅ | **MISSING** |
| `client_ip_address` | ❌ | ✅ (server-side only) | N/A |

### `wm_leads` Table (CRM Enrichment)

| Column | Present | Status |
|--------|---------|--------|
| `city` | ✅ | ✅ |
| `gclid` | ✅ | ✅ |
| `fbclid` | ✅ | ✅ |
| `utm_*` fields | ✅ | ✅ |
| `last_non_direct_*` fields | ✅ | ✅ |
| `zip` | ❌ | **MISSING** |
| `state` | ❌ | **MISSING** |

### `wm_event_log` Table (Event Ledger)

| Column | Present | Status |
|--------|---------|--------|
| `event_id` | ✅ | ✅ Deduplication key |
| `email_sha256` | ✅ | ✅ |
| `phone_sha256` | ✅ | ✅ |
| `fbclid`, `gclid` | ✅ | ✅ |
| `fbp`, `fbc` | ✅ | ✅ |
| `user_data` (jsonb) | ✅ | ✅ Contains hashed PII |

### `consultations` Table

| Column | Present | Status |
|--------|---------|--------|
| `name` | ✅ | ⚠️ Not split |
| `email` | ✅ | ✅ |
| `phone` | ✅ | ✅ |
| Attribution fields | ❌ | **MISSING** |

---

## 2. Form-to-Table Mapping

### All 12 Tools + Exit Intent Forms

| Page/Tool | Path | Form/Modal | Writes To | Captured Data |
|-----------|------|------------|-----------|---------------|
| **AI Quote Scanner** | `/ai-scanner` | `ScannerLeadCaptureModal` (3-step) | `leads` → `wm_leads` | firstName, lastName, email, phone, windowCount, quotePrice, file |
| **Reality Check** | `/reality-check` | `LeadCaptureModal`, `ConsultationBookingModal`, `ExitIntentModal` | `leads` → `wm_leads` | email, firstName, lastName, phone (optional) |
| **Fair Price Quiz** | `/fair-price-quiz` | `BlurGate` + `ExitIntentModal` | `leads` → `wm_leads` | email, firstName |
| **Consultation** | `/consultation` | Direct form on page | `leads` → `wm_leads` + `consultations` | firstName, lastName, email, phone, preferredTime, notes, propertyType, windowCount, cityZip |
| **Beat Your Quote** | `/beat-your-quote` | `MissionInitiatedModal`, `ConsultationBookingModal` | `leads` → `wm_leads` + `quote_files` | email, firstName, lastName, phone, file |
| **Quote Builder** | `/free-estimate` | `LeadModal` | `leads` → `wm_leads` | email, firstName, lastName |
| **Kitchen Table Guide** | `/kitchen-table-guide` | `KitchenTableGuideModal` (5-step) | `leads` → `wm_leads` | firstName, lastName, email, phone, propertyType, windowCount, timeframe, city, zip |
| **Sales Tactics Guide** | `/sales-tactics-guide` | `SalesTacticsGuideModal` (5-step) | `leads` → `wm_leads` | firstName, lastName, email, phone, propertyType, windowCount, timeframe, city, zip |
| **Spec Checklist Guide** | `/spec-checklist-guide` | `SpecChecklistGuideModal` (5-step) | `leads` → `wm_leads` | firstName, lastName, email, phone, propertyType, windowCount, timeframe, city, zip |
| **Cost Calculator** | `/cost-calculator` | `LeadCaptureModal` | `leads` → `wm_leads` | email, firstName, lastName |
| **Risk Diagnostic** | `/risk-diagnostic` | `LeadCaptureModal` | `leads` → `wm_leads` | email, firstName, lastName |
| **Vulnerability Test** | `/vulnerability-test` | `LeadCaptureModal` | `leads` → `wm_leads` | email, firstName, lastName |
| **Exit Intent (Global)** | All pages | `ExitIntentModal` (3-tier gauntlet) | `leads` → `wm_leads` | email, firstName (varies by tier) |

---

## 3. EMQ Gap Analysis

### What's Working (Achieving 8.0-8.5 EMQ)

| Parameter | Browser-side | Server-side | Status |
|-----------|--------------|-------------|--------|
| `em` (email hash) | ✅ `trackLeadSubmissionSuccess` | ✅ `sendStapeGTMEvent` | ✅ Dual-write |
| `ph` (phone hash) | ✅ E.164 normalized | ✅ E.164 normalized | ✅ Identity parity |
| `fn` (first name hash) | ✅ `buildEnhancedUserData` | ❌ Not sent to Stape | ⚠️ Browser only |
| `ln` (last name hash) | ✅ `buildEnhancedUserData` | ❌ Not sent to Stape | ⚠️ Browser only |
| `external_id` | ✅ `leadId` | ✅ `leadId` | ✅ |
| `event_id` | ✅ Deterministic format | ✅ Deduplication | ✅ |
| `fbp` | ✅ Cookie capture | ✅ `attribution.fbp` | ✅ |
| `fbc` | ✅ Cookie capture | ✅ `attribution.fbc` | ✅ |
| `client_user_agent` | ✅ `getClientUserAgent()` | ✅ `req.headers.get('user-agent')` | ✅ |

### What's Missing (Blocking 9.5 EMQ)

| Parameter | Required For | Current State | Gap |
|-----------|--------------|---------------|-----|
| `zp` (zip code) | Address matching | Only captured in 5-step modals, **NOT persisted to DB** | Forms collect it but `aiContextSchema.zip_code` is not written to leads table |
| `st` (state) | Address matching | **Never captured** | No form field, no DB column |
| `ct` (city) | Address matching | Captured in `wm_leads.city` but **NOT in `leads`** | Partial coverage |
| `client_ip_address` | Server matching | Captured via `getClientIp()` but **NOT persisted** | Used for rate limiting only |
| Server-side `fn`/`ln` | Name matching | **NOT sent to Stape GTM** | `sendStapeGTMEvent` doesn't include hashed names |

### Data Flow Gaps

1. **Zip Code**: The 5-step guide modals (Kitchen Table, Sales Tactics, Spec Checklist) capture `zip_code` in `aiContext`, but:
   - The `leads` table has no `zip` column
   - The `wm_leads` table has no `zip` column
   - The `save-lead` function doesn't persist it

2. **State**: No form in the entire system captures state. Users enter `cityZip` on Consultation page but it's a single field, not parsed into city+zip+state.

3. **Server-side Name Hashing**: The `sendStapeGTMEvent()` function only sends:
   - `email` (hashed)
   - `phone` (hashed)
   - `_fbp`, `_fbc`
   - `client_user_agent`
   - But **NOT** `fn` or `ln`

---

## 4. Technical Action Plan

### Migration 1: Add Missing Columns to `leads` Table

```sql
-- Add EMQ address fields to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS zip text,
ADD COLUMN IF NOT EXISTS client_user_agent text;

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_leads_zip ON public.leads(zip);
```

### Migration 2: Add Missing Columns to `wm_leads` Table

```sql
-- Add EMQ address fields to wm_leads table
ALTER TABLE public.wm_leads 
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS zip text;
```

### Migration 3: Update Trigger for Lead Sync

The existing `handle_new_lead_to_crm()` trigger will need to be updated to sync the new city/state/zip fields from `leads` to `wm_leads`.

### Code Change 1: Update `save-lead` Edge Function

The `aiContextSchema` already accepts `city`, `zip_code`. Need to persist them:

```typescript
// In leadRecord construction (around line 520-527)
city: aiContext?.city || null,
state: aiContext?.state || null, // NEW
zip: aiContext?.zip_code || null, // NEW - rename from zip_code
client_user_agent: clientUserAgent, // NEW - already captured from headers
```

### Code Change 2: Update `sendStapeGTMEvent()` 

Add first name and last name to the server-side payload:

```typescript
// In sendStapeGTMEvent (around line 312-360)
const [hashedEmail, hashedPhone, hashedFirstName, hashedLastName] = await Promise.all([
  hashEmail(payload.email),
  payload.phone ? hashPhoneE164(payload.phone) : Promise.resolve(null),
  payload.firstName ? hashName(payload.firstName) : Promise.resolve(null), // NEW
  payload.lastName ? hashName(payload.lastName) : Promise.resolve(null),  // NEW
]);

const gtmPayload = {
  // ... existing fields
  fn: hashedFirstName || undefined,  // NEW
  ln: hashedLastName || undefined,   // NEW
};
```

### Code Change 3: Update Form Modals

The 5-step modals need to ask for state:
- Add `state` dropdown (FL default, other US states)
- Update form schemas with state validation

### Code Change 4: Attribution for Consultations Table

The `consultations` table lacks attribution columns. Either:
- Add attribution columns to `consultations`
- OR ensure all consultations go through `save-lead` first (recommended)

---

## 5. EMQ Score Projection

| Action | Current EMQ | Projected EMQ |
|--------|-------------|---------------|
| Baseline (email + phone) | 6.0-6.5 | - |
| + fbp/fbc cookies | 7.0-7.5 | - |
| + fn/ln (browser) | 8.0-8.5 | **Current State** |
| + fn/ln (server) | 8.5-9.0 | After Code Change 2 |
| + city/state/zip | 9.0-9.5 | After Migrations + Code Changes |
| + external_id consistency | **9.5+** | After full implementation |

---

## Summary

Your architecture is solid with proper three-tier attribution, deterministic event IDs, and SHA-256 hashing. The gaps are surgical:

1. **Add 3 columns**: `city`, `state`, `zip` to `leads` table
2. **Add 2 columns**: `state`, `zip` to `wm_leads` table  
3. **Persist `zip_code`** from aiContext to new `zip` column
4. **Add server-side fn/ln** to Stape GTM payload
5. **Add state field** to 5-step modal forms

Estimated implementation time: 2-3 hours for migrations + code changes.

