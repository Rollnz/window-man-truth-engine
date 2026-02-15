

# Fix: Increase quote-scanner timeout to prevent "Request timed out"

## Root Cause

The `heavyAIRequest` in `src/lib/aiRequest.ts` has a 25-second timeout (`AI_TIMEOUTS.HEAVY = 25000`). The `quote-scanner` edge function performs image compression, OCR/extraction, and AI scoring in a single call. For uncached analyses (new browser = no cache hit), this routinely exceeds 25 seconds, triggering a client-side `AbortError` that surfaces as "Request timed out."

The edge function logs confirm a cache hit completed instantly, but a fresh visitor gets a full cold analysis.

## Fix

In `src/hooks/useGatedAIScanner.ts`, override the timeout for the `quote-scanner` call to **60 seconds** instead of the default 25s. This is a one-line change to the `sendRequest` options.

### File: `src/hooks/useGatedAIScanner.ts` (line ~291)

Change the `heavyAIRequest.sendRequest` call to include a timeout override:

```typescript
const { data: analysisData, error: requestError } = await heavyAIRequest.sendRequest<...>(
  'quote-scanner',
  { ... },
  { timeoutMs: 60000 }  // 60s for cold analysis
);
```

This uses the existing `AIRequestOptions.timeoutMs` parameter already supported by `sendRequest`. No changes to `aiRequest.ts` or any other file needed.

## Why not increase `AI_TIMEOUTS.HEAVY` globally?

Other consumers of `heavyAIRequest` (like `generate-quote`) should keep the 25s default. Only the quote-scanner analysis warrants a longer timeout due to its multi-step pipeline (OCR + scoring + summary generation).

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useGatedAIScanner.ts` | Add `{ timeoutMs: 60000 }` to `sendRequest` options (1 line) |

## Acceptance Test

1. Open /ai-scanner in a fresh incognito browser
2. Upload a quote image
3. Submit lead form
4. Analysis completes without "Request timed out" error
5. Authority report renders

