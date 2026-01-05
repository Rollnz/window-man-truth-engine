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
