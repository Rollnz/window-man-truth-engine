import { test, expect, Page } from '@playwright/test';

/**
 * Visual Regression Test Suite for Conversion Modals
 * 
 * Tests that LeadCaptureModal, ConsultationBookingModal, and IntelLeadModal
 * render correctly in both light and dark mode with proper contrast.
 * 
 * These tests verify the FormSurfaceProvider "trust" surface architecture
 * ensures white-card modals remain legible regardless of theme.
 */

// Helper to set color scheme preference
async function setColorScheme(page: Page, scheme: 'light' | 'dark') {
  await page.emulateMedia({ colorScheme: scheme });
}

// Helper to wait for modal to be fully visible and stable
async function waitForModalStable(page: Page) {
  // Wait for the modal content to be visible
  await page.waitForSelector('[role="dialog"]', { state: 'visible' });
  // Wait for any animations to complete
  await page.waitForTimeout(500);
}

// Helper to close any open modal
async function closeModal(page: Page) {
  const closeButton = page.locator('[role="dialog"] button[aria-label="Close"]').or(
    page.locator('[role="dialog"] button:has(svg.lucide-x)')
  );
  if (await closeButton.isVisible()) {
    await closeButton.click();
    await page.waitForTimeout(300);
  }
}

test.describe('Conversion Modal Visual Regression', () => {
  
  test.describe('LeadCaptureModal', () => {
    
    test.beforeEach(async ({ page }) => {
      // Navigate to comparison page where FloatingEmailButton triggers the modal
      await page.goto('/comparison');
      await page.waitForLoadState('networkidle');
    });

    test('renders correctly in light mode', async ({ page }) => {
      await setColorScheme(page, 'light');
      
      // Click the floating email button to open LeadCaptureModal
      const emailButton = page.locator('button').filter({ hasText: /email|get.*report/i }).first();
      await emailButton.click();
      await waitForModalStable(page);
      
      // Take screenshot of the modal
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      await expect(modal).toHaveScreenshot('lead-capture-modal-light.png', {
        maxDiffPixelRatio: 0.05,
      });
    });

    test('renders correctly in dark mode', async ({ page }) => {
      await setColorScheme(page, 'dark');
      
      // Click the floating email button to open LeadCaptureModal
      const emailButton = page.locator('button').filter({ hasText: /email|get.*report/i }).first();
      await emailButton.click();
      await waitForModalStable(page);
      
      // Take screenshot of the modal
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      await expect(modal).toHaveScreenshot('lead-capture-modal-dark.png', {
        maxDiffPixelRatio: 0.05,
      });
    });

    test('inputs have proper contrast in dark mode', async ({ page }) => {
      await setColorScheme(page, 'dark');
      
      const emailButton = page.locator('button').filter({ hasText: /email|get.*report/i }).first();
      await emailButton.click();
      await waitForModalStable(page);
      
      // Verify input fields are visible and styled correctly
      const inputs = page.locator('[role="dialog"] input');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        // Check that input has white background (trust surface)
        await expect(input).toHaveCSS('background-color', /rgb\(255, 255, 255\)|rgba\(255, 255, 255/);
      }
    });
  });

  test.describe('ConsultationBookingModal', () => {
    
    test.beforeEach(async ({ page }) => {
      // Navigate to intel page where "Schedule Free Consultation" triggers the modal
      await page.goto('/intel');
      await page.waitForLoadState('networkidle');
    });

    test('renders correctly in light mode', async ({ page }) => {
      await setColorScheme(page, 'light');
      
      // Scroll to the consultation CTA section
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      
      // Click the consultation button
      const consultButton = page.locator('button').filter({ hasText: /schedule.*consultation/i }).first();
      await consultButton.click();
      await waitForModalStable(page);
      
      // Take screenshot of the modal
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      await expect(modal).toHaveScreenshot('consultation-booking-modal-light.png', {
        maxDiffPixelRatio: 0.05,
      });
    });

    test('renders correctly in dark mode', async ({ page }) => {
      await setColorScheme(page, 'dark');
      
      // Scroll to the consultation CTA section
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      
      // Click the consultation button
      const consultButton = page.locator('button').filter({ hasText: /schedule.*consultation/i }).first();
      await consultButton.click();
      await waitForModalStable(page);
      
      // Take screenshot of the modal
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      await expect(modal).toHaveScreenshot('consultation-booking-modal-dark.png', {
        maxDiffPixelRatio: 0.05,
      });
    });

    test('select dropdown has proper contrast in dark mode', async ({ page }) => {
      await setColorScheme(page, 'dark');
      
      // Scroll and click consultation button
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      
      const consultButton = page.locator('button').filter({ hasText: /schedule.*consultation/i }).first();
      await consultButton.click();
      await waitForModalStable(page);
      
      // Click the select trigger to open dropdown
      const selectTrigger = page.locator('[role="dialog"] [role="combobox"]').first();
      if (await selectTrigger.isVisible()) {
        await selectTrigger.click();
        await page.waitForTimeout(300);
        
        // Screenshot the dropdown content
        const selectContent = page.locator('[role="listbox"]');
        if (await selectContent.isVisible()) {
          await expect(selectContent).toHaveScreenshot('consultation-select-dropdown-dark.png', {
            maxDiffPixelRatio: 0.05,
          });
        }
      }
    });

    test('form inputs are legible with typed text in dark mode', async ({ page }) => {
      await setColorScheme(page, 'dark');
      
      // Scroll and click consultation button
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      
      const consultButton = page.locator('button').filter({ hasText: /schedule.*consultation/i }).first();
      await consultButton.click();
      await waitForModalStable(page);
      
      // Fill in form fields to test legibility
      const nameInput = page.locator('[role="dialog"] input[placeholder*="name" i]').or(
        page.locator('[role="dialog"] input').first()
      );
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test User Name');
      }
      
      const emailInput = page.locator('[role="dialog"] input[type="email"]').or(
        page.locator('[role="dialog"] input[placeholder*="email" i]')
      );
      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com');
      }
      
      const phoneInput = page.locator('[role="dialog"] input[type="tel"]').or(
        page.locator('[role="dialog"] input[placeholder*="phone" i]')
      );
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('555-123-4567');
      }
      
      await page.waitForTimeout(300);
      
      // Screenshot with filled inputs
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toHaveScreenshot('consultation-booking-modal-filled-dark.png', {
        maxDiffPixelRatio: 0.05,
      });
    });
  });

  test.describe('IntelLeadModal', () => {
    
    test.beforeEach(async ({ page }) => {
      // Navigate to a page that might use IntelLeadModal
      // This modal is used for gated resource access
      await page.goto('/intel');
      await page.waitForLoadState('networkidle');
    });

    test('component can be rendered via direct trigger', async ({ page }) => {
      // IntelLeadModal is typically triggered by resource cards
      // We'll attempt to find and click a resource that requires gating
      
      const resourceCard = page.locator('[data-testid="resource-card"]').or(
        page.locator('article').filter({ hasText: /guide|download|access/i }).first()
      );
      
      // If there's a resource card, try to trigger the modal
      if (await resourceCard.isVisible()) {
        const accessButton = resourceCard.locator('button').filter({ hasText: /access|download|get/i }).first();
        if (await accessButton.isVisible()) {
          await accessButton.click();
          await page.waitForTimeout(500);
          
          const modal = page.locator('[role="dialog"]');
          if (await modal.isVisible()) {
            await expect(modal).toHaveScreenshot('intel-lead-modal-light.png', {
              maxDiffPixelRatio: 0.05,
            });
          }
        }
      }
    });
  });

  test.describe('BeatYourQuote Modal Access', () => {
    
    test('ConsultationBookingModal from BeatYourQuote renders in dark mode', async ({ page }) => {
      await setColorScheme(page, 'dark');
      
      await page.goto('/beat-your-quote');
      await page.waitForLoadState('networkidle');
      
      // Look for the consultation/book call button
      const bookButton = page.locator('button').filter({ hasText: /book.*call|schedule|consultation/i }).first();
      
      if (await bookButton.isVisible()) {
        await bookButton.click();
        await waitForModalStable(page);
        
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible();
        await expect(modal).toHaveScreenshot('beat-your-quote-consultation-modal-dark.png', {
          maxDiffPixelRatio: 0.05,
        });
      }
    });
  });

  test.describe('Cross-theme Consistency', () => {
    
    test('modal background remains white in both themes', async ({ page }) => {
      // Test LeadCaptureModal
      await page.goto('/comparison');
      await page.waitForLoadState('networkidle');
      
      const emailButton = page.locator('button').filter({ hasText: /email|get.*report/i }).first();
      
      // Light mode check
      await setColorScheme(page, 'light');
      await emailButton.click();
      await waitForModalStable(page);
      
      const modalLight = page.locator('[role="dialog"] > div').first();
      await expect(modalLight).toHaveCSS('background-color', /rgb\(255, 255, 255\)/);
      
      await closeModal(page);
      await page.waitForTimeout(300);
      
      // Dark mode check - modal should still have white background
      await setColorScheme(page, 'dark');
      await emailButton.click();
      await waitForModalStable(page);
      
      const modalDark = page.locator('[role="dialog"] > div').first();
      await expect(modalDark).toHaveCSS('background-color', /rgb\(255, 255, 255\)/);
    });

    test('focus rings are visible on inputs in dark mode', async ({ page }) => {
      await setColorScheme(page, 'dark');
      
      await page.goto('/comparison');
      await page.waitForLoadState('networkidle');
      
      const emailButton = page.locator('button').filter({ hasText: /email|get.*report/i }).first();
      await emailButton.click();
      await waitForModalStable(page);
      
      // Focus the first input
      const firstInput = page.locator('[role="dialog"] input').first();
      await firstInput.focus();
      
      // Take screenshot with focus ring visible
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toHaveScreenshot('lead-capture-modal-focus-ring-dark.png', {
        maxDiffPixelRatio: 0.05,
      });
    });
  });
});

test.describe('Default Surface Inputs (Non-Modal)', () => {
  
  test('tool page inputs use theme-aware styling in dark mode', async ({ page }) => {
    await setColorScheme(page, 'dark');
    
    // Navigate to a tool page with inputs (Cost Calculator has sliders/inputs)
    await page.goto('/cost-calculator');
    await page.waitForLoadState('networkidle');
    
    // Find any inputs on the page (not in a modal)
    const pageInputs = page.locator('main input:not([role="dialog"] input)');
    const inputCount = await pageInputs.count();
    
    if (inputCount > 0) {
      // Take a screenshot of the page inputs area
      const inputSection = pageInputs.first().locator('..').locator('..');
      if (await inputSection.isVisible()) {
        await expect(inputSection).toHaveScreenshot('tool-page-inputs-dark.png', {
          maxDiffPixelRatio: 0.05,
        });
      }
    }
  });

  test('tool page inputs remain legible in light mode', async ({ page }) => {
    await setColorScheme(page, 'light');
    
    await page.goto('/cost-calculator');
    await page.waitForLoadState('networkidle');
    
    const pageInputs = page.locator('main input:not([role="dialog"] input)');
    const inputCount = await pageInputs.count();
    
    if (inputCount > 0) {
      const inputSection = pageInputs.first().locator('..').locator('..');
      if (await inputSection.isVisible()) {
        await expect(inputSection).toHaveScreenshot('tool-page-inputs-light.png', {
          maxDiffPixelRatio: 0.05,
        });
      }
    }
  });
});
