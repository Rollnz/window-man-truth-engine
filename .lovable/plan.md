

# Premium Quote Analysis Email Template

## Assessment: What Already Exists vs What's Needed

**Item 1 (AI structured JSON) — ALREADY DONE.** The `quote-scanner` edge function already returns structured JSON with `overallScore`, `finalGrade`, `warnings[]`, `missingItems[]`, `summary`, `pricePerOpening`, and all pillar scores. This is persisted to `quote_analyses.analysis_json`. No prompt changes needed.

**Item 2-4 — Need building.** The current `quote-scanner-results` email (lines 328-367 of `send-email-notification`) is a basic inline HTML string with just `overallScore`, `warningsCount`, and `firstName`. It doesn't query the database for the full analysis, and it doesn't use React Email.

## Existing Modules to Reuse

- `supabase/functions/_shared/email-templates/signup.tsx` — pattern for React Email + Deno imports
- `supabase/functions/send-email-notification/index.ts` — delivery via Resend (lines 659-671)
- `supabase/functions/save-lead/index.ts` lines 1283-1293 — trigger point that sends `leadId`
- `quote_analyses` table — has `analysis_json`, `lead_id`, all pillar scores

## Minimal Change Plan (4 steps)

### Step 1: Create `supabase/functions/_shared/email-templates/quote-analysis.tsx`

React Email component using `npm:@react-email/components@0.0.22` (same version as auth templates).

**Props interface:**
```ts
interface QuoteAnalysisEmailProps {
  firstName: string;
  overallScore: number;
  finalGrade: string;
  warnings: string[];
  missingItems: string[];
  summary: string;
  safetyScore: number;
  scopeScore: number;
  priceScore: number;
  finePrintScore: number;
  warrantyScore: number;
  pricePerOpening: string;
  vaultUrl: string;
}
```

**Design:**
- Dark header (#070A0F) with logo via `<Img src="https://itswindowman.com/icon-512.webp" />`
- Score circle: large bold number with color-coded border (green >= 70, gold >= 40, red < 40)
- Grade badge next to score
- 5 pillar score bars as simple table rows with percentage labels
- Red flags section: each warning as a card row with ⚠️ prefix, light border
- Missing items section: each item as a card row with ❌ prefix
- Summary paragraph
- White body background per email best practices (dark header only)
- Primary CTA: "View Full Results" → `vaultUrl`
- Secondary CTA: "Get a Transparent Quote" → consultation
- Footer: "Window Truth Engine by Its Window Man"
- All CSS inlined via React Email's `style` props (Gmail/Outlook safe)
- Font stack: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

### Step 2: Update `send-email-notification/index.ts` — enrich data from DB

In the `quote-scanner-results` case (line 328), before rendering:

1. Import `render` from `npm:@react-email/render@0.0.12` and the template
2. If `data.leadId` exists, query `quote_analyses` table using service role client:
   ```ts
   const { data: analysis } = await supabase
     .from('quote_analyses')
     .select('analysis_json')
     .eq('lead_id', data.leadId)
     .order('created_at', { ascending: false })
     .limit(1)
     .maybeSingle();
   ```
3. Extract full analysis data (warnings array, summary, pillar scores, grade, pricePerOpening)
4. Render the React Email component to HTML string via `render()`
5. Fall back to current inline HTML if DB query fails (graceful degradation)

This requires adding a Supabase service-role client at the top of the function (it already has the import but may not initialize one for this case).

### Step 3: Update `save-lead/index.ts` — pass `leadId` (already done)

Line 1291 already passes `leadId` in the email trigger payload. No change needed.

### Step 4: No changes to `quote-scanner/index.ts`

The AI prompt and structured output are already correct. No modifications.

## Events Fired

No new tracking events. The existing `notification_sent` attribution event (lines 685-700) continues to fire with `email_type: 'quote-scanner-results'`.

## Files Changed

| File | Action |
|---|---|
| `supabase/functions/_shared/email-templates/quote-analysis.tsx` | **Create** — React Email template |
| `supabase/functions/send-email-notification/index.ts` | **Modify** — replace `quote-scanner-results` case with DB query + React Email render |

## Definition of Done

- [ ] Template renders a premium dark-header email with score gauge, pillar bars, red flags cards, and summary
- [ ] `send-email-notification` queries `quote_analyses` by `lead_id` for full data
- [ ] "View Full Results" CTA links to `/vault` with leadId
- [ ] Falls back to current HTML if no analysis found in DB
- [ ] All CSS inlined (no `<style>` blocks) for Gmail/Outlook compatibility
- [ ] No new tracking events, no new dependencies beyond `@react-email/render@0.0.12`
- [ ] Edge function deploys without errors

