// Google Tag Manager utilities with Enhanced Conversion Support
// Phase 1-4: Professional-grade conversion tracking system with Persistent Identity

export const GTM_ID = 'GTM-NHVFR5QZ';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Imports
// ═══════════════════════════════════════════════════════════════════════════

import type { SourceTool } from '@/types/sourceTool';
import type { LeadQuality } from '@/lib/leadQuality';
import { normalizeToE164 } from '@/lib/phoneFormat';
import { calculateLeadScore, getRoutingAction, getCRMTags } from '@/lib/leadScoringEngine';
import { buildEventMetadata, buildGTMEvent, type EventMetadataInput } from './eventMetadataHelper';

// ═══════════════════════════════════════════════════════════════════════════
// SHA-256 Hashing for Enhanced Conversions (GA4 + Meta CAPI)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SHA-256 hash function for Enhanced Conversions
 * Hashes PII (email, phone) for privacy-safe server matching
 * 
 * NORMALIZATION: Email is lowercased and trimmed before hashing
 */
export async function sha256(text: string): Promise<string> {
  if (!text) return '';
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
 * Safe hash wrapper that never throws
 * Returns undefined on any failure instead of throwing
 */
async function safeHash(text: string | undefined | null): Promise<string | undefined> {
  if (!text) return undefined;
  try {
    const hash = await sha256(text);
    return hash || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Hash phone number with E.164 normalization
 * 
 * IMPORTANT: Google expects E.164 format (+1XXXXXXXXXX) for phone hashing
 * Invalid phone numbers return undefined to avoid match quality issues
 */
export async function hashPhone(phone: string | undefined | null): Promise<string | undefined> {
  if (!phone) return undefined;
  
  // Normalize to E.164 first (returns undefined if invalid)
  const e164 = normalizeToE164(phone);
  if (!e164) {
    if (import.meta.env.DEV) {
      console.warn('[GTM] Phone number could not be normalized to E.164:', phone);
    }
    return undefined;
  }
  
  // Hash the E.164 formatted number
  return safeHash(e164);
}

// ═══════════════════════════════════════════════════════════════════════════
// Core Event Tracking
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Push an event to the GTM dataLayer
 */
export const trackEvent = (eventName: string, eventData?: Record<string, unknown>) => {
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
    const hashedEmail = await safeHash(email);
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

      // User Data for EMQ
      user_data: {
        external_id: metadata.external_id,
        em: hashedEmail,
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

    console.log('[GTM] lead_captured event pushed with full metadata:', {
      leadId: metadata.external_id,
      visitorId: metadata.visitor_id,
      sourceTool: metadata.lead_source,
      intentTier: metadata.intent_tier,
      leadScore: leadScoreData.finalScore,
      routing: routingAction.action
    });
  } catch (error) {
    console.error('[GTM] Error tracking lead capture:', error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// Legacy & Specialized Tracking
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track consultation booking
 */
export const trackConsultationBooked = async (params: {
  leadId: string;
  email: string;
  phone: string;
  metadata?: any;
}) => {
  const hashedEmail = await safeHash(params.email);
  const hashedPhone = await hashPhone(params.phone);
  
  trackEvent('consultation_booked', {
    lead_id: params.leadId,
    event_id: params.leadId,
    external_id: params.leadId,
    user_data: {
      sha256_email_address: hashedEmail,
      sha256_phone_number: hashedPhone,
      external_id: params.leadId,
    },
    conversion_metadata: params.metadata,
  });
};

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

// ═══════════════════════════════════════════════════════════════════════════
// Legacy Tracking Functions (for backward compatibility)
// ═══════════════════════════════════════════════════════════════════════════

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
 * Track lead submission success
 */
export const trackLeadSubmissionSuccess = (params: {
  leadId: string;
  sourceTool?: string;
  email?: string;
  phone?: string;
  hasPhone?: boolean;
  name?: string;
}) => {
  trackEvent('lead_submission_success', {
    lead_id: params.leadId,
    source_tool: params.sourceTool,
    email_domain: params.email?.split('@')[1] || 'unknown',
    has_phone: params.hasPhone ?? !!params.phone,
    has_name: !!params.name,
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

// ═══════════════════════════════════════════════════════════════════════════
// Additional Legacy Exports (for backward compatibility with existing code)
// ═══════════════════════════════════════════════════════════════════════════

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
 * Track phone lead capture
 */
export const trackPhoneLead = (params?: {
  sourceTool?: string;
  hasEmail?: boolean;
}) => {
  trackEvent('phone_lead', {
    source_tool: params?.sourceTool,
    has_email: params?.hasEmail,
  });
};

/**
 * Track conversion value with async PII hashing (Two-Step Tracking pattern)
 * 
 * ENHANCED CONVERSIONS: Email and phone are SHA-256 hashed before pushing
 * to the dataLayer to ensure privacy-safe Enhanced Conversion matching.
 * 
 * @param params.eventName - The GTM event name (e.g., 'cv_tool_completed')
 * @param params.value - Conversion value (clamped to 0-500)
 * @param params.email - Raw email (will be hashed)
 * @param params.phone - Raw phone (will be normalized to E.164 and hashed)
 * @param params.leadId - Lead ID for attribution
 * @param params.sourceTool - Source tool identifier
 * @param params.metadata - Additional event metadata
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
      params.email ? safeHash(params.email) : Promise.resolve(undefined),
      params.phone ? hashPhone(params.phone) : Promise.resolve(undefined),
    ]);
    
    // Build user_data object only if we have hashed values
    const userData = (hashedEmail || hashedPhone) ? {
      external_id: params.leadId,
      em: hashedEmail,
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

// ═══════════════════════════════════════════════════════════════════════════
// High-Value Signal Exports (for secondary signal tracking)
// ═══════════════════════════════════════════════════════════════════════════

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
