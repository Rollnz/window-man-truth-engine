

# Attribution System Upgrade: Implementation Plan

## Overview

Add 10 new attribution columns across the full pipeline (Meta granular params, Google iOS click IDs, TikTok click ID, landing page URL), consolidate `tracking.ts` duplicate interfaces, and deploy bottom-up.

## Phase 1: Database Migration

### 1A. Add 10 columns to `leads` table

The `leads` table is missing all 10 new columns:

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

The current trigger syncs ~20 fields from `leads` to `wm_leads`. We add 11 new fields to both the INSERT and UPDATE blocks:

**INSERT block** -- add to column list and VALUES:
- `msclkid` (mapped from `NEW.msclkid`)
- `meta_placement`, `meta_campaign_id`, `meta_adset_id`, `meta_ad_id`
- `meta_site_source_name`, `meta_creative_id`
- `gbraid`, `wbraid`, `ttclid`
- `landing_page_url`

**UPDATE block** -- add with COALESCE preservation:
- `msclkid = COALESCE(NEW.msclkid, OLD.msclkid)` (preserves first-touch)
- Same COALESCE pattern for all 10 other new fields

Key existing mapping preserved: `leads.fbc` maps to `wm_leads.fbclid`.

---

## Phase 2: Edge Function (`save-lead`)

### 2A. Update `attributionSchema` (line 43)

Add 10 new fields using `meta_` prefix to match the frontend interface:

```typescript
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
```

### 2B. Update `leadRecord` (line 601)

Add 10 new fields mapped from `attribution?.meta_placement` etc. (not from `referer` header):

```typescript
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

Add first-touch preservation for click IDs (`gbraid`, `wbraid`, `ttclid`) and always-update for Meta granular fields. Expand the `existingLead` SELECT (line 680) to include `gbraid`, `wbraid`, `ttclid`.

---

## Phase 3: Frontend Changes

### 3A. `index.html` -- Early Capture Script (line 36)

Add 10 new params inside the existing `try...catch`:

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

Update `hasAttribution` to include `gbraid`, `wbraid`, `ttclid`. Push all to `dataLayer` event and `wm_early_attribution` sessionStorage.

### 3B. `src/lib/attribution.ts` -- `AttributionData` interface (line 20)

Add 10 new optional fields:

```typescript
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
```

### 3C. `src/lib/attribution.ts` -- `captureAttributionFromUrl()` (line 186)

Add capture for all new params with early capture fallback and `decodeURIComponent` for `placement` and `site_source_name`:

```typescript
meta_placement: (() => {
  const v = pick('placement') || earlyCapture.placement;
  try { return v ? decodeURIComponent(v) : undefined; } catch { return v; }
})(),
meta_campaign_id: pick('campaign_id') || earlyCapture.campaign_id,
// ... etc for all 10 fields
landing_page_url: window.location.href,
```

### 3D. `src/lib/attribution.ts` -- `determineChannel()` and `isMeaningfulTouch()`

Add channel detection for `gbraid`/`wbraid` (google_ads) and `ttclid` (tiktok_ads). Add these click IDs to the meaningful touch check.

### 3E. `src/lib/tracking.ts` -- Consolidation

**Remove** (confirmed zero external imports):
- `Attribution` interface (lines 61-63)
- `TouchPoint` interface (lines 66-78)
- `parseCurrentAttribution()` function (lines 81-102)
- `getAttribution()` function (lines 105-138)

**Add** import from `attribution.ts`:
```typescript
import { getFullAttributionData, type AttributionData } from './attribution';
```

**Update** `TrackEnvelope` (line 170): change `attribution` field type to use `AttributionData` tiers.

**Update** `track()` (line 209): replace `getAttribution()` with `getFullAttributionData()`.

All exported functions remain unchanged: `getOrCreateClientId`, `getOrCreateSessionId`, `track`, `trackSectionView`, `trackCTAClick`, `trackToolRoute`.

---

## Files Modified

| File | Change |
|------|--------|
| New SQL migration | Add columns to `leads` + `wm_leads`, replace trigger |
| `supabase/functions/save-lead/index.ts` | Zod schema + leadRecord + update path |
| `index.html` | Capture 10 new URL params in early script |
| `src/lib/attribution.ts` | 10 new fields + capture + channel + meaningful touch |
| `src/lib/tracking.ts` | Remove 4 internal constructs, import from `attribution.ts` |

## What Does NOT Change

- All 24 files importing functions from `tracking.ts` (none import the removed types)
- All 20 files importing from `attribution.ts` (additive interface change)
- `gtm.ts`, `wmTracking.ts`, admin pages, test files
- `leads_dashboard` view (auto-inherits new columns from `leads` table)

