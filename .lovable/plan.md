# Move 1: SourceTool-Aware Copy Customization

## What This Does

Transforms the ExitIntentModal from a one-size-fits-all modal into a context-aware conversion engine. When a user tries to leave `/ai-scanner`, they see copy about their unfinished quote analysis. When they leave `/vulnerability-test`, they see copy about their home's exposed risk score. The offer feels like a natural continuation of what they were doing, not a generic popup.

## Why This Matters

Generic exit modals convert at 2-4%. Context-aware modals convert at 8-15% because the copy matches the user's current mental state and sunk-cost psychology ("You already started X, don't leave without Y").

## Scope

- **1 file modified**: `src/components/authority/ExitIntentModal.tsx`
- **0 files created or deleted**
- **No state logic, trigger logic, or layout changes**
- Only the text content, badge text, CTA labels, and decline copy become dynamic

## Architecture

A single `SOURCE_TOOL_COPY` mapping object will be added near the top of the file. It maps each `sourceTool` string to customized copy for all 3 steps:

```text
SOURCE_TOOL_COPY = {
  "quote-scanner": {
    step1: { badge, headline, subheadline, ctaLabel, ctaLoading, declineText },
    step2: { headline, subheadline, ctaLabel, ctaLoading, declineText },
    step3: { headline, subheadline, ctaLabel, ctaLoading, declineText },
  },
  "beat-your-quote": { ... },
  ...
}
```

A `getStepCopy(sourceTool, step)` helper function resolves the correct copy with a strong default fallback.

## The Copy — 3 Headlines Per Page (Best Option Marked)

### High-Intent Tool Pages

**quote-scanner / ai-scanner**

- Option C: "Don't Sign That Quote Blind."

**beat-your-quote**

- Option C: "Leave Now and You Leave Money on the Table."

**vulnerability-test**

- Option C: "Storm Season Won't Wait for You to Come Back."

**comparison-tool**

- Option C: "Budget vs. Premium: The 10-Year Truth."

### Pillar Pages (Educational Authority)

**window-cost-truth**

- Option C: "Stop Guessing. Get Your Exact Local Price."

**window-sales-truth**

- Option C: "Every Salesperson Hopes You Don't Know This."

**window-risk-and-code**

- Option B: "One Code Violation Could Void Your Insurance." (BEST — fear of loss)

**window-verification-system**

- Option C: "3 Out of 5 Quotes Fail Our Verification Check."

### Tier-2 Educational Pages

**risk-diagnostic**: "Your Home's Risk Profile Is Almost Ready."
**cost-calculator / true-cost-calculator**: "Your Custom Savings Estimate Is Waiting."
**fair-price-quiz**: "Your Fair Price Range Is Ready — Don't Lose It."  
**claim-survival-kit**: "Your Insurance Claim Checklist Is Ready to Download."
**evidence-locker**: "The Evidence File Is Compiled. Take It With You."
**intel-library**: "Your Intelligence Briefing Is Standing By."
**roleplay**: Prepare for the sales pitch. Practice makes perfect"  
**fast-win**: "Your Fastest Path to Savings Is One Click Away."
**expert-system**: "Your Expert Analysis Is Almost Complete."
**reality-check**: "The Reality Check Results Are In."
**kitchen-table-guide**: "The Kitchen Table Playbook — Free Before You Leave."
**sales-tactics-guide**: "The Tactics Decoder Cheat Sheet — Yours Free."
**spec-checklist-guide**: "Your Spec Verification Checklist Is Ready."
**insurance-savings-guide**: "Your Insurance Discount Roadmap — Take It."
**floating-estimate-form**: "Your Personalized Estimate Is Almost Ready."
**slide-over-ai-qa**: "Your Expert Answered — Don't Lose the Thread."

### Default Fallback (Unknown sourceTool)

- Headline: "Wait — Your Custom Report Is Almost Ready."
- Sub: "Get local pricing data and insider analysis before you go."
- CTA: "Unlock My Free Report"

## Step 2 and Step 3 Customization Strategy

Steps 2 and 3 will also get page-aware copy but with lighter variation since they're downsell tiers:

- **Step 2 (Storm Sentinel)**: Adjusts the urgency framing to match the page context. On cost pages: "Price drops happen fast." On risk pages: "Storm alerts save thousands." On sales pages: "Flash deals expose markups."
- **Step 3 (Kitchen Table)**: Adjusts the cheat sheet framing. On sales pages: "The Anti-Sales Playbook." On cost pages: "The Price Verification Checklist." On risk pages: "The Hurricane Prep Blueprint."

## Technical Details

### Changes to ExitIntentModal.tsx

1. **Add `SourceToolCopyConfig` interface** (lines ~35-50 area) defining the shape of each step's copy
2. **Add `SOURCE_TOOL_COPY` constant** (lines ~70-300 area) — a Record mapping sourceTool strings to copy configs for all 3 steps, plus a `DEFAULT` key
3. **Add `getStepCopy()` helper** — looks up `SOURCE_TOOL_COPY[sourceTool]` with fallback to `SOURCE_TOOL_COPY.DEFAULT`
4. **Replace hardcoded strings in the render section** (lines ~856-1070):
  - Step 1: Badge text, h2 text, p text, submit button label, decline text
  - Step 2: h2 text, p text, submit button label, decline text
  - Step 3: h2 text, p text, submit button label, decline text
5. **No changes to**: state management, trigger logic, form schemas, analytics, prefill logic, step navigation, or CSS

### What Is NOT Changing

- No new props on ExitIntentModal
- No new dependencies
- No changes to any page files
- No route changes
- The `sourceTool` prop is already passed by every page — this change just makes the component read it for copy selection
- CTA destinations (links) are NOT wired yet since ExitIntentModal submits forms, not navigates — the "destination" concept will be part of the post-submit redirect logic in a future enhancement  
  
GUARDRAILS FOR IMPLEMENTATION:

1. CONSTANT PLACEMENT (Performance): 
Make sure you define the `SOURCE_TOOL_COPY` object and the `SourceToolCopyConfig` interface OUTSIDE of the `ExitIntentModal` component function. Do not define it inside the render cycle, or it will be recreated on every single keystroke when the user types in their phone number.

2. TYPESCRIPT SAFETY (The Undefined Trap):
Ensure the `getStepCopy` helper function is completely bulletproof. If a `sourceTool` is passed that does not exist in the object, it MUST seamlessly fall back to `SOURCE_TOOL_COPY.DEFAULT` without throwing an undefined error. Use optional chaining where necessary.

3. LAYOUT PROTECTION (Text Lengths):
Do NOT alter any existing Tailwind classes `className="..."`) on the text elements (h2, p, span, etc.). The new dynamic copy must slot perfectly into the existing UI. Ensure the copy you generate for the sub-headlines does not exceed 2 short sentences, so we don't cause vertical overflow issues on mobile screens.

4. IGNORING resultSummary (For Now):
Some pages currently pass a `resultSummary` prop into this modal. For this specific refactor, do not attempt to merge `resultSummary` into the dynamic copy. Rely purely on the `SOURCE_TOOL_COPY` mapping based on the `sourceTool` string. 
