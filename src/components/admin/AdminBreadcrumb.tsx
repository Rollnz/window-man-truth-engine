import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  '/admin': 'Command Center',
  '/admin/crm': 'Lead Warehouse',
  '/admin/attribution': 'Attribution',
  '/admin/quotes': 'Quote Uploads',
  '/admin/leads': 'Lead Detail',
};

interface AdminBreadcrumbProps {
  items?: BreadcrumbItem[];
  currentLabel?: string;
  className?: string;
}

export function AdminBreadcrumb({ items, currentLabel, className }: AdminBreadcrumbProps) {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from path if not provided
  const breadcrumbs: BreadcrumbItem[] = items || (() => {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [{ label: 'Command Center', href: '/admin' }];
    
    if (parts.length > 1) {
      const section = `/${parts.slice(0, 2).join('/')}`;
      if (ROUTE_LABELS[section]) {
        crumbs.push({ label: ROUTE_LABELS[section], href: section });
      }
    }
    
    return crumbs;
  })();

  return (
    <nav className={cn('flex items-center gap-1 text-sm', className)} aria-label="Breadcrumb">
      <Link
        to="/admin"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {breadcrumbs.slice(1).map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {item.href ? (
            <Link
              to={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-muted-foreground">{item.label}</span>
          )}
        </div>
      ))}
      
      {currentLabel && (
        <div className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground font-medium truncate max-w-[150px]">{currentLabel}</span>
        </div>
      )}
    </nav>
  );
}
