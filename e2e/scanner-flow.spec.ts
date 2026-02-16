import { test, expect } from '@playwright/test';
import type { Page, Request, Response, ConsoleMessage } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════════════════
// Scanner Flow E2E Tests
// Verifies: gated funnel, log-event 401 fix, gating security, state cleanup,
// and 409 session conflict handling on /ai-scanner.
// ═══════════════════════════════════════════════════════════════════════════

// ── Helpers ───────────────────────────────────────────────────────────────

/** Minimal valid PDF (~200 bytes) — header + empty page + xref + trailer */
function createDummyPDF(): Buffer {
  const pdf = [
    '%PDF-1.4',
    '1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj',
    '2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj',
    '3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]>> endobj',
    'xref',
    '0 4',
    '0000000000 65535 f ',
    '0000000009 00000 n ',
    '0000000058 00000 n ',
    '0000000115 00000 n ',
    'trailer <</Size 4 /Root 1 0 R>>',
    'startxref',
    '190',
    '%%EOF',
  ].join('\n');
  return Buffer.from(pdf, 'utf-8');
}

/** Upload a dummy PDF via the hidden file input */
async function uploadDummyPDF(page: Page, filename = 'test-quote.pdf') {
  const buffer = createDummyPDF();
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles({
    name: filename,
    mimeType: 'application/pdf',
    buffer,
  });
}

/** Fill the QuoteUploadGateModal lead form and submit */
async function fillAndSubmitLeadForm(page: Page, data?: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}) {
  const firstName = data?.firstName ?? 'Test';
  const lastName = data?.lastName ?? 'User';
  const email = data?.email ?? `e2e+${Date.now()}@test.com`;
  const phone = data?.phone ?? '5551234567';

  // Wait for the modal to be visible
  await expect(page.locator('text=Unlock Your Full Analysis')).toBeVisible({ timeout: 15000 });

  // Fill form fields by their IDs
  await page.fill('#gate-firstName', firstName);
  await page.fill('#gate-lastName', lastName);
  await page.fill('#gate-email', email);
  await page.fill('#gate-phone', phone);

  // Check SMS consent
  await page.locator('#sms-consent').click();

  // Submit
  await page.locator('button:has-text("Unlock My Score Now")').click();
}

// ── Test Suite ─────────────────────────────────────────────────────────────

test.describe('Scanner Flow — /ai-scanner', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/ai-scanner', { waitUntil: 'networkidle' });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Test 1: Happy Path — log-event returns 200, quote-scanner fires once
  // ────────────────────────────────────────────────────────────────────────
  test('happy path: log-event 200 and quote-scanner fires after lead submit', async ({ page }) => {
    // Track quote-scanner calls
    const quoteScannerRequests: Request[] = [];
    page.on('request', (req) => {
      if (req.url().includes('functions/v1/quote-scanner')) {
        quoteScannerRequests.push(req);
      }
    });

    // Upload PDF → modal should open
    await uploadDummyPDF(page);

    // Set up log-event response listener BEFORE submitting
    const logEventPromise = page.waitForResponse(
      (resp) => resp.url().includes('functions/v1/log-event'),
      { timeout: 30_000 },
    );

    // Fill and submit lead form
    await fillAndSubmitLeadForm(page);

    // Assert log-event returns 200
    const logEventResponse = await logEventPromise;
    expect(logEventResponse.status()).toBe(200);

    // Wait a bit for quote-scanner to fire after lead capture
    await page.waitForResponse(
      (resp) => resp.url().includes('functions/v1/quote-scanner'),
      { timeout: 30_000 },
    );

    // Assert exactly 1 quote-scanner call
    expect(quoteScannerRequests.length).toBe(1);
  });

  // ────────────────────────────────────────────────────────────────────────
  // Test 2: Security Check — no analysis before lead capture + locked state
  // ────────────────────────────────────────────────────────────────────────
  test('security: no quote-scanner call before lead capture, locked state on dismiss', async ({ page }) => {
    const quoteScannerRequests: Request[] = [];
    page.on('request', (req) => {
      if (req.url().includes('functions/v1/quote-scanner')) {
        quoteScannerRequests.push(req);
      }
    });

    // Upload PDF
    await uploadDummyPDF(page);

    // Wait for modal to appear
    await expect(page.locator('text=Unlock Your Full Analysis')).toBeVisible({ timeout: 15000 });

    // Assert zero quote-scanner calls at this point
    expect(quoteScannerRequests.length).toBe(0);

    // Close the modal via the X button (DialogClose)
    await page.locator('[data-dialog-close], button[aria-label="Close"]').first().click();

    // Should see "locked" state
    await expect(page.locator('text=Your report is ready to unlock')).toBeVisible({ timeout: 10000 });

    // Blurred preview should exist
    await expect(page.locator('.blur-xl')).toBeVisible();

    // Still zero quote-scanner calls
    expect(quoteScannerRequests.length).toBe(0);
  });

  // ────────────────────────────────────────────────────────────────────────
  // Test 3: Abandon & Reset — state cleanup and re-upload
  // ────────────────────────────────────────────────────────────────────────
  test('abandon & reset: upload, dismiss, reset, re-upload reopens modal', async ({ page }) => {
    // Upload, then dismiss modal to reach locked state
    await uploadDummyPDF(page);
    await expect(page.locator('text=Unlock Your Full Analysis')).toBeVisible({ timeout: 15000 });
    await page.locator('[data-dialog-close], button[aria-label="Close"]').first().click();
    await expect(page.locator('text=Your report is ready to unlock')).toBeVisible({ timeout: 10000 });

    // Click "Upload a Different Quote"
    await page.locator('text=Upload a Different Quote').click();

    // Should return to idle state
    await expect(page.locator('text=Upload your quote to get started')).toBeVisible({ timeout: 10000 });

    // Upload a second file
    await uploadDummyPDF(page, 'second-quote.pdf');

    // Modal should reopen
    await expect(page.locator('text=Unlock Your Full Analysis')).toBeVisible({ timeout: 15000 });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Test 4: Session Conflict — no 409 errors on initial load
  // ────────────────────────────────────────────────────────────────────────
  test('session conflict: no 409 errors in console on page load', async ({ page }) => {
    const conflict409Messages: string[] = [];

    // Listen for console errors BEFORE navigating
    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('409') || text.toLowerCase().includes('duplicate key') || text.toLowerCase().includes('conflict')) {
          conflict409Messages.push(text);
        }
      }
    });

    // Re-navigate to capture console from the start
    await page.goto('/ai-scanner', { waitUntil: 'networkidle' });

    // Allow a short settle time for any async operations
    await page.waitForTimeout(3000);

    // Assert no 409-related console errors
    expect(conflict409Messages).toEqual([]);
  });
});
