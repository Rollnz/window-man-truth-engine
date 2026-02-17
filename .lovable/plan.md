

# Replace Static Number with Live UrgencyTicker

## File: `src/components/fair-price-quiz/QuizHero.tsx`

### Change 1: Import UrgencyTicker
Add `import { UrgencyTicker } from '@/components/social-proof';`

### Change 2: Replace the subheadline (line 28-30)

**Current:**
```
<p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-md mx-auto">
  Compare your quote against 1,247 Florida installations in 60 seconds.
</p>
```

**New:**
```
<div className="mb-8 max-w-md mx-auto space-y-4">
  <p className="text-lg md:text-xl text-muted-foreground">
    Compare your quote against
  </p>
  <UrgencyTicker variant="homepage" size="md" showToday={false} animated={true} />
  <p className="text-lg md:text-xl text-muted-foreground">
    in 60 seconds.
  </p>
</div>
```

The ticker sits between the two text lines, centered, using the `homepage` variant (light bg, matches the quiz page aesthetic). `showToday={false}` keeps it clean -- just the total count with the Shield icon.

### Change 3: Remove the static trust signal (line 57-59)

**Current:**
```
<p className="mt-6 text-sm text-muted-foreground">
  ✓ 2,847 homeowners analyzed their quotes this month
</p>
```

**Remove it.** The UrgencyTicker already provides live social proof above. Having a second static number below the CTA contradicts the live one and looks fake.

### What does NOT change
- UrgencyTicker component (unchanged)
- useTickerStats hook (unchanged)
- Quiz logic, phases, answers, analytics (unchanged)
- Value props grid (60 seconds, Spot overcharging, Free analysis) stays
- CTA button stays
- Badge stays
- No other files touched

### Result
The hero flows as:
1. Badge: "Fair Price Diagnostic"
2. Headline: "Is Your Window Quote Fair?"
3. "Compare your quote against"
4. [Live UrgencyTicker: "3,847 quotes scanned"]
5. "in 60 seconds."
6. Value props grid
7. CTA: "Analyze My Quote"
