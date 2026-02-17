

# E2E Test Suite: Selector Mismatches Found

## Problem

The Playwright tests in `e2e/scanner-flow.spec.ts` **will fail** because the text selectors don't match the actual modal content on `/ai-scanner`.

The tests reference text from `LeadCaptureModal` (a different component), but `/ai-scanner` actually renders `QuoteUploadGateModal`, which has different copy.

## Mismatches

| Test Selector | Expected By Test | Actual in QuoteUploadGateModal |
|---|---|---|
| Modal title | `"Unlock Your Full Analysis"` | `"Your Quote Is Ready to Audit"` |
| Submit button | `"Unlock My Score Now"` | `"Start My Analysis"` |

These selectors appear in:
- **Test 1** (happy path): line 57 + line 69
- **Test 2** (security): line 134
- **Test 3** (abandon & reset): lines 158, 172

The locked-state selectors (`"Your report is ready to unlock"`, `"Upload a Different Quote"`) and the `#gate-*` input IDs are **correct** and match the actual code.

## Fix: Update 4 Selectors

In `e2e/scanner-flow.spec.ts`, make the following replacements:

### 1. `fillAndSubmitLeadForm` helper (lines 57, 69)

| Line | Current | New |
|------|---------|-----|
| 57 | `text=Unlock Your Full Analysis` | `text=Your Quote Is Ready to Audit` |
| 69 | `button:has-text("Unlock My Score Now")` | `button:has-text("Start My Analysis")` |

### 2. Test 2 — security check (line 134)

| Line | Current | New |
|------|---------|-----|
| 134 | `text=Unlock Your Full Analysis` | `text=Your Quote Is Ready to Audit` |

### 3. Test 3 — abandon and reset (lines 158, 172)

| Line | Current | New |
|------|---------|-----|
| 158 | `text=Unlock Your Full Analysis` | `text=Your Quote Is Ready to Audit` |
| 172 | `text=Unlock Your Full Analysis` | `text=Your Quote Is Ready to Audit` |

## Summary

- **4 locations** change from `"Unlock Your Full Analysis"` to `"Your Quote Is Ready to Audit"`
- **1 location** changes from `"Unlock My Score Now"` to `"Start My Analysis"`
- All other selectors (input IDs, locked state text, close button) are already correct
- No logic changes needed -- only string literals

