# Phase 3: Identity Quality for EMQ Lift

## Executive Summary

Phase 3 focuses on verifying and improving Event Match Quality (EMQ) for Meta Conversions API by ensuring proper identity resolution, cookie passthrough, and deduplication.

---

## Step 3A: Server-Side CAPI Mapping Audit ✅ COMPLETE

### Facebook CAPI - Lead Tag Configuration

**Container:** GTM Server Container (GTM-PJZDXKH9)
**Tag Type:** Facebook Conversion API (stape-io)
**Trigger:** Lead Captured Trigger (Event Name contains `lead_captured`)
**Pixel ID:** 1908588773426244

### User Data Mapping (EMQ Parameters)

| Field | Variable | Status |
|-------|----------|--------|
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

### Server Event Data Override

| Field | Variable | Status |
|-------|----------|--------|
| **Event ID** | `{{Event Data - event_id}}` | ✅ Mapped (Deduplication) |

### Custom Data (Before Step 3B)

| Field | Variable | Status |
|-------|----------|--------|
| browser_language | `{{language}}` | ✅ Mapped |
| value | `{{Event Data - Value}}` | ✅ Mapped |
| currency | ❌ NOT MAPPED | ⚠️ GAP FOUND |

---

## Step 3B: Implement Missing Mappings ✅ COMPLETE

### Gap Identified
- **currency** was not mapped in Custom Data section

### Fix Applied
Added `currency` → `{{Event Data - Currency}}` to Custom Data section

### Updated Custom Data Configuration

| Property Name | Property Value | Status |
|--------------|----------------|--------|
| browser_language | `{{language}}` | ✅ Existing |
| value | `{{Event Data - Value}}` | ✅ Existing |
| currency | `{{Event Data - Currency}}` | ✅ **NEW** |

### Change Status
- **Workspace Changes:** 1
- **Last Edited:** January 23, 2026
- **Status:** Saved (pending publish)

---

## Step 3C: Cookie Integrity Proof (_fbp / _fbc)

### Cookie Configuration in GTM Server

| Cookie | Variable | Source |
|--------|----------|--------|
| `_fbp` | `{{Cookie - _fbp}}` | First-party cookie set by Meta Pixel |
| `_fbc` | `{{Cookie - _fbc}}` | Click ID from fbclid URL parameter |

### Cookie Flow

1. **_fbp (Facebook Browser ID)**
   - Set by Meta Pixel on first page view
   - Format: `fb.1.{timestamp}.{random_id}`
   - Persists across sessions for user identification
   - Passed to CAPI via `{{Cookie - _fbp}}` variable

2. **_fbc (Facebook Click ID)**
   - Set when user clicks Facebook ad (fbclid in URL)
   - Format: `fb.1.{timestamp}.{fbclid}`
   - Links conversion to specific ad click
   - Passed to CAPI via `{{Cookie - _fbc}}` variable

### Verification Points

- [ ] Verify _fbp cookie is set on page load
- [ ] Verify _fbc cookie is set when fbclid present
- [ ] Verify cookies are passed to server container
- [ ] Verify cookies appear in CAPI payload

---

## Step 3D: Live Deduplication Test

### Test Procedure

1. Open GTM Preview mode for both Web and Server containers
2. Navigate to site with GTM Preview connected
3. Submit a test lead form
4. Verify in GTM Preview:
   - `lead_submission_success` event fires with `event_id`
   - Meta Pixel Lead fires with same `event_id`
   - Server CAPI Lead fires with same `event_id`
5. Check Meta Events Manager Test Events for deduplication status

### Expected Results

| Event Source | event_id | Status |
|--------------|----------|--------|
| Web (Pixel) | `{uuid}` | Fires once |
| Server (CAPI) | `{uuid}` | Fires once |
| Meta Events Manager | Deduplicated | Green indicator |

---

## Step 3E: EMQ Confirmation

### EMQ Parameters Checklist

| Parameter | Web Payload | Server CAPI | Status |
|-----------|-------------|-------------|--------|
| em (email hash) | ✅ | ✅ | Mapped |
| ph (phone hash) | ✅ | ✅ | Mapped |
| fn (first name hash) | ✅ | ✅ | Mapped |
| ln (last name hash) | ✅ | ✅ | Mapped |
| external_id | ✅ | ✅ | Mapped |
| fbp | ✅ | ✅ | Mapped |
| fbc | ✅ | ✅ | Mapped |
| client_ip_address | N/A | ✅ | Server only |
| client_user_agent | N/A | Auto | Server only |

### Expected EMQ Score

With all parameters properly mapped:
- **Email + Phone:** Good baseline
- **+ First/Last Name:** Improved matching
- **+ fbp/fbc:** Excellent click attribution
- **+ IP/User Agent:** Maximum matching

**Target EMQ:** 8.0+ (Good to Excellent)

---

## Next Steps

1. ✅ Step 3A Complete - Audit done
2. ✅ Step 3B Complete - Currency mapping added
3. ⏳ Step 3C - Cookie integrity verification (in progress)
4. ⏳ Step 3D - Live deduplication test
5. ⏳ Step 3E - EMQ confirmation report
6. ⏳ Publish changes and final verification

---

## Change Log

| Date | Step | Change | Status |
|------|------|--------|--------|
| 2026-01-23 | 3B | Added currency mapping to CAPI Lead tag | Saved |
