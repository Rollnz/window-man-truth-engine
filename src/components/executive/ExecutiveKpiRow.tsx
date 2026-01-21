import { DollarSign, TrendingUp, Target, Users, BarChart3, Percent, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ExecutiveKPIs } from '@/hooks/useExecutiveProfit';

interface KpiCardProps {
  title: string;
  value: string | number | null;
  icon: React.ReactNode;
  format?: 'currency' | 'percent' | 'number' | 'ratio';
  positive?: boolean;
  negative?: boolean;
}

function KpiCard({ title, value, icon, format = 'number', positive, negative }: KpiCardProps) {
  const formatValue = (val: string | number | null): string => {
    if (val === null || val === undefined) return '—';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '—';

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(num);
      case 'percent':
        return `${(num * 100).toFixed(1)}%`;
      case 'ratio':
        return `${num.toFixed(2)}x`;
      default:
        return num.toLocaleString();
    }
  };

  const valueColor = positive
    ? 'text-emerald-600 dark:text-emerald-400'
    : negative
    ? 'text-destructive'
    : 'text-foreground';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className={`text-2xl font-bold ${valueColor}`}>{formatValue(value)}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ExecutiveKpiRowProps {
  kpis: ExecutiveKPIs | null;
  isLoading: boolean;
}

export function ExecutiveKpiRow({ kpis, isLoading }: ExecutiveKpiRowProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const isPositiveProfit = (kpis?.net_profit ?? 0) > 0;
  const isPositiveRoas = (kpis?.roas ?? 0) >= 2;
  const isPositiveMargin = (kpis?.profit_margin ?? 0) >= 0.2;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      <KpiCard
        title="Gross Revenue"
        value={kpis?.gross_revenue ?? null}
        format="currency"
        icon={<DollarSign className="h-5 w-5 text-primary" />}
      />
      <KpiCard
        title="Net Profit"
        value={kpis?.net_profit ?? null}
        format="currency"
        icon={<TrendingUp className="h-5 w-5 text-primary" />}
        positive={isPositiveProfit}
        negative={!isPositiveProfit && kpis?.net_profit !== null}
      />
      <KpiCard
        title="Ad Spend"
        value={kpis?.ad_spend ?? null}
        format="currency"
        icon={<Target className="h-5 w-5 text-primary" />}
      />
      <KpiCard
        title="ROAS"
        value={kpis?.roas ?? null}
        format="ratio"
        icon={<BarChart3 className="h-5 w-5 text-primary" />}
        positive={isPositiveRoas}
        negative={!isPositiveRoas && kpis?.roas !== null}
      />
      <KpiCard
        title="Profit Margin"
        value={kpis?.profit_margin ?? null}
        format="percent"
        icon={<Percent className="h-5 w-5 text-primary" />}
        positive={isPositiveMargin}
        negative={!isPositiveMargin && kpis?.profit_margin !== null}
      />
      <KpiCard
        title="CPA"
        value={kpis?.cpa ?? null}
        format="currency"
        icon={<ShoppingCart className="h-5 w-5 text-primary" />}
      />
      <KpiCard
        title="Deals Won"
        value={kpis?.deals_won ?? null}
        format="number"
        icon={<Users className="h-5 w-5 text-primary" />}
      />
    </div>
  );
}
