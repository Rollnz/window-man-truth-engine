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
