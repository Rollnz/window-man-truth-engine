

# Wire MiniTrustBar to Real Ticker Data (All Variants)

## The Problem

The `MiniTrustBar` component has a hardcoded default: `"3,400+ Quotes Analyzed"`. This number is frozen and never updates. Two variants (B and D) already override it with real data from `useTickerStats`, but Variants A, C, and E still show the stale default.

The fix is small and surgical: make every variant pass the live stat, exactly like Variant B already does.

## What Changes

### 1. `MiniTrustBar.tsx` -- Update the default prop

Change the default `stat` from `'3,400+ Quotes Analyzed'` to `undefined` (or remove the default entirely). This way, if a variant forgets to pass it, the stat line simply won't render rather than showing a stale number. This is a safety net.

### 2. `VariantA_ProofTransparency.tsx`

- Import `useTickerStats`
- Call `const { total } = useTickerStats();`
- Pass `stat={`${total.toLocaleString()}+ Quotes Analyzed`}` to `MiniTrustBar`

### 3. `VariantC_IncentiveOffer.tsx`

- Import `useTickerStats`
- Call `const { total } = useTickerStats();`
- Pass `stat={`${total.toLocaleString()}+ Quotes Analyzed`}` to `MiniTrustBar`

### 4. `VariantE_AiConcierge.tsx` (if it uses MiniTrustBar)

- Same pattern: import `useTickerStats`, pass dynamic stat

## What Does NOT Change

- `useTickerStats` hook (already works, already cached at module level)
- `get-ticker-stats` edge function (already deployed, already returns hybrid real+seeded data)
- Variant B and D (already wired correctly)
- Any tracking, A/B logic, or panel behavior

## How the Data Works

The stat comes from the same pipeline as the UrgencyTicker on `/ai-scanner`:
1. Client-side fallback renders immediately (no blank flash)
2. `get-ticker-stats` edge function fetches real count from `quote_analyses` table + marketing inflation
3. Result is cached at module level so multiple components sharing `useTickerStats` make only one network call

## Technical Risk

None. This is a 4-line change per variant file. `useTickerStats` is already imported in Variants B and D with zero issues. The hook uses `requestIdleCallback` so it won't block rendering.
