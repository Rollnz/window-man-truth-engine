import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, DollarSign, GitBranch, Copy, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrackingHealthData } from './types';

interface DiagnosticsPanelProps {
  diagnostics: TrackingHealthData['diagnostics'];
  costImpact: TrackingHealthData['costImpact'];
  isLoading?: boolean;
}

export function DiagnosticsPanel({ diagnostics, costImpact, isLoading }: DiagnosticsPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 badge-shimmer" />
          <Skeleton className="h-6 w-56 badge-shimmer" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 badge-shimmer" />
                  <Skeleton className="h-4 w-24 badge-shimmer" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-8 w-16 badge-shimmer" />
                  <Skeleton className="h-4 w-4 rounded-full badge-shimmer" />
                </div>
                <Skeleton className="h-3 w-full badge-shimmer" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32 badge-shimmer" />
              <Skeleton className="h-5 w-12 rounded-full badge-shimmer" />
            </div>
            <Skeleton className="h-2 w-full badge-shimmer" />
            <Skeleton className="h-3 w-64 badge-shimmer" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const integrityRate = diagnostics.conversionIntegrity.ok + diagnostics.conversionIntegrity.missing > 0
    ? (diagnostics.conversionIntegrity.ok / (diagnostics.conversionIntegrity.ok + diagnostics.conversionIntegrity.missing)) * 100
    : 100;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <GitBranch className="h-5 w-5" />
        Diagnostics & Cost Impact
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Orphan Events */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Orphan Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                'text-2xl font-bold',
                diagnostics.orphanEvents > 0 ? 'text-amber-500' : 'text-green-500'
              )}>
                {diagnostics.orphanEvents}
              </span>
              {diagnostics.orphanEvents === 0 && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Events without linked leads
            </p>
          </CardContent>
        </Card>

        {/* Duplicate Events */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Duplicates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                'text-2xl font-bold',
                diagnostics.duplicateEvents > 0 ? 'text-amber-500' : 'text-green-500'
              )}>
                {diagnostics.duplicateEvents}
              </span>
              {diagnostics.duplicateEvents === 0 && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Duplicate event IDs detected
            </p>
          </CardContent>
        </Card>

        {/* Conversion Integrity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Conversion Integrity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                'text-2xl font-bold',
                integrityRate >= 95 ? 'text-green-500' : integrityRate >= 80 ? 'text-amber-500' : 'text-red-500'
              )}>
                {integrityRate.toFixed(0)}%
              </span>
            </div>
            <Progress value={integrityRate} className="h-1.5 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {diagnostics.conversionIntegrity.ok} OK / {diagnostics.conversionIntegrity.missing} missing
            </p>
          </CardContent>
        </Card>

        {/* Cost Impact */}
        <Card className="bg-gradient-to-br from-red-500/5 to-amber-500/5 border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Est. Lost Attribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-red-500">
                ${costImpact.lostAttributedRevenue.toLocaleString()}
              </span>
            </div>
            {costImpact.potentialRecovery > 0 && (
              <p className="text-xs text-green-500 mt-1">
                ${costImpact.potentialRecovery.toLocaleString()} recoverable
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Based on failed events × $75 × 15% conv rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Rate Bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Fallback Error Rate</span>
            <Badge variant={diagnostics.errorRate > 5 ? 'destructive' : diagnostics.errorRate > 2 ? 'secondary' : 'default'}>
              {diagnostics.errorRate.toFixed(1)}%
            </Badge>
          </div>
          <Progress 
            value={Math.min(diagnostics.errorRate, 100)} 
            className={cn(
              'h-2',
              diagnostics.errorRate > 5 && '[&>div]:bg-red-500',
              diagnostics.errorRate > 2 && diagnostics.errorRate <= 5 && '[&>div]:bg-amber-500'
            )} 
          />
          <p className="text-xs text-muted-foreground mt-2">
            % of cv_* events that are cv_fallback (should be &lt;2%)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
