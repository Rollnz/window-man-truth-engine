

# Fix Useless Conditional in analyze-evidence Attribution Logging

## Problem Summary

The `logAttributionEvent` call has two logic errors:
1. The outer `if (sessionId)` prevents attribution logging when only IP is available
2. Inside the block, `sessionId || \`evidence-${ip}\`` is a useless conditional because `sessionId` is already guaranteed truthy

## Solution

### Changes to `supabase/functions/analyze-evidence/index.ts`

**Line 172 - Change outer condition:**
```typescript
// Before
if (sessionId) {

// After  
if (sessionId || ip) {
```

**Line 173 - Handle missing sessionId:**
```typescript
// Before
sessionId,

// After
sessionId: sessionId || `evidence-${ip}`,
```

**Line 187 - Fix anonymousIdFallback:**
```typescript
// Before
anonymousIdFallback: sessionId || `evidence-${ip}`,

// After
anonymousIdFallback: sessionId ?? `evidence-${ip}`,
```

## Complete Updated Block (lines 171-189)

```typescript
// Log attribution event (non-blocking)
if (sessionId || ip) {
  logAttributionEvent({
    sessionId: sessionId || `evidence-${ip}`,
    eventName: 'evidence_analyzed',
    eventCategory: 'ai_tool',
    pagePath: '/claim-survival',
    pageTitle: 'Claim Survival Vault',
    eventData: {
      overall_score: result.overallScore,
      status: result.status,
      documents_analyzed: documents.length,
      documents_complete: documents.filter(d => d.hasFile).length,
      user_id: userId,
    },
    leadId,
    anonymousIdFallback: sessionId ?? `evidence-${ip}`,
  }).catch((err) => console.error('[analyze-evidence] Attribution logging failed:', err));
}
```

## Logic Explanation

| Scenario | sessionId | ip | Result |
|----------|-----------|-----|--------|
| Full context | `"abc-123"` | `"192.168.1.1"` | sessionId = `"abc-123"`, fallback = `"abc-123"` |
| IP only | `undefined` | `"192.168.1.1"` | sessionId = `"evidence-192.168.1.1"`, fallback = `"evidence-192.168.1.1"` |
| Session only | `"abc-123"` | `"unknown"` | sessionId = `"abc-123"`, fallback = `"abc-123"` |
| No context | `undefined` | `"unknown"` | Block still runs, sessionId = `"evidence-unknown"` |

## Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `supabase/functions/analyze-evidence/index.ts` | 172, 173, 187 | Fix conditional logic |

## Risk Assessment

- **Risk Level**: Very Low
- **Breaking Changes**: None - this only enables more events to be logged
- **Rollback**: Simple line revert if needed

