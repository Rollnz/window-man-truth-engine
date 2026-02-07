import { useEffect } from 'react';
import { trackPageView, trackEvent } from '@/lib/gtm';
import { scheduleWhenIdle } from '@/lib/deferredInit';

/**
 * Hook to automatically track page views
 * - Deferred to idle time to avoid blocking initial render
 * - Uses shorter delay (500ms) since page views are important for analytics
 * @param toolName - The name of the tool/page being viewed
 */
export function usePageTracking(toolName: string) {
  useEffect(() => {
    const path = window.location.pathname;
    const referrer = document.referrer || 'direct';
    
    // Defer page tracking to idle time (shorter delay for page views)
    const cancel = scheduleWhenIdle(() => {
      // Track page view in GTM
      trackPageView(path);
      
      // Also track as a tool-specific event for internal analytics
      trackEvent('tool_page_view', {
        tool_name: toolName,
        page_path: path,
        referrer,
      });
    }, { minDelay: 500, timeout: 2000 });
    
    return cancel;
  }, []); // Fire once on mount
}
