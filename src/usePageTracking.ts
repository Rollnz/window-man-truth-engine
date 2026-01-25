import { useEffect, useRef } from 'react';

/**
 * Emits page view and page exit analytics events and returns a helper to push custom events.
 *
 * @param pageName - Identifier used as `page_name` in all pushed analytics events
 * @returns An object with `trackEvent(eventName, params?)` which pushes a custom event to `window.dataLayer` including `event`, `page_name`, any provided `params`, and a `timestamp`
 */
export function usePageTracking(pageName: string) {
  const startTime = useRef<number>(Date.now());
  const hasTrackedView = useRef(false);

  useEffect(() => {
    // Only track once per mount
    if (hasTrackedView.current) return;
    hasTrackedView.current = true;
    
    startTime.current = Date.now();

    // Fire page view event
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'page_view',
        page_name: pageName,
        page_path: window.location.pathname,
        timestamp: new Date().toISOString(),
      });
    }

    // Track time on page when leaving
    return () => {
      const timeOnPage = Math.round((Date.now() - startTime.current) / 1000);
      
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          event: 'page_exit',
          page_name: pageName,
          time_on_page_seconds: timeOnPage,
          timestamp: new Date().toISOString(),
        });
      }
    };
  }, [pageName]);

  return {
    trackEvent: (eventName: string, params?: Record<string, unknown>) => {
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          event: eventName,
          page_name: pageName,
          ...params,
          timestamp: new Date().toISOString(),
        });
      }
    },
  };
}

// Type declaration for dataLayer
declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}