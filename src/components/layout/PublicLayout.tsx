import { Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { SilentAllyInterceptor } from '@/components/authority/SilentAllyInterceptor';
import { TwilioDiagnostic } from '@/components/dev/TwilioDiagnostic';

// Below-fold components — lazy loaded to keep initial bundle minimal
const UnifiedFooter = lazy(() =>
  import('@/components/navigation/UnifiedFooter').then(m => ({ default: m.UnifiedFooter }))
);

const FloatingEstimateButton = lazy(() =>
  import('@/components/floating-cta/FloatingEstimateButton').then(m => ({ default: m.FloatingEstimateButton }))
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

      {/* Scroll-proximity exit intent interceptor bar — eagerly mounted so
          pageLoadTimeRef and scroll-depth tracking start at navigation time,
          not after chunk resolution. */}
      <SilentAllyInterceptor />

      {/* Dev-only Twilio diagnostic — returns null on production */}
      <TwilioDiagnostic />
    </div>
  );
}
