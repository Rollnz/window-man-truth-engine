/**
 * Lazy-loaded homepage sections with skeleton placeholders
 * These sections load progressively as the user scrolls, improving initial LCP
 */
import React, { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load below-fold components
const MascotTransition = lazy(() => 
  import('@/components/home/MascotTransition').then(m => ({ default: m.MascotTransition }))
);
const UncomfortableTruth = lazy(() => 
  import('@/components/home/UncomfortableTruth').then(m => ({ default: m.UncomfortableTruth }))
);
const ToolGrid = lazy(() => 
  import('@/components/home/ToolGrid').then(m => ({ default: m.ToolGrid }))
);
const CommunityImpact = lazy(() => 
  import('@/components/authority/CommunityImpact').then(m => ({ default: m.CommunityImpact }))
);
const SocialProof = lazy(() => 
  import('@/components/home/SocialProof').then(m => ({ default: m.SocialProof }))
);
const Footer = lazy(() => 
  import('@/components/home/Footer').then(m => ({ default: m.Footer }))
);

/**
 * Skeleton placeholder for section loading
 * Prevents CLS by reserving space with proper aspect ratios
 */
function SectionSkeleton({ height = 'h-96', className = '' }: { height?: string; className?: string }) {
  return (
    <div className={`w-full ${height} ${className} flex items-center justify-center bg-secondary/20`}>
      <div className="space-y-4 w-full max-w-4xl px-4">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}

/**
 * Minimal skeleton for transition sections
 */
function TransitionSkeleton() {
  return <div className="h-24 w-full bg-gradient-to-b from-background to-secondary/30" />;
}

/**
 * Footer skeleton with reserved space
 */
function FooterSkeleton() {
  return (
    <div className="h-48 w-full bg-secondary/30 flex items-center justify-center">
      <Skeleton className="h-6 w-48" />
    </div>
  );
}

// Export lazy sections with their skeletons wrapped
export function LazyMascotTransition() {
  return (
    <Suspense fallback={<TransitionSkeleton />}>
      <MascotTransition />
    </Suspense>
  );
}

export function LazyUncomfortableTruth() {
  return (
    <Suspense fallback={<SectionSkeleton height="h-[400px]" />}>
      <UncomfortableTruth />
    </Suspense>
  );
}

export function LazyToolGrid() {
  return (
    <Suspense fallback={<SectionSkeleton height="h-[800px]" />}>
      <ToolGrid />
    </Suspense>
  );
}

export function LazyCommunityImpact() {
  return (
    <Suspense fallback={<SectionSkeleton height="h-[300px]" />}>
      <CommunityImpact />
    </Suspense>
  );
}

export function LazySocialProof() {
  return (
    <Suspense fallback={<SectionSkeleton height="h-[200px]" />}>
      <SocialProof />
    </Suspense>
  );
}

export function LazyFooter() {
  return (
    <Suspense fallback={<FooterSkeleton />}>
      <Footer />
    </Suspense>
  );
}
