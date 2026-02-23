
# Attribution System Upgrade — COMPLETED ✅

## Summary

Added 10 new attribution columns across the full pipeline (Meta granular params, Google iOS click IDs, TikTok click ID, landing page URL), consolidated `tracking.ts` duplicate interfaces, deployed bottom-up.

## Phases Completed

### ✅ Phase 1: Database Migration
- Added 10 columns to `leads` table
- Added 12 columns to `wm_leads` table (including missing `msclkid`)
- Replaced `handle_new_lead_to_crm()` trigger with all 11 new fields synced via COALESCE

### ✅ Phase 2: Edge Function (`save-lead`)
- Updated `attributionSchema` with 10 new Zod fields (all using `meta_` prefix)
- Updated `leadRecord` mapping from `attribution?.meta_placement` etc.
- Added first-touch preservation for `gbraid`, `wbraid`, `ttclid` in UPDATE path
- Added last-touch updates for Meta granular fields
- Expanded `existingLead` SELECT to include new click IDs

### ✅ Phase 3: Frontend Changes
- `index.html`: Early capture script now captures 10 new params + `landing_page_url`
- `src/lib/attribution.ts`: Interface extended, `captureAttributionFromUrl` enhanced with `decodeURIComponent`, channel detection for `google_ads`/`tiktok_ads`
- `src/lib/tracking.ts`: Removed duplicate `Attribution`/`TouchPoint`/`getAttribution`, now imports from `attribution.ts`

### ✅ E2E Test
- Submitted test lead with all new params via edge function
- Verified all 10 fields correctly stored in both `leads` and `wm_leads` tables
- Trigger COALESCE logic confirmed working
