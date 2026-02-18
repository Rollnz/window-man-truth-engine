// Google Tag Manager utilities with Enhanced Conversion Support
// Phase 1-4: Professional-grade conversion tracking system with Persistent Identity
// Updated: January 23, 2026 - Option A: Payload Parity for lead_submission_success

export const GTM_ID = 'GTM-NHVFR5QZ';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    truthEngine?: TruthEngine;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Imports
// ═══════════════════════════════════════════════════════════════════════════

import type { SourceTool } from '@/types/sourceTool';
import { wmLead, wmQualifiedLead, wmScannerUpload, wmAppointmentBooked, wmSold, wmRetarget, wmInternal } from './wmTracking';
import { normalizeToE164 } from '@/lib/phoneFormat';
import { calculateLeadScore, getRoutingAction, getCRMTags } from '@/lib/leadScoringEngine';
import { buildEventMetadata, buildGTMEvent, type EventMetadataInput } from './eventMetadataHelper';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SHA-256 hash detection (64 hex characters)
 * Used to prevent double-hashing of already-hashed values
 */
const HASH_64_HEX_REGEX = /^[a-f0-9]{64}$/i;

/**
 * Standard lead conversion value
 */
// (Legacy LEAD_VALUE / LEAD_CURRENCY constants removed — values live in wmTracking.ts)

// ═══════════════════════════════════════════════════════════════════════════
// HASH-STATE DETECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a value is already a SHA-256 hash (64 hex characters)
 * CRITICAL: Prevents double-hashing which would break identity matching
 */
export function isAlreadyHashed(value: string): boolean {
  return HASH_64_HEX_REGEX.test(value);
}

// ═══════════════════════════════════════════════════════════════════════════
// SHA-256 Hashing for Enhanced Conversions (GA4 + Meta CAPI)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalize email for hashing (lowercase + trim)
 * Google/Meta requirement for Enhanced Conversions
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Normalize name for hashing (lowercase + trim, remove special chars)
 * Meta CAPI requirement for fn/ln fields
 */
export function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z]/g, '');
}

/**
 * Normalize city for hashing (lowercase + trim, remove special chars)
 * Meta CAPI requirement for ct field
 */
export function normalizeCity(city: string): string {
  return city.toLowerCase().trim().replace(/[^a-z]/g, '');
}

/**
 * Normalize state for hashing (lowercase + trim, 2-char code)
 * Meta CAPI requirement for st field
 */
export function normalizeState(state: string): string {
  return state.toLowerCase().trim().slice(0, 2);
}

/**
 * Normalize zip for hashing (digits only, first 5)
 * Meta CAPI requirement for zp field
 */
export function normalizeZip(zip: string): string {
  return zip.replace(/\D/g, '').slice(0, 5);
}

/**
 * SHA-256 hash function for Enhanced Conversions
 * Hashes PII (email, phone) for privacy-safe server matching
 * 
 * CRITICAL: If input is already hashed (64-char hex), returns as-is
 * NORMALIZATION: Email is lowercased and trimmed before hashing
 */
export async function sha256(text: string): Promise<string> {
  if (!text) return '';
  
  // CRITICAL: Never re-hash already-hashed values
  if (isAlreadyHashed(text)) {
    return text;
  }
  
  try {
    const encoder = new TextEncoder();
    // Normalize: lowercase and trim (Google requirement)
    const data = encoder.encode(text.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    console.warn('[GTM] SHA-256 hashing failed:', error);
    return '';
  }
}

/**
 * Alias for sha256 for explicit naming
 */
export const safeHash = sha256;

/**
 * Hash phone number with E.164 normalization
 * 
 * CRITICAL: If input is already hashed (64-char hex), returns as-is
 * IMPORTANT: Google expects E.164 format (+1XXXXXXXXXX) for phone hashing
 * Invalid phone numbers return undefined to avoid match quality issues
 */
export async function hashPhone(phone: string | undefined | null): Promise<string | undefined> {
  if (!phone) return undefined;
  
  // CRITICAL: Never re-hash already-hashed values
  if (isAlreadyHashed(phone)) {
    return phone;
  }
  
  // Normalize to E.164 first (returns undefined if invalid)
  const e164 = normalizeToE164(phone);
  if (!e164) {
    if (import.meta.env.DEV) {
      console.warn('[GTM] Phone number could not be normalized to E.164:', phone);
    }
    return undefined;
  }
  
  // Hash the E.164 formatted number
  const hash = await sha256(e164);
  return hash || undefined;
}

/**
 * Hash a name field (first name or last name)
 */
export async function hashName(name: string | undefined | null): Promise<string | undefined> {
  if (!name) return undefined;
  if (isAlreadyHashed(name)) return name;
  const normalized = normalizeName(name);
  if (!normalized) return undefined;
  const hash = await sha256(normalized);
  return hash || undefined;
}

/**
 * Hash a city field
 */
export async function hashCity(city: string | undefined | null): Promise<string | undefined> {
  if (!city) return undefined;
  if (isAlreadyHashed(city)) return city;
  const normalized = normalizeCity(city);
  if (!normalized) return undefined;
  const hash = await sha256(normalized);
  return hash || undefined;
}

/**
 * Hash a state field
 */
export async function hashState(state: string | undefined | null): Promise<string | undefined> {
  if (!state) return undefined;
  if (isAlreadyHashed(state)) return state;
  const normalized = normalizeState(state);
  if (!normalized) return undefined;
  const hash = await sha256(normalized);
  return hash || undefined;
}

/**
 * Hash a zip code field
 */
export async function hashZip(zip: string | undefined | null): Promise<string | undefined> {
  if (!zip) return undefined;
  if (isAlreadyHashed(zip)) return zip;
  const normalized = normalizeZip(zip);
  if (!normalized || normalized.length < 5) return undefined;
  const hash = await sha256(normalized);
  return hash || undefined;
}

// ═══════════════════════════════════════════════════════════════════════════
// COOKIE CAPTURE FUNCTIONS (Facebook Attribution)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get a cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Get Facebook Browser ID (_fbp cookie)
 * REQUIRED for cross-device attribution
 */
export function getFbp(): string | null {
  return getCookie('_fbp');
}

/**
 * Get Facebook Click ID (_fbc cookie or from URL)
 * REQUIRED for ad click attribution
 */
export function getFbc(): string | null {
  if (typeof window === 'undefined') return null;
  
  // First: Check URL for fbclid parameter (most accurate)
  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid');
  
  if (fbclid) {
    // Format per Meta spec: fb.1.{timestamp}.{fbclid}
    return `fb.1.${Date.now()}.${fbclid}`;
  }
  
  // Fallback: Check existing cookie
  return getCookie('_fbc');
}

/**
 * Get client user agent
 */
export function getClientUserAgent(): string {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent;
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT ID GENERATION
// ═══════════════════════════════════════════════════════════════════════════

import { generateSecureUUID } from './secureUUID';

/**
 * Generate a unique event ID for CAPI deduplication
 * Uses cryptographically secure UUID generation (CWE-338 compliant)
 */
export function generateEventId(): string {
  return generateSecureUUID();
}

// ═══════════════════════════════════════════════════════════════════════════
// ENHANCED USER DATA BUILDER (Full EMQ Support)
// ═══════════════════════════════════════════════════════════════════════════

export interface EnhancedUserData {
  // Google Enhanced Conversions format
  sha256_email_address?: string;
  sha256_phone_number?: string;
  // Meta CAPI format (aliased)
  em?: string;
  ph?: string;
  // Advanced matching params (Meta CAPI)
  fn?: string;
  ln?: string;
  ct?: string;
  st?: string;
  zp?: string;
  country?: string;
  // Cross-platform external ID
  external_id?: string;
  // Facebook attribution cookies
  fbp?: string | null;
  fbc?: string | null;
  // Client info
  client_user_agent?: string;
}

/**
 * Input interface for building enhanced user data
 * Matches the parameters needed for full EMQ support
 */
export interface EnhancedUserDataInput {
  email?: string;
  phone?: string;
  leadId?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

/**
 * Build Enhanced user_data object for Google Enhanced Conversions & Meta CAPI
 * 
 * IMPORTANT: Returns both Google format (sha256_email_address) and Meta format (em/ph)
 * for cross-platform compatibility.
 * 
 * ENHANCED: Now includes full advanced matching params (fn, ln, ct, st, zp, country)
 * and Facebook attribution cookies (fbp, fbc) for maximum EMQ.
 * 
 * CRITICAL: All hashing uses hash-state detection to prevent double-hashing
 */
export async function buildEnhancedUserData(params: EnhancedUserDataInput): Promise<EnhancedUserData | undefined> {
  // Hash all PII fields in parallel for performance
  const [
    hashedEmail,
    hashedPhone,
    hashedFirstName,
    hashedLastName,
    hashedCity,
    hashedState,
    hashedZip,
  ] = await Promise.all([
    params.email ? sha256(params.email) : Promise.resolve(undefined),
    params.phone ? hashPhone(params.phone) : Promise.resolve(undefined),
    params.firstName ? hashName(params.firstName) : Promise.resolve(undefined),
    params.lastName ? hashName(params.lastName) : Promise.resolve(undefined),
    params.city ? hashCity(params.city) : Promise.resolve(undefined),
    params.state ? hashState(params.state) : Promise.resolve(undefined),
    params.zipCode ? hashZip(params.zipCode) : Promise.resolve(undefined),
  ]);

  // Get Facebook attribution cookies
  const fbp = getFbp();
  const fbc = getFbc();
  const client_user_agent = getClientUserAgent();

  // Return undefined if we have no useful data
  if (!hashedEmail && !hashedPhone && !params.leadId && !fbp && !fbc) {
    return undefined;
  }

  return {
    // Google Enhanced Conversions format
    sha256_email_address: hashedEmail || undefined,
    sha256_phone_number: hashedPhone,
    // Meta CAPI format (aliased)
    em: hashedEmail || undefined,
    ph: hashedPhone,
    // Advanced matching params (Meta CAPI) - for EMQ 8.5+
    fn: hashedFirstName,
    ln: hashedLastName,
    ct: hashedCity,
    st: hashedState,
    zp: hashedZip,
    country: 'us', // Hardcoded for US-only business
    // Cross-platform external ID
    external_id: params.leadId,
    // Facebook attribution cookies
    fbp,
    fbc,
    // Client info
    client_user_agent,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Core Event Tracking
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialize dataLayer if not already present
 */
function ensureDataLayer(): void {
  if (typeof window !== 'undefined' && !window.dataLayer) {
    window.dataLayer = [];
  }
}

/**
 * Push an event to the GTM dataLayer
 */
export const trackEvent = (eventName: string, eventData?: Record<string, unknown>) => {
  ensureDataLayer();
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...eventData,
    });
  }
};

export const trackPageView = (url: string) => {
  trackEvent('page_view', { page_path: url });
};

// ═══════════════════════════════════════════════════════════════════════════
// Standardized Lead Capture Tracking (Phase 4)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track lead capture (email submitted) - PHASE 4 PERSISTENT IDENTITY + METADATA
 * 
 * CRITICAL: This is the canonical lead tracking function.
 * It uses buildEventMetadata to ensure all 15+ parameters are included.
 * Handles PII hashing and GTM dataLayer push.
 */
export const trackLeadCapture = async (
  input: EventMetadataInput,
  email: string,
  phone?: string,
  additionalData?: {
    hasAddress?: boolean;
    hasProjectDetails?: boolean;
    hasName?: boolean;
    hasPhone?: boolean;
  }
) => {
  try {
    // 1. Build standardized metadata (includes visitor_id, intent_tier, funnel_stage, etc.)
    const metadata = buildEventMetadata(input);

    // 2. Hash PII for Meta CAPI (Phase 2 requirement - EMQ ≥ 8.0)
    const hashedEmail = await sha256(email);
    const hashedPhone = phone ? await hashPhone(phone) : undefined;

    // 3. Calculate lead score for internal routing (Phase 3 requirement)
    const leadScoreData = calculateLeadScore({
      intentTier: metadata.intent_tier,
      leadSource: metadata.lead_source as SourceTool,
      hasEmail: !!email,
      hasPhone: !!phone,
      hasAddress: additionalData?.hasAddress,
      hasProjectDetails: additionalData?.hasProjectDetails,
      hasName: additionalData?.hasName,
    });

    // 4. Get routing and tags
    const routingAction = getRoutingAction(leadScoreData.finalScore);
    const crmTags = getCRMTags({
      intentTier: metadata.intent_tier,
      leadSource: metadata.lead_source as SourceTool,
      hasEmail: !!email,
      hasPhone: !!phone,
      hasAddress: additionalData?.hasAddress,
      hasProjectDetails: additionalData?.hasProjectDetails,
      hasName: additionalData?.hasName,
      finalScore: leadScoreData.finalScore,
    });

    // 5. Build final GTM event payload (Phase 4 requirement - 15+ parameters)
    const gtmEvent = buildGTMEvent('lead_captured', metadata, {
      // Lead Scoring
      lead_score: leadScoreData.finalScore,
      lead_score_breakdown: {
        base_score: leadScoreData.baseScore,
        tool_multiplier: leadScoreData.toolMultiplier,
        data_bonus: leadScoreData.dataBonus,
      },
      routing_action: routingAction.action,
      routing_priority: routingAction.priority,
      crm_tags: crmTags,

      // User Data for EMQ (HASHED ONLY)
      user_data: {
        external_id: metadata.external_id,
        sha256_email_address: hashedEmail || undefined,
        sha256_phone_number: hashedPhone,
        em: hashedEmail || undefined,
        ph: hashedPhone,
        fbp: getFbp(),
        fbc: getFbc(),
        client_user_agent: getClientUserAgent(),
      },

      // Legacy fields for backward compatibility
      source_tool: metadata.lead_source,
      email_domain: email.split('@')[1] || 'unknown',
      has_phone: !!phone,
      conversion_type: 'lead',
      lead_id: metadata.external_id,
    });

    // 6. Push to dataLayer
    trackEvent('lead_captured', gtmEvent);

    if (import.meta.env.DEV) {
      console.log('[GTM] lead_captured event pushed with full metadata:', {
        leadId: metadata.external_id,
        visitorId: metadata.visitor_id,
        sourceTool: metadata.lead_source,
        intentTier: metadata.intent_tier,
        leadScore: leadScoreData.finalScore,
        routing: routingAction.action
      });
    }
  } catch (error) {
    console.error('[GTM] Error tracking lead capture:', error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY CONVERSION FUNCTIONS — REMOVED
// All conversion tracking now goes through wmTracking.ts:
//   wmLead, wmQualifiedLead, wmScannerUpload, wmAppointmentBooked, wmSold
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// Legacy & Specialized Tracking
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track AI Scan results
 */
export const trackScanResult = (params: {
  scanType: 'quote' | 'evidence' | 'claim';
  status: 'success' | 'error' | 'partial';
  quoteAmount?: number;
  errorReason?: string;
}) => {
  trackEvent('ai_scan_complete', {
    scan_type: params.scanType,
    scan_status: params.status,
    quote_amount: params.quoteAmount,
    error_reason: params.errorReason,
  });
};

/**
 * Track modal open event
 * Supports both string (legacy) and object signatures
 */
export const trackModalOpen = (
  paramsOrModalName: string | { modalName: string; sourceTool?: string; triggerAction?: string },
  sourceTool?: string
) => {
  const params = typeof paramsOrModalName === 'string'
    ? { modalName: paramsOrModalName, sourceTool }
    : paramsOrModalName;
  
  trackEvent('modal_open', {
    modal_name: params.modalName,
    source_tool: params.sourceTool,
    trigger_action: params.triggerAction,
  });
};

/**
 * Track form submission
 * Supports both string (legacy) and object signatures
 */
export const trackFormSubmit = (
  paramsOrFormName: string | { formName: string; formId?: string; sourceTool?: string; success?: boolean },
  sourceTool?: string
) => {
  const params = typeof paramsOrFormName === 'string'
    ? { formName: paramsOrFormName, sourceTool }
    : paramsOrFormName;
  
  trackEvent('form_submit', {
    form_name: params.formName,
    form_id: params.formId,
    source_tool: params.sourceTool,
    success: params.success ?? true,
  });
};

/**
 * Track form start (user begins filling form)
 * Supports both string (legacy) and object signatures
 */
export const trackFormStart = (
  paramsOrFormName: string | { formName: string; formId?: string; sourceTool?: string },
  sourceTool?: string
) => {
  const params = typeof paramsOrFormName === 'string'
    ? { formName: paramsOrFormName, sourceTool }
    : paramsOrFormName;
  
  trackEvent('form_start', {
    form_name: params.formName,
    form_id: params.formId,
    source_tool: params.sourceTool,
  });
};

/**
 * Track consultation booking/request
 */
export const trackConsultation = (params: {
  consultationType?: string;
  preferredTime?: string;
  sourceTool?: string;
  name?: string;
  email?: string;
  phone?: string;
}) => {
  trackEvent('consultation_requested', {
    consultation_type: params.consultationType,
    preferred_time: params.preferredTime,
    source_tool: params.sourceTool,
    has_name: !!params.name,
    has_email: !!params.email,
    has_phone: !!params.phone,
  });
};

/**
 * Track tool completion
 */
export const trackToolCompletion = (params: {
  toolName: string;
  score?: number;
  completionTime?: number;
  resultType?: string;
}) => {
  trackEvent('tool_completion', {
    tool_name: params.toolName,
    score: params.score,
    completion_time: params.completionTime,
    result_type: params.resultType,
  });
};

/**
 * Track vault sync clicked
 */
export const trackVaultSyncClicked = (params?: {
  sourceTool?: string;
  analysisGrade?: string;
}) => {
  trackEvent('vault_sync_clicked', {
    source_tool: params?.sourceTool,
    analysis_grade: params?.analysisGrade,
  });
};

/**
 * Track vault activation
 */
export const trackVaultActivation = (params?: {
  sourceTool?: string;
  method?: string;
}) => {
  trackEvent('vault_activation', {
    source_tool: params?.sourceTool,
    method: params?.method,
  });
};

// trackOfflineConversion — REMOVED. Use wmSold from @/lib/wmTracking

/**
 * Track form abandonment
 */
export const trackFormAbandonment = (params: {
  formName: string;
  sourceTool?: string;
  fieldsCompleted?: number;
  timeSpentMs?: number;
}) => {
  trackEvent('form_abandonment', {
    form_name: params.formName,
    source_tool: params.sourceTool,
    fields_completed: params.fieldsCompleted,
    time_spent_ms: params.timeSpentMs,
  });
};

/**
 * Track price analysis viewed
 */
export const trackPriceAnalysisViewed = (params?: {
  grade?: string;
  overagePercentage?: number;
  quoteAmount?: number;
}) => {
  trackEvent('price_analysis_viewed', {
    grade: params?.grade,
    overage_percentage: params?.overagePercentage,
    quote_amount: params?.quoteAmount,
  });
};

// trackConversionValue — REMOVED. Use wmTracking OPT functions instead.

/**
 * Track scanner upload completed (high-value signal)
 */
export const trackScannerUploadCompleted = (params: {
  fileId?: string;
  fileSize?: number;
  uploadDuration?: number;
  sourceTool?: string;
}) => {
  trackEvent('scanner_upload_completed', {
    file_id: params.fileId,
    file_size: params.fileSize,
    upload_duration: params.uploadDuration,
    source_tool: params.sourceTool ?? 'quote-scanner',
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// TRUTH ENGINE - Global API for Debugging & Cross-Module Access
// ═══════════════════════════════════════════════════════════════════════════

/**
 * TruthEngine interface - exposed on window for debugging
 */
export interface TruthEngine {
  // Utilities
  buildEnhancedUserData: typeof buildEnhancedUserData;
  normalizeEmail: typeof normalizeEmail;
  normalizeToE164: typeof normalizeToE164;
  safeHash: typeof safeHash;
  sha256: typeof sha256;
  hashPhone: typeof hashPhone;
  generateEventId: typeof generateEventId;
  isAlreadyHashed: typeof isAlreadyHashed;
  getFbp: typeof getFbp;
  getFbc: typeof getFbc;

  // Canonical wmTracking functions
  wmLead: typeof wmLead;
  wmQualifiedLead: typeof wmQualifiedLead;
  wmScannerUpload: typeof wmScannerUpload;
  wmAppointmentBooked: typeof wmAppointmentBooked;
  wmSold: typeof wmSold;
  wmRetarget: typeof wmRetarget;
  wmInternal: typeof wmInternal;
  
  // General tracking
  trackEvent: typeof trackEvent;
  trackLeadCapture: typeof trackLeadCapture;
}

/**
 * Install the Truth Engine on window for debugging and cross-module access
 * 
 * MERGE-SAFE: Does not overwrite existing properties
 * 
 * Call this from app entry point (main.tsx)
 */
export function installTruthEngine(): void {
  if (typeof window === 'undefined') return;
  
  // Merge-safe: preserve any existing properties
  window.truthEngine = {
    ...window.truthEngine,
    // Utilities
    buildEnhancedUserData,
    normalizeEmail,
    normalizeToE164,
    safeHash,
    sha256,
    hashPhone,
    generateEventId,
    isAlreadyHashed,
    getFbp,
    getFbc,
    // Canonical wmTracking functions
    wmLead,
    wmQualifiedLead,
    wmScannerUpload,
    wmAppointmentBooked,
    wmSold,
    wmRetarget,
    wmInternal,
    // General tracking
    trackEvent,
    trackLeadCapture,
  };
  
  if (import.meta.env.DEV) {
    console.log('[TruthEngine] Installed on window.truthEngine', {
      methods: Object.keys(window.truthEngine),
    });
  }
}

// Re-export normalizeToE164 from phoneFormat for truthEngine access
export { normalizeToE164 };
