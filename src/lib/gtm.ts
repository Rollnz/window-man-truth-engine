// Google Tag Manager utilities with Enhanced Conversion Support
// Phase 1-3: Professional-grade conversion tracking system

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
import { hasExplicitSubmission, getSubmittedLeadId } from '@/lib/consent';
import { normalizeToE164 } from '@/lib/phoneFormat';
import { generateEventId, isDuplicateEvent, isSemanticDuplicate } from '@/lib/eventDeduplication';

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
// Conversion Value Map for Value-Based Bidding
// ═══════════════════════════════════════════════════════════════════════════

export const CONVERSION_VALUES: Record<string, number> = {
  'consultation_booked': 75,
  'quote-scanner': 50,
  'quote-builder': 40,
  'fair-price-quiz': 35,
  'beat-your-quote': 45,
  'risk-diagnostic': 20,
  'intel-library': 10,
  'evidence-locker': 10,
  'claim-survival-kit': 15,
  'comparison-tool': 25,
  'vulnerability-test': 15,
  'fast-win': 20,
  'expert-chat': 30,
  'default': 15,
};

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
// Enhanced Lead Capture Tracking (Phase 1)
// ═══════════════════════════════════════════════════════════════════════════

export interface EnhancedLeadParams {
  leadId: string;
  email: string;
  phone?: string;
  sourceTool: SourceTool | string;
  leadQuality?: LeadQuality;
  metadata?: {
    windowCount?: number;
    urgencyLevel?: string;
    quoteAmount?: number;
    projectValue?: number;
  };
}

/**
 * Track lead submission with Enhanced Conversion data
 * Includes value-based bidding, hashed PII, and source attribution
 */
export const trackLeadSubmissionSuccess = async (params: EnhancedLeadParams) => {
  const value = CONVERSION_VALUES[params.sourceTool] || CONVERSION_VALUES['default'];
  
  // Hash PII for Enhanced Conversions (GA4 + Meta CAPI)
  const hashedEmail = await safeHash(params.email);
  const hashedPhone = await hashPhone(params.phone);
  
  trackEvent('lead_submission_success', {
    // Core conversion data
    lead_id: params.leadId,
    value: value,
    currency: 'USD',
    source_tool: params.sourceTool,
    
    // Enhanced Conversions user_data (GA4 + Meta CAPI)
    user_data: {
      sha256_email_address: hashedEmail,
      sha256_phone_number: hashedPhone,
    },
    
    // Lead Quality for audience segmentation
    lead_quality: params.leadQuality || 'warm',
    
    // Zero-Party Data for Smart Bidding
    conversion_metadata: {
      window_count: params.metadata?.windowCount,
      urgency_level: params.metadata?.urgencyLevel,
      quote_amount: params.metadata?.quoteAmount,
      project_value: params.metadata?.projectValue,
    },
    
    // Source persistence for SPA attribution
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
    page_referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
  });
  
  console.log('[GTM] lead_submission_success event pushed:', {
    lead_id: params.leadId,
    value,
    source_tool: params.sourceTool,
    lead_quality: params.leadQuality,
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// Consultation Booking Tracking (Phase 2)
// ═══════════════════════════════════════════════════════════════════════════

export interface ConsultationParams {
  leadId: string;
  email: string;
  phone: string;
  name: string;
  preferredTime?: string;
  metadata?: {
    windowCount?: number;
    projectValue?: number;
    urgencyLevel?: string;
  };
}

/**
 * Track consultation booking - highest value conversion
 */
export const trackConsultationBooked = async (params: ConsultationParams) => {
  const hashedEmail = await safeHash(params.email);
  const hashedPhone = await hashPhone(params.phone);
  
  trackEvent('consultation_booked', {
    lead_id: params.leadId,
    value: CONVERSION_VALUES['consultation_booked'],
    currency: 'USD',
    
    user_data: {
      sha256_email_address: hashedEmail,
      sha256_phone_number: hashedPhone,
    },
    
    conversion_metadata: {
      window_count: params.metadata?.windowCount,
      estimated_project_value: params.metadata?.projectValue,
      urgency_level: params.metadata?.urgencyLevel,
      preferred_callback_time: params.preferredTime,
    },
    
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
    page_referrer: typeof document !== 'undefined' ? document.referrer : undefined,
  });
  
  console.log('[GTM] consultation_booked event pushed:', params.leadId);
};

// ═══════════════════════════════════════════════════════════════════════════
// Legacy Lead Capture (backward compatibility)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track lead capture (email submitted) - PHASE 2 DEDUPLICATION
 * 
 * CRITICAL: This must fire ONLY after Supabase confirms insert success.
 * Includes event_id and external_id for browser + server deduplication.
 * PHASE 2 REQUIREMENT: Must include email + phone for EMQ ≥ 8.0
 */
export const trackLeadCapture = async (params: {
  sourceTool: SourceTool;
  email: string;
  phone?: string;
  leadScore?: number;
  hasPhone?: boolean;
  leadId?: string;
}) => {
  // PHASE 2 REQUIREMENT: leadId is mandatory for deduplication
  if (!params.leadId) {
    console.error('[GTM] trackLeadCapture: leadId is required for deduplication');
    return;
  }

  // Hash PII for Facebook EMQ matching (Phase 2 requirement)
  const hashedEmail = await safeHash(params.email);
  const hashedPhone = params.phone ? await hashPhone(params.phone) : undefined;

  // Push the canonical lead_captured event with deduplication parameters
  trackEvent('lead_captured', {
    // DEDUPLICATION (Phase 2 - Non-negotiable)
    event_id: params.leadId,           // Deduplication key for browser + server
    external_id: params.leadId,        // Facebook CAPI external_id
    lead_source: params.sourceTool,    // Tool or page identifier
    content_name: params.sourceTool,   // Funnel name for attribution
    
    // User data for Facebook EMQ matching (Phase 2 requirement - EMQ ≥ 8.0)
    user_data: {
      external_id: params.leadId,      // CRM anchor
      em: hashedEmail,                 // Hashed email for EMQ
      ph: hashedPhone,                 // Hashed phone for EMQ (when available)
    },
    
    // Legacy fields (for backward compatibility)
    source_tool: params.sourceTool,
    email_domain: params.email.split('@')[1] || 'unknown',
    lead_score: params.leadScore || 0,
    has_phone: params.hasPhone || !!params.phone,
    conversion_type: 'lead',
    lead_id: params.leadId,
  });
  
  console.log('[GTM] lead_captured event pushed with deduplication:', {
    event_id: params.leadId,
    external_id: params.leadId,
    lead_source: params.sourceTool,
    has_email: !!hashedEmail,
    has_phone: !!hashedPhone,
  });
};

/**
 * Track consultation booking - legacy signature
 */
export const trackConsultation = (params: {
  name: string;
  phone: string;
  email: string;
  leadScore?: number;
}) => {
  trackEvent('consultation_booked', {
    has_name: !!params.name,
    has_phone: !!params.phone,
    has_email: !!params.email,
    lead_score: params.leadScore || 0,
    conversion_type: 'consultation',
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// Micro-Conversion Funnel Events (Phase 3)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track when user first interacts with a form
 */
export const trackFormStart = (params: {
  formId: string;
  sourceTool: string;
}) => {
  trackEvent('form_start', {
    form_id: params.formId,
    source_tool: params.sourceTool,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
    timestamp: Date.now(),
  });
};

/**
 * Track multi-step form progression
 */
export const trackFormStepComplete = (params: {
  formId: string;
  stepNumber: number;
  stepName: string;
  fieldsCompleted?: string[];
}) => {
  trackEvent('form_step_complete', {
    form_id: params.formId,
    step_number: params.stepNumber,
    step_name: params.stepName,
    fields_completed: params.fieldsCompleted,
  });
};

/**
 * Track field-level engagement for CRO analysis
 */
export const trackFormFieldFocus = (params: {
  formId: string;
  fieldName: string;
}) => {
  trackEvent('form_field_focus', {
    form_id: params.formId,
    field_name: params.fieldName,
  });
};

/**
 * Track AI Scanner results (Quote Scanner, Evidence Analysis)
 */
export const trackScanResult = (params: {
  scanType: 'quote' | 'evidence' | 'claim';
  status: 'success' | 'error' | 'partial';
  quoteAmount?: number;
  errorReason?: string;
  processingTimeMs?: number;
}) => {
  trackEvent('ai_scan_complete', {
    scan_type: params.scanType,
    scan_status: params.status,
    quote_amount: params.quoteAmount,
    error_reason: params.errorReason,
    processing_time_ms: params.processingTimeMs,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// Form Abandonment Tracking (Phase 7)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track form abandonment (user entered data but didn't submit)
 */
export const trackFormAbandonment = (params: {
  formId: string;
  sourceTool: string;
  fieldsEntered: string[];
  timeOnFormMs: number;
}) => {
  trackEvent('form_abandonment', {
    form_id: params.formId,
    source_tool: params.sourceTool,
    fields_entered: params.fieldsEntered,
    time_on_form_seconds: Math.round(params.timeOnFormMs / 1000),
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
  });
  
  console.log('[GTM] form_abandonment event pushed:', params.formId);
};

// ═══════════════════════════════════════════════════════════════════════════
// Value-Based Bidding: Delta Tracking (Aligned with Postgres get_event_score)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Delta value map aligned with Postgres get_event_score for consistency
 * These represent incremental "points" for each user action
 */
export const DELTA_VALUES: Record<string, number> = {
  'quote_scanned': 25,
  'quote_generated': 25,
  'evidence_analyzed': 20,
  'fair_price_quiz_completed': 20,
  'reality_check_completed': 15,
  'risk_diagnostic_completed': 15,
  'fast_win_completed': 15,
  'vulnerability_test_completed': 15,
  'cost_calculator_completed': 15,
  'roleplay_completed': 20,
  'lead_captured': 30,
  'consultation_booked': 50,
  'guide_downloaded': 15,
  'expert_chat_session': 20,
  'vault_sync': 15,
  'document_uploaded': 20,
  'email_results_sent': 10,
  'tool_started': 5,
  'tool_viewed': 2,
};

/**
 * Track incremental "delta" conversion value for Value-Based Bidding
 * Enables Google/Meta to optimize for "Super Users" with high engagement
 * 
 * EXPERT-GRADE SAFEGUARDS:
 * 1. Event deduplication via UUID to prevent double-fires
 * 2. Try/catch with fallback to ensure no data loss
 * 3. Privacy-first: PII only included with consent, anonymous events always fire
 * 4. Standardized cv_ prefix for clean GTM reporting
 * 5. E.164 phone normalization for proper match quality
 * 6. Value clamped to sane range (0-10000)
 */
export const trackConversionValue = async (params: {
  eventName: string;
  value: number; // The incremental "delta" points (e.g., +50)
  email?: string;
  phone?: string;
  cumulativeScore?: number; // Total score for debugging
  metadata?: Record<string, unknown>;
  eventId?: string; // Optional: provide your own event ID for deduplication
  leadId?: string; // For semantic dedupe
  toolId?: string; // For semantic dedupe
}) => {
  // Generate event ID for deduplication
  const eventId = params.eventId || generateEventId();
  
  // PHASE 2: Use semantic dedupe for tool events
  const isToolEvent = params.eventName.includes('tool_') || params.toolId;
  
  if (isToolEvent) {
    // Use semantic dedupe for tool events
    if (isSemanticDuplicate(params.eventName, {
      leadId: params.leadId || getSubmittedLeadId() || undefined,
      toolId: params.toolId,
    })) {
      if (import.meta.env.DEV) {
        console.log(`%c[GTM] Semantic duplicate blocked: ${params.eventName}`, 'color: #f59e0b');
      }
      return;
    }
  } else {
    // Legacy UUID dedupe for non-tool events
    if (isDuplicateEvent(eventId)) {
      if (import.meta.env.DEV) {
        console.log(`%c[GTM] Duplicate event blocked: ${params.eventName}`, 'color: #f59e0b');
      }
      return;
    }
  }
  
  // Enforce cv_ prefix for clean GTM reporting
  const prefixedEventName = params.eventName.startsWith('cv_') 
    ? params.eventName 
    : `cv_${params.eventName}`;
  
  // Clamp value to sane range (no negatives, max 10000)
  const clampedValue = Math.max(0, Math.min(params.value, 10000));
  
  try {
    // PHASE 1A: PII ONLY with explicit submission flag
    // This replaces the old implicit consent check
    const hasSubmitted = hasExplicitSubmission();
    let userData: Record<string, string | undefined> | undefined = undefined;
    let piiStatus: 'included' | 'no_pii_provided' | 'no_explicit_submission' = 'no_pii_provided';
    
    // Only include PII if explicit submission flag is set
    if (hasSubmitted && (params.email || params.phone)) {
      userData = {
        sha256_email_address: await safeHash(params.email),
        sha256_phone_number: await hashPhone(params.phone), // Uses E.164
      };
      piiStatus = 'included';
    } else if (!hasSubmitted && (params.email || params.phone)) {
      piiStatus = 'no_explicit_submission';
    }

    // Fire the conversion event (anonymous events ALWAYS fire)
    trackEvent(prefixedEventName, {
      event_id: eventId, // For server-side deduplication
      value: clampedValue,
      currency: 'USD',
      user_data: userData, // Only present if explicit submission + PII provided
      cumulative_score: params.cumulativeScore,
      has_explicit_submission: hasSubmitted,
      pii_status: piiStatus,
      lead_id: params.leadId || getSubmittedLeadId(),
      tool_id: params.toolId,
      ...params.metadata,
      page_location: typeof window !== 'undefined' ? window.location.href : undefined,
      page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    });

    // DEV LOGGING: Full payload visibility
    if (import.meta.env.DEV) {
      console.log(
        `%c[GTM] ${prefixedEventName}`,
        'color: #22c55e; font-weight: bold',
        {
          event_id: eventId.slice(0, 8) + '...',
          delta: clampedValue,
          cumulative: params.cumulativeScore,
          pii_status: piiStatus,
          has_explicit_submission: hasSubmitted,
          metadata: params.metadata,
        }
      );
    }
    
  } catch (error) {
    // FALLBACK: Fire synchronous event without PII to prevent data loss
    console.warn('[GTM] trackConversionValue error, using fallback:', error);
    
    trackEvent(prefixedEventName, {
      event_id: eventId,
      value: clampedValue,
      currency: 'USD',
      fallback: true,
      original_event: params.eventName,
      error_type: error instanceof Error ? error.name : 'unknown',
    });
    
    // Fire debug event for monitoring fallback frequency
    trackEvent('cv_tracking_fallback', {
      event_id: generateEventId(),
      original_event: params.eventName,
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CRM Offline Conversion Tracking (Qualification-Based Bidding)
// ═══════════════════════════════════════════════════════════════════════════

export interface OfflineConversionParams {
  leadId: string;
  newStatus: 'qualified' | 'mql' | 'appointment_set' | 'sat' | 'closed_won' | 'closed_lost' | 'dead';
  dealValue?: number;
  gclid?: string | null;
  fbclid?: string | null;
  email?: string; // For Enhanced Match
}

/**
 * Qualification-Based Offline Conversion Values
 * 
 * STRATEGY: 
 * - Positive signals for real engagement (optimize bidding toward these)
 * - "Dead" leads fire a SEPARATE exclusion event (not negative value)
 * 
 * NOTE: Negative values don't work as expected in Google/Meta bidding.
 * Instead of -$50 for dead, we fire a separate "lead_disqualified" event
 * that should be used for audience exclusions, not bidding optimization.
 */
const OFFLINE_CONVERSION_VALUES: Record<string, number> = {
  'qualified': 35,       // Verified interest + contact info
  'mql': 35,             // Marketing qualified (same as qualified)
  'appointment_set': 50, // Committed time for rep visit
  'sat': 150,            // HIGH-QUALITY SIGNAL: Rep entered the home
  'closed_won': 1500,    // Default sale value (overridden by dealValue)
  'closed_lost': 50,     // NEUTRAL: Same as appointment - they had intent!
  'dead': 0,             // No value - fires separate exclusion event instead
};

/**
 * Track offline conversion when CRM status changes
 * Enables Google/Meta to attribute sales back to original ad clicks
 * 
 * IMPORTANT: Uses the LEAD's original gclid/fbclid from the database,
 * not the admin's browser attribution data
 */
export const trackOfflineConversion = async (params: OfflineConversionParams) => {
  const eventId = generateEventId();
  
  // Skip if dead - we fire a separate exclusion event instead
  const isDead = params.newStatus === 'dead';
  
  const value = params.newStatus === 'closed_won' 
    ? (params.dealValue || OFFLINE_CONVERSION_VALUES['closed_won'])
    : (OFFLINE_CONVERSION_VALUES[params.newStatus] || 0);
  
  // Hash email for Enhanced Match (improves Meta Event Match Quality)
  const hashedEmail = await safeHash(params.email);
  
  // Core offline conversion event (skip for dead leads)
  if (!isDead && value > 0) {
    trackEvent('offline_conversion', {
      event_id: eventId,
      lead_id: params.leadId,
      conversion_action: params.newStatus,
      value: value,
      currency: 'USD',
      deal_value: params.dealValue,
      
      // Click IDs for platform attribution
      gclid: params.gclid,
      fbclid: params.fbclid,
      
      // Enhanced Match for Meta CAPI
      user_data: hashedEmail ? {
        sha256_email_address: hashedEmail,
      } : undefined,
      
      // Source tracking
      page_location: typeof window !== 'undefined' ? window.location.href : undefined,
    });
  }
  
  // Fire specific events for cleaner GTM trigger configuration
  if (params.newStatus === 'closed_won') {
    trackEvent('crm_sale_completed', {
      event_id: generateEventId(),
      lead_id: params.leadId,
      value: value,
      currency: 'USD',
      gclid: params.gclid,
      fbclid: params.fbclid,
      user_data: hashedEmail ? { sha256_email_address: hashedEmail } : undefined,
    });
  } else if (params.newStatus === 'appointment_set') {
    trackEvent('crm_appointment_set', {
      event_id: generateEventId(),
      lead_id: params.leadId,
      value: OFFLINE_CONVERSION_VALUES['appointment_set'],
      currency: 'USD',
      gclid: params.gclid,
      fbclid: params.fbclid,
    });
  } else if (params.newStatus === 'sat') {
    trackEvent('crm_sat_completed', {
      event_id: generateEventId(),
      lead_id: params.leadId,
      value: OFFLINE_CONVERSION_VALUES['sat'],
      currency: 'USD',
      gclid: params.gclid,
      fbclid: params.fbclid,
    });
  } else if (params.newStatus === 'dead') {
    // EXCLUSION EVENT: For audience suppression, NOT bidding optimization
    // This should be configured as a secondary conversion in Google Ads
    // and used for audience exclusions in Meta
    trackEvent('lead_disqualified', {
      event_id: generateEventId(),
      lead_id: params.leadId,
      disqualification_reason: 'dead', // spam, fake info, not interested
      currency: 'USD',
      // Include click IDs for proper attribution matching in exclusions
      gclid: params.gclid,
      fbclid: params.fbclid,
      // Include hashed email for Meta exclusion audiences
      user_data: hashedEmail ? { sha256_email_address: hashedEmail } : undefined,
    });
  } else if (params.newStatus === 'qualified' || params.newStatus === 'mql') {
    trackEvent('crm_lead_qualified', {
      event_id: generateEventId(),
      lead_id: params.leadId,
      value: OFFLINE_CONVERSION_VALUES['qualified'],
      currency: 'USD',
      gclid: params.gclid,
      fbclid: params.fbclid,
    });
  }
  
  console.log('[GTM] offline_conversion event pushed:', {
    lead_id: params.leadId,
    status: params.newStatus,
    value: isDead ? 'excluded' : value,
    has_gclid: !!params.gclid,
    has_fbclid: !!params.fbclid,
    has_email: !!params.email,
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// Tool Completion Tracking
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track tool completion events
 */
export const trackToolCompletion = (params: { 
  toolName: string; 
  score?: number; 
  duration?: number; 
}) => {
  trackEvent('tool_completed', {
    tool_name: params.toolName,
    score: params.score,
    duration_seconds: params.duration ? Math.round(params.duration / 1000) : undefined,
  });
};

/**
 * Track modal open events
 */
export const trackModalOpen = (modalName: string, additionalParams?: Record<string, unknown>) => {
  trackEvent('modal_open', {
    modal_name: modalName,
    ...additionalParams,
  });
};

/**
 * Track form submissions
 */
export const trackFormSubmit = (formName: string, additionalParams?: Record<string, unknown>) => {
  trackEvent('form_submit', {
    form_name: formName,
    ...additionalParams,
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// Phone Lead & Advanced Tracking
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track phone lead capture (triggers FB Lead event via GTM)
 */
export const trackPhoneLead = (params: {
  grade: string;
  leadScore: number;
  quoteAmount?: number;
  toolName?: string;
}) => {
  trackEvent('PhoneLeadCaptured', {
    grade: params.grade,
    lead_score: params.leadScore,
    quote_amount: params.quoteAmount,
    tool_name: params.toolName || 'fair-price-quiz',
    fb_event: 'Lead',
  });
};

/**
 * Track Vault activation (triggers FB CompleteRegistration via GTM)
 */
export const trackVaultActivation = (params: {
  source: string;
  emailDomain?: string;
}) => {
  trackEvent('VaultActivated', {
    source: params.source,
    email_domain: params.emailDomain,
    fb_event: 'CompleteRegistration',
  });
};

/**
 * Track price analysis viewed
 */
export const trackPriceAnalysisViewed = (params: {
  grade: string;
  quoteAmount: number;
  fmvLow: number;
  fmvHigh: number;
  overagePct: number;
}) => {
  trackEvent('PriceAnalysisViewed', {
    grade: params.grade,
    quote_amount: params.quoteAmount,
    fmv_low: params.fmvLow,
    fmv_high: params.fmvHigh,
    overage_pct: params.overagePct,
  });
};

/**
 * Track Vault sync button click
 */
export const trackVaultSyncClicked = (params: {
  source: 'primary' | 'downsell' | 'standalone';
  grade?: string;
}) => {
  trackEvent('VaultSyncClicked', {
    source: params.source,
    grade: params.grade,
  });
};
