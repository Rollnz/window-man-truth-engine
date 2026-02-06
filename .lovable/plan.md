

# Phase 1 Only: Backend Session Sync (Zero UI Changes)

## Executive Summary

Implement automatic session data synchronization from localStorage to the database when users authenticate. This is **purely backend infrastructure** with **no changes to any lead capture modals**.

**What we're NOT doing**: No "Create Vault" prompts, no blocking steps, no changes to `LeadCaptureModal`, `SampleReportLeadModal`, or any guide modals.

---

## Why This Is Safe

| Concern | Status |
|---------|--------|
| Lead capture modals | UNTOUCHED |
| Upsell flows (Call Offer, Project Details) | UNTOUCHED |
| `onSuccess` callbacks | UNTOUCHED |
| Revenue CTAs | UNTOUCHED |

This phase is **purely additive backend code** that runs invisibly in the background.

---

## What This Enables (Future "Passive" Options)

Once Phase 1 is complete, you can add non-blocking "Create Vault" prompts on:
- Results pages (after analysis complete)
- Vault dashboard sidebar
- Email follow-ups ("Secure your results")

These can be added later without touching lead capture flows.

---

## Technical Implementation

### 1. Database Schema Update

Add columns to store synced session data:

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS session_data JSONB DEFAULT '{}';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS session_sync_at TIMESTAMPTZ;
```

**Risk**: None - purely additive.

---

### 2. Edge Function: `sync-session`

**File**: `supabase/functions/sync-session/index.ts`

**Core Logic**: Safe Deep Merge where existing DB data wins over empty incoming data.

```text
Merge Rules:
  ┌────────────────────────────────────────────────────────┐
  │  IF incoming[key] is null/empty → KEEP existing       │
  │  IF existing[key] is null       → USE incoming        │
  │  IF both have values (arrays)   → MERGE unique items  │
  │  DEFAULT: existing wins (conservative)                │
  └────────────────────────────────────────────────────────┘
```

**Endpoint**:
```text
POST /sync-session
Authorization: Bearer <JWT>
Body: { sessionData: {...}, syncReason: "auth_login" }
```

---

### 3. Client Hook: `useSessionSync`

**File**: `src/hooks/useSessionSync.ts`

Triggers automatically when `isAuthenticated` becomes true:

```text
┌─────────────────────────────────────────────────────────┐
│              useSessionSync Hook                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  On Auth State Change:                                  │
│  1. Check if user just authenticated                    │
│  2. Check if localStorage has meaningful data           │
│  3. If yes to both → call sync-session (fire & forget)  │
│  4. Mark synced to avoid duplicate calls                │
│                                                         │
│  Safety: Errors are logged, never block UI              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 4. Vault Page: Hydrate from DB

**File**: `src/pages/Vault.tsx`

When user opens Vault on a new device with empty localStorage:

```text
On Mount:
  1. Check localStorage for session data
  2. If empty AND user authenticated:
     → Fetch profiles.session_data from DB
     → Hydrate localStorage with fetched data
  3. Display unified data
```

---

### 5. Integration Point

**File**: `src/App.tsx`

Add hook at app root (runs on every page):

```tsx
import { useSessionSync } from '@/hooks/useSessionSync';

function App() {
  useSessionSync(); // Fires in background on auth
  // ... rest of app
}
```

---

## Files to Create/Modify

| File | Action | Risk |
|------|--------|------|
| `supabase/migrations/xxx_add_session_sync.sql` | CREATE | None |
| `supabase/functions/sync-session/index.ts` | CREATE | None |
| `src/hooks/useSessionSync.ts` | CREATE | None |
| `src/App.tsx` | MODIFY (add hook) | Very Low |
| `src/pages/Vault.tsx` | MODIFY (add DB fetch) | Low |

---

## Implementation Order

| Step | Task | Test |
|------|------|------|
| 1 | Run migration to add columns | `SELECT session_data FROM profiles LIMIT 1` |
| 2 | Deploy `sync-session` edge function | Test with curl |
| 3 | Create `useSessionSync` hook | Console log verification |
| 4 | Add hook to `App.tsx` | Auth flow test |
| 5 | Update `Vault.tsx` to fetch from DB | Cross-device test |

---

## Testing Checklist

1. Complete Fair Price Quiz without logging in
2. Sign up for account (via navbar login)
3. Check `profiles.session_data` in database - should contain quiz data
4. Clear localStorage
5. Open Vault on different browser
6. Verify quiz results appear (fetched from DB)

---

## What's NOT in This Plan (Deferred to Later)

| Feature | Status | Why Deferred |
|---------|--------|--------------|
| "Create Vault" prompt in lead modals | SKIPPED | Blocks revenue CTAs |
| Password creation flow | SKIPPED | Adds friction |
| Modal step changes | SKIPPED | Interferes with upsells |

These can be added as **passive, non-blocking elements** on results pages later.

---

## Rollback Plan

If issues arise:
1. Comment out `useSessionSync()` in App.tsx
2. localStorage continues working as before
3. No data loss - columns remain for future use

