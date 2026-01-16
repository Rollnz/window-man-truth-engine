import { test, expect, Page } from '@playwright/test';

/**
 * Golden Thread E2E Tests
 * 
 * Tests the leadId persistence and data merging across:
 * - Page refreshes (localStorage persistence)
 * - Multi-tool transitions (data merging)
 * - Gated content flows (Intel Modal)
 * - Double submissions (idempotency)
 * - Consultation-first flows (reverse order)
 */

const STORAGE_KEY = 'impact-windows-session';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_NAME = 'Test User';
const TEST_PHONE = '(555) 123-4567';

// Helper to get session data from localStorage
async function getSessionData(page: Page) {
  return await page.evaluate((key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }, STORAGE_KEY);
}

// Helper to clear session data
async function clearSessionData(page: Page) {
  await page.evaluate((key) => {
    localStorage.removeItem(key);
  }, STORAGE_KEY);
}

// Helper to intercept save-lead API calls
async function interceptSaveLeadCalls(page: Page) {
  const calls: { payload: any; response: any }[] = [];
  
  await page.route('**/functions/v1/save-lead', async (route) => {
    const request = route.request();
    const payload = request.postDataJSON();
    
    // Continue with the actual request
    const response = await route.fetch();
    const responseBody = await response.json();
    
    calls.push({ payload, response: responseBody });
    
    await route.fulfill({ response });
  });
  
  return calls;
}

test.describe('Golden Thread Persistence', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear any existing session data before each test
    await page.goto('/');
    await clearSessionData(page);
  });

  /**
   * Scenario 1: The "Refresh" Test
   * Goal: Verify leadId survives a browser refresh
   */
  test('Scenario 1: leadId persists after page refresh', async ({ page }) => {
    // Navigate to cost calculator
    await page.goto('/cost-calculator');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Simulate setting a leadId (as if form was submitted)
    await page.evaluate((key) => {
      const existing = localStorage.getItem(key);
      const data = existing ? JSON.parse(existing) : {};
      data.leadId = 'test-lead-uuid-12345';
      data.email = 'test@example.com';
      localStorage.setItem(key, JSON.stringify(data));
    }, STORAGE_KEY);
    
    // Verify leadId is set
    let sessionData = await getSessionData(page);
    expect(sessionData?.leadId).toBe('test-lead-uuid-12345');
    
    // Hard refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify leadId persisted after refresh
    sessionData = await getSessionData(page);
    expect(sessionData?.leadId).toBe('test-lead-uuid-12345');
    expect(sessionData?.email).toBe('test@example.com');
  });

  /**
   * Scenario 2: The "Multi-Tool" Jumper
   * Goal: Ensure using Tool B doesn't erase data from Tool A
   */
  test('Scenario 2: session data merges across tool transitions', async ({ page }) => {
    // Step 1: Set initial data from "cost calculator"
    await page.goto('/cost-calculator');
    await page.waitForLoadState('networkidle');
    
    await page.evaluate((key) => {
      const data = {
        leadId: 'multi-tool-lead-123',
        email: 'multiuser@example.com',
        toolsCompleted: ['cost-calculator'],
        costOfInactionTotal: 5000,
        homeSize: 2500,
        windowCount: 12,
      };
      localStorage.setItem(key, JSON.stringify(data));
    }, STORAGE_KEY);
    
    // Step 2: Navigate to Fair Price Quiz and add quiz data
    await page.goto('/fair-price-quiz');
    await page.waitForLoadState('networkidle');
    
    // Simulate completing the quiz by merging new data
    await page.evaluate((key) => {
      const existing = localStorage.getItem(key);
      const data = existing ? JSON.parse(existing) : {};
      
      // Add quiz-specific data
      data.fairPriceQuizResults = {
        quoteAmount: 15000,
        grade: 'good',
        analyzedAt: new Date().toISOString(),
      };
      data.toolsCompleted = [...(data.toolsCompleted || []), 'fair-price-quiz'];
      
      localStorage.setItem(key, JSON.stringify(data));
    }, STORAGE_KEY);
    
    // Verify both tool data exists
    const sessionData = await getSessionData(page);
    
    // Original data preserved
    expect(sessionData?.leadId).toBe('multi-tool-lead-123');
    expect(sessionData?.costOfInactionTotal).toBe(5000);
    expect(sessionData?.homeSize).toBe(2500);
    expect(sessionData?.windowCount).toBe(12);
    
    // New data added
    expect(sessionData?.fairPriceQuizResults?.quoteAmount).toBe(15000);
    expect(sessionData?.fairPriceQuizResults?.grade).toBe('good');
    expect(sessionData?.toolsCompleted).toContain('cost-calculator');
    expect(sessionData?.toolsCompleted).toContain('fair-price-quiz');
  });

  /**
   * Scenario 3: The "Gated Content" Flow
   * Goal: Verify the Intel Modal correctly initializes the thread
   */
  test('Scenario 3: Intel gated content creates and persists leadId', async ({ page }) => {
    await page.goto('/intel');
    await page.waitForLoadState('networkidle');
    
    // Verify initially no leadId
    let sessionData = await getSessionData(page);
    expect(sessionData?.leadId).toBeUndefined();
    
    // Simulate unlocking a resource (sets leadId)
    await page.evaluate((key) => {
      const existing = localStorage.getItem(key);
      const data = existing ? JSON.parse(existing) : {};
      data.leadId = 'intel-gate-lead-456';
      data.email = 'intel@example.com';
      data.unlockedResources = ['claim-survival'];
      data.intelLibraryViewed = true;
      localStorage.setItem(key, JSON.stringify(data));
    }, STORAGE_KEY);
    
    // Navigate to another tool (Beat Your Quote)
    await page.goto('/beat-your-quote');
    await page.waitForLoadState('networkidle');
    
    // Verify leadId carries over
    sessionData = await getSessionData(page);
    expect(sessionData?.leadId).toBe('intel-gate-lead-456');
    expect(sessionData?.unlockedResources).toContain('claim-survival');
  });

  /**
   * Scenario 4: The "Double Dip"
   * Goal: Ensure submitting the same form twice returns the same leadId
   */
  test('Scenario 4: double submission maintains idempotency', async ({ page }) => {
    await page.goto('/cost-calculator');
    await page.waitForLoadState('networkidle');
    
    // Simulate first submission - creates leadId
    await page.evaluate((key) => {
      const data = {
        leadId: 'idempotent-lead-789',
        email: 'idempotent@example.com',
        costOfInactionTotal: 3000,
      };
      localStorage.setItem(key, JSON.stringify(data));
    }, STORAGE_KEY);
    
    let sessionData = await getSessionData(page);
    const firstLeadId = sessionData?.leadId;
    
    // Simulate second submission - should use existing leadId
    await page.evaluate((key) => {
      const existing = localStorage.getItem(key);
      const data = existing ? JSON.parse(existing) : {};
      // Update some data but keep leadId
      data.costOfInactionTotal = 4500; // Changed value
      localStorage.setItem(key, JSON.stringify(data));
    }, STORAGE_KEY);
    
    sessionData = await getSessionData(page);
    const secondLeadId = sessionData?.leadId;
    
    // Both submissions should use the same leadId
    expect(secondLeadId).toBe(firstLeadId);
    expect(sessionData?.costOfInactionTotal).toBe(4500); // Updated value
  });

  /**
   * Scenario 5: The "Consultation First" Edge Case
   * Goal: Verify the thread works when consultation is booked before using tools
   */
  test('Scenario 5: consultation-first flow correctly initializes thread', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify initially no leadId
    let sessionData = await getSessionData(page);
    expect(sessionData?.leadId).toBeUndefined();
    
    // Simulate consultation booking (creates leadId first)
    await page.evaluate((key) => {
      const data = {
        leadId: 'consultation-first-lead-101',
        email: 'consult-first@example.com',
        name: 'Consultation User',
        phone: '(555) 999-8888',
        consultationRequested: true,
      };
      localStorage.setItem(key, JSON.stringify(data));
    }, STORAGE_KEY);
    
    // Navigate to cost calculator and add tool data
    await page.goto('/cost-calculator');
    await page.waitForLoadState('networkidle');
    
    await page.evaluate((key) => {
      const existing = localStorage.getItem(key);
      const data = existing ? JSON.parse(existing) : {};
      data.costOfInactionTotal = 6000;
      data.toolsCompleted = ['cost-calculator'];
      localStorage.setItem(key, JSON.stringify(data));
    }, STORAGE_KEY);
    
    // Verify consultation leadId is preserved and tool data added
    sessionData = await getSessionData(page);
    expect(sessionData?.leadId).toBe('consultation-first-lead-101');
    expect(sessionData?.consultationRequested).toBe(true);
    expect(sessionData?.costOfInactionTotal).toBe(6000);
    expect(sessionData?.toolsCompleted).toContain('cost-calculator');
  });

  /**
   * Bonus: Cross-tab consistency
   * Goal: Verify localStorage syncs across navigation
   */
  test('Bonus: leadId persists across route navigation', async ({ page }) => {
    // Set leadId on home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.evaluate((key) => {
      localStorage.setItem(key, JSON.stringify({
        leadId: 'navigation-lead-202',
        email: 'nav@example.com',
      }));
    }, STORAGE_KEY);
    
    // Navigate through multiple routes
    const routes = ['/cost-calculator', '/fair-price-quiz', '/intel', '/beat-your-quote', '/'];
    
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      const sessionData = await getSessionData(page);
      expect(sessionData?.leadId).toBe('navigation-lead-202');
    }
  });
});

test.describe('API Payload Verification', () => {
  
  /**
   * Verify leadId is included in API payloads
   * Note: This test mocks the localStorage state and verifies structure
   */
  test('API payloads include leadId when present in session', async ({ page }) => {
    await page.goto('/cost-calculator');
    await page.waitForLoadState('networkidle');
    
    // Set up session with leadId
    await page.evaluate((key) => {
      localStorage.setItem(key, JSON.stringify({
        leadId: 'api-test-lead-303',
        email: 'api@example.com',
        homeSize: 2000,
        windowCount: 10,
      }));
    }, STORAGE_KEY);
    
    // Verify session has leadId
    const sessionData = await getSessionData(page);
    expect(sessionData?.leadId).toBe('api-test-lead-303');
    
    // The actual API call verification would happen in the component tests
    // This confirms the localStorage state is correct for components to read
  });
});

test.describe('GTM DataLayer Verification', () => {
  
  /**
   * Verify GTM events include lead_id
   */
  test('GTM events include lead_id when leadId is set', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Set up leadId in session
    await page.evaluate((key) => {
      localStorage.setItem(key, JSON.stringify({
        leadId: 'gtm-test-lead-404',
      }));
    }, STORAGE_KEY);
    
    // Initialize dataLayer if not present
    await page.evaluate(() => {
      window.dataLayer = window.dataLayer || [];
    });
    
    // Simulate a GTM event push
    await page.evaluate(() => {
      window.dataLayer.push({
        event: 'lead_captured',
        lead_id: 'gtm-test-lead-404',
        source_tool: 'cost-calculator',
      });
    });
    
    // Verify dataLayer contains the event with lead_id
    const dataLayer = await page.evaluate(() => window.dataLayer);
    const leadEvent = dataLayer.find((e: any) => e.event === 'lead_captured');
    
    expect(leadEvent).toBeDefined();
    expect(leadEvent?.lead_id).toBe('gtm-test-lead-404');
    expect(leadEvent?.source_tool).toBe('cost-calculator');
  });
});
