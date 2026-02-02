

# Fix firstName/lastName Split in Consultation Page

## Problem Summary

The Consultation page (lines 49-67) combines `firstName` and `lastName` into a single `name` field before sending to `save-lead`:

```typescript
name: `${data.firstName} ${data.lastName}`.trim(),  // ❌ Combined
```

This forces the server to re-split the name, which is:
1. Redundant - we already have the split values
2. Error-prone - splitting on space can mishandle multi-part last names
3. Inconsistent - other forms pass `firstName`/`lastName` directly

## Solution

Pass `firstName` and `lastName` directly to `save-lead` instead of combining them. The edge function already supports these fields per the EMQ 9.5+ standard.

---

## Implementation

### File: `src/pages/Consultation.tsx`

**Lines 49-67 - Update the save-lead payload:**

| Field | Before | After |
|-------|--------|-------|
| `name` | `${data.firstName} ${data.lastName}` | Remove |
| `firstName` | Not sent | `data.firstName` |
| `lastName` | Not sent | `data.lastName` |

**Code change:**

```typescript
const { data: leadData, error: leadError } = await supabase.functions.invoke('save-lead', {
  body: {
    email: data.email,
    phone: data.phone,
    firstName: data.firstName,   // ✅ Direct
    lastName: data.lastName,     // ✅ Direct
    sourceTool: 'consultation',
    sessionData: {
      clientId,
      propertyType: data.propertyType,
      // ... rest unchanged
    },
  },
});
```

---

## Before/After

```text
BEFORE:
┌────────────────────────────────────────────┐
│  save-lead payload:                        │
│  {                                         │
│    email, phone,                           │
│    name: "John Smith",  ← Combined         │
│    ...                                     │
│  }                                         │
│  ⚠️ Server must split on space             │
│  ⚠️ "Mary Jane Watson" → wrong split       │
└────────────────────────────────────────────┘

AFTER:
┌────────────────────────────────────────────┐
│  save-lead payload:                        │
│  {                                         │
│    email, phone,                           │
│    firstName: "John",    ✅                │
│    lastName: "Smith",    ✅                │
│    ...                                     │
│  }                                         │
│  ✅ No server-side splitting needed        │
│  ✅ Multi-part names preserved             │
│  ✅ EMQ 9.5+ compliant                     │
└────────────────────────────────────────────┘
```

---

## Technical Details

| Aspect | Details |
|--------|---------|
| File changed | `src/pages/Consultation.tsx` |
| Lines affected | 53 (replace `name` with `firstName`/`lastName`) |
| Breaking changes | None - `save-lead` already supports both formats |
| Side effects | Improved EMQ tracking accuracy |

## Impact

- **Low risk**: The `save-lead` function already handles `firstName`/`lastName` fields
- **Positive**: Eliminates redundant server-side name splitting
- **Consistent**: Aligns with EMQ 9.5+ standard used in other forms

