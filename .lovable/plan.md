
# Fix Score-Event Ownership Validation for Anonymous Users

## Problem Analysis

The `score-event` edge function is returning 403 errors because:

1. **Identity Fragmentation**: The `wte-anon-id` (used for scoring) has no cookie backup
2. **Strict Ownership**: Current validation requires exact match between `anon_id` and `lead.client_id`
3. **Session Loss**: When localStorage is cleared, a new `anon_id` is generated, breaking ownership

**Evidence from logs:**
```
client_id=b4e08751-354c-4250-9dc3-5fa445acaee1 !== anon_id=694ffb83-0ef1-44a7-954e-7aa4b26cd93e
```

---

## Solution Overview

A two-part fix:

1. **Immediate**: Add session-based validation fallback in `score-event`
2. **Preventative**: Add cookie backup to `getOrCreateAnonId()` to prevent future mismatches

---

## Part 1: Update `score-event` Edge Function

### Changes to `validateOwnership()` Function

**File:** `supabase/functions/score-event/index.ts`

**Current Logic (line 269-307):**
```
if entityType === 'lead':
  - Fetch lead from database
  - Check if anon_id matches lead.client_id
  - If no match → FAIL (403)
```

**New Logic:**
```
if entityType === 'lead':
  - Fetch lead from database
  - Check if anon_id matches lead.client_id → SUCCESS
  - If no match AND anon_id exists as valid session → SUCCESS (with log)
  - If no match AND no valid session → FAIL (403)
```

### Implementation Details

Add a new helper function to validate session existence:

```typescript
async function isValidSession(supabase: any, sessionId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('wm_sessions')
      .select('id')
      .eq('id', sessionId)
      .maybeSingle();
    
    return !error && data !== null;
  } catch {
    return false;
  }
}
```

Update the `validateOwnership` function for `entityType === 'lead'`:

```typescript
if (entityType === 'lead') {
  const { data, error } = await supabase
    .from('leads')
    .select('id, user_id, client_id')
    .eq('id', entityId)
    .maybeSingle();

  if (error || !data) {
    console.log(`[score-event] Lead not found: ${entityId}`);
    return false;
  }

  // 1. Check authenticated user ownership
  if (userId && data.user_id === userId) {
    console.log(`[score-event] ✓ Ownership via user_id match`);
    return true;
  }
  
  // 2. Check anonymous client_id match (primary)
  if (anonId && data.client_id === anonId) {
    console.log(`[score-event] ✓ Ownership via client_id match`);
    return true;
  }

  // 3. FALLBACK: Allow if anon_id is a valid session
  //    This handles cases where localStorage was cleared but user has valid session
  if (anonId) {
    const sessionValid = await isValidSession(supabase, anonId);
    if (sessionValid) {
      console.log(`[score-event] ✓ Ownership via valid session fallback (client_id mismatch)`);
      console.log(`[score-event] Note: client_id=${data.client_id} !== anon_id=${anonId}`);
      return true;
    }
  }

  console.log(`[score-event] ✗ Ownership validation failed`);
  return false;
}
```

---

## Part 2: Add Cookie Backup to `getOrCreateAnonId()`

**File:** `src/hooks/useCanonicalScore.ts`

**Current Implementation:**
```typescript
const ANON_ID_KEY = 'wte-anon-id';

export function getOrCreateAnonId(): string {
  try {
    let anonId = localStorage.getItem(ANON_ID_KEY);
    if (!anonId) {
      anonId = crypto.randomUUID();
      localStorage.setItem(ANON_ID_KEY, anonId);
    }
    return anonId;
  } catch {
    return crypto.randomUUID();
  }
}
```

**New Implementation (with cookie backup):**
```typescript
const ANON_ID_KEY = 'wte-anon-id';
const ANON_ID_COOKIE = 'wte_anon_id';
const ANON_ID_TTL_DAYS = 400;

function setAnonIdCookie(anonId: string): void {
  const expires = new Date();
  expires.setDate(expires.getDate() + ANON_ID_TTL_DAYS);
  document.cookie = `${ANON_ID_COOKIE}=${encodeURIComponent(anonId)}; path=/; expires=${expires.toUTCString()}; Secure; SameSite=Lax`;
}

function getAnonIdFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === ANON_ID_COOKIE && value) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

export function getOrCreateAnonId(): string {
  try {
    // 1. Try localStorage first
    let anonId = localStorage.getItem(ANON_ID_KEY);
    if (anonId) {
      setAnonIdCookie(anonId); // Ensure cookie backup
      return anonId;
    }
    
    // 2. Try cookie fallback
    const cookieId = getAnonIdFromCookie();
    if (cookieId) {
      localStorage.setItem(ANON_ID_KEY, cookieId);
      return cookieId;
    }
    
    // 3. Generate new ID
    anonId = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, anonId);
    setAnonIdCookie(anonId);
    return anonId;
  } catch {
    return crypto.randomUUID();
  }
}
```

---

## Part 3: Add "session" Entity Type (Optional Enhancement)

For pure anonymous tracking events (like `PAGE_VIEWED`, `TOOL_STARTED`) that happen before any lead exists:

**Add to whitelist:**
```typescript
const ALLOWED_EVENT_TYPES = [
  'QUOTE_UPLOADED', 
  'LEAD_CAPTURED',
  'SESSION_ENGAGED'  // New: for pre-lead tracking
] as const;

const POINTS_MAP: Record<EventType, number> = {
  QUOTE_UPLOADED: 50,
  LEAD_CAPTURED: 100,
  SESSION_ENGAGED: 10,  // Lower points for passive engagement
};
```

**Add session validation:**
```typescript
if (entityType === 'session') {
  // For session events, just verify the session exists
  const sessionValid = await isValidSession(supabase, entityId);
  if (sessionValid) {
    console.log(`[score-event] ✓ Session entity validated: ${entityId}`);
    return true;
  }
  
  // Also allow if anon_id itself is a valid session
  if (anonId && await isValidSession(supabase, anonId)) {
    console.log(`[score-event] ✓ Session validated via anon_id: ${anonId}`);
    return true;
  }
  
  return false;
}
```

---

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/score-event/index.ts` | Modify | Add session fallback validation |
| `src/hooks/useCanonicalScore.ts` | Modify | Add cookie backup to identity |

---

## Data Flow After Fix

```
Anonymous user → Uploads quote → lead.client_id = "abc123"
                ↓
User clears localStorage
                ↓
User returns → getOrCreateAnonId() checks:
  1. localStorage? NO
  2. Cookie? YES → "abc123" ← RESTORED!
                ↓
score-event receives anon_id = "abc123"
                ↓
Ownership check: "abc123" === "abc123" ✓ SUCCESS
```

**Even if cookie is also cleared:**
```
score-event receives anon_id = "xyz789" (new)
                ↓
Ownership check: "xyz789" !== "abc123"
                ↓
Fallback: Is "xyz789" a valid session? YES
                ↓
✓ SUCCESS (with warning log)
```

---

## Security Considerations

1. **Session Validation**: The fallback only works if the `anon_id` exists in `wm_sessions`
2. **Idempotency**: The `event_id` uniqueness constraint still prevents duplicate scoring
3. **Logging**: Mismatches are logged for monitoring potential abuse
4. **Authenticated Users**: No change - they use `user_id` validation

---

## Testing Plan

1. **Test ownership match**: Create lead, same session → should succeed
2. **Test ownership mismatch with valid session**: Create lead, new session registered → should succeed (fallback)
3. **Test ownership mismatch with invalid session**: Create lead, completely new session not registered → should fail
4. **Test cookie persistence**: Clear localStorage, verify cookie restores identity
