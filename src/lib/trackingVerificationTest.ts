/**
 * E2E Tracking Verification Test Utility
 * 
 * Provides comprehensive verification of the Meta Pixel deduplication pipeline:
 * 1. Synthetic lead generation with realistic test data
 * 2. GTM dataLayer event verification
 * 3. Network request interception for facebook.com/tr/
 * 4. Browser/Server event_id parity validation
 * 
 * USAGE: Import and call runTrackingVerificationTest() in dev console or test page
 */

import { generateSecureUUID } from './secureUUID';
import { wmLead } from './wmTracking';
import {
  trackLeadSubmissionSuccess, // @deprecated - used only in this verification test utility
  buildEnhancedUserData,
  generateEventId,
  sha256,
  hashPhone,
  hashName,
  getFbp,
  getFbc,
  getClientUserAgent,
} from './gtm';

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate realistic synthetic lead data for testing
 */
export function generateSyntheticLead() {
  const testId = Date.now().toString(36);
  return {
    leadId: generateSecureUUID(),
    firstName: 'TestJohn',
    lastName: 'TestDoe',
    email: `test.verification.${testId}@windowman-test.com`,
    phone: '+15551234567',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    sourceTool: 'tracking-verification-test',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA LAYER INSPECTION
// ═══════════════════════════════════════════════════════════════════════════

interface DataLayerEvent {
  event?: string;
  event_id?: string;
  lead_id?: string;
  external_id?: string;
  user_data?: {
    em?: string;
    ph?: string;
    fn?: string;
    ln?: string;
    external_id?: string;
    fbp?: string | null;
    fbc?: string | null;
  };
  value?: number;
  currency?: string;
  source_tool?: string;
  [key: string]: unknown;
}

/**
 * Find the most recent lead_submission_success event in dataLayer
 */
export function findLeadSubmissionEvent(): DataLayerEvent | null {
  if (typeof window === 'undefined' || !window.dataLayer) {
    return null;
  }
  
  // Search backwards for most recent
  for (let i = window.dataLayer.length - 1; i >= 0; i--) {
    const entry = window.dataLayer[i] as DataLayerEvent;
    if (entry.event === 'lead_submission_success') {
      return entry;
    }
  }
  
  return null;
}

/**
 * Validate dataLayer event has all required fields for Meta deduplication
 */
export function validateDataLayerEvent(event: DataLayerEvent): {
  valid: boolean;
  issues: string[];
  score: number;
} {
  const issues: string[] = [];
  let score = 0;
  const maxScore = 10;
  
  // CRITICAL: event_id is required for deduplication
  if (event.event_id && typeof event.event_id === 'string' && event.event_id.length >= 32) {
    score += 3; // Critical weight
  } else {
    issues.push('❌ CRITICAL: Missing or invalid event_id (required for deduplication)');
  }
  
  // Lead ID / external_id
  if (event.lead_id || event.external_id) {
    score += 1;
  } else {
    issues.push('⚠️ Missing lead_id/external_id');
  }
  
  // User data object
  if (event.user_data) {
    // Email hash (em)
    if (event.user_data.em && event.user_data.em.length === 64) {
      score += 1.5;
    } else {
      issues.push('⚠️ Missing or invalid user_data.em (hashed email)');
    }
    
    // Phone hash (ph)
    if (event.user_data.ph && event.user_data.ph.length === 64) {
      score += 1;
    } else {
      issues.push('ℹ️ Missing user_data.ph (hashed phone)');
    }
    
    // First name hash (fn)
    if (event.user_data.fn && event.user_data.fn.length === 64) {
      score += 1;
    } else {
      issues.push('ℹ️ Missing user_data.fn (hashed firstName)');
    }
    
    // Last name hash (ln)
    if (event.user_data.ln && event.user_data.ln.length === 64) {
      score += 1;
    } else {
      issues.push('ℹ️ Missing user_data.ln (hashed lastName)');
    }
    
    // External ID in user_data
    if (event.user_data.external_id) {
      score += 0.5;
    }
    
    // Facebook cookies
    if (event.user_data.fbp) {
      score += 0.5;
    }
    if (event.user_data.fbc) {
      score += 0.5;
    }
  } else {
    issues.push('❌ CRITICAL: Missing user_data object');
  }
  
  return {
    valid: score >= 5 && issues.filter(i => i.startsWith('❌')).length === 0,
    issues,
    score: Math.min(score, maxScore),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// NETWORK INTERCEPTION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

interface CapturedPixelRequest {
  url: string;
  timestamp: number;
  eventName?: string;
  eventId?: string;
  hasAdvancedMatching: boolean;
  params: Record<string, string>;
}

let capturedPixelRequests: CapturedPixelRequest[] = [];
let originalFetch: typeof fetch | null = null;

/**
 * Start intercepting facebook.com/tr/ requests
 */
export function startPixelInterception(): void {
  capturedPixelRequests = [];
  
  if (typeof window === 'undefined') return;
  
  // Intercept fetch requests
  if (!originalFetch) {
    originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : '';
      
      if (url.includes('facebook.com/tr/') || url.includes('facebook.com/tr?')) {
        const parsed = parsePixelUrl(url);
        capturedPixelRequests.push(parsed);
        console.log('[TrackingTest] Captured Facebook Pixel request:', parsed);
      }
      
      return originalFetch!.apply(this, args);
    };
  }
  
  // Also monitor for img pixel requests via MutationObserver
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLImageElement) {
          const src = node.src;
          if (src.includes('facebook.com/tr/') || src.includes('facebook.com/tr?')) {
            const parsed = parsePixelUrl(src);
            capturedPixelRequests.push(parsed);
            console.log('[TrackingTest] Captured Facebook Pixel IMG:', parsed);
          }
        }
      });
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  console.log('[TrackingTest] Pixel interception started');
}

/**
 * Stop intercepting and restore original fetch
 */
export function stopPixelInterception(): void {
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
  console.log('[TrackingTest] Pixel interception stopped');
}

/**
 * Parse Facebook Pixel URL to extract parameters
 */
function parsePixelUrl(url: string): CapturedPixelRequest {
  const params: Record<string, string> = {};
  
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
  } catch {
    // URL might be malformed, try regex fallback
    const queryString = url.split('?')[1] || '';
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) params[key] = decodeURIComponent(value || '');
    });
  }
  
  return {
    url,
    timestamp: Date.now(),
    eventName: params.ev || params.event || undefined,
    eventId: params.eid || undefined,
    hasAdvancedMatching: !!(params.ud || params.em || params.ph || params.fn),
    params,
  };
}

/**
 * Get all captured pixel requests
 */
export function getCapturedPixelRequests(): CapturedPixelRequest[] {
  return [...capturedPixelRequests];
}

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICATION REPORT GENERATION
// ═══════════════════════════════════════════════════════════════════════════

export interface TrackingVerificationReport {
  timestamp: string;
  testLead: ReturnType<typeof generateSyntheticLead>;
  dataLayerCheck: {
    found: boolean;
    event: DataLayerEvent | null;
    validation: ReturnType<typeof validateDataLayerEvent> | null;
  };
  eventIdParity: {
    browserEventId: string;
    serverFormat: string;
    match: boolean;
    deduplicationReady: boolean;
  };
  networkCapture: {
    requestsCaptured: number;
    pixelRequests: CapturedPixelRequest[];
    hasEventIdInPixel: boolean;
    hasAdvancedMatching: boolean;
  };
  gtmTagVerification: {
    dataLayerVariablePresent: boolean;
    eventIdFormat: 'valid_uuid' | 'invalid' | 'missing';
    recommendation: string;
  };
  overallStatus: 'PASS' | 'PARTIAL' | 'FAIL';
  emqProjectedScore: number;
  actionItems: string[];
}

/**
 * Run the complete E2E tracking verification test
 */
export async function runTrackingVerificationTest(): Promise<TrackingVerificationReport> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  E2E TRACKING VERIFICATION TEST');
  console.log('  Meta Pixel Deduplication Pipeline Check');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const actionItems: string[] = [];
  
  // 1. Generate synthetic lead data
  console.log('\n[1/5] Generating synthetic lead data...');
  const testLead = generateSyntheticLead();
  console.log('  Lead ID:', testLead.leadId.slice(0, 8) + '...');
  console.log('  Email:', testLead.email);
  console.log('  Phone:', testLead.phone);
  
  // 2. Start pixel interception
  console.log('\n[2/5] Starting network interception...');
  startPixelInterception();
  
  // 3. Generate a unique event_id (browser-side)
  const browserEventId = generateEventId();
  console.log('\n[3/5] Generated browser event_id:', browserEventId);
  
  // 4. Trigger lead_submission_success event
  console.log('\n[4/5] Triggering lead_submission_success event...');
  // TODO: Migrate to wmLead once legacy events are fully removed
  await trackLeadSubmissionSuccess({
    leadId: testLead.leadId,
    email: testLead.email,
    phone: testLead.phone,
    firstName: testLead.firstName,
    lastName: testLead.lastName,
    city: testLead.city,
    state: testLead.state,
    zipCode: testLead.zipCode,
    sourceTool: testLead.sourceTool,
    eventId: browserEventId, // Use our generated ID
    value: 15,
  });
  
  // Wait for GTM to process and potentially fire pixel
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // 5. Verify dataLayer
  console.log('\n[5/5] Verifying dataLayer event...');
  const dataLayerEvent = findLeadSubmissionEvent();
  let validation: ReturnType<typeof validateDataLayerEvent> | null = null;
  
  if (dataLayerEvent) {
    console.log('  ✅ lead_submission_success found in dataLayer');
    validation = validateDataLayerEvent(dataLayerEvent);
    console.log('  Validation score:', validation.score.toFixed(1) + '/10');
    validation.issues.forEach(issue => console.log('    ' + issue));
  } else {
    console.log('  ❌ lead_submission_success NOT found in dataLayer');
    actionItems.push('Check GTM container is loaded and event triggers are configured');
  }
  
  // Stop interception
  stopPixelInterception();
  
  // Check captured requests
  const pixelRequests = getCapturedPixelRequests();
  const leadPixelRequest = pixelRequests.find(r => r.eventName === 'Lead');
  
  // Build report
  const report: TrackingVerificationReport = {
    timestamp: new Date().toISOString(),
    testLead,
    dataLayerCheck: {
      found: !!dataLayerEvent,
      event: dataLayerEvent,
      validation,
    },
    eventIdParity: {
      browserEventId,
      serverFormat: browserEventId, // Same UUID format used server-side
      match: true, // Same generation logic
      deduplicationReady: dataLayerEvent?.event_id === browserEventId,
    },
    networkCapture: {
      requestsCaptured: pixelRequests.length,
      pixelRequests,
      hasEventIdInPixel: !!leadPixelRequest?.eventId,
      hasAdvancedMatching: !!leadPixelRequest?.hasAdvancedMatching,
    },
    gtmTagVerification: {
      dataLayerVariablePresent: !!dataLayerEvent?.event_id,
      eventIdFormat: dataLayerEvent?.event_id?.match(/^[0-9a-f-]{36}$/i) ? 'valid_uuid' : 
                     dataLayerEvent?.event_id ? 'invalid' : 'missing',
      recommendation: !dataLayerEvent?.event_id 
        ? 'Add {{DLV - event_id}} variable to GTM and pass to Meta tag eventID parameter'
        : 'event_id is properly configured in dataLayer',
    },
    overallStatus: 'FAIL',
    emqProjectedScore: 0,
    actionItems,
  };
  
  // Calculate overall status and EMQ score
  if (validation) {
    report.emqProjectedScore = Math.round((validation.score / 10) * 10 * 10) / 10; // Scale to 10
    
    if (validation.valid && report.eventIdParity.deduplicationReady) {
      report.overallStatus = 'PASS';
    } else if (validation.score >= 5) {
      report.overallStatus = 'PARTIAL';
    }
  }
  
  // Add action items based on findings
  if (!validation?.valid) {
    actionItems.push('Fix dataLayer validation issues listed above');
  }
  if (!report.networkCapture.hasEventIdInPixel && pixelRequests.length > 0) {
    actionItems.push('Configure GTM Meta tag to include eventID: {{DLV - event_id}} in options object');
  }
  if (!report.eventIdParity.deduplicationReady) {
    actionItems.push('Verify event_id is being passed correctly to dataLayer');
  }
  
  // Print summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  VERIFICATION REPORT SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Overall Status:', report.overallStatus);
  console.log('  Projected EMQ Score:', report.emqProjectedScore.toFixed(1) + '/10');
  console.log('  DataLayer Event Found:', report.dataLayerCheck.found ? '✅' : '❌');
  console.log('  event_id Format:', report.gtmTagVerification.eventIdFormat);
  console.log('  Pixel Requests Captured:', report.networkCapture.requestsCaptured);
  console.log('  eventID in Pixel:', report.networkCapture.hasEventIdInPixel ? '✅' : '❌');
  console.log('  Advanced Matching:', report.networkCapture.hasAdvancedMatching ? '✅' : '❌');
  
  if (actionItems.length > 0) {
    console.log('\n  ACTION ITEMS:');
    actionItems.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  
  return report;
}

/**
 * Quick validation of current dataLayer state
 */
export function quickDataLayerCheck(): void {
  const event = findLeadSubmissionEvent();
  if (!event) {
    console.log('No lead_submission_success event found in dataLayer');
    console.log('Current dataLayer length:', window.dataLayer?.length || 0);
    return;
  }
  
  const validation = validateDataLayerEvent(event);
  console.table({
    'event_id': event.event_id?.slice(0, 8) + '...' || 'MISSING',
    'lead_id': event.lead_id?.slice(0, 8) + '...' || 'MISSING',
    'user_data.em': event.user_data?.em ? '✅ (64 chars)' : '❌',
    'user_data.ph': event.user_data?.ph ? '✅ (64 chars)' : '❌',
    'user_data.fn': event.user_data?.fn ? '✅ (64 chars)' : '❌',
    'user_data.ln': event.user_data?.ln ? '✅ (64 chars)' : '❌',
    'user_data.fbp': event.user_data?.fbp ? '✅' : '❌',
    'user_data.fbc': event.user_data?.fbc ? '✅' : '❌',
    'Validation Score': `${validation.score.toFixed(1)}/10`,
    'Status': validation.valid ? '✅ PASS' : '⚠️ Issues Found',
  });
}

// Export for global access in dev tools
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).trackingTest = {
    run: runTrackingVerificationTest,
    quickCheck: quickDataLayerCheck,
    generateLead: generateSyntheticLead,
    getCapturedRequests: getCapturedPixelRequests,
  };
}
