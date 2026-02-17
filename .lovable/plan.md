

# Fix Build Errors: Missing "qualified" Status + TypeScript Type Error

## Two Issues to Fix

### 1. Backend: Add "qualified" to allowed statuses in `admin-lead-detail`

**File:** `supabase/functions/admin-lead-detail/index.ts` (line 344)

The `validStatuses` array is missing `"qualified"`. Your frontend CRM types define it as a valid status, but the edge function rejects it.

**Change:**
```typescript
// Before
const validStatuses = ['new', 'qualifying', 'mql', 'appointment_set', 'sat', 'closed_won', 'closed_lost', 'dead'];

// After
const validStatuses = ['new', 'qualifying', 'mql', 'qualified', 'appointment_set', 'sat', 'closed_won', 'closed_lost', 'dead'];
```

### 2. Frontend: Fix TypeScript operator error in `VariantB_DiagnosticQuiz.tsx`

**File:** `src/components/floating-cta/steps/choice-variants/VariantB_DiagnosticQuiz.tsx` (line 138)

The `quizStep` variable has type `0 | 1 | 2 | 'done'` (a union of numbers and string). Using `>=` on it fails because TypeScript can't compare `string | number` with `number`. The existing casts `(quizStep as number)` on lines 169 and 202 suppress this, but line 138 is missing the cast.

**Change (line 138):**
```typescript
// Before
<div className={cn('space-y-2', quizStep >= 0 ? 'opacity-100' : 'opacity-40')}>

// After
<div className={cn('space-y-2', (quizStep as number) >= 0 ? 'opacity-100' : 'opacity-40')}>
```

### 3. Edge function dep resolution error (`quote-scanner/deps.ts`)

The `npm:@supabase/supabase-js@2.39.7` specifier fails type resolution in the build. This is a Deno module resolution issue -- the pinned version `2.39.7` doesn't match any available package in the build environment. Updating to match the project's installed version (`2.89.0`) resolves it.

**File:** `supabase/functions/quote-scanner/deps.ts` (lines 8-9)

```typescript
// Before
export { createClient } from "npm:@supabase/supabase-js@2.39.7";
export type { SupabaseClient } from "npm:@supabase/supabase-js@2.39.7";

// After
export { createClient } from "npm:@supabase/supabase-js@2";
export type { SupabaseClient } from "npm:@supabase/supabase-js@2";
```

Using the major version `@2` prevents future pin staleness.

## What Does NOT Change
- No schema or database changes
- No UI layout changes
- No other edge functions affected

