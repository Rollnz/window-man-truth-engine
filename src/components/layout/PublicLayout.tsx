import { Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { UnifiedFooter } from '@/components/navigation/UnifiedFooter';
import { MobileStickyFooter } from '@/components/navigation/MobileStickyFooter';

// Lazy load FAB - ensures it's the absolute last thing to load
const FloatingEstimateButton = lazy(() => 
  import('@/components/floating-cta/FloatingEstimateButton').then(m => ({ default: m.FloatingEstimateButton }))
);

/**
 * PublicLayout wraps all public-facing pages with the unified footer system.
 * 
 * This layout automatically includes:
 * - UnifiedFooter: Full footer at page bottom (light-surface always)
 * - MobileStickyFooter: Mobile-only sticky CTA bar (light-surface always)
 * 
 * Excluded routes (should NOT use this layout):
 * - /vault/* (authenticated user dashboard)
 * - /admin/* (admin pages)
 * - /auth (login/signup)
 */
export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content with mobile bottom padding to prevent sticky bar overlap */}
      <main className="flex-1 pb-[var(--mobile-sticky-footer-h)] md:pb-0">
        <Outlet />
      </main>
      
      {/* Full footer at page bottom */}
      <UnifiedFooter />
      
      {/* Mobile-only sticky CTA bar */}
      <MobileStickyFooter />
      
      {/* Floating CTA button - lazy loaded, appears last on all public pages */}
      <Suspense fallback={null}>
        <FloatingEstimateButton />
      </Suspense>
    </div>
  );
}
