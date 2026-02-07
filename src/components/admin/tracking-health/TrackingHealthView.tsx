import { useState, useEffect, useCallback } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RefreshCw, ChevronDown, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { HealthStatusCard } from './HealthStatusCard';
import { EMQScoreCard } from './EMQScoreCard';
import { FixQueueCard } from './FixQueueCard';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import type { TrackingHealthData, HealthStatus } from './types';
import type { DateRange } from '@/components/admin/DateRangePicker';

interface TrackingHealthViewProps {
  dateRange: DateRange;
  onStatusChange?: (status: HealthStatus) => void;
}

export function TrackingHealthView({ dateRange, onStatusChange }: TrackingHealthViewProps) {
  const [data, setData] = useState<TrackingHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const { toast } = useToast();

  const fetchHealthData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
        return;
      }

      const params = new URLSearchParams();
      if (dateRange.startDate) {
        params.set('start_date', format(startOfDay(dateRange.startDate), "yyyy-MM-dd'T'HH:mm:ss"));
      }
      if (dateRange.endDate) {
        params.set('end_date', format(endOfDay(dateRange.endDate), "yyyy-MM-dd'T'HH:mm:ss"));
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-tracking-health?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch health data: ${response.status}`);
      }

      const result: TrackingHealthData = await response.json();
      setData(result);
      onStatusChange?.(result.systemStatus);
    } catch (error) {
      console.error('[TrackingHealthView] Error:', error);
      toast({
        title: 'Error loading health data',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, toast, onStatusChange]);

  // Initial load
  useEffect(() => {
    if (!hasLoaded) {
      fetchHealthData();
      setHasLoaded(true);
    }
  }, [hasLoaded, fetchHealthData]);

  // Re-fetch when dateRange changes (but only if already loaded)
  useEffect(() => {
    if (hasLoaded) {
      fetchHealthData();
    }
  }, [dateRange.startDate, dateRange.endDate]);

  const handleRetryAll = async () => {
    // TODO: Implement retry endpoint in Phase 2
    toast({
      title: 'Coming soon',
      description: 'Batch retry functionality will be available in Phase 2',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Tracking Health Monitor
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time EMQ scoring, failed event queue, and data quality diagnostics
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchHealthData}
          disabled={isLoading}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HealthStatusCard
          status={data?.systemStatus || 'healthy'}
          reason={data?.statusReason || 'Loading...'}
          isLoading={isLoading && !data}
        />
        <EMQScoreCard
          overall={data?.emqScore.overall || 0}
          breakdown={data?.emqScore.breakdown || { email: 0, phone: 0, firstName: 0, lastName: 0, fbp: 0, fbc: 0 }}
          trend={data?.emqScore.trend || 'stable'}
          previousScore={data?.emqScore.previousScore || 0}
          totalEvents={data?.emqScore.totalEvents || 0}
          isLoading={isLoading && !data}
        />
        <FixQueueCard
          pendingCount={data?.fixQueue.pendingCount || 0}
          deadLetterCount={data?.fixQueue.deadLetterCount || 0}
          resolvedToday={data?.fixQueue.resolvedToday || 0}
          oldestPending={data?.fixQueue.oldestPending || null}
          byDestination={data?.fixQueue.byDestination || {}}
          isLoading={isLoading && !data}
          onRetryAll={handleRetryAll}
        />
      </div>

      {/* Collapsible Diagnostics */}
      <Collapsible open={isDiagnosticsOpen} onOpenChange={setIsDiagnosticsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-4 py-6 border rounded-lg">
            <span className="font-medium">Detailed Diagnostics & Cost Impact</span>
            <ChevronDown className={cn('h-5 w-5 transition-transform', isDiagnosticsOpen && 'rotate-180')} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <DiagnosticsPanel
            diagnostics={data?.diagnostics || {
              orphanEvents: 0,
              duplicateEvents: 0,
              conversionIntegrity: { ok: 0, missing: 0 },
              errorRate: 0,
              totalEvents: 0,
            }}
            costImpact={data?.costImpact || { lostAttributedRevenue: 0, potentialRecovery: 0 }}
            isLoading={isLoading && !data}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
