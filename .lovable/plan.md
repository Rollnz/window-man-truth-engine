
# Fix: CRM-Leads Edge Function Request Method Mismatch

## Problem Summary

The `/admin/roi` page crashes with error `"leadId and updates required"` because:

1. **`LeadSourceROI.tsx`** uses `supabase.functions.invoke('crm-leads', { body: { action: 'list' } })`
2. **`supabase.functions.invoke()`** defaults to POST method
3. **`crm-leads` edge function** POST handler expects `{ leadId, updates }`, not `{ action: 'list' }`
4. **Result**: The function returns 400 error because `leadId` is missing

The same issue exists in `AttributionHealthDashboard.tsx`.

---

## Fix Strategy

Change the admin pages to use **GET requests with query parameters** (matching the working pattern in `useCRMLeads.ts`).

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/admin/LeadSourceROI.tsx` | Replace `supabase.functions.invoke()` with `fetch()` GET request |
| `src/pages/admin/AttributionHealthDashboard.tsx` | Replace `supabase.functions.invoke()` with `fetch()` GET request |

---

## Implementation Details

### Fix 1: LeadSourceROI.tsx (Lines 94-100)

**Current (broken):**
```typescript
const { data: leadsResponse, error: leadsError } = await supabase.functions.invoke('crm-leads', {
  body: { 
    action: 'list',
    startDate,
    endDate,
  }
});
```

**Fixed:**
```typescript
// Build query params for GET request
const params = new URLSearchParams();
if (startDate) params.append('startDate', startDate);
if (endDate) params.append('endDate', endDate);

const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-leads${params.toString() ? `?${params}` : ''}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  }
);

if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.error || `Failed to fetch leads (${response.status})`);
}

const leadsResponse = await response.json();
```

### Fix 2: AttributionHealthDashboard.tsx (Lines 77-83)

**Current (broken):**
```typescript
const { data: leads, error: leadsError } = await supabase.functions.invoke('crm-leads', {
  body: { 
    action: 'list',
    startDate,
    endDate,
  }
});
```

**Fixed:**
```typescript
// Build query params for GET request
const leadsParams = new URLSearchParams();
if (startDate) leadsParams.append('startDate', startDate);
if (endDate) leadsParams.append('endDate', endDate);

const leadsResponse = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-leads${leadsParams.toString() ? `?${leadsParams}` : ''}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  }
);

if (!leadsResponse.ok) {
  const errorData = await leadsResponse.json().catch(() => ({}));
  throw new Error(errorData.error || `Failed to fetch leads (${leadsResponse.status})`);
}

const leads = await leadsResponse.json();
const leadsData = leads?.leads || [];
```

---

## Why This Fix Works

1. **Matches existing pattern**: `useCRMLeads.ts` already uses this exact approach successfully
2. **No backend changes needed**: The edge function GET handler is already designed for listing
3. **Proper HTTP semantics**: GET for reading, POST for writing
4. **Consistent error handling**: Both pages will have proper error handling with useful messages

---

## Testing Checklist

After implementation:
1. Navigate to `/admin/roi` - should load without errors
2. Navigate to `/admin/attribution-health` - should load without errors
3. Verify date range filtering works on both pages
4. Verify refresh button works on both pages
5. Check that the CRM dashboard (`/admin/crm`) still works (uses `useCRMLeads.ts`)

---

## Technical Notes

The edge function has clear separation:
- **GET**: List leads with optional filters (`startDate`, `endDate`, `status`, `quality`)
- **POST**: Update a specific lead (`leadId` + `updates` object required)

The admin pages were incorrectly using POST with `{ action: 'list' }` which the backend doesn't recognize.
