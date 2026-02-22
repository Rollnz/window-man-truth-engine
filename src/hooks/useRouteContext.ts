import { useLocation } from 'react-router-dom';
import { getRouteContext, type RouteContext } from '@/lib/routeContext';

/**
 * Thin React hook — returns route-specific context for the slide-over panel.
 * Re-renders on navigation.
 */
export function useRouteContext(): RouteContext {
  const { pathname } = useLocation();
  return getRouteContext(pathname);
}
