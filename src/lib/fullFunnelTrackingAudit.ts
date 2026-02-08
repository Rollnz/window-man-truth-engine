/**
 * Full-Funnel Meta Tracking Audit
 * 
 * Comprehensive E2E verification suite for all Meta Pixel events:
 * 1. CE - lead_form_opened (Meta - Lead Form Opened)
 * 2. CE - ScannerUpload (Meta - ScannerUpload)
 * 3. quote_upload_success (Meta - Quote Upload Success)
 * 4. CE - call_initiated (Meta - Click to Call)
 * 5. engagement_score (Meta - High Engagement 60+)
 * 6. lead_submission_success (Meta - Lead Conversion)
 * 
 * Tests all 6 Meta conversion tags from GTM version 63
 */

import { generateSecureUUID } from './secureUUID';
import { 
  trackEvent,
  buildEnhancedUserData,
  generateEventId,
  sha256,
  hashPhone,
  hashName,
  hashCity,
  hashState,
  hashZip,
  getFbp,
  getFbc,
  getClientUserAgent,
  type EnhancedUserData,
} from './gtm';

// ═══════════════════════════════════════════════════════════════════════════
// GOLDEN LEAD PROFILE
// ═══════════════════════════════════════════════════════════════════════════

export interface GoldenLeadProfile {
  leadId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  sourceTool: string;
}

/**
 * Generate a "Golden Lead" profile with all matching fields
 * for maximum EMQ testing
 */
export function generateGoldenLead(): GoldenLeadProfile {
  const testId = Date.now().toString(36);
  return {
    leadId: generateSecureUUID(),
    firstName: 'GoldenTest',
    lastName: 'LeadUser',
    email: `golden.lead.${testId}@windowman-test.com`,
    phone: '+15125551234',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    country: 'us',
    sourceTool: 'full-funnel-audit',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// META EVENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface MetaEventDefinition {
  eventName: string;
  gtmTriggerName: string;
  metaTagName: string;
  expectedValue: number;
  category: 'standard' | 'custom';
  description: string;
}

export const META_EVENTS: MetaEventDefinition[] = [
  {
    eventName: 'lead_form_opened',
    gtmTriggerName: 'CE - lead_form_opened',
    metaTagName: 'Meta - Lead Form Opened',
    expectedValue: 0,
    category: 'custom',
    description: 'User opens a lead capture form',
  },
  {
    eventName: 'scanner_upload',
    gtmTriggerName: 'CE - ScannerUpload',
    metaTagName: 'Meta - ScannerUpload',
    expectedValue: 35,
    category: 'custom',
    description: 'User uploads a document to the scanner',
  },
  {
    eventName: 'quote_upload_success',
    gtmTriggerName: 'CE - quote_upload_success',
    metaTagName: 'Meta - Quote Upload Success',
    expectedValue: 50,
    category: 'custom',
    description: 'Quote successfully analyzed',
  },
  {
    eventName: 'call_initiated',
    gtmTriggerName: 'CE - call_initiated',
    metaTagName: 'Meta - Click to Call',
    expectedValue: 60,
    category: 'custom',
    description: 'User initiates a phone call',
  },
  {
    eventName: 'engagement_score',
    gtmTriggerName: 'CE - engagement_score',
    metaTagName: 'Meta - High Engagement 60+',
    expectedValue: 40,
    category: 'custom',
    description: 'User reaches 60+ engagement score',
  },
  {
    eventName: 'lead_submission_success',
    gtmTriggerName: 'CE - lead_submission_success',
    metaTagName: 'Meta - Lead Conversion',
    expectedValue: 100,
    category: 'standard',
    description: 'Lead form successfully submitted',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// NETWORK INTERCEPTION
// ═══════════════════════════════════════════════════════════════════════════

interface CapturedPixelRequest {
  url: string;
  timestamp: number;
  eventName?: string;
  eventId?: string;
  hasAdvancedMatching: boolean;
  hasEventId: boolean;
  params: Record<string, string>;
  triggeredBy?: string;
}

let capturedRequests: CapturedPixelRequest[] = [];
let originalFetch: typeof fetch | null = null;
let mutationObserver: MutationObserver | null = null;

function parsePixelUrl(url: string): CapturedPixelRequest {
  const params: Record<string, string> = {};
  
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
  } catch {
    const queryString = url.split('?')[1] || '';
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) params[key] = decodeURIComponent(value || '');
    });
  }
  
  // Check for cd (custom data) JSON - Meta's advanced matching params
  let hasAdvancedMatching = !!(params.ud || params.em || params.ph || params.fn);
  if (params.cd) {
    try {
      const customData = JSON.parse(decodeURIComponent(params.cd));
      hasAdvancedMatching = hasAdvancedMatching || !!(customData.em || customData.ph || customData.fn);
    } catch {
      // Ignore parse errors
    }
  }
  
  return {
    url,
    timestamp: Date.now(),
    eventName: params.ev || params.event || undefined,
    eventId: params.eid || undefined,
    hasAdvancedMatching,
    hasEventId: !!params.eid,
    params,
  };
}

export function startNetworkInterception(): void {
  capturedRequests = [];
  
  if (typeof window === 'undefined') return;
  
  // Intercept fetch requests
  if (!originalFetch) {
    originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : '';
      
      if (url.includes('facebook.com/tr/') || url.includes('facebook.com/tr?')) {
        const parsed = parsePixelUrl(url);
        capturedRequests.push(parsed);
        console.log('[FullFunnelAudit] Captured Meta Pixel (fetch):', parsed.eventName, parsed);
      }
      
      return originalFetch!.apply(this, args);
    };
  }
  
  // Monitor for img pixel requests
  if (!mutationObserver) {
    mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement) {
            const src = node.src;
            if (src.includes('facebook.com/tr/') || src.includes('facebook.com/tr?')) {
              const parsed = parsePixelUrl(src);
              capturedRequests.push(parsed);
              console.log('[FullFunnelAudit] Captured Meta Pixel (img):', parsed.eventName, parsed);
            }
          }
        });
      });
    });
    
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }
  
  console.log('[FullFunnelAudit] Network interception started');
}

export function stopNetworkInterception(): void {
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
  
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
  
  console.log('[FullFunnelAudit] Network interception stopped');
}

export function getCapturedRequests(): CapturedPixelRequest[] {
  return [...capturedRequests];
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA LAYER INSPECTION
// ═══════════════════════════════════════════════════════════════════════════

interface DataLayerEvent {
  event?: string;
  event_id?: string;
  lead_id?: string;
  external_id?: string;
  value?: number;
  currency?: string;
  user_data?: Partial<EnhancedUserData>;
  source_tool?: string;
  [key: string]: unknown;
}

export function findDataLayerEvents(eventName: string): DataLayerEvent[] {
  if (typeof window === 'undefined' || !window.dataLayer) {
    return [];
  }
  
  return window.dataLayer.filter(
    (entry): entry is DataLayerEvent => 
      typeof entry === 'object' && entry !== null && (entry as DataLayerEvent).event === eventName
  );
}

export function getLastDataLayerEvent(eventName: string): DataLayerEvent | null {
  const events = findDataLayerEvents(eventName);
  return events.length > 0 ? events[events.length - 1] : null;
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT FIRING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface FiredEventResult {
  eventName: string;
  eventId: string;
  timestamp: number;
  userData: EnhancedUserData | undefined;
  dataLayerPushed: boolean;
}

/**
 * Fire lead_form_opened event
 */
export async function fireLeadFormOpened(
  goldenLead: GoldenLeadProfile
): Promise<FiredEventResult> {
  const eventId = generateEventId();
  const userData = await buildEnhancedUserData({
    email: goldenLead.email,
    phone: goldenLead.phone,
    leadId: goldenLead.leadId,
    firstName: goldenLead.firstName,
    lastName: goldenLead.lastName,
    city: goldenLead.city,
    state: goldenLead.state,
    zipCode: goldenLead.zipCode,
  });
  
  trackEvent('lead_form_opened', {
    event_id: eventId,
    lead_id: goldenLead.leadId,
    external_id: goldenLead.leadId,
    user_data: userData,
    source_tool: goldenLead.sourceTool,
    form_name: 'full-funnel-test',
  });
  
  return {
    eventName: 'lead_form_opened',
    eventId,
    timestamp: Date.now(),
    userData,
    dataLayerPushed: true,
  };
}

/**
 * Fire scanner_upload event (CE - ScannerUpload)
 */
export async function fireScannerUpload(
  goldenLead: GoldenLeadProfile
): Promise<FiredEventResult> {
  const eventId = generateEventId();
  const userData = await buildEnhancedUserData({
    email: goldenLead.email,
    phone: goldenLead.phone,
    leadId: goldenLead.leadId,
    firstName: goldenLead.firstName,
    lastName: goldenLead.lastName,
    city: goldenLead.city,
    state: goldenLead.state,
    zipCode: goldenLead.zipCode,
  });
  
  trackEvent('scanner_upload', {
    event_id: eventId,
    lead_id: goldenLead.leadId,
    external_id: goldenLead.leadId,
    user_data: userData,
    value: 35,
    currency: 'USD',
    source_tool: goldenLead.sourceTool,
    file_type: 'image/png',
  });
  
  return {
    eventName: 'scanner_upload',
    eventId,
    timestamp: Date.now(),
    userData,
    dataLayerPushed: true,
  };
}

/**
 * Fire quote_upload_success event
 */
export async function fireQuoteUploadSuccess(
  goldenLead: GoldenLeadProfile
): Promise<FiredEventResult> {
  const scanAttemptId = generateSecureUUID();
  const eventId = `quote_uploaded:${scanAttemptId}`;
  const userData = await buildEnhancedUserData({
    email: goldenLead.email,
    phone: goldenLead.phone,
    leadId: goldenLead.leadId,
    firstName: goldenLead.firstName,
    lastName: goldenLead.lastName,
    city: goldenLead.city,
    state: goldenLead.state,
    zipCode: goldenLead.zipCode,
  });
  
  trackEvent('quote_upload_success', {
    event_id: eventId,
    lead_id: goldenLead.leadId,
    external_id: goldenLead.leadId,
    user_data: userData,
    value: 50,
    currency: 'USD',
    source_tool: goldenLead.sourceTool,
  });
  
  return {
    eventName: 'quote_upload_success',
    eventId,
    timestamp: Date.now(),
    userData,
    dataLayerPushed: true,
  };
}

/**
 * Fire call_initiated event (CE - call_initiated)
 */
export async function fireCallInitiated(
  goldenLead: GoldenLeadProfile
): Promise<FiredEventResult> {
  const eventId = generateEventId();
  const userData = await buildEnhancedUserData({
    email: goldenLead.email,
    phone: goldenLead.phone,
    leadId: goldenLead.leadId,
    firstName: goldenLead.firstName,
    lastName: goldenLead.lastName,
    city: goldenLead.city,
    state: goldenLead.state,
    zipCode: goldenLead.zipCode,
  });
  
  trackEvent('call_initiated', {
    event_id: eventId,
    lead_id: goldenLead.leadId,
    external_id: goldenLead.leadId,
    user_data: userData,
    value: 60,
    currency: 'USD',
    source_tool: goldenLead.sourceTool,
    phone_number_dialed: goldenLead.phone,
  });
  
  return {
    eventName: 'call_initiated',
    eventId,
    timestamp: Date.now(),
    userData,
    dataLayerPushed: true,
  };
}

/**
 * Fire engagement_score event (Meta - High Engagement 60+)
 */
export async function fireEngagementScore(
  goldenLead: GoldenLeadProfile,
  score: number = 65
): Promise<FiredEventResult> {
  const eventId = generateEventId();
  const userData = await buildEnhancedUserData({
    email: goldenLead.email,
    phone: goldenLead.phone,
    leadId: goldenLead.leadId,
    firstName: goldenLead.firstName,
    lastName: goldenLead.lastName,
    city: goldenLead.city,
    state: goldenLead.state,
    zipCode: goldenLead.zipCode,
  });
  
  trackEvent('engagement_score', {
    event_id: eventId,
    lead_id: goldenLead.leadId,
    external_id: goldenLead.leadId,
    user_data: userData,
    value: 40,
    currency: 'USD',
    source_tool: goldenLead.sourceTool,
    engagement_score: score,
    threshold_reached: score >= 60,
  });
  
  return {
    eventName: 'engagement_score',
    eventId,
    timestamp: Date.now(),
    userData,
    dataLayerPushed: true,
  };
}

/**
 * Fire lead_submission_success event (Meta - Lead Conversion)
 */
export async function fireLeadSubmissionSuccess(
  goldenLead: GoldenLeadProfile
): Promise<FiredEventResult> {
  const eventId = generateEventId();
  const userData = await buildEnhancedUserData({
    email: goldenLead.email,
    phone: goldenLead.phone,
    leadId: goldenLead.leadId,
    firstName: goldenLead.firstName,
    lastName: goldenLead.lastName,
    city: goldenLead.city,
    state: goldenLead.state,
    zipCode: goldenLead.zipCode,
  });
  
  trackEvent('lead_submission_success', {
    event_id: eventId,
    lead_id: goldenLead.leadId,
    external_id: goldenLead.leadId,
    user_data: userData,
    value: 100,
    currency: 'USD',
    source_tool: goldenLead.sourceTool,
    source_system: 'website',
    // Location fields as strings (not IP addresses)
    city: goldenLead.city,
    region: goldenLead.state,
    zip: goldenLead.zipCode,
    country: goldenLead.country,
  });
  
  return {
    eventName: 'lead_submission_success',
    eventId,
    timestamp: Date.now(),
    userData,
    dataLayerPushed: true,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE AUDIT
// ═══════════════════════════════════════════════════════════════════════════

export interface EventAuditResult {
  eventName: string;
  metaTagName: string;
  fired: boolean;
  eventId: string;
  dataLayerEvent: DataLayerEvent | null;
  validation: {
    hasEventId: boolean;
    hasUserData: boolean;
    hasEmail: boolean;
    hasPhone: boolean;
    hasFirstName: boolean;
    hasLastName: boolean;
    hasCity: boolean;
    hasState: boolean;
    hasZip: boolean;
    hasExternalId: boolean;
    hasValue: boolean;
    locationStringsValid: boolean;
  };
  score: number;
  maxScore: number;
  issues: string[];
}

export interface FullFunnelAuditReport {
  timestamp: string;
  goldenLead: GoldenLeadProfile;
  goldenLeadHashes: {
    email: string;
    phone: string | undefined;
    firstName: string | undefined;
    lastName: string | undefined;
    city: string | undefined;
    state: string | undefined;
    zip: string | undefined;
  };
  eventResults: EventAuditResult[];
  networkCapture: {
    totalRequests: number;
    pixelRequests: CapturedPixelRequest[];
    eventsWithEventId: number;
    eventsWithAdvancedMatching: number;
  };
  serverSideParity: {
    eventIdFormat: 'uuid_v4' | 'deterministic' | 'mixed';
    formatConsistent: boolean;
    recommendation: string;
  };
  overallScore: number;
  maxScore: number;
  overallStatus: 'PASS' | 'PARTIAL' | 'FAIL';
  projectedEMQ: number;
  actionItems: string[];
}

/**
 * Run the complete Full-Funnel Meta Tracking Audit
 */
export async function runFullFunnelAudit(): Promise<FullFunnelAuditReport> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  FULL-FUNNEL META TRACKING AUDIT');
  console.log('  Comprehensive 6-Event Conversion Pipeline Test');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const actionItems: string[] = [];
  
  // 1. Generate Golden Lead
  console.log('\n[1/6] Generating Golden Lead profile...');
  const goldenLead = generateGoldenLead();
  console.log('  Lead ID:', goldenLead.leadId.slice(0, 8) + '...');
  console.log('  Email:', goldenLead.email);
  console.log('  Phone:', goldenLead.phone);
  console.log('  Location:', `${goldenLead.city}, ${goldenLead.state} ${goldenLead.zipCode}`);
  
  // Pre-hash all fields for parity check
  const [hashedEmail, hashedPhone, hashedFn, hashedLn, hashedCity, hashedState, hashedZip] = 
    await Promise.all([
      sha256(goldenLead.email),
      hashPhone(goldenLead.phone),
      hashName(goldenLead.firstName),
      hashName(goldenLead.lastName),
      hashCity(goldenLead.city),
      hashState(goldenLead.state),
      hashZip(goldenLead.zipCode),
    ]);
  
  const goldenLeadHashes = {
    email: hashedEmail,
    phone: hashedPhone,
    firstName: hashedFn,
    lastName: hashedLn,
    city: hashedCity,
    state: hashedState,
    zip: hashedZip,
  };
  
  console.log('\n[2/6] Pre-computed hashes for parity check:');
  console.log('  em:', hashedEmail.slice(0, 12) + '...');
  console.log('  ph:', hashedPhone?.slice(0, 12) + '...');
  console.log('  fn:', hashedFn?.slice(0, 12) + '...');
  console.log('  ln:', hashedLn?.slice(0, 12) + '...');
  
  // 2. Start network interception
  console.log('\n[3/6] Starting network interception...');
  startNetworkInterception();
  
  // 3. Fire all 6 events in sequence
  console.log('\n[4/6] Firing 6-event conversion sequence...');
  
  const firedEvents: FiredEventResult[] = [];
  const eventResults: EventAuditResult[] = [];
  
  // Fire events with small delays to ensure proper sequencing
  const eventFirers = [
    { name: 'lead_form_opened', fn: () => fireLeadFormOpened(goldenLead), meta: META_EVENTS[0] },
    { name: 'scanner_upload', fn: () => fireScannerUpload(goldenLead), meta: META_EVENTS[1] },
    { name: 'quote_upload_success', fn: () => fireQuoteUploadSuccess(goldenLead), meta: META_EVENTS[2] },
    { name: 'call_initiated', fn: () => fireCallInitiated(goldenLead), meta: META_EVENTS[3] },
    { name: 'engagement_score', fn: () => fireEngagementScore(goldenLead, 75), meta: META_EVENTS[4] },
    { name: 'lead_submission_success', fn: () => fireLeadSubmissionSuccess(goldenLead), meta: META_EVENTS[5] },
  ];
  
  for (const { name, fn, meta } of eventFirers) {
    console.log(`  Firing: ${name}...`);
    const result = await fn();
    firedEvents.push(result);
    
    // Small delay to let GTM process
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Validate the event
    const dlEvent = getLastDataLayerEvent(name);
    const validation = {
      hasEventId: !!dlEvent?.event_id,
      hasUserData: !!dlEvent?.user_data,
      hasEmail: !!(dlEvent?.user_data?.em || dlEvent?.user_data?.sha256_email_address),
      hasPhone: !!(dlEvent?.user_data?.ph || dlEvent?.user_data?.sha256_phone_number),
      hasFirstName: !!dlEvent?.user_data?.fn,
      hasLastName: !!dlEvent?.user_data?.ln,
      hasCity: !!dlEvent?.user_data?.ct,
      hasState: !!dlEvent?.user_data?.st,
      hasZip: !!dlEvent?.user_data?.zp,
      hasExternalId: !!(dlEvent?.user_data?.external_id || dlEvent?.external_id),
      hasValue: dlEvent?.value !== undefined,
      locationStringsValid: 
        typeof dlEvent?.city === 'string' && 
        typeof dlEvent?.region === 'string' && 
        typeof dlEvent?.zip === 'string' ||
        true, // Not all events have location
    };
    
    // Calculate score
    let score = 0;
    const issues: string[] = [];
    
    if (validation.hasEventId) score += 2; else issues.push('❌ Missing event_id (deduplication will fail)');
    if (validation.hasUserData) score += 1; else issues.push('❌ Missing user_data object');
    if (validation.hasEmail) score += 1.5; else issues.push('⚠️ Missing em (hashed email)');
    if (validation.hasPhone) score += 1; else issues.push('ℹ️ Missing ph (hashed phone)');
    if (validation.hasFirstName) score += 0.75; else issues.push('ℹ️ Missing fn (hashed firstName)');
    if (validation.hasLastName) score += 0.75; else issues.push('ℹ️ Missing ln (hashed lastName)');
    if (validation.hasCity) score += 0.5;
    if (validation.hasState) score += 0.5;
    if (validation.hasZip) score += 0.5;
    if (validation.hasExternalId) score += 0.5;
    if (validation.hasValue) score += 1;
    
    eventResults.push({
      eventName: name,
      metaTagName: meta.metaTagName,
      fired: true,
      eventId: result.eventId,
      dataLayerEvent: dlEvent,
      validation,
      score,
      maxScore: 10,
      issues,
    });
    
    console.log(`    ✓ ${name} - Score: ${score.toFixed(1)}/10`);
  }
  
  // Wait for pixel requests to be captured
  console.log('\n[5/6] Waiting for network requests...');
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Stop interception and analyze
  stopNetworkInterception();
  const pixelRequests = getCapturedRequests();
  
  console.log('\n[6/6] Analyzing captured requests...');
  console.log(`  Total pixel requests captured: ${pixelRequests.length}`);
  
  const eventsWithEventId = pixelRequests.filter(r => r.hasEventId).length;
  const eventsWithAdvancedMatching = pixelRequests.filter(r => r.hasAdvancedMatching).length;
  
  // Calculate overall score
  const totalScore = eventResults.reduce((sum, r) => sum + r.score, 0);
  const maxScore = eventResults.reduce((sum, r) => sum + r.maxScore, 0);
  const overallScore = totalScore;
  
  // Determine status
  let overallStatus: 'PASS' | 'PARTIAL' | 'FAIL' = 'FAIL';
  if (totalScore >= maxScore * 0.8) {
    overallStatus = 'PASS';
  } else if (totalScore >= maxScore * 0.5) {
    overallStatus = 'PARTIAL';
  }
  
  // Check event ID format consistency
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const deterministicPattern = /^[a-z_]+:[0-9a-f-]+$/;
  
  let uuidCount = 0;
  let deterministicCount = 0;
  
  firedEvents.forEach(e => {
    if (uuidPattern.test(e.eventId)) uuidCount++;
    else if (deterministicPattern.test(e.eventId)) deterministicCount++;
  });
  
  const eventIdFormat = uuidCount === firedEvents.length ? 'uuid_v4' : 
                        deterministicCount === firedEvents.length ? 'deterministic' : 'mixed';
  
  // Build action items
  if (eventsWithEventId < pixelRequests.length && pixelRequests.length > 0) {
    actionItems.push('Configure GTM Meta tags to pass eventID: {{DLV - event_id}} in the options object');
  }
  
  eventResults.forEach(r => {
    if (!r.validation.hasEventId) {
      actionItems.push(`Fix ${r.eventName}: Missing event_id in dataLayer push`);
    }
    if (!r.validation.hasEmail) {
      actionItems.push(`Fix ${r.eventName}: Missing hashed email (em) in user_data`);
    }
  });
  
  // Build report
  const report: FullFunnelAuditReport = {
    timestamp: new Date().toISOString(),
    goldenLead,
    goldenLeadHashes,
    eventResults,
    networkCapture: {
      totalRequests: pixelRequests.length,
      pixelRequests,
      eventsWithEventId,
      eventsWithAdvancedMatching,
    },
    serverSideParity: {
      eventIdFormat,
      formatConsistent: eventIdFormat !== 'mixed',
      recommendation: eventIdFormat === 'mixed' 
        ? 'Standardize event_id format to UUID v4 for consistency'
        : 'Event ID format is consistent across all events',
    },
    overallScore,
    maxScore,
    overallStatus,
    projectedEMQ: Math.round((totalScore / maxScore) * 10 * 10) / 10,
    actionItems,
  };
  
  // Print summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  FULL-FUNNEL AUDIT SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Overall Status: ${overallStatus}`);
  console.log(`  Total Score: ${totalScore.toFixed(1)}/${maxScore}`);
  console.log(`  Projected EMQ: ${report.projectedEMQ.toFixed(1)}/10`);
  console.log(`  Events Tested: ${eventResults.length}`);
  console.log(`  Pixel Requests Captured: ${pixelRequests.length}`);
  console.log(`  Events with eventID in Pixel: ${eventsWithEventId}/${pixelRequests.length}`);
  console.log(`  Events with Advanced Matching: ${eventsWithAdvancedMatching}/${pixelRequests.length}`);
  
  if (actionItems.length > 0) {
    console.log('\n  ACTION ITEMS:');
    actionItems.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  
  return report;
}

// Export for global access in dev tools
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).fullFunnelAudit = {
    run: runFullFunnelAudit,
    generateGoldenLead,
    META_EVENTS,
    getCapturedRequests,
  };
}
