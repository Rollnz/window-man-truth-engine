import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { RiskScoreBreakdown } from '@/lib/riskCalculations';

const RiskRadarChart = lazy(() => import('./RiskRadarChart'));

interface RiskRadarChartLazyProps {
  breakdown: RiskScoreBreakdown;
}

function ChartSkeleton() {
  return (
    <div className="w-full aspect-square max-w-[320px] mx-auto">
      <Skeleton className="w-full h-full rounded-full" />
    </div>
  );
}

export function RiskRadarChartLazy({ breakdown }: RiskRadarChartLazyProps) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <RiskRadarChart breakdown={breakdown} />
    </Suspense>
  );
}
