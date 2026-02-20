import { Outlet } from 'react-router-dom';
import { GlobalLeadSearch } from '@/components/admin/GlobalLeadSearch';
import { GlobalSearchProvider } from '@/contexts/GlobalSearchContext';

/**
 * Shared layout for all admin routes
 * Provides the GlobalLeadSearch dialog available via Cmd+K
 */
export function AdminLayout() {
  return (
    <GlobalSearchProvider>
      <Outlet />
      <GlobalLeadSearch />
    </GlobalSearchProvider>
  );
}
