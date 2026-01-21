# ROAS Overlay Technical Notes

## Overview
The ROAS Overlay system provides Return on Ad Spend analytics by joining attribution data with deals and ad spend. This document describes the formulas, date filters, and data quality considerations.

---

## Date Filter Definitions

**IMPORTANT**: Different entities use different date fields for filtering:

| Entity | Date Field | Description |
|--------|------------|-------------|
| `wm_leads` | `created_at` | When the lead was captured |
| `deals` | `close_date` | When the deal was closed/won |
| `ad_spend_daily` | `spend_date` | The date the spend occurred |

This means:
- **Leads count** = leads created within the date range
- **Revenue/Profit** = from deals closed within the date range  
- **Spend** = ad spend within the date range

This is intentional: it measures "what did we close in this period" vs "what did we spend in this period", which is the standard ROAS calculation approach.

---

## Formulas

### ROAS (Return on Ad Spend)
```
ROAS = Revenue / Spend
```
- If `Spend = 0`, ROAS displays as "—" (null)
- ROAS >= 1.0 indicates break-even or profit
- ROAS < 1.0 indicates loss

### CPA (Cost Per Acquisition)
```
CPA = Spend / Deals Won
```
- If `Deals Won = 0`, CPA displays as "—" (null)
- Lower CPA is better

### Revenue Per Lead
```
Rev Per Lead = Revenue / Leads
```
- If `Leads = 0`, displays as "—" (null)

### Profit Per Lead  
```
Profit Per Lead = Profit / Leads
```
- If `Leads = 0`, displays as "—" (null)
- Negative values indicate loss per lead

---

## Platform Attribution Logic

Platform is derived from lead attribution fields using this priority:

1. `last_non_direct_gclid` is not null → **google**
2. `last_non_direct_fbclid` is not null → **meta**
3. `gclid` is not null → **google**
4. `fbclid` is not null → **meta**
5. `last_non_direct_utm_source` or `utm_source` contains "google" → **google**
6. `last_non_direct_utm_source` or `utm_source` contains "facebook", "instagram", or "meta" → **meta**
7. Otherwise → **other**

---

## Campaign Attribution Logic

Campaign is derived using `utm_campaign` from `wm_leads`:

1. `utm_campaign` (primary source - there is NO `last_non_direct_utm_campaign` column)
2. `null` → displays as "Unknown"

**Note**: Unlike platform attribution, campaign attribution does not have a "last non-direct" variant. The `wm_leads` table only stores `utm_campaign` directly.

---

## Mapping Quality Definitions

| Quality | Meaning |
|---------|---------|
| **high** | Perfect match (currently not achievable without campaign_id on wm_leads) |
| **medium** | Reasonable match via click IDs or normalized campaign string matching |
| **low** | Fallback grouping with no direct match possible |

### Platform Grouping
- **medium**: Both spend and revenue exist for this platform
- **low**: Only one side has data, or platform is "other"

### Campaign Grouping
- **medium**: Campaign string matches between spend and lead UTM (case-insensitive, normalized)
- **low**: No match found, campaign missing, or falls to "unknown"

---

## Limitations & Caveats

1. **Attribution is last-touch biased**: We use `last_non_direct_*` fields which capture the last paid touch before conversion. Multi-touch attribution is not supported.

2. **Campaign matching is fuzzy**: Without a canonical `campaign_id` on leads, we rely on UTM parameter string matching. Inconsistent UTM tagging will reduce accuracy.

3. **Timing mismatch is expected**: Leads created today may not close for weeks/months. This is why we filter deals by `close_date` and leads by `created_at` separately.

4. **Spend-revenue join is imperfect**: Spend comes from `ad_spend_daily` (imported from ad platforms), while revenue comes from leads → deals. The join is by derived platform/campaign, not by individual click or session.

5. **Other/Organic traffic**: Leads without click IDs or recognizable UTM sources are grouped as "other". This includes organic, direct, referral, and untagged paid traffic.

---

## Recommended Usage

- Use **Platform grouping** for high-level ROAS insights
- Use **Campaign grouping** for drill-down when UTM tagging is consistent
- Check **Mapping Quality** badges to assess data reliability
- Always verify spend imports are complete for the selected date range
- Use the drill-down to `/admin/revenue` for detailed deal analysis

---

## Future Improvements

1. Add `campaign_id` field to `wm_leads` for precise matching
2. Implement time-lag analysis (lead created → deal closed)
3. Add cohort analysis (leads created in month X → revenue over time)
4. Support multi-touch attribution models
