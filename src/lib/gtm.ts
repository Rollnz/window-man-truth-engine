// Google Tag Manager utilities
export const GTM_ID = 'GTM-NHVFR5QZ';

// Google Ads Conversion ID
export const GOOGLE_ADS_ID = 'AW-17439985315';
export const GOOGLE_ADS_LEAD_CONVERSION_LABEL = '-1ITCNSm2-gbEKOdhPxA';

// Facebook Pixel ID
export const FB_PIXEL_ID = '1908588773426244';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Push an event to the GTM dataLayer
 */
export const trackEvent = (eventName: string, eventData?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: eventName,
      ...eventData,
    });
  }
};

export const trackPageView = (url: string) => {
  trackEvent('page_view', { page_path: url });
};

import type { SourceTool } from '@/types/sourceTool';

/**
 * Track lead capture (email submitted)
 */
export const trackLeadCapture = (params: {
  sourceTool: SourceTool;
  email: string;
  leadScore?: number;
  hasPhone?: boolean;
  /** Golden Thread lead ID for attribution */
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
 * Track consultation booking
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

/**
 * Track Google Ads conversion for lead form submissions.
 * This fires only on successful lead capture (not button clicks).
 * 
 * @param params Optional additional parameters for the conversion event
 */
export const trackGoogleAdsConversion = (params?: {
  /** Optional transaction ID for deduplication */
  transactionId?: string;
  /** Optional lead value */
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LEAD_CONVERSION_LABEL}`,
      ...(params?.transactionId && { transaction_id: params.transactionId }),
      ...(params?.value && { value: params.value, currency: 'USD' }),
    });
    console.log('[Google Ads] Conversion event fired:', {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LEAD_CONVERSION_LABEL}`,
      ...params,
    });
  } else {
    console.warn('[Google Ads] gtag not available - conversion not tracked');
  }
};

/**
 * Track Facebook Pixel Lead conversion for form submissions.
 * This fires only on successful lead capture (not button clicks).
 * 
 * @param params Optional additional parameters for the conversion event
 */
export const trackFacebookConversion = (params?: {
  /** Event ID for deduplication (use leadId) */
  eventId?: string;
  /** Lead value */
  value?: number;
  /** Content name (e.g., source tool) */
  contentName?: string;
}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead', {
      content_name: params?.contentName || 'lead_form',
      value: params?.value || 0,
      currency: 'USD',
    }, {
      eventID: params?.eventId, // For CAPI deduplication
    });
    console.log('[Facebook Pixel] Lead event fired:', {
      eventId: params?.eventId,
      contentName: params?.contentName,
      value: params?.value,
    });
  } else {
    console.warn('[Facebook Pixel] fbq not available - conversion not tracked');
  }
};

/**
 * Track conversions on both Google Ads and Facebook Pixel.
 * Convenience function that fires both platform conversions at once.
 */
export const trackAllConversions = (params?: {
  /** Transaction/Event ID for deduplication */
  transactionId?: string;
  /** Lead value */
  value?: number;
  /** Source tool name */
  sourceTool?: string;
}) => {
  trackGoogleAdsConversion({
    transactionId: params?.transactionId,
    value: params?.value,
  });
  trackFacebookConversion({
    eventId: params?.transactionId,
    value: params?.value,
    contentName: params?.sourceTool,
  });
};
