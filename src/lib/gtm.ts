// Google Tag Manager utilities with Enhanced Conversion Support
// Phase 1-3: Professional-grade conversion tracking system

export const GTM_ID = 'GTM-NHVFR5QZ';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SHA-256 Hashing for Enhanced Conversions (GA4 + Meta CAPI)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SHA-256 hash function for Enhanced Conversions
 * Hashes PII (email, phone) for privacy-safe server matching
 */
export async function sha256(text: string): Promise<string> {
  if (!text) return '';
  try {
    const encoder = new TextEncoder();
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
 * Hash phone number (strips non-digits before hashing)
 */
export async function hashPhone(phone: string): Promise<string> {
  if (!phone) return '';
  const digitsOnly = phone.replace(/\D/g, '');
  return sha256(digitsOnly);
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

import type { SourceTool } from '@/types/sourceTool';
import type { LeadQuality } from '@/lib/leadQuality';

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
  const hashedEmail = await sha256(params.email);
  const hashedPhone = params.phone ? await hashPhone(params.phone) : undefined;
  
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
  const hashedEmail = await sha256(params.email);
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
 * Track lead capture (email submitted) - legacy signature
 */
export const trackLeadCapture = (params: {
  sourceTool: SourceTool;
  email: string;
  leadScore?: number;
  hasPhone?: boolean;
  leadId?: string;
}) => {
  trackEvent('lead_captured', {
    source_tool: params.sourceTool,
    email_domain: params.email.split('@')[1] || 'unknown',
    lead_score: params.leadScore || 0,
    has_phone: params.hasPhone || false,
    conversion_type: 'lead',
    lead_id: params.leadId,
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
// CRM Offline Conversion Tracking (Phase 7)
// ═══════════════════════════════════════════════════════════════════════════

export interface OfflineConversionParams {
  leadId: string;
  newStatus: 'appointment_set' | 'sat' | 'closed_won' | 'closed_lost';
  dealValue?: number;
  gclid?: string;
  fbclid?: string;
}

/**
 * Track offline conversion when CRM status changes
 * This allows Google/Meta to attribute back to the original ad click
 */
export const trackOfflineConversion = async (params: OfflineConversionParams) => {
  const valueMap: Record<string, number> = {
    'appointment_set': 25,
    'sat': 100,
    'closed_won': params.dealValue || 500,
    'closed_lost': 0,
  };
  
  trackEvent('offline_conversion', {
    lead_id: params.leadId,
    conversion_action: params.newStatus,
    value: valueMap[params.newStatus] || 0,
    currency: 'USD',
    deal_value: params.dealValue,
    gclid: params.gclid,
    fbclid: params.fbclid,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
  });
  
  // Also fire specific event for GTM triggers
  if (params.newStatus === 'closed_won') {
    trackEvent('sale_completed', {
      lead_id: params.leadId,
      value: params.dealValue || 500,
      currency: 'USD',
      gclid: params.gclid,
      fbclid: params.fbclid,
    });
  } else if (params.newStatus === 'appointment_set') {
    trackEvent('appointment_set', {
      lead_id: params.leadId,
      value: 25,
      gclid: params.gclid,
      fbclid: params.fbclid,
    });
  }
  
  console.log('[GTM] offline_conversion event pushed:', params);
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
