import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, TrendingUp, ToggleLeft, ToggleRight } from "lucide-react";
import { DateRangePicker, DateRange } from "@/components/admin/DateRangePicker";
import { ROASSummaryBar } from "@/components/admin/ROASSummaryBar";
import { ROASProfitabilityTable } from "@/components/admin/ROASProfitabilityTable";
import { useAttributionROAS } from "@/hooks/useAttributionROAS";
import { subDays, format } from "date-fns";

interface ROASOverlaySectionProps {
  className?: string;
}

export function ROASOverlaySection({ className }: ROASOverlaySectionProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });
  const [groupBy, setGroupBy] = useState<'platform' | 'campaign'>('platform');

  const { data, isLoading, refetch } = useAttributionROAS({
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
    groupBy,
  });

  const toggleGroupBy = () => {
    setGroupBy(prev => prev === 'platform' ? 'campaign' : 'platform');
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">ROAS Overlay</CardTitle>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              disabled={isLoading}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleGroupBy}
              className="gap-2"
            >
              {groupBy === 'platform' ? (
                <>
                  <ToggleLeft className="h-4 w-4" />
                  Platform
                </>
              ) : (
                <>
                  <ToggleRight className="h-4 w-4" />
                  Campaign
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <ROASSummaryBar 
          summary={data?.summary || null} 
          isLoading={isLoading} 
        />
        
        <ROASProfitabilityTable
          rows={data?.rows || []}
          groupBy={groupBy}
          startDate={data?.filters.start_date}
          endDate={data?.filters.end_date}
          isLoading={isLoading}
        />
        
        {!isLoading && data && (data.summary.total_spend === 0 || data.summary.deals_won === 0) && (
          <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-md">
            {data.summary.total_spend === 0 && data.summary.deals_won === 0 ? (
              <p>No spend data and no won deals in this period. Add data to see ROAS metrics.</p>
            ) : data.summary.total_spend === 0 ? (
              <p>No spend data for this range. Import ad spend to calculate ROAS.</p>
            ) : (
              <p>No won deals yet. Close deals to see profitability metrics.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
