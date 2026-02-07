

# Unified Scoring Plan: Business Hierarchy Implementation

## Executive Summary
Your scoring system is currently fragmented across 5 different implementations. This plan consolidates everything into a single source of truth: the `get_event_score()` PostgreSQL function.

---

## Current State Analysis

### The Fragmentation Problem

You have **5 competing scoring systems** that don't talk to each other:

| System | Location | What It Scores | Status |
|--------|----------|----------------|--------|
| `get_event_score()` | DB Function | `wm_events` → `wm_leads.engagement_score` | **ACTIVE** (7 qualified, 2 hot leads) |
| `/track` function | Edge Function | `lead_activities` → `leads.lead_score_total` | **ACTIVE** (all leads at 0) |
| `intentTierMapping.ts` | Frontend | Meta CAPI/GTM events | **CLIENT-SIDE ONLY** |
| `leadScoringEngine.ts` | Frontend | Unused elaborate formulas | **DEAD CODE** |
| `toolDeltaValues.ts` | Frontend | Ad platform bidding values | **SEPARATE PURPOSE** |

### Why Leads Have Zero Scores

Your `leads` table shows all 72 leads with `lead_score_total = 0`:
```text
quote-scanner: 14 leads → avg_score: 0
expert-system: 10 leads → avg_score: 0
beat-your-quote: 8 leads → avg_score: 0
```

**Root Cause**: The `/track` function only scores these specific events:
- Section views (wm_proof_section_view)
- CTA clicks (wm_proof_cta_click)
- Tool routes (wm_tool_route)
- Engagement events (transcript/dossier opens)

It **does NOT score** the high-intent actions like `quote_scanned`, `lead_captured`, or `consultation_booked`.

---

## Your Business Hierarchy

Based on your input, here's the scoring model:

```text
┌─────────────────────────────────────────────────────────────────┐
│  TIER 5: REVENUE (100 pts)                                      │
│  "The Best" - Sale closed, deposit received                     │
├─────────────────────────────────────────────────────────────────┤
│  TIER 4: HAND RAISER (60 pts)                                   │
│  "Even Better" - Actively asking for sales conversation         │
│  → consultation_booked, request_estimate, booking_confirmed     │
├─────────────────────────────────────────────────────────────────┤
│  TIER 3: ENGAGED (35 pts)                                       │
│  "Better" - High-effort actions requiring work                  │
│  → ai_scanner, audit, beat_your_quote, sample_report,           │
│    quote_builder, expert_chat, roleplay, evidence_analyzed      │
├─────────────────────────────────────────────────────────────────┤
│  TIER 2: CURIOUS (10 pts)                                       │
│  "Good" - Gave contact info but not ready to buy                │
│  → ebook_download, guide_request, intel_library, fair_price_quiz│
├─────────────────────────────────────────────────────────────────┤
│  TIER 1: BROWSING (1-5 pts)                                     │
│  Passive engagement - page views, tool starts                   │
│  → page_view, tool_started, section_viewed                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Unified Event Scoring Matrix

### Tier 5: Revenue Events (100 pts)
| Event Name | Current Score | New Score | Notes |
|------------|---------------|-----------|-------|
| `sale_closed` | N/A | **100** | Future-proofing |
| `deposit_received` | N/A | **100** | Future-proofing |

### Tier 4: Hand Raiser Events (60 pts)
| Event Name | Current Score | New Score | Change |
|------------|---------------|-----------|--------|
| `consultation_booked` | 50 | **60** | +10 |
| `booking_confirmed` | N/A | **60** | NEW |
| `request_estimate` | N/A | **60** | NEW |
| `estimate_form_submitted` | N/A | **60** | NEW |
| `voice_estimate_confirmed` | N/A | **60** | NEW |

### Tier 3: Engaged Events (35 pts)
| Event Name | Current Score | New Score | Change |
|------------|---------------|-----------|--------|
| `quote_scanned` | 25 | **35** | +10 |
| `quote_generated` | 25 | **35** | +10 |
| `evidence_analyzed` | 20 | **35** | +15 |
| `expert_chat_session` | 20 | **35** | +15 |
| `roleplay_completed` | 20 | **35** | +15 |
| `document_uploaded` | 20 | **35** | +15 |
| `sample_report_unlocked` | N/A | **35** | NEW |
| `beat_quote_analyzed` | N/A | **35** | NEW |
| `audit_completed` | N/A | **35** | NEW |

### Tier 2: Curious Events (10 pts)
| Event Name | Current Score | New Score | Change |
|------------|---------------|-----------|--------|
| `lead_captured` | 30 | **10** | -20 (adjusted) |
| `guide_downloaded` | 15 | **10** | -5 |
| `fair_price_quiz_completed` | 20 | **10** | -10 |
| `reality_check_completed` | 15 | **10** | -5 |
| `risk_diagnostic_completed` | 15 | **10** | -5 |
| `ebook_download` | N/A | **10** | NEW |
| `intel_library_unlocked` | N/A | **10** | NEW |

### Tier 1: Browsing Events (1-5 pts)
| Event Name | Current Score | New Score | Notes |
|------------|---------------|-----------|-------|
| `*_started` | 5 | **5** | Keep |
| `*_viewed` | 2 | **2** | Keep |
| `page_view` | 2 | **1** | Reduce |
| `time_on_site_2min` | 10 | **5** | Reduce |
| Category: `engagement` | 5 | **3** | Reduce |

---

## Lead Quality Thresholds

### Current Thresholds (in `get_lead_quality`)
```text
cold:      < 50
warm:      50 - 99
hot:       100 - 149
qualified: 150+
```

### Proposed Thresholds (Aligned to Hierarchy)
```text
┌───────────────┬─────────────┬───────────────────────────────────┐
│ Quality       │ Score Range │ What It Means                     │
├───────────────┼─────────────┼───────────────────────────────────┤
│ window_shopper│ 0 - 9       │ Just browsing                     │
│ curious       │ 10 - 34     │ Downloaded guide, gave email      │
│ engaged       │ 35 - 59     │ Used high-effort tool             │
│ hot           │ 60 - 99     │ Asked for estimate/consultation   │
│ qualified     │ 100+        │ Revenue event or multiple hot     │
└───────────────┴─────────────┴───────────────────────────────────┘
```

**Reasoning**:
- A single Tier 2 action (10 pts) = "curious"
- A single Tier 3 action (35 pts) = "engaged"
- A single Tier 4 action (60 pts) = "hot"
- Two Tier 4 actions or one Tier 5 action = "qualified"

---

## Implementation Steps

### Phase 1: Update `get_event_score()` Function

Replace the current scoring logic with your hierarchy:

```sql
CREATE OR REPLACE FUNCTION public.get_event_score(event_name TEXT, event_category TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- ════════════════════════════════════════════════
  -- TIER 5: REVENUE (100 pts)
  -- ════════════════════════════════════════════════
  IF event_name IN ('sale_closed', 'deposit_received') THEN 
    RETURN 100;
  
  -- ════════════════════════════════════════════════
  -- TIER 4: HAND RAISER (60 pts)
  -- ════════════════════════════════════════════════
  ELSIF event_name IN (
    'consultation_booked',
    'booking_confirmed',
    'request_estimate',
    'estimate_form_submitted',
    'voice_estimate_confirmed'
  ) THEN 
    RETURN 60;
  
  -- ════════════════════════════════════════════════
  -- TIER 3: ENGAGED (35 pts)
  -- ════════════════════════════════════════════════
  ELSIF event_name IN (
    'quote_scanned',
    'quote_generated',
    'evidence_analyzed',
    'expert_chat_session',
    'roleplay_completed',
    'roleplay_game_completed',
    'document_uploaded',
    'sample_report_unlocked',
    'beat_quote_analyzed',
    'audit_completed',
    'quote_file_linked'
  ) THEN 
    RETURN 35;
  
  -- ════════════════════════════════════════════════
  -- TIER 2: CURIOUS (10 pts)
  -- ════════════════════════════════════════════════
  ELSIF event_name IN (
    'lead_captured',
    'guide_downloaded',
    'fair_price_quiz_completed',
    'reality_check_completed',
    'risk_diagnostic_completed',
    'ebook_download',
    'intel_library_unlocked',
    'vault_sync',
    'vault_email_sent'
  ) THEN 
    RETURN 10;
  
  -- ════════════════════════════════════════════════
  -- TIER 1: BROWSING (1-5 pts)
  -- ════════════════════════════════════════════════
  ELSIF event_name LIKE '%_started' THEN RETURN 5;
  ELSIF event_name LIKE '%_viewed' THEN RETURN 2;
  ELSIF event_name = 'time_on_site_2min' THEN RETURN 5;
  
  -- Category fallbacks
  ELSIF event_category = 'conversion' THEN RETURN 35;
  ELSIF event_category = 'tool' THEN RETURN 10;
  ELSIF event_category = 'vault' THEN RETURN 10;
  ELSIF event_category = 'engagement' THEN RETURN 3;
  ELSIF event_category = 'ai_tool' THEN RETURN 35;
  
  -- Default
  ELSE RETURN 1;
  END IF;
END;
$$;
```

### Phase 2: Update `get_lead_quality()` Thresholds

```sql
CREATE OR REPLACE FUNCTION public.get_lead_quality(score INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF score >= 100 THEN RETURN 'qualified';
  ELSIF score >= 60 THEN RETURN 'hot';
  ELSIF score >= 35 THEN RETURN 'engaged';
  ELSIF score >= 10 THEN RETURN 'curious';
  ELSE RETURN 'window_shopper';
  END IF;
END;
$$;
```

### Phase 3: Backfill Existing Leads

Run the backfill function to recalculate all existing leads:

```sql
SELECT public.backfill_all_lead_scores();
```

### Phase 4: Align Frontend Constants

Update `src/config/toolDeltaValues.ts` to match database:

```typescript
export const TOOL_DELTA_VALUES = {
  // Tier 4: Hand Raiser (60)
  'consultation': { deltaValue: 60 },
  'booking': { deltaValue: 60 },
  
  // Tier 3: Engaged (35)
  'quote-scanner': { deltaValue: 35 },
  'beat-your-quote': { deltaValue: 35 },
  'expert-system': { deltaValue: 35 },
  'sample-report': { deltaValue: 35 },
  
  // Tier 2: Curious (10)
  'intel-library': { deltaValue: 10 },
  'fair-price-quiz': { deltaValue: 10 },
  'reality-check': { deltaValue: 10 },
};
```

---

## Data Migration Impact

### Current Lead Distribution
```text
qualified (150+): 7 leads  → Will stay qualified
hot (100-149):    2 leads  → May change to engaged/hot
warm (50-99):     3 leads  → May change to engaged
engaged (10-49):  9 leads  → May change to curious
cold (0-9):       52 leads → Will stay window_shopper
```

### After Migration
With the new scoring, leads using high-effort tools (quote_scanned: 104 events) will properly accumulate to "engaged" or "hot" status.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/` | New migration with updated functions |
| `src/config/toolDeltaValues.ts` | Align values with new tiers |
| `src/lib/leadScoringEngine.ts` | Consider deprecating or aligning |
| `supabase/functions/track/index.ts` | Optional: align scoring or remove |

---

## Success Criteria

After implementation:
1. **Quote scanner users** (14 leads) should show as "engaged" (35+ pts)
2. **Consultation bookers** (7 leads) should show as "hot" (60+ pts)
3. **Guide downloaders** should show as "curious" (10 pts)
4. Lead quality labels match sales team expectations

---

## Decision Point

Before implementing, please confirm:

1. **Tier 3 Granularity**: Should `sample_report` (passive unlock) score the same as `quote_scanned` (active upload)? Or should sample_report be 20 pts (between Tier 2 and Tier 3)?

2. **`lead_captured` Placement**: Currently 30 pts. Proposed 10 pts. This means just submitting an email form = "curious" not "engaged". Is that correct for your sales process?

3. **Deprecate `/track` scoring?** The edge function has its own scoring system (CTA clicks, section views). Should we:
   - A) Keep it for micro-engagement tracking (separate from main lead scoring)
   - B) Align it with this hierarchy
   - C) Remove scoring from `/track` entirely

