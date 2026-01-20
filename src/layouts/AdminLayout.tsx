import { Outlet } from 'react-router-dom';
import { GlobalLeadSearch } from '@/components/admin/GlobalLeadSearch';

/**
 * Shared layout for all admin routes
 * Provides the GlobalLeadSearch dialog available via Cmd+K
 */
export function AdminLayout() {
  return (
    <>
      <Outlet />
      <GlobalLeadSearch />
    </>
  );
}
