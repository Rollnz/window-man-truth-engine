

# Playwright E2E Test Suite: Scanner Flow and Log Event Fixes

## Overview

Create `e2e/scanner-flow.spec.ts` with 4 test scenarios verifying the gated scanner funnel, log-event 401 fix, gating security, state cleanup, and 409 session conflict handling.

## Test Architecture

All tests target `/ai-scanner` (the QuoteScanner page). The page uses a state machine with phases: `idle` -> `uploaded` -> `locked` -> `analyzing` -> `revealed`. Key UI selectors are derived from the existing page markup (Lock icon, "Upload a Different Quote" link, lead modal, etc.).

A dummy PDF will be generated inline using a minimal valid PDF buffer (no external fixture files needed).

## Test Scenarios

### Test 1: Happy Path (Log Event 200 Verification)
- Navigate to `/ai-scanner`
- Generate a minimal dummy PDF in-memory and upload via the file input
- Wait for the lead modal to appear (look for the modal content/form)
- Fill in First Name, Last Name, Email, Phone fields
- Check the SMS consent checkbox
- Submit the form
- Use `page.waitForResponse` to intercept the `log-event` call and assert status 200
- Assert that a `quote-scanner` network call is made exactly once after submission

### Test 2: Security Check (No Analysis Before Lead Capture)
- Navigate to `/ai-scanner`
- Set up a request listener for `quote-scanner` calls
- Upload a dummy PDF
- Wait for modal to appear
- Assert zero `quote-scanner` requests were made
- Close the modal (click the X or "No thanks" link)
- Assert the "locked" phase UI is visible: "Your report is ready to unlock" text and the blurred preview container

### Test 3: Abandon and Reset
- Upload a file, close modal to reach "locked" state
- Click "Upload a Different Quote" link
- Assert the UI returns to idle state (upload zone visible, Lock placeholder with "Upload your quote to get started")
- Upload a second file
- Assert the lead modal reopens

### Test 4: Session Conflict (409 Suppression)
- Listen to `page.on('console')` for any messages containing "409" or "duplicate key"
- Navigate to `/ai-scanner`
- Wait for page to fully load and settle (network idle)
- Assert no console errors contain 409-related messages (the 409 from `wm_sessions` INSERT is expected but should be handled gracefully without console.error)

## Technical Details

### File: `e2e/scanner-flow.spec.ts`

Dependencies: `@playwright/test` (already installed)

Helpers:
- `createDummyPDF()`: Returns a `Buffer` with a minimal valid PDF (header + empty page + xref + trailer) -- roughly 200 bytes
- `uploadFile(page, buffer, filename)`: Uses `page.setInputFiles` on the file input with the buffer
- `fillLeadForm(page, data)`: Fills the modal form fields and submits

Network interception:
- `page.waitForResponse(url => url.includes('log-event'))` for log-event assertions
- `page.route('**/quote-scanner', ...)` or request counting for security check

Timeouts: 30s default per test (scanner analysis can take up to 60s, but tests 2-4 don't wait for analysis completion).

### Key Selectors (from page source)
- Upload zone file input: `input[type="file"]` or `[data-testid]` if available
- Lead modal: Dialog content with form fields
- "Upload a Different Quote": `button` or `a` containing that text
- Locked state: Text "Your report is ready to unlock"
- Idle state: Text "Upload your quote to get started"

