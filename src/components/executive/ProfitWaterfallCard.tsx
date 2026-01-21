import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDown, Minus, Equal } from 'lucide-react';
import type { ExecutiveWaterfall } from '@/hooks/useExecutiveProfit';

interface WaterfallLineProps {
  label: string;
  value: number;
  isSubtraction?: boolean;
  isTotal?: boolean;
  isHighlight?: boolean;
}

function WaterfallLine({ label, value, isSubtraction, isTotal, isHighlight }: WaterfallLineProps) {
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value));

  const prefix = isSubtraction ? '−' : isTotal ? '=' : '';
  const valueColor = isHighlight
    ? value >= 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-destructive'
    : isSubtraction
    ? 'text-muted-foreground'
    : 'text-foreground';

  return (
    <div
      className={`flex items-center justify-between py-2 ${
        isTotal ? 'border-t border-border pt-3 mt-1' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        {isSubtraction && <Minus className="h-3 w-3 text-muted-foreground" />}
        {isTotal && <Equal className="h-3 w-3 text-muted-foreground" />}
        <span className={`text-sm ${isTotal ? 'font-semibold' : ''}`}>{label}</span>
      </div>
      <span className={`font-mono text-sm font-medium ${valueColor}`}>
        {prefix} {formattedValue}
      </span>
    </div>
  );
}

interface ProfitWaterfallCardProps {
  waterfall: ExecutiveWaterfall | null;
  isLoading: boolean;
}

export function ProfitWaterfallCard({ waterfall, isLoading }: ProfitWaterfallCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48" />
        </CardContent>
      </Card>
    );
  }

  if (!waterfall) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profit Waterfall</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Profit Waterfall</CardTitle>
        <CardDescription>From gross revenue to marketing-adjusted profit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <WaterfallLine label="Gross Revenue" value={waterfall.gross_revenue} />
        <WaterfallLine label="COGS" value={waterfall.cogs} isSubtraction />
        <WaterfallLine label="Labor" value={waterfall.labor} isSubtraction />
        <WaterfallLine label="Commissions" value={waterfall.commissions} isSubtraction />
        <WaterfallLine label="Other Costs" value={waterfall.other_cost} isSubtraction />
        <WaterfallLine label="Net Profit" value={waterfall.net_profit} isTotal isHighlight />

        <div className="pt-4 border-t mt-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Customer Acquisition Cost
            </span>
          </div>
          <WaterfallLine label="Ad Spend" value={waterfall.ad_spend} isSubtraction />
          <WaterfallLine
            label="Marketing-Adjusted Profit"
            value={waterfall.marketing_adjusted_profit}
            isTotal
            isHighlight
          />
        </div>
      </CardContent>
    </Card>
  );
}
