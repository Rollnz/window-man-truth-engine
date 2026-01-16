import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { CostProjection } from '@/lib/calculations';

const TimelineChart = lazy(() => import('./TimelineChart'));

interface TimelineChartLazyProps {
  projection: CostProjection;
}

function ChartSkeleton() {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <Skeleton className="h-6 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}

export function TimelineChartLazy({ projection }: TimelineChartLazyProps) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <TimelineChart projection={projection} />
    </Suspense>
  );
}
