import { Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Below-fold components — lazy loaded to keep initial bundle minimal
const UnifiedFooter = lazy(() =>
  import('@/components/navigation/UnifiedFooter').then(m => ({ default: m.UnifiedFooter }))
);

const FloatingEstimateButton = lazy(() =>
  import('@/components/floating-cta/FloatingEstimateButton').then(m => ({ default: m.FloatingEstimateButton }))
);

const SilentAllyInterceptor = lazy(() =>
  import('@/components/authority/SilentAllyInterceptor').then(m => ({ default: m.SilentAllyInterceptor }))
);

/**
 * PublicLayout wraps all public-facing pages with the unified footer system.
 *
 * This layout automatically includes:
 * - UnifiedFooter: Full footer at page bottom
 * - FloatingEstimateButton: Floating CTA button
 * - SilentAllyInterceptor: Scroll-proximity exit intent bar
 *
 * Excluded routes (should NOT use this layout):
 * - /vault/* (authenticated user dashboard)
 * - /admin/* (admin pages)
 * - /auth (login/signup)
 */
export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Full footer at page bottom */}
      <Suspense fallback={null}>
        <UnifiedFooter />
      </Suspense>

      {/* Floating CTA button - lazy loaded, appears last on all public pages */}
      <Suspense fallback={null}>
        <FloatingEstimateButton />
      </Suspense>

      {/* Scroll-proximity exit intent interceptor bar */}
      <Suspense fallback={null}>
        <SilentAllyInterceptor />
      </Suspense>
    </div>
  );
}
