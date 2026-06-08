import { Outlet } from 'react-router-dom';
import { GlobalLeadSearch } from '@/components/admin/GlobalLeadSearch';
import { GlobalSearchProvider } from '@/contexts/GlobalSearchContext';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

/**
 * Shared layout for all admin routes
 * Provides the GlobalLeadSearch dialog available via Cmd+K
 */
export function AdminLayout() {
  return (
    <GlobalSearchProvider>
      <ErrorBoundary title="Admin section error" showRetry>
        <Outlet />
      </ErrorBoundary>
      <GlobalLeadSearch />
    </GlobalSearchProvider>
  );
}
