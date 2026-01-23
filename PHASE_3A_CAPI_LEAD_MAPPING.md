# Phase 3A: CAPI Lead Mapping Audit (As-Is)

## Tag Details

| Field | Value |
|-------|-------|
| **Tag Name** | Facebook CAPI - Lead |
| **Tag Type** | Facebook Conversion API (stape-io) |
| **Trigger** | Lead Captured Trigger (Event Name contains `lead_captured`) |
| **Event Type** | Standard → Lead |
| **Facebook Pixel ID** | 1908588773426244 |
| **Test ID** | TEST47984 |
| **API Access Token** | ✅ Present |

---

## Server Event Data Override

| Property | Variable | Status |
|----------|----------|--------|
| **Event ID** | `{{Event Data - event_id}}` | ✅ Mapped |

---

## User Data Mapping (EMQ Parameters)

| Property Name | Variable | Status |
|--------------|----------|--------|
| **Email** | `{{Event Data - Email}}` | ✅ Mapped |
| **Phone** | `{{Event Data - Phone}}` | ✅ Mapped |
| **External ID** | `{{Event Data - External ID}}` | ✅ Mapped |
| **First Name** | `{{Event Data - First Name}}` | ✅ Mapped |
| **Last Name** | `{{Event Data - Last Name}}` | ✅ Mapped |
| **Lead ID** | `{{Event Data - Lead ID}}` | ✅ Mapped |
| **Click ID (fbc)** | `{{Cookie - _fbc}}` | ✅ Mapped |
| **Browser ID (fbp)** | `{{Cookie - _fbp}}` | ✅ Mapped |
| **Client IP Address** | `{{Client IP}}` | ✅ Mapped |
| **State** | `{{Event Data - State}}` | ✅ Mapped |
| **Zip** | `{{Event Data - Zip}}` | ✅ Mapped |

---

## Custom Data

| Property Name | Variable | Status |
|--------------|----------|--------|
| **browser_language** | `{{language}}` | ✅ Mapped |
| **value** | `{{Event Data - Value}}` | ✅ Mapped |
| **currency** | ❌ **NOT MAPPED** | ❌ Missing |

---

## Required CAPI Legitimacy Fields Audit

| Field | Required | Status | Notes |
|-------|----------|--------|-------|
| **action_source** | Yes | ⚠️ **NOT EXPLICITLY SET** | May default to 'website' via stape-io tag |
| **client_ip_address** | Yes | ✅ Mapped | `{{Client IP}}` |
| **client_user_agent** | Yes | ⚠️ **NOT EXPLICITLY SET** | May be auto-populated by stape-io |
| **event_source_url** | Yes | ⚠️ **NOT EXPLICITLY SET** | May be auto-populated by stape-io |
| **event_time** | Yes | ⚠️ **NOT EXPLICITLY SET** | May be auto-populated by stape-io |

---

## Required Attribution Cookies

| Field | Status | Variable |
|-------|--------|----------|
| **fbp** | ✅ Mapped | `{{Cookie - _fbp}}` |
| **fbc** | ✅ Mapped | `{{Cookie - _fbc}}` |

---

## Required Identity Keys (Hashed/Normalized)

| Field | Status | Variable |
|-------|--------|----------|
| **user_data.em** | ✅ Mapped | `{{Event Data - Email}}` |
| **user_data.ph** | ✅ Mapped | `{{Event Data - Phone}}` |
| **user_data.external_id** | ✅ Mapped | `{{Event Data - External ID}}` |

---

## Advanced Matching Fields

| Field | Status | Variable |
|-------|--------|----------|
| **user_data.fn** | ✅ Mapped | `{{Event Data - First Name}}` |
| **user_data.ln** | ✅ Mapped | `{{Event Data - Last Name}}` |
| **user_data.ct** (city) | ❌ **NOT MAPPED** | - |
| **user_data.st** (state) | ✅ Mapped | `{{Event Data - State}}` |
| **user_data.zp** (zip) | ✅ Mapped | `{{Event Data - Zip}}` |
| **user_data.country** | ❌ **NOT MAPPED** | - |

---

## Deterministic Deduplication

| Field | Status | Variable |
|-------|--------|----------|
| **event_id** | ✅ Mapped | `{{Event Data - event_id}}` |

**Note:** The event_id is overridden from the incoming request using `{{Event Data - event_id}}`. This is the correct configuration for deduplication.

---

## Summary Table: CAPI Lead Mapping (As-Is)

| Field | Status |
|-------|--------|
| event_id | ✅ Mapped |
| action_source | ⚠️ Questionable (not explicit, may default) |
| event_source_url | ⚠️ Questionable (not explicit, may auto-populate) |
| client_ip_address | ✅ Mapped |
| client_user_agent | ⚠️ Questionable (not explicit, may auto-populate) |
| event_time | ⚠️ Questionable (not explicit, may auto-populate) |
| fbp | ✅ Mapped |
| fbc | ✅ Mapped |
| user_data.em | ✅ Mapped |
| user_data.ph | ✅ Mapped |
| user_data.external_id | ✅ Mapped |
| user_data.fn | ✅ Mapped |
| user_data.ln | ✅ Mapped |
| user_data.ct | ❌ Missing |
| user_data.st | ✅ Mapped |
| user_data.zp | ✅ Mapped |
| user_data.country | ❌ Missing |
| value | ✅ Mapped |
| currency | ⚠️ Questionable (not visible in Custom Data) |

---

## Gaps Identified

1. **action_source** - Not explicitly set (may default via stape-io)
2. **event_source_url** - Not explicitly set (may auto-populate)
3. **client_user_agent** - Not explicitly set (may auto-populate)
4. **event_time** - Not explicitly set (may auto-populate)
5. **user_data.ct** (city) - Not mapped
6. **user_data.country** - Not mapped
7. **currency** - Not visible in Custom Data section

---

## Next Steps

1. Verify if stape-io tag auto-populates action_source, event_source_url, client_user_agent, event_time
2. Consider adding city and country mappings if data is available
3. Verify currency is being passed correctly
