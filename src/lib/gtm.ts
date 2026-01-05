// GTM Tracking Utilities

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

/**
 * Push an event to the GTM dataLayer
 */
export function trackEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...params,
  });
}

/**
 * Track a virtual pageview for SPA navigation
 */
export function trackPageView(pagePath: string, pageTitle?: string) {
  trackEvent('virtual_pageview', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
  });
}

/**
 * Track modal open events
 */
export function trackModalOpen(modalName: string, additionalParams?: Record<string, unknown>) {
  trackEvent('modal_open', {
    modal_name: modalName,
    ...additionalParams,
  });
}

/**
 * Track form submissions
 */
export function trackFormSubmit(formName: string, additionalParams?: Record<string, unknown>) {
  trackEvent('form_submit', {
    form_name: formName,
    ...additionalParams,
  });
}

/**
 * Track lead capture events
 */
export function trackLeadCapture(toolName: string, additionalParams?: Record<string, unknown>) {
  trackEvent('lead_captured', {
    tool_name: toolName,
    ...additionalParams,
  });
}

/**
 * Track consultation booking events
 */
export function trackConsultation(toolName: string, additionalParams?: Record<string, unknown>) {
  trackEvent('consultation_booked', {
    tool_name: toolName,
    ...additionalParams,
  });
}

/**
 * Track tool completion events
 */
export function trackToolCompletion(toolName: string, additionalParams?: Record<string, unknown>) {
  trackEvent('tool_completed', {
    tool_name: toolName,
    ...additionalParams,
  });
}
/**
 * Track lead capture (email submitted)
 */
export const trackLeadCapture = (params: {
  sourceTool: string;
  email: string;
  leadScore?: number;
  hasPhone?: boolean;
}) => {
  trackEvent('lead_captured', {
    source_tool: params.sourceTool,
    email_domain: params.email.split('@')[1] || 'unknown',
    lead_score: params.leadScore || 0,
    has_phone: params.hasPhone || false,
    conversion_type: 'lead',
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
 * Track tool completion
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
