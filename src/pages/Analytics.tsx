import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateRangePicker, type DateRange } from '@/components/admin/DateRangePicker';
import {
  DataHealthActionCards,
  AnalyticsSummaryCards,
  TrafficLeadsChart,
  ToolPerformanceCards,
  AttributionTable,
  CPACalculator,
} from '@/components/analytics';
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard';
import { ROUTES } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function Analytics() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  const {
    data,
    isLoading,
    error,
    refetch,
    healAttribution,
    reprocessOrphans,
  } = useAnalyticsDashboard({
    startDate: dateRange.startDate ?? null,
    endDate: dateRange.endDate ?? null,
  });

  const handleDateChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };

  const handleReviewSpam = () => {
    // Navigate to leads with spam filter or show modal
    toast({
      title: 'Spam Review',
      description: 'Navigate to Admin > Leads and filter by "spam signals" to review suspicious leads.',
    });
  };

  // Calculate qualified leads from tool performance
  const qualifiedLeads = data.toolPerformance.reduce(
    (sum, t) => sum + t.qualified_leads,
    0
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Tools</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                Truth Engine Analytics
              </h1>
              <p className="text-muted-foreground mt-1">
                First-Party Golden Thread Data — 100% Accuracy, Zero Sampling
              </p>
            </div>

            <div className="flex items-center gap-3">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive">
            <strong>Error loading analytics:</strong> {error}
          </div>
        )}

        {/* Data Health & Action Center */}
        <DataHealthActionCards
          healthStats={data.healthStats}
          isLoading={isLoading}
          onHealAttribution={healAttribution}
          onReprocessOrphans={reprocessOrphans}
          onReviewSpam={handleReviewSpam}
        />

        {/* Summary Cards */}
        <AnalyticsSummaryCards summary={data.summary} isLoading={isLoading} />

        {/* Traffic vs Leads Chart */}
        <TrafficLeadsChart dailyMetrics={data.dailyMetrics} isLoading={isLoading} />

        {/* Tool Performance */}
        <ToolPerformanceCards
          toolPerformance={data.toolPerformance}
          isLoading={isLoading}
        />

        {/* Attribution Table */}
        <AttributionTable attribution={data.attribution} isLoading={isLoading} />

        {/* CPA Calculator */}
        <CPACalculator summary={data.summary} qualifiedLeads={qualifiedLeads} />
      </div>
    </div>
  );
}
