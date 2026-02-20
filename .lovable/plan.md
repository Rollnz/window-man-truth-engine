

# CRO Email Delivery System for High-Value Tools

## Overview

Build hand-crafted, value-driven HTML email templates for each high-value tool and wire them into the existing `save-lead` pipeline so users automatically receive a personalized follow-up email after completing a form. Every email drives toward booking a consultation.

## Tools Getting CRO Emails

| Tool | Email Type Key | Value Proposition in Email |
|------|---------------|---------------------------|
| `quote-scanner` | `quote-scanner-results` | Their score, what was missing, why it matters |
| `beat-your-quote` | `beat-your-quote-results` | Quote uploaded confirmation, what happens next |
| `quote-builder` | `quote-builder-results` | Their estimate summary, how to get a real quote |
| `risk-diagnostic` | `risk-diagnostic-results` | Protection score, gap breakdown, insurance savings angle |
| `vulnerability-test` | `vulnerability-test-results` | Vulnerability level, urgency, Florida-specific risks |
| `fair-price-quiz` | `fair-price-quiz-results` | Quiz results, fair price insight |

## Architecture

The system reuses the existing infrastructure:

1. **`save-lead` edge function** -- already routes emails by `sourceTool`. We add `else if` branches for 6 new tools, passing tool-specific data from `sessionData` and `aiContext`.

2. **`send-email-notification` edge function** -- already has the Resend integration, CORS, auth, and simulation mode. We add 6 new `case` blocks in `generateEmailContent()` with CRO-optimized HTML templates.

No new edge functions, no new database tables, no schema changes.

## File Changes

### 1. `supabase/functions/send-email-notification/index.ts`

Add 6 new cases to `generateEmailContent()` (after existing cases, before `default`):

- **`quote-scanner-results`**: Shows their overall score, key warnings count, and a "Your quote had X red flags" hook. CTA: "Get a Transparent Quote From Us"
- **`beat-your-quote-results`**: Confirms upload received, explains the analysis process, urgency language. CTA: "Book Your Free Comparison Call"
- **`quote-builder-results`**: Summarizes their estimate (window count, total), positions it as a starting point. CTA: "Lock In Your Real Price"
- **`risk-diagnostic-results`**: Shows protection score with color-coded severity, insurance savings opportunity. CTA: "Get Your Free Protection Assessment"
- **`vulnerability-test-results`**: Shows vulnerability level (High/Medium/Low), Florida code compliance angle. CTA: "Schedule Your Free Window Inspection"
- **`fair-price-quiz-results`**: Reveals whether they're overpaying, market context. CTA: "See What You Should Really Pay"

Each template follows this CRO structure:
1. Personalized greeting with first name
2. Result summary (score/level/estimate)
3. "What this means for you" section with 2-3 bullet points
4. Social proof line (Florida homeowners stat)
5. Primary CTA button (consultation booking)
6. Footer with no-spam reassurance

Update the `EmailPayload` type union to include the 6 new type strings.

### 2. `supabase/functions/save-lead/index.ts`

Expand the email routing block (around line 1073-1085) to add `else if` branches for each new tool:

```text
// Existing:
if (sourceTool === 'comparison-tool') { ... }
else if (sourceTool === 'cost-calculator') { ... }

// New additions:
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
else if (sourceTool === 'beat-your-quote') { ... }
else if (sourceTool === 'quote-builder') { ... }
else if (sourceTool === 'risk-diagnostic') { ... }
else if (sourceTool === 'vulnerability-test') { ... }
else if (sourceTool === 'fair-price-quiz') { ... }
```

Each branch extracts relevant data from `sessionData` and `aiContext` (which are already available at this point in the function).

### 3. Deploy

Both `save-lead` and `send-email-notification` edge functions will be redeployed automatically.

## Email Design Principles

- **From**: `Window Truth Engine <noreply@windowman.com>` (matches existing)
- **Mobile-first**: Inline CSS, single-column layout, large CTA buttons (48px tall)
- **Brand colors**: Dark background (#1a1a2e), cyan accent (#00D4FF), gold highlights (#FFD700)
- **Consultation link**: `https://itswindowman.com/consultation`
- **No attachments**: All value is in the email body itself
- **Personalization**: First name in greeting, tool-specific scores/results in body

## What This Does NOT Change

- No database schema changes
- No new edge functions
- No changes to the frontend lead capture forms
- No changes to the existing email templates (comparison-report, cost-calculator-report, etc.)
- Existing admin notification emails remain untouched

