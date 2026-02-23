

# Attribution System Upgrade: Final Corrected Plan

## Overview

Add 10 new attribution columns across the full pipeline (Meta granular params, Google iOS, TikTok), consolidate `tracking.ts` duplicate interfaces, and deploy bottom-up: DB first, then edge function, then frontend.

## Corrections Applied (Your Feedback)

| Issue | Fix |
|-------|-----|
| Naming mismatch: Zod expects `placement` but interface sends `meta_placement` | All Zod fields use `meta_` prefix to match `AttributionData` |
| `landing_page_url` mapped from `referer` header (wrong) | Mapped from `attribution.landing_page_url` (the actual arrival URL) |
| `msclkid` missing from `wm_leads` trigger UPDATE block | Explicitly included with `COALESCE(NEW.msclkid, OLD.msclkid)` |
| `decodeURIComponent` for Meta params | Applied to `placement` and `site_source_name` which can contain encoded chars |

---

## Phase 1: Database Migration (Deploy First)

### 1A. Add 10 columns to `leads` table

```sql
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS meta_placement TEXT,
  ADD COLUMN IF NOT EXISTS meta_campaign_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_adset_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_ad_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_site_source_name TEXT,
  ADD COLUMN IF NOT EXISTS meta_creative_id TEXT,
  ADD COLUMN IF NOT EXISTS gbraid TEXT,
  ADD COLUMN IF NOT EXISTS wbraid TEXT,
  ADD COLUMN IF NOT EXISTS ttclid TEXT,
  ADD COLUMN IF NOT EXISTS landing_page_url TEXT;
```

### 1B. Add 12 columns to `wm_leads` table

`wm_leads` is also missing `msclkid` (confirmed via schema query), so we add it here too:

```sql
ALTER TABLE public.wm_leads
  ADD COLUMN IF NOT EXISTS msclkid TEXT,
  ADD COLUMN IF NOT EXISTS meta_placement TEXT,
  ADD COLUMN IF NOT EXISTS meta_campaign_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_adset_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_ad_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_site_source_name TEXT,
  ADD COLUMN IF NOT EXISTS meta_creative_id TEXT,
  ADD COLUMN IF NOT EXISTS gbraid TEXT,
  ADD COLUMN IF NOT EXISTS wbraid TEXT,
  ADD COLUMN IF NOT EXISTS ttclid TEXT,
  ADD COLUMN IF NOT EXISTS landing_page_url TEXT;
```

### 1C. Replace `handle_new_lead_to_crm()` trigger

The INSERT block adds all 11 new columns. The UPDATE block adds all 11 with `COALESCE(NEW.x, OLD.x)` preservation -- including `msclkid`.

Key mapping note: `leads.fbc` maps to `wm_leads.fbclid` (existing convention preserved).

---

## Phase 2: Edge Function `save-lead` (Deploy Second)

### 2A. Update `attributionSchema` (line 43)

All fields use the `meta_` prefix to match the frontend `AttributionData` interface:

```typescript
const attributionSchema = z.object({
  // ... existing 9 fields unchanged ...
  meta_placement: z.string().max(255).optional().nullable(),
  meta_campaign_id: z.string().max(255).optional().nullable(),
  meta_adset_id: z.string().max(255).optional().nullable(),
  meta_ad_id: z.string().max(255).optional().nullable(),
  meta_site_source_name: z.string().max(100).optional().nullable(),
  meta_creative_id: z.string().max(255).optional().nullable(),
  gbraid: z.string().max(255).optional().nullable(),
  wbraid: z.string().max(255).optional().nullable(),
  ttclid: z.string().max(255).optional().nullable(),
  landing_page_url: z.string().max(2000).optional().nullable(),
}).optional().nullable();
```

### 2B. Update `leadRecord` (line 601)

Mapping uses `attribution?.meta_placement` (not `referer`):

```typescript
// New attribution fields
meta_placement: attribution?.meta_placement || null,
meta_campaign_id: attribution?.meta_campaign_id || null,
meta_adset_id: attribution?.meta_adset_id || null,
meta_ad_id: attribution?.meta_ad_id || null,
meta_site_source_name: attribution?.meta_site_source_name || null,
meta_creative_id: attribution?.meta_creative_id || null,
gbraid: attribution?.gbraid || null,
wbraid: attribution?.wbraid || null,
ttclid: attribution?.ttclid || null,
landing_page_url: attribution?.landing_page_url || null,
```

### 2C. Update the UPDATE path (line 728)

Add first-touch preservation for click IDs, always-update for the rest:

```typescript
// New click IDs: preserve first-touch
if (!existingLead?.gbraid && attribution?.gbraid) {
  updateRecord.gbraid = attribution.gbraid;
}
if (!existingLead?.wbraid && attribution?.wbraid) {
  updateRecord.wbraid = attribution.wbraid;
}
if (!existingLead?.ttclid && attribution?.ttclid) {
  updateRecord.ttclid = attribution.ttclid;
}
// Meta granular: always update (last-touch)
updateRecord.meta_placement = attribution?.meta_placement || undefined;
updateRecord.meta_campaign_id = attribution?.meta_campaign_id || undefined;
updateRecord.meta_adset_id = attribution?.meta_adset_id || undefined;
updateRecord.meta_ad_id = attribution?.meta_ad_id || undefined;
updateRecord.meta_site_source_name = attribution?.meta_site_source_name || undefined;
updateRecord.meta_creative_id = attribution?.meta_creative_id || undefined;
updateRecord.landing_page_url = attribution?.landing_page_url || undefined;
```

Also need to expand the `existingLead` SELECT (line 680) to include `gbraid`, `wbraid`, `ttclid`.

---

## Phase 3: Frontend Changes (Deploy Last)

### 3A. `index.html` -- Early Capture Script (line 36)

Add inside the existing `try...catch`:

```javascript
placement: params.get('placement') || undefined,
campaign_id: params.get('campaign_id') || undefined,
adset_id: params.get('adset_id') || undefined,
ad_id: params.get('ad_id') || undefined,
site_source_name: params.get('site_source_name') || undefined,
creative_id: params.get('creative_id') || undefined,
gbraid: params.get('gbraid') || undefined,
wbraid: params.get('wbraid') || undefined,
ttclid: params.get('ttclid') || undefined,
landing_page_url: window.location.href,
```

Update `hasAttribution` check to include `gbraid`, `wbraid`, `ttclid`.

Push all to `dataLayer` event and `wm_early_attribution` sessionStorage.

### 3B. `src/lib/attribution.ts` -- `AttributionData` interface

Add 10 new optional fields:

```typescript
export interface AttributionData {
  // ... existing fields ...
  // Meta Ads granular params
  meta_placement?: string;
  meta_campaign_id?: string;
  meta_adset_id?: string;
  meta_ad_id?: string;
  meta_site_source_name?: string;
  meta_creative_id?: string;
  // Google iOS tracking
  gbraid?: string;
  wbraid?: string;
  // TikTok
  ttclid?: string;
  // Full landing page URL
  landing_page_url?: string;
}
```

### 3C. `src/lib/attribution.ts` -- `captureAttributionFromUrl()`

Add capture with `decodeURIComponent` for Meta string params:

```typescript
meta_placement: (() => {
  const v = pick('placement') || earlyCapture.placement;
  try { return v ? decodeURIComponent(v) : undefined; } catch { return v; }
})(),
meta_campaign_id: pick('campaign_id') || earlyCapture.campaign_id,
meta_adset_id: pick('adset_id') || earlyCapture.adset_id,
meta_ad_id: pick('ad_id') || earlyCapture.ad_id,
meta_site_source_name: (() => {
  const v = pick('site_source_name') || earlyCapture.site_source_name;
  try { return v ? decodeURIComponent(v) : undefined; } catch { return v; }
})(),
meta_creative_id: pick('creative_id') || earlyCapture.creative_id,
gbraid: pick('gbraid') || earlyCapture.gbraid,
wbraid: pick('wbraid') || earlyCapture.wbraid,
ttclid: pick('ttclid') || earlyCapture.ttclid,
landing_page_url: window.location.href,
```

### 3D. `src/lib/attribution.ts` -- `determineChannel()`

Add new channel detection:

```typescript
if (data.gbraid || data.wbraid) return 'google_ads';
if (data.ttclid) return 'tiktok_ads';
```

### 3E. `src/lib/attribution.ts` -- `isMeaningfulTouch()`

Add new click IDs:

```typescript
if (data.gbraid || data.wbraid || data.ttclid) return true;
```

### 3F. `src/lib/tracking.ts` -- Consolidation

**Remove** (confirmed: zero external imports):
- `Attribution` interface (lines 61-63)
- `TouchPoint` interface (lines 66-78)
- `parseCurrentAttribution()` function (lines 81-102)
- `getAttribution()` function (lines 105-138)

**Add** import:
```typescript
import { getFullAttributionData, type AttributionData } from './attribution';
```

**Update** `TrackEnvelope` (line 170):
```typescript
attribution: {
  first_touch: AttributionData;
  last_touch: AttributionData;
  last_non_direct: AttributionData;
};
```

**Update** `track()` (line 209):
```typescript
const attribution = getFullAttributionData(); // replaces getAttribution()
```

All exported functions stay identical: `getOrCreateClientId`, `getOrCreateSessionId`, `track`, `trackSectionView`, `trackCTAClick`, `trackToolRoute`.

---

## Files Modified

| File | Change |
|------|--------|
| New SQL migration | Add columns to `leads` + `wm_leads`, replace trigger |
| `supabase/functions/save-lead/index.ts` | Zod schema + leadRecord + update path (all using `meta_` prefix) |
| `index.html` | Capture 10 new URL params in early script |
| `src/lib/attribution.ts` | 10 new fields in interface + capture + channel + meaningful touch |
| `src/lib/tracking.ts` | Remove 4 internal constructs, import from `attribution.ts` |

## What Does NOT Change

- All 24 files importing functions from `tracking.ts` (none import the removed types)
- All 20 files importing from `attribution.ts` (additive interface change)
- `gtm.ts`, `wmTracking.ts`, admin pages, test files
- `leads_dashboard` view (auto-inherits new columns)

