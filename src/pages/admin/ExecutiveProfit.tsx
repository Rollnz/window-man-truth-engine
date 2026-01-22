import { useState, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { RefreshCw, Calendar, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { ExecutiveKpiRow } from '@/components/executive/ExecutiveKpiRow';
import { ProfitWaterfallCard } from '@/components/executive/ProfitWaterfallCard';
import { ProfitBySourceTable } from '@/components/executive/ProfitBySourceTable';
import { RedFlagsPanel } from '@/components/executive/RedFlagsPanel';
import { useExecutiveProfit } from '@/hooks/useExecutiveProfit';
import { track } from '@/lib/tracking';

type DatePreset = 'today' | 'last7' | 'last30' | 'custom';
type GroupBy = 'platform' | 'campaign';
type Basis = 'closed_won' | 'captured';

function ExecutiveProfitContent() {
  const [preset, setPreset] = useState<DatePreset>('last7');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [groupBy, setGroupBy] = useState<GroupBy>('platform');
  const [basis, setBasis] = useState<Basis>('closed_won');

  // Memoize date range - use getTime() for stable primitive deps
  const { start, end } = useMemo(() => {
    const now = new Date();
    switch (preset) {
      case 'today':
        return { start: now, end: now };
      case 'last7':
        return { start: subDays(now, 6), end: now };
      case 'last30':
        return { start: subDays(now, 29), end: now };
      case 'custom':
        return {
          start: customStartDate || subDays(now, 6),
          end: customEndDate || now,
        };
      default:
        return { start: subDays(now, 6), end: now };
    }
  }, [preset, customStartDate?.getTime(), customEndDate?.getTime()]);

  const { data, isLoading, error, refetch } = useExecutiveProfit({
    startDate: start,
    endDate: end,
    groupBy,
    basis,
  });

  const handlePresetChange = (newPreset: DatePreset) => {
    setPreset(newPreset);
    track('exec_filter_changed', {
      page_path: '/admin/executive',
      section_id: 'date-filter',
      filters: { preset: newPreset, start_date: format(start, 'yyyy-MM-dd'), end_date: format(end, 'yyyy-MM-dd') },
    });
  };

  const handleBasisChange = (newBasis: Basis) => {
    setBasis(newBasis);
    track('exec_filter_changed', {
      page_path: '/admin/executive',
      section_id: 'basis-filter',
      filters: { basis: newBasis },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Executive Profit Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Daily command center: revenue, profit, and marketing ROI
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Attribution Basis Toggle */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={basis === 'closed_won' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleBasisChange('closed_won')}
                >
                  Closed Won
                </Button>
                <Button
                  variant={basis === 'captured' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleBasisChange('captured')}
                >
                  Captured
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">Attribution Basis</p>
                    <p className="text-xs">
                      <strong>Closed Won:</strong> Matches deals closed in date range to ad spend in same range. Best for "Did we make money this period?"
                    </p>
                    <p className="text-xs mt-1">
                      <strong>Captured:</strong> Matches leads created in date range to ad spend. Best for "What did our ads produce?"
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Date Presets */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={preset === 'today' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handlePresetChange('today')}
                >
                  Today
                </Button>
                <Button
                  variant={preset === 'last7' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handlePresetChange('last7')}
                >
                  7 Days
                </Button>
                <Button
                  variant={preset === 'last30' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handlePresetChange('last30')}
                >
                  30 Days
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={preset === 'custom' ? 'default' : 'ghost'} size="sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      Custom
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="range"
                      selected={{
                        from: customStartDate,
                        to: customEndDate,
                      }}
                      onSelect={(range) => {
                        setCustomStartDate(range?.from);
                        setCustomEndDate(range?.to);
                        if (range?.from && range?.to) {
                          setPreset('custom');
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Date Range Display */}
          <div className="mt-2 text-xs text-muted-foreground">
            {format(start, 'MMM d, yyyy')} — {format(end, 'MMM d, yyyy')}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive">
            <p className="font-medium">Failed to load data</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* KPI Row */}
        <ExecutiveKpiRow kpis={data?.kpis ?? null} isLoading={isLoading} />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Waterfall */}
          <div className="lg:col-span-1">
            <ProfitWaterfallCard waterfall={data?.waterfall ?? null} isLoading={isLoading} />
          </div>

          {/* Red Flags */}
          <div className="lg:col-span-2">
            <RedFlagsPanel redFlags={data?.red_flags ?? []} isLoading={isLoading} />
          </div>
        </div>

        {/* Profit by Source Table */}
        <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
          <TabsList>
            <TabsTrigger value="platform">By Platform</TabsTrigger>
            <TabsTrigger value="campaign">By Campaign</TabsTrigger>
          </TabsList>
          <TabsContent value="platform" className="mt-4">
            <ProfitBySourceTable
              rows={data?.rows ?? []}
              matchCoverage={data?.match_coverage ?? null}
              filters={data?.filters ?? null}
              isLoading={isLoading}
            />
          </TabsContent>
          <TabsContent value="campaign" className="mt-4">
            <ProfitBySourceTable
              rows={data?.rows ?? []}
              matchCoverage={data?.match_coverage ?? null}
              filters={data?.filters ?? null}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function ExecutiveProfit() {
  return (
    <AuthGuard>
      <ErrorBoundary
        title="Dashboard Error"
        description="The Executive Dashboard encountered an error. This may be due to a temporary network issue."
        onReset={() => window.location.reload()}
      >
        <ExecutiveProfitContent />
      </ErrorBoundary>
    </AuthGuard>
  );
}
