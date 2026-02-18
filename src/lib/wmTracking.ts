/**
 * wmTracking.ts — Canonical Tracking Chokepoint
 *
 * This is the ONLY module authorized to attach value/currency to events
 * destined for ad platforms (Meta CAPI, Google Ads).
 *
 * OPT events (5 total, hardcoded values):
 *   wm_lead              $10    (Meta: Lead)
 *   wm_qualified_lead    $100   (Meta: QualifiedLead)
 *   wm_scanner_upload    $500   (Meta: ScannerUpload)
 *   wm_appointment_booked $1000 (Meta: Schedule)
 *   wm_sold              $5000 + sale_amount (Meta: Purchase)
 *
 * RT events: sent to ad platforms for audiences, NEVER with value/currency
 * INTERNAL events: never sent to ad platforms
 *
 * GTM Firewall Contract:
 *   Every event includes a `meta` object.
 *   Conversion tags MUST require: event matches ^wm_ AND meta.category === 'opt'
 */

import { trackEvent, buildEnhancedUserData, generateEventId } from './gtm';
import type { EnhancedUserData } from './gtm';
import type { QualificationData } from '@/components/LeadModalV2/types';

// ═══════════════════════════════════════════════════════════════════════════
// VERSION
// ═══════════════════════════════════════════════════════════════════════════

const WM_TRACKING_VERSION = '1.0.0';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type WmEventCategory = 'opt' | 'rt' | 'internal';

export type WmOptEvent =
  | 'wm_lead'
  | 'wm_qualified_lead'
  | 'wm_scanner_upload'
  | 'wm_appointment_booked'
  | 'wm_sold';

/** The `meta` field on every wmTracking event for GTM firewall routing */
export interface WmEventMeta {
  send: boolean;
  category: WmEventCategory;
  meta_event_name?: string;
  value?: number;
  currency?: string;
  wm_tracking_version: string;
}

/** PII identity for Enhanced Conversions (hashed internally). leadId is REQUIRED for OPT events. */
export interface WmUserIdentity {
  leadId: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

/** Context attached to events — NEVER includes value/currency */
export interface WmEventContext {
  source_tool?: string;
  source_system?: string;
  page_path?: string;
  page_location?: string;
  [key: string]: unknown;
}

// ═══════════════════════════════════════════════════════════════════════════
// HARDCODED OPT VALUES — callers CANNOT override
// ═══════════════════════════════════════════════════════════════════════════

const OPT_VALUES: Record<WmOptEvent, number> = {
  wm_lead: 10,
  wm_qualified_lead: 100,
  wm_scanner_upload: 500,
  wm_appointment_booked: 1000,
  wm_sold: 5000,
};

/** Meta CAPI event name mapping (for meta.meta_event_name) */
const META_EVENT_NAMES: Record<WmOptEvent, string> = {
  wm_lead: 'Lead',
  wm_qualified_lead: 'QualifiedLead',
  wm_scanner_upload: 'ScannerUpload',
  wm_appointment_booked: 'Schedule',
  wm_sold: 'Purchase',
};

/** Legacy bridge map — each OPT event also fires the old name as RT during transition */
const LEGACY_BRIDGE: Partial<Record<WmOptEvent, string>> = {
  wm_lead: 'lead_submission_success',
  wm_scanner_upload: 'quote_upload_success',
  wm_appointment_booked: 'booking_confirmed',
  wm_qualified_lead: 'phone_lead_captured',
};

// ═══════════════════════════════════════════════════════════════════════════
// DEDUPLICATION GUARDS
// ═══════════════════════════════════════════════════════════════════════════

/** Scanner upload dedupe — one fire per scanAttemptId */
let lastFiredScanId: string | null = null;

/** Check if wm_scanner_upload has fired for a leadId in this session */
function hasUploadFired(leadId: string): boolean {
  try {
    return sessionStorage.getItem(`wm_upload_fired:${leadId}`) === '1';
  } catch {
    return false;
  }
}

/** Mark that wm_scanner_upload fired for a leadId */
function markUploadFired(leadId: string): void {
  try {
    sessionStorage.setItem(`wm_upload_fired:${leadId}`, '1');
  } catch {
    // Non-critical
  }
}

/** Check if wm_qualified_lead has fired for a leadId in this session */
function hasQlFired(leadId: string): boolean {
  try {
    return sessionStorage.getItem(`wm_ql_fired:${leadId}`) === '1';
  } catch {
    return false;
  }
}

/** Mark that wm_qualified_lead fired for a leadId */
function markQlFired(leadId: string): void {
  try {
    sessionStorage.setItem(`wm_ql_fired:${leadId}`, '1');
  } catch {
    // Non-critical
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// QUALIFIED LEAD THRESHOLD HELPER
// ═══════════════════════════════════════════════════════════════════════════

const URGENT_TIMELINES = ['30days', '90days'];
const QUALIFYING_SCOPES = ['6_15', '16_plus', 'whole_house'];

/**
 * Strict threshold for wm_qualified_lead OPT event.
 *
 * Returns true ONLY when:
 * 1. windowScope > 5 windows ('6_15', '16_plus', 'whole_house')
 * 2. timeline is urgent ('30days' or '90days')
 *
 * Does NOT check scanner-upload or session-dedupe state.
 * Those checks happen inside wmQualifiedLead() itself.
 */
export function qualifiesForQualifiedLead(
  qualification: Pick<QualificationData, 'windowScope' | 'timeline'>,
): boolean {
  return (
    qualification.windowScope !== null &&
    qualification.timeline !== null &&
    QUALIFYING_SCOPES.includes(qualification.windowScope) &&
    URGENT_TIMELINES.includes(qualification.timeline)
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CORE: pushWmEvent (shared by all OPT emitters)
// ═══════════════════════════════════════════════════════════════════════════

async function pushWmEvent(
  eventName: WmOptEvent,
  eventId: string,
  identity: WmUserIdentity,
  value: number,
  metaEventName: string,
  context?: WmEventContext,
): Promise<void> {
  const meta: WmEventMeta = {
    send: true,
    category: 'opt',
    meta_event_name: metaEventName,
    value,
    currency: 'USD',
    wm_tracking_version: WM_TRACKING_VERSION,
  };

  // Build hashed user_data for Enhanced Conversions / CAPI
  let user_data: EnhancedUserData | undefined;
  try {
    user_data = await buildEnhancedUserData(identity);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(`[wmTracking] PII hashing failed for ${eventName}:`, err);
    }
  }

  const payload: Record<string, unknown> = {
    event_id: eventId,
    meta,
    value,
    currency: 'USD',
    source_system: 'website',
    page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
    external_id: identity.leadId,
    lead_id: identity.leadId,
    ...(user_data && { user_data }),
    ...context,
  };

  trackEvent(eventName, payload);

  if (import.meta.env.DEV) {
    console.log(
      `%c[wmTracking] ${eventName} (opt)`,
      'color: #22c55e; font-weight: bold',
      { event_id: eventId, value, leadId: identity.leadId },
    );
  }
}

/**
 * Fire a legacy bridge event as RT (no value, no currency).
 * Tagged with `legacy_bridge: true` for easy identification and removal.
 */
function fireLegacyBridge(
  optEventName: WmOptEvent,
  context?: WmEventContext,
): void {
  const legacyName = LEGACY_BRIDGE[optEventName];
  if (!legacyName) return;

  trackEvent(legacyName, {
    meta: {
      send: true,
      category: 'rt' as WmEventCategory,
      wm_tracking_version: WM_TRACKING_VERSION,
    },
    legacy_bridge: true,
    source_system: 'website',
    ...(context?.source_tool && { source_tool: context.source_tool }),
    page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// OPT EVENT EMITTERS (the ONLY 5 functions that attach value/currency)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * wm_lead — $10 — any first-party email capture with a confirmed leadId.
 *
 * event_id format: lead:{leadId}
 */
export async function wmLead(
  identity: WmUserIdentity,
  context?: WmEventContext,
): Promise<void> {
  const eventId = `lead:${identity.leadId}`;

  await pushWmEvent(
    'wm_lead', eventId, identity,
    OPT_VALUES.wm_lead, META_EVENT_NAMES.wm_lead,
    context,
  );

  fireLegacyBridge('wm_lead', context);
}

/**
 * wm_qualified_lead — $100 — lead passes qualification threshold.
 *
 * event_id format: ql:{leadId}
 *
 * Automatically suppressed if:
 * - Already fired for this leadId in this session
 * - wm_scanner_upload already fired for this leadId (upload surpasses qualified)
 *
 * @returns true if fired, false if suppressed/deduplicated
 */
export async function wmQualifiedLead(
  identity: WmUserIdentity,
  context?: WmEventContext,
): Promise<boolean> {
  // Session dedupe
  if (hasQlFired(identity.leadId)) {
    if (import.meta.env.DEV) {
      console.log(`[wmTracking] wm_qualified_lead deduplicated for ${identity.leadId}`);
    }
    return false;
  }

  // Suppressed if scanner upload already fired (higher tier)
  if (hasUploadFired(identity.leadId)) {
    if (import.meta.env.DEV) {
      console.log(`[wmTracking] wm_qualified_lead suppressed — upload already fired for ${identity.leadId}`);
    }
    return false;
  }

  const eventId = `ql:${identity.leadId}`;
  markQlFired(identity.leadId);

  await pushWmEvent(
    'wm_qualified_lead', eventId, identity,
    OPT_VALUES.wm_qualified_lead, META_EVENT_NAMES.wm_qualified_lead,
    context,
  );

  fireLegacyBridge('wm_qualified_lead', context);
  return true;
}

/**
 * wm_scanner_upload — $500 — user uploaded a quote for AI analysis.
 *
 * event_id format: upload:{scanAttemptId}
 *
 * Deduplicated per scanAttemptId (module-level guard).
 * Also sets the upload-fired session flag so wm_qualified_lead is suppressed.
 *
 * @returns event_id if fired, null if deduplicated
 */
export async function wmScannerUpload(
  identity: WmUserIdentity,
  scanAttemptId: string,
  context?: WmEventContext,
): Promise<string | null> {
  if (lastFiredScanId === scanAttemptId) {
    if (import.meta.env.DEV) {
      console.log(`[wmTracking] wm_scanner_upload deduplicated for ${scanAttemptId}`);
    }
    return null;
  }

  const eventId = `upload:${scanAttemptId}`;
  lastFiredScanId = scanAttemptId;
  markUploadFired(identity.leadId);

  await pushWmEvent(
    'wm_scanner_upload', eventId, identity,
    OPT_VALUES.wm_scanner_upload, META_EVENT_NAMES.wm_scanner_upload,
    { scan_attempt_id: scanAttemptId, ...context },
  );

  fireLegacyBridge('wm_scanner_upload', context);
  return eventId;
}

/**
 * wm_appointment_booked — $1000 — consultation/booking confirmed.
 *
 * event_id format: appt:{leadId}:{appointmentKey}
 *
 * @param appointmentKey - Unique key to prevent collisions on re-bookings
 *   (e.g. appointment_id, calendar timestamp, or CRM row ID).
 *   Falls back to Date.now() if not provided.
 */
export async function wmAppointmentBooked(
  identity: WmUserIdentity,
  appointmentKey?: string,
  context?: WmEventContext,
): Promise<void> {
  const suffix = appointmentKey || String(Date.now());
  const eventId = `appt:${identity.leadId}:${suffix}`;

  await pushWmEvent(
    'wm_appointment_booked', eventId, identity,
    OPT_VALUES.wm_appointment_booked, META_EVENT_NAMES.wm_appointment_booked,
    context,
  );

  fireLegacyBridge('wm_appointment_booked', context);
}

/**
 * wm_sold — $5000 + saleAmount — sale closed (typically server-originated).
 *
 * event_id format: sold:{leadId}:{dealKey}
 *
 * @param dealKey - Unique key to prevent collisions (e.g. deal_id, closed_ts).
 *   Falls back to Date.now() if not provided.
 */
export async function wmSold(
  identity: WmUserIdentity,
  saleAmount: number,
  dealKey?: string,
  context?: WmEventContext,
): Promise<void> {
  const suffix = dealKey || String(Date.now());
  const eventId = `sold:${identity.leadId}:${suffix}`;
  const totalValue = OPT_VALUES.wm_sold + Math.max(0, saleAmount);

  await pushWmEvent(
    'wm_sold', eventId, identity,
    totalValue, META_EVENT_NAMES.wm_sold,
    { sale_amount: saleAmount, ...context },
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RT EVENT EMITTER (retargeting — no value/currency ever)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fire a retargeting event: sent to ad platforms for audience building,
 * but NEVER with value or currency.
 */
export function wmRetarget(
  eventName: string,
  context?: WmEventContext,
): void {
  const eventId = generateEventId();

  trackEvent(eventName, {
    event_id: eventId,
    meta: {
      send: true,
      category: 'rt' as WmEventCategory,
      wm_tracking_version: WM_TRACKING_VERSION,
    },
    source_system: 'website',
    page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
    ...context,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL EVENT EMITTER (never sent to ad platforms)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fire an internal analytics event (never reaches ad platforms).
 * meta.send = false ensures GTM blocks all tags.
 */
export function wmInternal(
  eventName: string,
  data?: Record<string, unknown>,
): void {
  trackEvent(eventName, {
    event_id: generateEventId(),
    meta: {
      send: false,
      category: 'internal' as WmEventCategory,
      wm_tracking_version: WM_TRACKING_VERSION,
    },
    ...data,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST UTILITIES (exported for test files only)
// ═══════════════════════════════════════════════════════════════════════════

/** Reset scanner upload dedupe guard */
export function _resetScannerUploadGuard(): void {
  lastFiredScanId = null;
}

/** Reset all session-based dedupe flags for a leadId */
export function _resetSessionGuards(leadId: string): void {
  try {
    sessionStorage.removeItem(`wm_upload_fired:${leadId}`);
    sessionStorage.removeItem(`wm_ql_fired:${leadId}`);
  } catch {
    // Non-critical
  }
}
