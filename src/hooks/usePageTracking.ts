import { useEffect } from 'react';
import { logEvent } from '@/lib/windowTruthClient';

/**
 * Hook to automatically track page views
 * @param toolName - The name of the tool/page being viewed
 */
export function usePageTracking(toolName: string) {
  useEffect(() => {
    const referrer = document.referrer || 'direct';
    const path = window.location.pathname;

    logEvent({
      event_name: 'page_view',
      tool_name: toolName,
      page_path: path,
      params: {
        referrer,
        search: window.location.search,
      },
    });
  }, []); // Fire once on mount
}
