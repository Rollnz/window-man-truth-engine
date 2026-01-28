# EMQ 9.5+ Implementation Status

## ✅ COMPLETED - Database & Edge Function Upgrades

**Migration Applied:** 2025-01-28

| Gap | Status | Implementation |
|-----|--------|----------------|
| Missing `zip` column in leads/wm_leads | ✅ FIXED | Added via migration |
| Missing `state` column in leads/wm_leads | ✅ FIXED | Added via migration |
| `city` not in leads table | ✅ FIXED | Added via migration |
| `client_user_agent` not persisted | ✅ FIXED | Added to leads table + save-lead edge function |
| Server-side `fn`/`ln` not hashed | ✅ FIXED | Added `hashName()` to `sendStapeGTMEvent()` |

---

## Remaining Work (Frontend Forms)

The following forms collect city/zip but need state dropdown added:

| Form/Modal | Status |
|------------|--------|
| KitchenTableGuideModal | ⏳ Needs state field |
| SalesTacticsGuideModal | ⏳ Needs state field |
| SpecChecklistGuideModal | ⏳ Needs state field |
| EstimateSlidePanel (AddressDetailsStep) | ✅ Already has state |

---

## EMQ Score Projection

| Action | EMQ |
|--------|-----|
| Baseline (email + phone + fbp/fbc) | 7.0-7.5 |
| + fn/ln (browser) | 8.0-8.5 |
| **+ fn/ln (server) [DONE]** | **8.5-9.0** |
| + city/state/zip (when form collects) | 9.0-9.5 |
| + external_id consistency | **9.5+** |
