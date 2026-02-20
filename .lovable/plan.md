

# CRO Email Delivery System - Implementation Plan

## Summary

Add 6 hand-crafted CRO email templates and wire them into the existing lead pipeline. When a user submits a form on any high-value tool, they automatically receive a personalized follow-up email driving them toward booking a consultation.

## Current State

- The `EmailPayload` type already includes the 6 new type strings (done in prior session)
- No actual email templates exist yet for the 6 new tools
- `save-lead` only routes emails for `comparison-tool` and `cost-calculator`

## Changes Required

### File 1: `supabase/functions/send-email-notification/index.ts`

Insert 6 new `case` blocks into `generateEmailContent()` before the `default` case (line 328):

| Case | Subject Line | Key Data | CTA |
|------|-------------|----------|-----|
| `quote-scanner-results` | "Your Quote Has Been Analyzed" | Overall score, warnings count | "Get a Transparent Quote From Us" |
| `beat-your-quote-results` | "Your Quote Upload Confirmed" | Upload confirmation, next steps | "Book Your Free Comparison Call" |
| `quote-builder-results` | "Your Window Estimate Summary" | Window count, total estimate | "Lock In Your Real Price" |
| `risk-diagnostic-results` | "Your Protection Score" | Protection score, gap breakdown | "Get Your Free Protection Assessment" |
| `vulnerability-test-results` | "Your Vulnerability Score" | Score, vulnerability level | "Schedule Your Free Window Inspection" |
| `fair-price-quiz-results` | "Are You Overpaying?" | Quiz results, fair price insight | "See What You Should Really Pay" |

Each template uses:
- Brand colors: dark background (#1a1a2e), cyan (#00D4FF), gold (#FFD700)
- CRO structure: greeting, result summary, "what this means" bullets, social proof, CTA button, footer
- Mobile-first inline CSS, 48px tall CTA buttons
- Consultation link: `https://itswindowman.com/consultation`

### File 2: `supabase/functions/save-lead/index.ts`

Expand the email routing block (after line 1085) with 6 new `else if` branches. Each extracts relevant data from `sessionData` and `aiContext`:

```text
else if (sourceTool === 'quote-scanner') {
  triggerEmailNotification({
    email: normalizedEmail,
    type: 'quote-scanner-results',
    data: {
      firstName: normalizedFirstName,
      overallScore: sessionData?.overallScore || sessionData?.overall_score,
      warningsCount: sessionData?.warningsCount || sessionData?.warnings_count,
      leadId,
    },
  });
}
// ... similar for beat-your-quote, quote-builder, risk-diagnostic,
//     vulnerability-test, fair-price-quiz
```

### Deployment

Both edge functions will be redeployed after changes. Then we test by checking edge function logs for email delivery confirmation.

## What Does NOT Change

- No database schema changes
- No new edge functions
- No frontend changes
- Existing email templates remain untouched

## Technical Details

### Data Extraction per Tool

| Tool | Session Data Fields | AI Context Fields |
|------|-------------------|-------------------|
| quote-scanner | `overallScore`, `warningsCount` | -- |
| beat-your-quote | -- | -- (confirmation only) |
| quote-builder | `windowCount`, `estimatedTotal` | -- |
| risk-diagnostic | `protectionScore`, `gapCount` | -- |
| vulnerability-test | `quizScore`, `quizVulnerability` | -- |
| fair-price-quiz | `quizScore`, `quizResult` | -- |

### Email From Address

`Window Truth Engine <noreply@windowman.com>` (matches existing Resend sender)
