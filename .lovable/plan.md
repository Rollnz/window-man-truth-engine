

# Fix Missing sessionId in Guide Modal Upsell Flows

## Problem Summary

All three guide modals have an identical bug: the **upsell consultation booking** (step 2 of the funnel) uses a direct `supabase.functions.invoke('save-lead', ...)` call that is missing critical Golden Thread fields:

| Missing Field | Purpose | Impact |
|---------------|---------|--------|
| `sessionId` | Links events in `wm_events` table | Attribution tracking fails |
| `clientId` | Ownership validation in Truth Engine | 403 errors possible |
| `leadId` | Links upsell to original lead | Duplicate leads created |
| `attribution` | First/last touch tracking | ROAS attribution broken |

**Server logs confirm:** `"Golden Thread: No sessionId provided - wm_events event not persisted"`

---

## Affected Files (All 3 Have Identical Bug)

| File | Line Range | Function |
|------|------------|----------|
| `src/components/conversion/KitchenTableGuideModal.tsx` | 227-248 | `handleLocationSubmit` |
| `src/components/conversion/SalesTacticsGuideModal.tsx` | 227-248 | `handleLocationSubmit` |
| `src/components/conversion/SpecChecklistGuideModal.tsx` | 256-277 | `handleLocationSubmit` |

---

## Solution

Add the missing Golden Thread fields to each `handleLocationSubmit` function's payload. This requires:

1. **Import** the required utilities
2. **Add** the Golden Thread fields to the `save-lead` payload

### Changes Per Modal

#### 1. Add Imports (top of each file)

```typescript
import { getOrCreateAnonId } from '@/hooks/useCanonicalScore';
import { getFullAttributionData } from '@/lib/attribution';
```

#### 2. Get sessionId from useSessionData

Each modal already uses `useSessionData()`. We need to also destructure `sessionId`:

```typescript
// Current:
const { sessionData, updateFields } = useSessionData();

// Fixed:
const { sessionData, updateFields, sessionId } = useSessionData();
```

#### 3. Update the save-lead Payload

Add the missing fields to the `supabase.functions.invoke` call:

```typescript
await supabase.functions.invoke('save-lead', {
  body: {
    email: values.email,
    firstName: values.firstName,
    lastName: values.lastName,
    phone: phoneE164 || values.phone,
    sourceTool: 'consultation',
    // ═══ GOLDEN THREAD FIELDS (NEW) ═══
    leadId: capturedLeadId,  // Link to original lead
    sessionId,               // From useSessionData
    sessionData: {
      clientId: getOrCreateAnonId(),
    },
    ...getFullAttributionData(),  // Spread first_touch, last_touch, last_non_direct
    // ═══════════════════════════════════
    aiContext: {
      source_form: 'kitchen-table-guide-upsell',  // (varies per modal)
      // ... existing fields
    },
  }
});
```

---

## Implementation Details

### KitchenTableGuideModal.tsx

**Line 15 - Add imports:**
```typescript
import { getOrCreateAnonId } from '@/hooks/useCanonicalScore';
import { getFullAttributionData } from '@/lib/attribution';
```

**Line 57 - Update useSessionData destructure:**
```typescript
const { sessionData, updateFields, sessionId } = useSessionData();
```

**Lines 227-248 - Update payload:**
```typescript
await supabase.functions.invoke('save-lead', {
  body: {
    email: values.email,
    firstName: values.firstName,
    lastName: values.lastName,
    phone: phoneE164 || values.phone,
    sourceTool: 'consultation',
    leadId: capturedLeadId,
    sessionId,
    sessionData: {
      clientId: getOrCreateAnonId(),
    },
    ...getFullAttributionData(),
    aiContext: {
      source_form: 'kitchen-table-guide-upsell',
      upsell_type: upsellType,
      property_type: projectDetails.propertyType,
      property_status: projectDetails.propertyStatus,
      window_reasons: projectDetails.windowReasons,
      window_count: projectDetails.windowCount,
      timeframe: projectDetails.timeframe,
      city: locationDetails.city,
      state: locationDetails.state,
      zip_code: locationDetails.zipCode,
      remark: locationDetails.remark,
    },
  }
});
```

### SalesTacticsGuideModal.tsx

Same pattern - update:
- **Line 15**: Add imports
- **Line 57**: Update `useSessionData` destructure
- **Lines 227-248**: Add Golden Thread fields to payload (with `source_form: 'sales-tactics-guide-upsell'`)

### SpecChecklistGuideModal.tsx

Same pattern - update:
- **Line 15**: Add imports
- **Line 57**: Update `useSessionData` destructure
- **Lines 256-277**: Add Golden Thread fields to payload (with `source_form: 'spec-checklist-guide-upsell'`)

---

## Before/After Comparison

```text
BEFORE (broken):
┌────────────────────────────────────────────┐
│  save-lead payload:                        │
│  {                                         │
│    email, firstName, lastName, phone,      │
│    sourceTool, aiContext                   │
│  }                                         │
│  ❌ Missing: sessionId, clientId, leadId   │
│  ❌ Missing: attribution data              │
│  ❌ Server: "wm_events event not persisted"│
└────────────────────────────────────────────┘

AFTER (fixed):
┌────────────────────────────────────────────┐
│  save-lead payload:                        │
│  {                                         │
│    email, firstName, lastName, phone,      │
│    sourceTool, aiContext,                  │
│    leadId,                    ✅           │
│    sessionId,                 ✅           │
│    sessionData: { clientId }, ✅           │
│    first_touch, last_touch,   ✅           │
│    last_non_direct            ✅           │
│  }                                         │
│  ✅ Golden Thread maintained               │
│  ✅ wm_events persisted                    │
│  ✅ Ownership validated                    │
└────────────────────────────────────────────┘
```

---

## Impact Assessment

| Risk | Level | Notes |
|------|-------|-------|
| Breaking changes | None | Only adding new fields to existing payloads |
| Side effects | Positive | Fixes attribution tracking for all 3 modals |
| Testing | Recommended | Submit through upsell flow and verify `wm_events` records |

