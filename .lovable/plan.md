

# Update BeatOrValidateSection Headline Copy

## What Changes

Replace the current headline and subline in `src/components/audit/BeatOrValidateSection.tsx`:

**Current:**
- Headline: "We Don't Just Grade the Homework. We Fix the Grade."
- Subline: "Every Scan ends with you Winning. Period."

**New (first-person Window Man voice):**
- Headline: "With Window Man, You Can't Lose."
- Accent line: "I'll Either Verify Your Quote — Or Start a Bidding War."
- Subline: "A 'Verified Fair' badge of confidence, or the price you actually deserve."

## Why This Structure

The user's quote is powerful but too long for a single headline. Splitting it preserves the punch while fitting the existing layout pattern (headline + gradient accent span + paragraph subline). The first-person voice aligns with the brand framing standard (Window Man as a character, not a faceless tool).

## Technical Detail

**File:** `src/components/audit/BeatOrValidateSection.tsx`

Update lines inside the section header `div`:

```tsx
// Current
<h2>
  We Don't Just Grade the Homework.
  <span className="...">We Fix the Grade.</span>
</h2>
<p>Every Scan ends with you Winning. Period.</p>

// New
<h2>
  With Window Man, You Can't Lose.
  <span className="...">I'll Either Verify Your Quote — Or Start a Bidding War.</span>
</h2>
<p>A "Verified Fair" badge of confidence, or the price you actually deserve.</p>
```

No structural, styling, or component changes needed — only three string literals updated.

