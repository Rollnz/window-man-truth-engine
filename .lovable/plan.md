

# Fix: Enable "Today" count on Fair Price Quiz UrgencyTicker

## The Problem
The UrgencyTicker on the Fair Price Quiz hero has `showToday={false}`, hiding the "+X today" pulsing indicator that every other page displays.

## The Fix
One prop change in `src/components/fair-price-quiz/QuizHero.tsx`:

**Current (line ~34):**
```
<UrgencyTicker variant="homepage" size="md" showToday={false} animated={true} />
```

**New:**
```
<UrgencyTicker variant="homepage" size="md" showToday={true} animated={true} />
```

That's it. One prop flip. The ticker already supports it — it was just turned off.

## File Modified

| File | Change |
|------|--------|
| `src/components/fair-price-quiz/QuizHero.tsx` | `showToday={false}` to `showToday={true}` |

## What Does NOT Change
- UrgencyTicker component (unchanged)
- useTickerStats hook (unchanged)
- Quiz logic, phases, layout (unchanged)
- Every other file (unchanged)
