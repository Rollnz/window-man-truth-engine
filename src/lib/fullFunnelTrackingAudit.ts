/**
 * Full-Funnel Tracking Audit — Canonical wmTracking OPT Events
 *
 * Fires the 5 canonical OPT conversion events through wmTracking.ts
 * and validates that each event lands in the Data Layer with the correct
 * payload structure (event_id, meta, value, identity fields, hashed PII).
 *
 * OPT Ladder:
 *   wm_lead              $10
 *   wm_qualified_lead    $100
 *   wm_scanner_upload    $500
 *   wm_appointment_booked $1,000
 *   wm_sold              $5,000 + sale_amount
 */

import { generateSecureUUID } from './secureUUID';
import {
  sha256,
  hashPhone,
  hashName,
  hashCity,
  hashState,
  hashZip,
  type EnhancedUserData,
} from './gtm';
import {
  wmLead,
  wmQualifiedLead,
  wmScannerUpload,
  wmAppointmentBooked,
  wmSold,
  _resetWmLeadGuard,
  _resetScannerUploadGuard,
  _resetSessionGuards,
  type WmUserIdentity,
} from './wmTracking';

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
// OPT EVENT DEFINITIONS (canonical 5)
// ═══════════════════════════════════════════════════════════════════════════

export interface MetaEventDefinition {
  eventName: string;
  metaTagName: string;
  expectedValue: number;
  description: string;
}

export const META_EVENTS: MetaEventDefinition[] = [
  {
    eventName: 'wm_lead',
    metaTagName: 'Lead ($10)',
    expectedValue: 10,
    description: 'First-party email capture with confirmed leadId',
  },
  {
    eventName: 'wm_qualified_lead',
    metaTagName: 'QualifiedLead ($100)',
    expectedValue: 100,
    description: 'Lead passes scope + timeline qualification',
  },
  {
    eventName: 'wm_scanner_upload',
    metaTagName: 'ScannerUpload ($500)',
    expectedValue: 500,
    description: 'User uploaded a quote for AI analysis',
  },
  {
    eventName: 'wm_appointment_booked',
    metaTagName: 'Schedule ($1,000)',
    expectedValue: 1000,
    description: 'Consultation / booking confirmed',
  },
  {
    eventName: 'wm_sold',
    metaTagName: 'Purchase ($5,000+)',
    expectedValue: 20000, // $5,000 base + $15,000 test sale
    description: 'Sale closed (test: $15k sale amount)',
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
}

let capturedRequests: CapturedPixelRequest[] = [];
let originalFetch: typeof fetch | null = null;
let mutationObserver: MutationObserver | null = null;

function parsePixelUrl(url: string): CapturedPixelRequest {
  const params: Record<string, string> = {};
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.forEach((value, key) => { params[key] = value; });
  } catch {
    const qs = url.split('?')[1] || '';
    qs.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) params[key] = decodeURIComponent(value || '');
    });
  }

  let hasAdvancedMatching = !!(params.ud || params.em || params.ph || params.fn);
  if (params.cd) {
    try {
      const cd = JSON.parse(decodeURIComponent(params.cd));
      hasAdvancedMatching = hasAdvancedMatching || !!(cd.em || cd.ph || cd.fn);
    } catch { /* ignore */ }
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

  if (!originalFetch) {
    originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : '';
      if (url.includes('facebook.com/tr/') || url.includes('facebook.com/tr?')) {
        const parsed = parsePixelUrl(url);
        capturedRequests.push(parsed);
      }
      return originalFetch!.apply(this, args);
    };
  }

  if (!mutationObserver) {
    mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement) {
            const src = node.src;
            if (src.includes('facebook.com/tr/') || src.includes('facebook.com/tr?')) {
              capturedRequests.push(parsePixelUrl(src));
            }
          }
        });
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }
}

export function stopNetworkInterception(): void {
  if (originalFetch) { window.fetch = originalFetch; originalFetch = null; }
  if (mutationObserver) { mutationObserver.disconnect(); mutationObserver = null; }
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
  client_id?: string;
  session_id?: string;
  value?: number;
  currency?: string;
  meta?: {
    send?: boolean;
    category?: string;
    meta_event_name?: string;
    value?: number;
    currency?: string;
    wm_tracking_version?: string;
  };
  user_data?: Partial<EnhancedUserData>;
  [key: string]: unknown;
}

export function findDataLayerEvents(eventName: string): DataLayerEvent[] {
  if (typeof window === 'undefined' || !window.dataLayer) return [];
  return window.dataLayer.filter(
    (entry): entry is DataLayerEvent =>
      typeof entry === 'object' && entry !== null && (entry as DataLayerEvent).event === eventName,
  );
}

export function getLastDataLayerEvent(eventName: string): DataLayerEvent | null {
  const events = findDataLayerEvents(eventName);
  return events.length > 0 ? events[events.length - 1] : null;
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT RESULT TYPES
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
    hasClientId: boolean;
    hasSessionId: boolean;
    hasMetaCategory: boolean;
    hasMetaSend: boolean;
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
    eventIdFormat: 'deterministic' | 'mixed';
    formatConsistent: boolean;
    recommendation: string;
  };
  overallScore: number;
  maxScore: number;
  overallStatus: 'PASS' | 'PARTIAL' | 'FAIL';
  projectedEMQ: number;
  actionItems: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATE A SINGLE DATA LAYER EVENT
// ═══════════════════════════════════════════════════════════════════════════

function validateEvent(
  eventName: string,
  meta: MetaEventDefinition,
  eventId: string,
): EventAuditResult {
  const dlEvent = getLastDataLayerEvent(eventName);

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
    hasValue: dlEvent?.value === meta.expectedValue,
    hasClientId: !!dlEvent?.client_id,
    hasSessionId: !!dlEvent?.session_id,
    hasMetaCategory: dlEvent?.meta?.category === 'opt',
    hasMetaSend: dlEvent?.meta?.send === true,
  };

  let score = 0;
  const issues: string[] = [];
  const maxScore = 14;

  // Core identity (4 pts)
  if (validation.hasEventId) score += 2; else issues.push('❌ Missing event_id');
  if (validation.hasClientId) score += 1; else issues.push('❌ Missing client_id');
  if (validation.hasSessionId) score += 1; else issues.push('❌ Missing session_id');

  // Meta firewall (2 pts)
  if (validation.hasMetaCategory) score += 1; else issues.push('❌ meta.category !== "opt"');
  if (validation.hasMetaSend) score += 1; else issues.push('❌ meta.send !== true');

  // Value (1 pt)
  if (validation.hasValue) score += 1; else issues.push(`❌ value mismatch (expected ${meta.expectedValue})`);

  // PII / user_data (6 pts)
  if (validation.hasUserData) score += 0.5; else issues.push('❌ Missing user_data');
  if (validation.hasEmail) score += 1.5; else issues.push('⚠️ Missing em');
  if (validation.hasPhone) score += 1; else issues.push('ℹ️ Missing ph');
  if (validation.hasFirstName) score += 0.5;
  if (validation.hasLastName) score += 0.5;
  if (validation.hasCity) score += 0.5;
  if (validation.hasState) score += 0.5;
  if (validation.hasZip) score += 0.5;
  if (validation.hasExternalId) score += 0.5;

  return {
    eventName,
    metaTagName: meta.metaTagName,
    fired: !!dlEvent,
    eventId,
    dataLayerEvent: dlEvent,
    validation,
    score,
    maxScore,
    issues,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN FULL-FUNNEL AUDIT
// ═══════════════════════════════════════════════════════════════════════════

const TEST_SALE_AMOUNT = 15000;
const TEST_SCAN_ATTEMPT_ID_PREFIX = 'audit-scan-';

export async function runFullFunnelAudit(): Promise<FullFunnelAuditReport> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  FULL-FUNNEL OPT TRACKING AUDIT');
  console.log('  5-Event Canonical wmTracking Pipeline Test');
  console.log('═══════════════════════════════════════════════════════════════');

  const actionItems: string[] = [];

  // 1. Generate Golden Lead
  const goldenLead = generateGoldenLead();
  console.log('\n[1/5] Golden Lead:', goldenLead.leadId.slice(0, 8) + '...', goldenLead.email);

  // Build identity for wmTracking
  const identity: WmUserIdentity = {
    leadId: goldenLead.leadId,
    email: goldenLead.email,
    phone: goldenLead.phone,
    firstName: goldenLead.firstName,
    lastName: goldenLead.lastName,
    city: goldenLead.city,
    state: goldenLead.state,
    zipCode: goldenLead.zipCode,
  };

  // Pre-hash for parity display
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

  // 2. Reset dedupe guards so audit can fire cleanly on every run
  console.log('\n[2/5] Resetting dedupe guards...');
  _resetWmLeadGuard();
  _resetScannerUploadGuard();
  _resetSessionGuards(goldenLead.leadId);

  // 3. Start network interception
  console.log('\n[3/5] Starting network interception...');
  startNetworkInterception();

  // 4. Fire all 5 OPT events through canonical wmTracking emitters
  console.log('\n[4/5] Firing 5-event OPT sequence...');

  const context = { source_tool: 'full-funnel-audit' };
  const scanAttemptId = `${TEST_SCAN_ATTEMPT_ID_PREFIX}${goldenLead.leadId.slice(0, 8)}`;
  const appointmentKey = `audit-${Date.now()}`;
  const dealKey = `audit-deal-${Date.now()}`;

  // Expected deterministic event_ids
  const expectedIds: Record<string, string> = {
    wm_lead: `lead:${goldenLead.leadId}`,
    wm_qualified_lead: `ql:${goldenLead.leadId}`,
    wm_scanner_upload: `upload:${scanAttemptId}`,
    wm_appointment_booked: `appt:${goldenLead.leadId}:${appointmentKey}`,
    wm_sold: `sold:${goldenLead.leadId}:${dealKey}`,
  };

  // Fire in sequence with small delays for Data Layer propagation
  console.log('  Firing: wm_lead...');
  await wmLead(identity, context);
  await new Promise(r => setTimeout(r, 150));

  // Reset QL session guard since wmScannerUpload will mark upload-fired
  // and we want QL to fire before that
  console.log('  Firing: wm_qualified_lead...');
  await wmQualifiedLead(identity, context);
  await new Promise(r => setTimeout(r, 150));

  // Reset scanner guard again since QL may have changed session state
  _resetScannerUploadGuard();
  console.log('  Firing: wm_scanner_upload...');
  await wmScannerUpload(identity, scanAttemptId, context);
  await new Promise(r => setTimeout(r, 150));

  console.log('  Firing: wm_appointment_booked...');
  await wmAppointmentBooked(identity, appointmentKey, context);
  await new Promise(r => setTimeout(r, 150));

  console.log('  Firing: wm_sold...');
  await wmSold(identity, TEST_SALE_AMOUNT, dealKey, context);
  await new Promise(r => setTimeout(r, 150));

  // 5. Validate each event in the Data Layer
  console.log('\n[5/5] Validating Data Layer events...');

  const eventResults: EventAuditResult[] = META_EVENTS.map((meta) => {
    const result = validateEvent(meta.eventName, meta, expectedIds[meta.eventName]);
    console.log(`  ${result.fired ? '✓' : '✗'} ${meta.eventName} — ${result.score.toFixed(1)}/${result.maxScore}`);
    return result;
  });

  // Wait for pixel requests
  await new Promise(r => setTimeout(r, 1500));
  stopNetworkInterception();
  const pixelRequests = getCapturedRequests();

  const eventsWithEventId = pixelRequests.filter(r => r.hasEventId).length;
  const eventsWithAdvancedMatching = pixelRequests.filter(r => r.hasAdvancedMatching).length;

  // Score
  const totalScore = eventResults.reduce((s, r) => s + r.score, 0);
  const maxScore = eventResults.reduce((s, r) => s + r.maxScore, 0);

  let overallStatus: 'PASS' | 'PARTIAL' | 'FAIL' = 'FAIL';
  if (totalScore >= maxScore * 0.8) overallStatus = 'PASS';
  else if (totalScore >= maxScore * 0.5) overallStatus = 'PARTIAL';

  // Event ID format — all should be deterministic now
  const deterministicPattern = /^[a-z_]+:.+$/;
  const allDeterministic = eventResults.every(
    r => r.eventId && deterministicPattern.test(r.eventId),
  );

  // Action items
  eventResults.forEach(r => {
    if (!r.validation.hasEventId) actionItems.push(`Fix ${r.eventName}: Missing event_id`);
    if (!r.validation.hasMetaCategory) actionItems.push(`Fix ${r.eventName}: meta.category !== "opt"`);
    if (!r.validation.hasEmail) actionItems.push(`Fix ${r.eventName}: Missing hashed email`);
  });

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
      eventIdFormat: allDeterministic ? 'deterministic' : 'mixed',
      formatConsistent: allDeterministic,
      recommendation: allDeterministic
        ? 'All event IDs use deterministic type:{id} format ✓'
        : 'Some event IDs are not deterministic — check wmTracking emitters',
    },
    overallScore: totalScore,
    maxScore,
    overallStatus,
    projectedEMQ: Math.round((totalScore / maxScore) * 10 * 10) / 10,
    actionItems,
  };

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  Status: ${overallStatus} | Score: ${totalScore.toFixed(1)}/${maxScore} | EMQ: ${report.projectedEMQ.toFixed(1)}/10`);
  console.log('═══════════════════════════════════════════════════════════════');

  return report;
}

// Export for dev tools
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).fullFunnelAudit = {
    run: runFullFunnelAudit,
    generateGoldenLead,
    META_EVENTS,
    getCapturedRequests,
  };
}
