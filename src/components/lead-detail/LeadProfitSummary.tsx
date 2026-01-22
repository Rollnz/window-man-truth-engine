import { DollarSign, TrendingUp, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FinancialSummary } from '@/hooks/useLeadFinancials';
import { format } from 'date-fns';

interface LeadProfitSummaryProps {
  summary: FinancialSummary;
  isLoading: boolean;
}

export function LeadProfitSummary({ summary, isLoading }: LeadProfitSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = summary.wonCount > 0 || summary.lostCount > 0 || summary.totalForecast > 0;

  if (!hasData) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Profit Summary</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded bg-green-500/10">
              <DollarSign className="h-3.5 w-3.5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="font-semibold">${summary.totalRevenue.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className={`p-1.5 rounded ${summary.totalProfit >= 0 ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
              <TrendingUp className={`h-3.5 w-3.5 ${summary.totalProfit >= 0 ? 'text-green-600' : 'text-destructive'}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net Profit</p>
              <p className={`font-semibold ${summary.totalProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                ${summary.totalProfit.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded bg-primary/10">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Won / Lost</p>
              <p className="font-semibold">
                <span className="text-green-600">{summary.wonCount}</span>
                {' / '}
                <span className="text-destructive">{summary.lostCount}</span>
              </p>
            </div>
          </div>

          {summary.latestCloseDate && (
            <div className="flex items-start gap-2">
              <div className="p-1.5 rounded bg-muted">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Close</p>
                <p className="font-medium text-sm">
                  {format(new Date(summary.latestCloseDate), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          )}

          {summary.totalForecast > 0 && (
            <div className="col-span-2 pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Pipeline Forecast</span>
                <span className="font-semibold text-primary">${summary.totalForecast.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
