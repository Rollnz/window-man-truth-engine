// Google Tag Manager utilities with Enhanced Conversion Support
// Phase 1-4: Professional-grade conversion tracking system with Persistent Identity

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

// ═══════════════════════════════════════════════════════════════════════════
// EVENT ID GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a unique event ID for CAPI deduplication
 * Uses crypto.randomUUID with fallback for older browsers
 */
export function generateEventId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ENHANCED USER DATA BUILDER
// ═══════════════════════════════════════════════════════════════════════════

export interface EnhancedUserData {
  sha256_email_address?: string;
  sha256_phone_number?: string;
  em?: string;
  ph?: string;
  external_id?: string;
}

/**
 * Build Enhanced user_data object for Google Enhanced Conversions & Meta CAPI
 * 
 * IMPORTANT: Returns both Google format (sha256_email_address) and Meta format (em/ph)
 * for cross-platform compatibility.
 * 
 * CRITICAL: All hashing uses hash-state detection to prevent double-hashing
 */
export async function buildEnhancedUserData(params: {
  email?: string;
  phone?: string;
  leadId?: string;
}): Promise<EnhancedUserData | undefined> {
  const [hashedEmail, hashedPhone] = await Promise.all([
    params.email ? sha256(params.email) : Promise.resolve(undefined),
    params.phone ? hashPhone(params.phone) : Promise.resolve(undefined),
  ]);

  if (!hashedEmail && !hashedPhone && !params.leadId) {
    return undefined;
  }

  return {
    // Google Enhanced Conversions format
    sha256_email_address: hashedEmail || undefined,
    sha256_phone_number: hashedPhone,
    // Meta CAPI format (aliased)
    em: hashedEmail || undefined,
    ph: hashedPhone,
    // Cross-platform external ID
    external_id: params.leadId,
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
// HIGH-VALUE CONVERSION TRACKING (EMQ 9.5+ COMPLIANT)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track lead submission success with Enhanced Conversions
 * 
 * ENHANCED: Async SHA-256 PII hashing for Google Enhanced Conversions & Meta CAPI
 * Value: $15 (standard lead tier)
 * 
 * CRITICAL: Only hashed PII is pushed to dataLayer - raw PII never appears
 */
export const trackLeadSubmissionSuccess = async (params: {
  leadId: string;
  email: string;
  phone?: string;
  sourceTool?: string;
  name?: string;
  eventId?: string;
}): Promise<void> => {
  try {
    const userData = await buildEnhancedUserData({
      email: params.email,
      phone: params.phone,
      leadId: params.leadId,
    });

    const eventId = params.eventId || params.leadId || generateEventId();

    trackEvent('lead_submission_success', {
      lead_id: params.leadId,
      event_id: eventId, // For CAPI deduplication
      external_id: params.leadId,
      user_data: userData,
      value: 15,
      currency: 'USD',
      source_tool: params.sourceTool,
      email_domain: params.email?.split('@')[1] || 'unknown',
      has_phone: !!params.phone,
      has_name: !!params.name,
    });

    if (import.meta.env.DEV) {
      console.log('[GTM] lead_submission_success pushed with Enhanced Conversions', {
        leadId: params.leadId.slice(0, 8),
        eventId: eventId.slice(0, 8),
        hasEmail: !!userData?.sha256_email_address,
        hasPhone: !!userData?.sha256_phone_number,
        value: 15,
      });
    }
  } catch (error) {
    console.warn('[GTM] lead_submission_success hashing failed, firing fallback:', error);
    trackEvent('lead_submission_success_fallback', {
      lead_id: params.leadId,
      value: 15,
      currency: 'USD',
      source_tool: params.sourceTool,
      hash_error: true,
    });
  }
};

/**
 * Track phone lead capture with Enhanced Conversions
 * 
 * ENHANCED: Async SHA-256 PII hashing with E.164 phone normalization
 * Value: $25 (higher intent than email-only leads)
 * 
 * CRITICAL: Only hashed PII is pushed to dataLayer - raw PII never appears
 */
export const trackPhoneLead = async (params: {
  leadId: string;
  phone: string;
  email?: string;
  sourceTool: string;
  eventId?: string;
}): Promise<void> => {
  try {
    const userData = await buildEnhancedUserData({
      email: params.email,
      phone: params.phone,
      leadId: params.leadId,
    });

    const eventId = params.eventId || params.leadId || generateEventId();

    trackEvent('phone_lead', {
      lead_id: params.leadId,
      event_id: eventId, // For CAPI deduplication
      external_id: params.leadId,
      user_data: userData,
      value: 25,
      currency: 'USD',
      source_tool: params.sourceTool,
      has_email: !!params.email,
    });

    if (import.meta.env.DEV) {
      console.log('[GTM] phone_lead pushed with Enhanced Conversions', {
        leadId: params.leadId.slice(0, 8),
        eventId: eventId.slice(0, 8),
        hasEmail: !!userData?.sha256_email_address,
        hasPhone: !!userData?.sha256_phone_number,
        value: 25,
      });
    }
  } catch (error) {
    console.warn('[GTM] phone_lead hashing failed, firing fallback:', error);
    trackEvent('phone_lead_fallback', {
      lead_id: params.leadId,
      value: 25,
      currency: 'USD',
      source_tool: params.sourceTool,
      hash_error: true,
    });
  }
};

/**
 * Track consultation booking with Enhanced Conversions
 * 
 * ENHANCED: Includes both Google (sha256_*) and Meta (em/ph) formats
 * Value: $75 (highest tier)
 * 
 * CRITICAL: Only hashed PII is pushed to dataLayer - raw PII never appears
 */
export const trackConsultationBooked = async (params: {
  leadId: string;
  email: string;
  phone: string;
  metadata?: Record<string, unknown>;
  sourceTool?: string;
  eventId?: string;
}): Promise<void> => {
  try {
    const userData = await buildEnhancedUserData({
      email: params.email,
      phone: params.phone,
      leadId: params.leadId,
    });

    const eventId = params.eventId || params.leadId || generateEventId();
    
    trackEvent('consultation_booked', {
      lead_id: params.leadId,
      event_id: eventId, // For CAPI deduplication
      external_id: params.leadId,
      user_data: userData,
      value: 75,
      currency: 'USD',
      conversion_metadata: params.metadata,
      source_tool: params.sourceTool,
    });

    if (import.meta.env.DEV) {
      console.log('[GTM] consultation_booked pushed with Enhanced Conversions', {
        leadId: params.leadId.slice(0, 8),
        eventId: eventId.slice(0, 8),
        hasEmail: !!userData?.sha256_email_address,
        hasPhone: !!userData?.sha256_phone_number,
        value: 75,
      });
    }
  } catch (error) {
    console.warn('[GTM] consultation_booked hashing failed, firing fallback:', error);
    trackEvent('consultation_booked_fallback', {
      lead_id: params.leadId,
      value: 75,
      currency: 'USD',
      source_tool: params.sourceTool,
      hash_error: true,
    });
  }
};

/**
 * Track booking confirmed with async PII hashing (highest-value conversion)
 * 
 * ENHANCED: Uses buildEnhancedUserData for both Google (sha256_*) and Meta (em/ph) formats
 * Value: $75 (highest tier in conversion values reference)
 * 
 * CRITICAL: Only hashed PII is pushed to dataLayer - raw PII never appears
 */
export const trackBookingConfirmed = async (params: {
  leadId: string;
  email: string;
  phone?: string;
  name?: string;
  preferredTime?: string;
  sourceTool?: string;
  windowCount?: number;
  estimatedProjectValue?: number;
  urgencyLevel?: string;
  eventId?: string;
}): Promise<void> => {
  try {
    const userData = await buildEnhancedUserData({
      email: params.email,
      phone: params.phone,
      leadId: params.leadId,
    });

    const eventId = params.eventId || params.leadId || generateEventId();
    
    trackEvent('booking_confirmed', {
      lead_id: params.leadId,
      event_id: eventId, // For CAPI deduplication
      external_id: params.leadId,
      value: 75, // Highest conversion value tier
      currency: 'USD',
      user_data: userData,
      conversion_metadata: {
        window_count: params.windowCount,
        estimated_project_value: params.estimatedProjectValue,
        urgency_level: params.urgencyLevel,
        preferred_callback_time: params.preferredTime,
      },
      source_tool: params.sourceTool,
      has_name: !!params.name,
      page_location: typeof window !== 'undefined' ? window.location.href : undefined,
      page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    });
    
    if (import.meta.env.DEV) {
      console.log('[GTM] booking_confirmed pushed with Enhanced Conversions', {
        leadId: params.leadId.slice(0, 8),
        eventId: eventId.slice(0, 8),
        hasEmail: !!userData?.sha256_email_address,
        hasPhone: !!userData?.sha256_phone_number,
        value: 75,
      });
    }
  } catch (error) {
    console.warn('[GTM] booking_confirmed hashing failed, firing fallback:', error);
    trackEvent('booking_confirmed_fallback', {
      lead_id: params.leadId,
      value: 75,
      currency: 'USD',
      source_tool: params.sourceTool,
      hash_error: true,
    });
  }
};

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

/**
 * Track offline conversion (CRM status updates)
 */
export const trackOfflineConversion = (params: {
  leadId: string;
  conversionType: string;
  value?: number;
  status?: string;
}) => {
  trackEvent('offline_conversion', {
    lead_id: params.leadId,
    conversion_type: params.conversionType,
    conversion_value: params.value,
    lead_status: params.status,
  });
};

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

/**
 * Track conversion value with async PII hashing (Two-Step Tracking pattern)
 * 
 * ENHANCED CONVERSIONS: Email and phone are SHA-256 hashed before pushing
 * to the dataLayer to ensure privacy-safe Enhanced Conversion matching.
 */
export const trackConversionValue = async (params: {
  eventName: string;
  value: number;
  email?: string;
  phone?: string;
  leadId?: string;
  sourceTool?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> => {
  try {
    // Clamp value to [0, 500] as per tracking architecture
    const clampedValue = Math.max(0, Math.min(500, params.value));
    
    // Async PII hashing for Enhanced Conversions (EMQ ≥ 8.0 requirement)
    const [hashedEmail, hashedPhone] = await Promise.all([
      params.email ? sha256(params.email) : Promise.resolve(undefined),
      params.phone ? hashPhone(params.phone) : Promise.resolve(undefined),
    ]);
    
    // Build user_data object only if we have hashed values
    const userData = (hashedEmail || hashedPhone) ? {
      external_id: params.leadId,
      sha256_email_address: hashedEmail || undefined,
      sha256_phone_number: hashedPhone,
      em: hashedEmail || undefined,
      ph: hashedPhone,
    } : undefined;
    
    trackEvent(params.eventName, {
      value: clampedValue,
      lead_id: params.leadId,
      source_tool: params.sourceTool,
      ...(userData && { user_data: userData }),
      ...params.metadata,
    });
    
    if (import.meta.env.DEV) {
      console.log(`[GTM] ${params.eventName} pushed with value ${clampedValue}`, {
        hasEmail: !!hashedEmail,
        hasPhone: !!hashedPhone,
        leadId: params.leadId?.slice(0, 8),
      });
    }
  } catch (error) {
    // Fallback: fire event without PII hashing to avoid losing conversion data
    console.warn('[GTM] PII hashing failed, firing fallback event:', error);
    trackEvent(`${params.eventName}_fallback`, {
      value: Math.max(0, Math.min(500, params.value)),
      lead_id: params.leadId,
      source_tool: params.sourceTool,
      hash_error: true,
      ...params.metadata,
    });
  }
};

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
  
  // High-value conversion tracking
  trackLeadSubmissionSuccess: typeof trackLeadSubmissionSuccess;
  trackPhoneLead: typeof trackPhoneLead;
  trackConsultationBooked: typeof trackConsultationBooked;
  trackBookingConfirmed: typeof trackBookingConfirmed;
  
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
    // High-value conversion tracking
    trackLeadSubmissionSuccess,
    trackPhoneLead,
    trackConsultationBooked,
    trackBookingConfirmed,
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
