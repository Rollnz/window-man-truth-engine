import { Outlet } from 'react-router-dom';
import { UnifiedFooter } from '@/components/navigation/UnifiedFooter';
import { MobileStickyFooter } from '@/components/navigation/MobileStickyFooter';
import { FloatingEstimateButton } from '@/components/floating-cta';

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
      
      {/* Floating CTA button - appears on all public pages */}
      <FloatingEstimateButton />
    </div>
  );
}
