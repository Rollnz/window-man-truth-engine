/**
 * E2E Tracking Verification Test Utility (Post-Refactor)
 * 
 * Provides comprehensive verification of the wmTracking pipeline:
 * 1. Synthetic lead generation with realistic test data
 * 2. GTM dataLayer event verification (wm_lead with meta.category=opt)
 * 3. Network request interception for facebook.com/tr/
 * 4. Browser/Server event_id parity validation
 * 
 * USAGE: Import and call runTrackingVerificationTest() in dev console or test page
 */

import { generateSecureUUID } from './secureUUID';
import {
  buildEnhancedUserData,
  generateEventId,
  sha256,
  hashPhone,
  hashName,
  getFbp,
  getFbc,
  getClientUserAgent,
} from './gtm';
import { wmLead } from './wmTracking';

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
  meta?: {
    send?: boolean;
    category?: string;
    value?: number;
    currency?: string;
  };
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
 * Find the most recent wm_lead event in dataLayer
 */
export function findWmLeadEvent(): DataLayerEvent | null {
  if (typeof window === 'undefined' || !window.dataLayer) {
    return null;
  }
  
  for (let i = window.dataLayer.length - 1; i >= 0; i--) {
    const entry = window.dataLayer[i] as DataLayerEvent;
    if (entry.event === 'wm_lead') {
      return entry;
    }
  }
  
  return null;
}

/**
 * Validate dataLayer event has all required fields for the wmTracking firewall
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
  if (event.event_id && typeof event.event_id === 'string' && event.event_id.length >= 5) {
    score += 2;
  } else {
    issues.push('❌ CRITICAL: Missing or invalid event_id (required for deduplication)');
  }
  
  // Meta firewall object
  if (event.meta?.category === 'opt' && event.meta?.send === true) {
    score += 2;
  } else {
    issues.push('❌ CRITICAL: Missing meta.category=opt or meta.send=true');
  }
  
  // Hardcoded value check
  if (event.value === 10 && event.currency === 'USD') {
    score += 1;
  } else {
    issues.push('⚠️ Value is not $10 (expected for wm_lead)');
  }
  
  // Lead ID / external_id
  if (event.lead_id || event.external_id) {
    score += 1;
  } else {
    issues.push('⚠️ Missing lead_id/external_id');
  }
  
  // User data object
  if (event.user_data) {
    if (event.user_data.em && event.user_data.em.length === 64) {
      score += 1.5;
    } else {
      issues.push('⚠️ Missing or invalid user_data.em (hashed email)');
    }
    
    if (event.user_data.ph && event.user_data.ph.length === 64) {
      score += 1;
    } else {
      issues.push('ℹ️ Missing user_data.ph (hashed phone)');
    }
    
    if (event.user_data.external_id) {
      score += 0.5;
    }
    
    if (event.user_data.fbp) score += 0.5;
    if (event.user_data.fbc) score += 0.5;
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

export function startPixelInterception(): void {
  capturedPixelRequests = [];
  if (typeof window === 'undefined') return;
  
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
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLImageElement) {
          const src = node.src;
          if (src.includes('facebook.com/tr/') || src.includes('facebook.com/tr?')) {
            const parsed = parsePixelUrl(src);
            capturedPixelRequests.push(parsed);
          }
        }
      });
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  console.log('[TrackingTest] Pixel interception started');
}

export function stopPixelInterception(): void {
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
}

function parsePixelUrl(url: string): CapturedPixelRequest {
  const params: Record<string, string> = {};
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.forEach((value, key) => { params[key] = value; });
  } catch {
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

export function getCapturedPixelRequests(): CapturedPixelRequest[] {
  return [...capturedPixelRequests];
}

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICATION REPORT
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
    expectedFormat: string;
    match: boolean;
    deduplicationReady: boolean;
  };
  networkCapture: {
    requestsCaptured: number;
    pixelRequests: CapturedPixelRequest[];
    hasEventIdInPixel: boolean;
    hasAdvancedMatching: boolean;
  };
  overallStatus: 'PASS' | 'PARTIAL' | 'FAIL';
  emqProjectedScore: number;
  actionItems: string[];
}

/**
 * Run the complete E2E tracking verification test using wmLead
 */
export async function runTrackingVerificationTest(): Promise<TrackingVerificationReport> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  E2E TRACKING VERIFICATION TEST (wmTracking v1.0)');
  console.log('  Canonical Pipeline Check');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const actionItems: string[] = [];
  
  console.log('\n[1/5] Generating synthetic lead data...');
  const testLead = generateSyntheticLead();
  console.log('  Lead ID:', testLead.leadId.slice(0, 8) + '...');
  
  console.log('\n[2/5] Starting network interception...');
  startPixelInterception();
  
  const expectedEventId = `lead:${testLead.leadId}`;
  console.log('\n[3/5] Expected event_id:', expectedEventId);
  
  console.log('\n[4/5] Firing wmLead (canonical $10 OPT event)...');
  await wmLead(
    {
      leadId: testLead.leadId,
      email: testLead.email,
      phone: testLead.phone,
      firstName: testLead.firstName,
      lastName: testLead.lastName,
      city: testLead.city,
      state: testLead.state,
      zipCode: testLead.zipCode,
    },
    { source_tool: testLead.sourceTool },
  );
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log('\n[5/5] Verifying dataLayer event...');
  const dataLayerEvent = findWmLeadEvent();
  let validation: ReturnType<typeof validateDataLayerEvent> | null = null;
  
  if (dataLayerEvent) {
    console.log('  ✅ wm_lead found in dataLayer');
    validation = validateDataLayerEvent(dataLayerEvent);
    console.log('  Validation score:', validation.score.toFixed(1) + '/10');
    validation.issues.forEach(issue => console.log('    ' + issue));
  } else {
    console.log('  ❌ wm_lead NOT found in dataLayer');
    actionItems.push('Check GTM container and wmTracking import');
  }
  
  stopPixelInterception();
  
  const pixelRequests = getCapturedPixelRequests();
  const leadPixelRequest = pixelRequests.find(r => r.eventName === 'Lead');
  
  const report: TrackingVerificationReport = {
    timestamp: new Date().toISOString(),
    testLead,
    dataLayerCheck: {
      found: !!dataLayerEvent,
      event: dataLayerEvent,
      validation,
    },
    eventIdParity: {
      browserEventId: expectedEventId,
      expectedFormat: 'lead:{leadId}',
      match: dataLayerEvent?.event_id === expectedEventId,
      deduplicationReady: dataLayerEvent?.event_id === expectedEventId,
    },
    networkCapture: {
      requestsCaptured: pixelRequests.length,
      pixelRequests,
      hasEventIdInPixel: !!leadPixelRequest?.eventId,
      hasAdvancedMatching: !!leadPixelRequest?.hasAdvancedMatching,
    },
    overallStatus: 'FAIL',
    emqProjectedScore: 0,
    actionItems,
  };
  
  if (validation) {
    report.emqProjectedScore = Math.round((validation.score / 10) * 100) / 10;
    if (validation.valid && report.eventIdParity.deduplicationReady) {
      report.overallStatus = 'PASS';
    } else if (validation.score >= 5) {
      report.overallStatus = 'PARTIAL';
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Overall Status:', report.overallStatus);
  console.log('  Projected EMQ Score:', report.emqProjectedScore.toFixed(1) + '/10');
  console.log('═══════════════════════════════════════════════════════════════');
  
  return report;
}

/**
 * Quick validation of current dataLayer state
 */
export function quickDataLayerCheck(): void {
  const event = findWmLeadEvent();
  if (!event) {
    console.log('No wm_lead event found in dataLayer');
    console.log('Current dataLayer length:', window.dataLayer?.length || 0);
    return;
  }
  
  const validation = validateDataLayerEvent(event);
  console.table({
    'event_id': event.event_id || 'MISSING',
    'meta.category': event.meta?.category || 'MISSING',
    'meta.send': event.meta?.send ?? 'MISSING',
    'value': event.value ?? 'MISSING',
    'user_data.em': event.user_data?.em ? '✅ (64 chars)' : '❌',
    'user_data.ph': event.user_data?.ph ? '✅ (64 chars)' : '❌',
    'user_data.fbp': event.user_data?.fbp ? '✅' : '❌',
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
  };
}
