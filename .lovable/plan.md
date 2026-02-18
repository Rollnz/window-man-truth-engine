

# Fix: Isolate wmLead failure in useLeadFormSubmit

## Problem
`wmLead` (a non-critical analytics/pixel call) is `await`ed inside the same `try` block as the critical `save-lead` API call. If `wmLead` rejects after the lead is already saved, the outer `catch` fires: the user sees a "Something went wrong" toast and the hook returns `false`, even though their data was captured successfully.

## Fix (1 file, ~6 lines changed)

**`src/hooks/useLeadFormSubmit.ts`** -- lines 222-236

Wrap the `wmLead` call in its own `try/catch` so failures are logged but do not affect the submission result:

```typescript
// Before (lines 222-236):
const nameParts = (normalizedName || '').trim().split(' ');
const firstName = nameParts[0] || undefined;
const lastName = nameParts.slice(1).join(' ') || undefined;

await wmLead(
  { leadId: effectiveLeadId || '', email: data.email, phone: data.phone || undefined, firstName, lastName },
  { source_tool: sourceTool },
);

// After:
const nameParts = (normalizedName || '').trim().split(' ');
const firstName = nameParts[0] || undefined;
const lastName = nameParts.slice(1).join(' ') || undefined;

try {
  await wmLead(
    { leadId: effectiveLeadId || '', email: data.email, phone: data.phone || undefined, firstName, lastName },
    { source_tool: sourceTool },
  );
} catch (wmError) {
  console.error('[useLeadFormSubmit] wmLead failed (non-blocking):', wmError);
}
```

## What does NOT change
- The `save-lead` API call and its error handling (lines 166-174)
- The `trackLeadCapture` and `trackFormSubmit` calls (fire-and-forget analytics -- these already do not throw in practice, but could be isolated in a future pass)
- The success toast, `onSuccess` callback, and redirect logic
- No other files affected

