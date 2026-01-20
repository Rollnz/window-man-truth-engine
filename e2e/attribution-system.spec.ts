import { test, expect, Page } from '@playwright/test';

/**
 * Attribution System E2E Tests (Phase 1B)
 * 
 * Tests the three-tier attribution model:
 * 1. first_touch - Captured on first visit, never overwritten
 * 2. last_touch - Updated on every session (including direct)
 * 3. last_non_direct - ONLY updated when isMeaningfulTouch === true
 * 
 * Key scenarios:
 * - Paid click → Direct return: last_non_direct preserved
 * - Multiple paid clicks: last_non_direct updates
 * - First touch immutability
 * - Channel classification accuracy
 */

const FIRST_TOUCH_KEY = 'wm_first_touch';
const LAST_TOUCH_KEY = 'wm_attribution_data';
const LAST_NON_DIRECT_KEY = 'wm_last_non_direct';

// Helper to get attribution tier from localStorage
async function getAttributionTier(page: Page, tierKey: string) {
  return await page.evaluate((key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }, tierKey);
}

// Helper to clear all attribution storage
async function clearAttribution(page: Page) {
  await page.evaluate(({ first, last, nonDirect }) => {
    localStorage.removeItem(first);
    localStorage.removeItem(last);
    localStorage.removeItem(nonDirect);
  }, { first: FIRST_TOUCH_KEY, last: LAST_TOUCH_KEY, nonDirect: LAST_NON_DIRECT_KEY });
}

// Helper to simulate a visit with specific attribution
async function visitWithAttribution(
  page: Page,
  path: string,
  params: Record<string, string> = {}
) {
  const url = new URL(path, 'http://localhost:5173');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  await page.goto(url.pathname + url.search);
  await page.waitForLoadState('networkidle');
}

test.describe('Attribution System - Phase 1B', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start fresh
    await page.goto('/');
    await clearAttribution(page);
    await page.reload();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Scenario 1: The Core Protection Test
  // ═══════════════════════════════════════════════════════════════════════════
  
  test('Scenario 1: last_non_direct is preserved when user returns via direct visit', async ({ page }) => {
    // Step 1: User arrives via Google Ads click
    await visitWithAttribution(page, '/', {
      gclid: 'test-gclid-12345',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'windows_spring',
    });
    
    // Verify last_non_direct captured the paid click
    let lastNonDirect = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(lastNonDirect?.gclid).toBe('test-gclid-12345');
    expect(lastNonDirect?.utm_source).toBe('google');
    expect(lastNonDirect?.utm_medium).toBe('cpc');
    expect(lastNonDirect?.channel).toBe('google_ads');
    
    // Step 2: User returns directly (no UTMs, no gclid)
    await page.goto('/cost-calculator');
    await page.waitForLoadState('networkidle');
    
    // Verify last_touch was updated to direct
    const lastTouch = await getAttributionTier(page, LAST_TOUCH_KEY);
    expect(lastTouch?.channel).toBe('direct');
    expect(lastTouch?.gclid).toBeUndefined();
    
    // CRITICAL: Verify last_non_direct was NOT overwritten
    lastNonDirect = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(lastNonDirect?.gclid).toBe('test-gclid-12345');
    expect(lastNonDirect?.utm_source).toBe('google');
    expect(lastNonDirect?.channel).toBe('google_ads');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Scenario 2: Meta (Facebook) Attribution Protection
  // ═══════════════════════════════════════════════════════════════════════════
  
  test('Scenario 2: fbclid preserves Meta attribution on direct return', async ({ page }) => {
    // Step 1: User arrives via Facebook ad
    await visitWithAttribution(page, '/', {
      fbclid: 'test-fbclid-67890',
      utm_source: 'facebook',
      utm_medium: 'paid',
      utm_campaign: 'insurance_claim',
    });
    
    // Verify Meta attribution captured
    let lastNonDirect = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(lastNonDirect?.fbc).toContain('test-fbclid-67890');
    expect(lastNonDirect?.channel).toBe('meta_ads');
    
    // Step 2: User returns directly to complete a tool
    await page.goto('/fair-price-quiz');
    await page.waitForLoadState('networkidle');
    
    // Step 3: User returns again directly
    await page.goto('/beat-your-quote');
    await page.waitForLoadState('networkidle');
    
    // CRITICAL: Meta attribution still preserved after TWO direct visits
    lastNonDirect = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(lastNonDirect?.fbc).toContain('test-fbclid-67890');
    expect(lastNonDirect?.channel).toBe('meta_ads');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Scenario 3: First Touch Immutability
  // ═══════════════════════════════════════════════════════════════════════════
  
  test('Scenario 3: first_touch is never overwritten', async ({ page }) => {
    // Step 1: First visit via organic search
    await visitWithAttribution(page, '/', {
      utm_source: 'google',
      utm_medium: 'organic',
    });
    
    const firstTouch = await getAttributionTier(page, FIRST_TOUCH_KEY);
    expect(firstTouch?.utm_source).toBe('google');
    expect(firstTouch?.utm_medium).toBe('organic');
    expect(firstTouch?.channel).toBe('organic_search');
    
    // Step 2: Later clicks on a paid ad
    await visitWithAttribution(page, '/cost-calculator', {
      gclid: 'paid-click-xyz',
      utm_source: 'google',
      utm_medium: 'cpc',
    });
    
    // Verify first_touch is UNCHANGED
    const stillFirstTouch = await getAttributionTier(page, FIRST_TOUCH_KEY);
    expect(stillFirstTouch?.utm_medium).toBe('organic');
    expect(stillFirstTouch?.gclid).toBeUndefined();
    expect(stillFirstTouch?.channel).toBe('organic_search');
    
    // Verify last_non_direct HAS updated to paid
    const lastNonDirect = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(lastNonDirect?.gclid).toBe('paid-click-xyz');
    expect(lastNonDirect?.channel).toBe('google_ads');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Scenario 4: Multiple Meaningful Touches Update Last Non-Direct
  // ═══════════════════════════════════════════════════════════════════════════
  
  test('Scenario 4: last_non_direct updates when new paid click arrives', async ({ page }) => {
    // Step 1: First paid visit via Google
    await visitWithAttribution(page, '/', {
      gclid: 'google-click-1',
      utm_source: 'google',
      utm_medium: 'cpc',
    });
    
    let lastNonDirect = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(lastNonDirect?.gclid).toBe('google-click-1');
    
    // Step 2: Direct return (should NOT update)
    await page.goto('/cost-calculator');
    await page.waitForLoadState('networkidle');
    
    lastNonDirect = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(lastNonDirect?.gclid).toBe('google-click-1'); // Still google
    
    // Step 3: New paid visit via Facebook (SHOULD update)
    await visitWithAttribution(page, '/fair-price-quiz', {
      fbclid: 'facebook-click-2',
      utm_source: 'facebook',
      utm_medium: 'paid',
    });
    
    lastNonDirect = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(lastNonDirect?.fbc).toContain('facebook-click-2');
    expect(lastNonDirect?.channel).toBe('meta_ads');
    // gclid may still be present from merge, but fbc is now set
    expect(lastNonDirect?.fbc).toBeDefined();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Scenario 5: UTM-Only Campaigns Count as Meaningful
  // ═══════════════════════════════════════════════════════════════════════════
  
  test('Scenario 5: UTM source + medium without click ID is meaningful', async ({ page }) => {
    // Step 1: Visit via email campaign (no click ID, but has UTMs)
    await visitWithAttribution(page, '/', {
      utm_source: 'newsletter',
      utm_medium: 'email',
      utm_campaign: 'jan_2026',
    });
    
    let lastNonDirect = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(lastNonDirect?.utm_source).toBe('newsletter');
    expect(lastNonDirect?.utm_medium).toBe('email');
    expect(lastNonDirect?.channel).toBe('email');
    
    // Step 2: Direct return
    await page.goto('/intel');
    await page.waitForLoadState('networkidle');
    
    // Verify email attribution preserved
    lastNonDirect = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(lastNonDirect?.utm_source).toBe('newsletter');
    expect(lastNonDirect?.channel).toBe('email');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Scenario 6: Microsoft/Bing Ads Support
  // ═══════════════════════════════════════════════════════════════════════════
  
  test('Scenario 6: msclkid counts as meaningful touch', async ({ page }) => {
    // Visit via Microsoft Ads
    await visitWithAttribution(page, '/', {
      msclkid: 'bing-click-abc',
      utm_source: 'bing',
      utm_medium: 'cpc',
    });
    
    let lastNonDirect = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(lastNonDirect?.msclkid).toBe('bing-click-abc');
    expect(lastNonDirect?.channel).toBe('microsoft_ads');
    
    // Direct return should preserve
    await page.goto('/cost-calculator');
    await page.waitForLoadState('networkidle');
    
    lastNonDirect = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(lastNonDirect?.msclkid).toBe('bing-click-abc');
    expect(lastNonDirect?.channel).toBe('microsoft_ads');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Scenario 7: UTM Source Alone is NOT Meaningful
  // ═══════════════════════════════════════════════════════════════════════════
  
  test('Scenario 7: utm_source without utm_medium is not meaningful', async ({ page }) => {
    // First: Establish a meaningful touch
    await visitWithAttribution(page, '/', {
      gclid: 'original-paid-click',
      utm_source: 'google',
      utm_medium: 'cpc',
    });
    
    let lastNonDirect = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(lastNonDirect?.gclid).toBe('original-paid-click');
    
    // Visit with only utm_source (should NOT update last_non_direct)
    await visitWithAttribution(page, '/cost-calculator', {
      utm_source: 'some-source', // No utm_medium, no click ID
    });
    
    // last_non_direct should still have the original gclid
    lastNonDirect = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(lastNonDirect?.gclid).toBe('original-paid-click');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Scenario 8: Complex User Journey
  // ═══════════════════════════════════════════════════════════════════════════
  
  test('Scenario 8: full user journey with multiple touchpoints', async ({ page }) => {
    // Day 1: User discovers via organic Google search
    await visitWithAttribution(page, '/', {
      utm_source: 'google',
      utm_medium: 'organic',
    });
    
    const firstTouch = await getAttributionTier(page, FIRST_TOUCH_KEY);
    expect(firstTouch?.channel).toBe('organic_search');
    
    // Day 2: User returns directly, browses around
    await page.goto('/cost-calculator');
    await page.waitForLoadState('networkidle');
    
    // Day 3: User clicks a retargeting ad
    await visitWithAttribution(page, '/fair-price-quiz', {
      gclid: 'retarget-click-123',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'retargeting',
    });
    
    // Day 4: User returns directly to complete a tool
    await page.goto('/beat-your-quote');
    await page.waitForLoadState('networkidle');
    
    // Day 5: User returns directly and converts
    await page.goto('/consultation');
    await page.waitForLoadState('networkidle');
    
    // Final verification
    const finalFirstTouch = await getAttributionTier(page, FIRST_TOUCH_KEY);
    const finalLastTouch = await getAttributionTier(page, LAST_TOUCH_KEY);
    const finalLastNonDirect = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    
    // First touch: organic (unchanged)
    expect(finalFirstTouch?.utm_medium).toBe('organic');
    expect(finalFirstTouch?.channel).toBe('organic_search');
    
    // Last touch: direct (most recent)
    expect(finalLastTouch?.channel).toBe('direct');
    
    // Last non-direct: retargeting campaign (the ACTUAL converting source)
    expect(finalLastNonDirect?.gclid).toBe('retarget-click-123');
    expect(finalLastNonDirect?.utm_campaign).toBe('retargeting');
    expect(finalLastNonDirect?.channel).toBe('google_ads');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Scenario 9: Landing Page Tracking
  // ═══════════════════════════════════════════════════════════════════════════
  
  test('Scenario 9: landing_page is captured correctly', async ({ page }) => {
    await visitWithAttribution(page, '/cost-calculator', {
      gclid: 'landing-test',
      utm_source: 'google',
      utm_medium: 'cpc',
    });
    
    const lastNonDirect = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(lastNonDirect?.landing_page).toContain('/cost-calculator');
    expect(lastNonDirect?.landing_page).toContain('gclid=landing-test');
  });
});

test.describe('Attribution System - Channel Classification', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAttribution(page);
  });

  test('Google Ads channel classification', async ({ page }) => {
    await visitWithAttribution(page, '/', { gclid: 'test' });
    const data = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(data?.channel).toBe('google_ads');
  });

  test('Meta Ads channel classification', async ({ page }) => {
    await visitWithAttribution(page, '/', { fbclid: 'test' });
    const data = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(data?.channel).toBe('meta_ads');
  });

  test('Microsoft Ads channel classification', async ({ page }) => {
    await visitWithAttribution(page, '/', { msclkid: 'test' });
    const data = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(data?.channel).toBe('microsoft_ads');
  });

  test('Email channel classification', async ({ page }) => {
    await visitWithAttribution(page, '/', { utm_source: 'mailchimp', utm_medium: 'email' });
    const data = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(data?.channel).toBe('email');
  });

  test('Organic search channel classification', async ({ page }) => {
    await visitWithAttribution(page, '/', { utm_source: 'google', utm_medium: 'organic' });
    const data = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(data?.channel).toBe('organic_search');
  });

  test('Direct channel for no params', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const data = await getAttributionTier(page, LAST_TOUCH_KEY);
    expect(data?.channel).toBe('direct');
  });
});

test.describe('Attribution System - Edge Cases', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAttribution(page);
  });

  test('Empty localStorage initializes correctly', async ({ page }) => {
    // Clear and reload
    await clearAttribution(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // All three tiers should have data after page load
    const firstTouch = await getAttributionTier(page, FIRST_TOUCH_KEY);
    const lastTouch = await getAttributionTier(page, LAST_TOUCH_KEY);
    
    expect(firstTouch).not.toBeNull();
    expect(lastTouch).not.toBeNull();
    expect(firstTouch?.channel).toBe('direct');
    expect(lastTouch?.channel).toBe('direct');
  });

  test('Handles malformed localStorage gracefully', async ({ page }) => {
    // Set malformed data
    await page.evaluate(({ first, last, nonDirect }) => {
      localStorage.setItem(first, 'not-valid-json');
      localStorage.setItem(last, '{broken');
      localStorage.setItem(nonDirect, '');
    }, { first: FIRST_TOUCH_KEY, last: LAST_TOUCH_KEY, nonDirect: LAST_NON_DIRECT_KEY });
    
    // Page should still load without errors
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should not throw, page should be usable
    await expect(page.locator('body')).toBeVisible();
  });

  test('Attribution survives browser refresh', async ({ page }) => {
    await visitWithAttribution(page, '/', {
      gclid: 'persistence-test',
      utm_source: 'google',
      utm_medium: 'cpc',
    });
    
    // Hard refresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const lastNonDirect = await getAttributionTier(page, LAST_NON_DIRECT_KEY);
    expect(lastNonDirect?.gclid).toBe('persistence-test');
  });

  test('Multiple tabs share attribution', async ({ page, context }) => {
    // First tab: paid click
    await visitWithAttribution(page, '/', {
      gclid: 'tab-test',
      utm_source: 'google',
      utm_medium: 'cpc',
    });
    
    // Open second tab (same context = same localStorage)
    const page2 = await context.newPage();
    await page2.goto('/cost-calculator');
    await page2.waitForLoadState('networkidle');
    
    // Second tab should see the same attribution
    const lastNonDirect = await getAttributionTier(page2, LAST_NON_DIRECT_KEY);
    expect(lastNonDirect?.gclid).toBe('tab-test');
    
    await page2.close();
  });
});
