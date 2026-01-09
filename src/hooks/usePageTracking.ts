import { useEffect } from 'react';
import { trackPageView, trackEvent } from '@/lib/gtm';

/**
 * Hook to automatically track page views
 * @param toolName - The name of the tool/page being viewed
 */
export function usePageTracking(toolName: string) {
  useEffect(() => {
    const path = window.location.pathname;
    
    // Track page view in GTM
    trackPageView(path);
    
    // Also track as a tool-specific event for internal analytics
    trackEvent('tool_page_view', {
      tool_name: toolName,
      page_path: path,
      referrer: document.referrer || 'direct',
    });
  }, []); // Fire once on mount
}
