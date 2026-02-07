
# Golden Thread Identity Consolidation — Final Production-Ready Implementation

## Overview

This plan implements the v4.0 Golden Thread Identity Consolidation with all critical fixes, including the 5 missing schema columns, the trigger fix for CRM attribution, and downstream dashboard verification.

---

## Implementation Phases

### Phase 1: Create Zero-Dependency Identity Module

**Create: `src/lib/goldenThread.ts`**

A standalone module with ZERO imports that provides the canonical Golden Thread ID. This prevents circular dependencies and serves as the single source of truth.

Key features:
- Primary storage: `localStorage['wte-anon-id']`
- Backup storage: Cookie `wte_anon_id` (400-day TTL)
- Browser-only JSDoc documentation for SSR safety
- Function: `getGoldenThreadId(): string`

---

### Phase 2: Create Startup Reconciliation Function (Updated)

**Create: `src/lib/identityReconciliation.ts`**

**CRITICAL UPDATE (Per User Request):** Before generating a new UUID, the reconciler must first **adopt** any existing legacy ID to prevent history loss for returning users.

Logic order:
1. Check if `wte-anon-id` already exists → use it
2. Check if `wte_anon_id` cookie exists → adopt it
3. Check if `wm_client_id` exists in localStorage → adopt it as the canonical ID
4. Check if `wm_vid` exists in localStorage → adopt it as the canonical ID  
5. Only if NONE exist → generate new UUID

Then sync all legacy keys and cookies to the canonical value.

**Keys reconciled (visitor-scoped ONLY):**
- `wm_client_id` (localStorage)
- `wm_vid` (localStorage + cookie)

**Keys NOT touched (session-scoped):**
- `wm-session-id` — intentionally separate

**Rollback safety:**
- Stash original values in `{key}_pre_migration` before overwriting

---

### Phase 3: Update main.tsx

**Modify: `src/main.tsx`**

Replace the current `getOrCreateAnonId()` call with the reconciler:

```typescript
import { reconcileIdentities } from './lib/identityReconciliation';

const goldenThreadFID = reconcileIdentities();
console.log(`[Golden Thread] Active FID: ${goldenThreadFID}`);
```

---

### Phase 4: Fix `handle_new_lead_to_crm` Trigger (SHIP-BLOCKER)

**SQL Migration Required**

The current trigger fails because it looks up sessions by primary key (`WHERE id = client_id`) instead of visitor identity (`WHERE anonymous_id = client_id`).

**Current (broken):**
```sql
SELECT EXISTS(
  SELECT 1 FROM public.wm_sessions WHERE id = NEW.client_id::uuid
) INTO session_exists;
```

**Fixed:**
```sql
-- Find the most recent session for this visitor (by anonymous_id)
IF NEW.client_id IS NOT NULL AND NEW.client_id ~ '^[0-9a-f]{8}-...$' THEN
  SELECT id INTO validated_session_id
  FROM public.wm_sessions 
  WHERE anonymous_id = NEW.client_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  session_exists := validated_session_id IS NOT NULL;
END IF;
```

**Impact of fix:** 
- `wm_leads.original_session_id` correctly populated
- `link_quote_analyses_to_lead()` now fires properly
- CRM attribution chain restored

---

### Phase 5: Fix `save-lead` anonymousIdFallback (SHIP-BLOCKER)

**Modify: `supabase/functions/save-lead/index.ts`**

**Line ~1057 current:**
```typescript
anonymousIdFallback: `lead-${leadId}`,
```

**Fixed:**
```typescript
anonymousIdFallback: clientId || `lead-${leadId}`,
```

Where `clientId` is extracted from `sessionData.clientId` (already available in the function).

---

### Phase 6: Add `identity_version` Column

**SQL Migration:**

```sql
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS identity_version smallint DEFAULT 1;

COMMENT ON COLUMN leads.identity_version IS 
  '1 = legacy (mixed ID sources), 2 = Golden Thread (unified wte-anon-id)';

CREATE INDEX IF NOT EXISTS idx_leads_identity_version 
ON leads(identity_version);
```

**Modify: `supabase/functions/save-lead/index.ts`**

1. Add `identity_version: 2` to new lead `INSERT` records
2. Add `identity_version: 2` to `UPDATE` records (email-match path)
3. Do NOT add to Zod schema — this is server-set only

---

### Phase 7: Add 5 Missing Schema Columns (Per User Request)

**SQL Migration:**

```sql
-- Add missing columns for complete attribution data
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS original_session_id uuid,
ADD COLUMN IF NOT EXISTS device_type text,
ADD COLUMN IF NOT EXISTS referrer text,
ADD COLUMN IF NOT EXISTS landing_page text,
ADD COLUMN IF NOT EXISTS ip_hash text;

-- Add indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_leads_session_id 
ON leads(original_session_id) WHERE original_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_device_type 
ON leads(device_type) WHERE device_type IS NOT NULL;
```

**Update `save-lead` to populate:**
- `original_session_id` ← from `sessionId` in payload
- `device_type` ← from client user agent parsing
- `referrer` ← from HTTP Referer header or attribution data
- `landing_page` ← from `source_page` or session data
- `ip_hash` ← already computed in function

---

### Phase 8: Update `useCanonicalScore.ts`

**Modify: `src/hooks/useCanonicalScore.ts`**

Replace inline implementation with import from canonical module:

```typescript
import { getGoldenThreadId } from '@/lib/goldenThread';

// Re-export for backward compatibility
export const getOrCreateAnonId = getGoldenThreadId;
```

Remove the duplicate implementation (lines 13-68).

---

### Phase 9: Update `eventMetadataHelper.ts`

**Modify: `src/lib/eventMetadataHelper.ts`**

Replace `getVisitorIdFromCookie()` with canonical source:

```typescript
import { getGoldenThreadId } from '@/lib/goldenThread';

// Line ~70
const visitorId = input.visitorId || getGoldenThreadId() || 'unknown';
```

---

### Phase 10: Update `windowTruthClient.ts`

**Modify: `src/lib/windowTruthClient.ts`**

Use static import to set `anonymous_id` from Golden Thread:

```typescript
import { getGoldenThreadId } from '@/lib/goldenThread';

// In createOrRefreshSession() line ~92
const anonymousId = getGoldenThreadId();
```

---

### Phase 11: Deprecate Legacy Functions in `tracking.ts`

**Modify: `src/lib/tracking.ts`**

Add JSDoc deprecation (NO runtime warning to avoid console noise):

```typescript
/**
 * @deprecated Use getGoldenThreadId() from '@/lib/goldenThread' instead.
 * This function is aliased to the canonical ID via the startup reconciler,
 * so it works correctly but should be migrated in future cleanup.
 */
export function getOrCreateClientId(): string {
  // ... existing implementation
}
```

---

### Phase 12: Update `attributionLogger.ts` Documentation

**Modify: `supabase/functions/_shared/attributionLogger.ts`**

Add clear documentation about Golden Thread ID usage:

```typescript
/** 
 * CRITICAL: Pass the Golden Thread ID (clientId from request payload).
 * This ensures wm_sessions.anonymous_id matches leads.client_id for proper joins.
 */
anonymousIdFallback?: string;
```

---

### Step 11 (User Request): Downstream Dashboard Verification

After all code changes are deployed, manually verify these admin pages:

| Page | URL | Verify |
|------|-----|--------|
| CRM Dashboard | `/admin/crm` | Leads load, Kanban works |
| ROI Dashboard | `/admin/roi` | ROAS data displays |
| Attribution Dashboard | `/admin/attribution` | Source breakdown visible |
| Attribution Health | `/admin/attribution-health` | Health metrics load |
| Lead Detail | `/admin/leads/:id` | Individual lead data shows |
| Quotes Dashboard | `/admin/quotes` | Quote list renders |
| Executive Profit | `/admin/executive` | Revenue metrics visible |

**Specific checks:**
1. No "Invalid UUID" errors in console
2. No "Missing Column" errors
3. New leads created post-migration have `identity_version = 2`
4. `wm_leads.original_session_id` is populated for new leads

---

## Files to Create/Modify Summary

| Action | File |
|--------|------|
| **Create** | `src/lib/goldenThread.ts` |
| **Create** | `src/lib/identityReconciliation.ts` |
| **Modify** | `src/main.tsx` |
| **Modify** | `src/hooks/useCanonicalScore.ts` |
| **Modify** | `src/lib/eventMetadataHelper.ts` |
| **Modify** | `src/lib/windowTruthClient.ts` |
| **Modify** | `src/lib/tracking.ts` |
| **Modify** | `supabase/functions/_shared/attributionLogger.ts` |
| **Modify** | `supabase/functions/save-lead/index.ts` |
| **SQL** | `handle_new_lead_to_crm` trigger fix |
| **SQL** | Add `identity_version` column |
| **SQL** | Add 5 missing columns + indexes |

---

## Success Criteria

After implementation:
- [ ] Console shows `[Golden Thread] Active FID: xxx` on page load
- [ ] Same FID appears in all browser tabs
- [ ] New leads have `identity_version = 2`
- [ ] New leads have `client_id` matching the console FID
- [ ] `wm_leads.original_session_id` is populated for new leads
- [ ] `wm_sessions.anonymous_id` matches `leads.client_id`
- [ ] Pre-migration values stashed in `wm_client_id_pre_migration`
- [ ] All admin dashboards load without UUID/column errors
- [ ] Returning users with legacy IDs are adopted (not given new IDs)
