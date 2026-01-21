import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  Users, 
  CheckCircle2, 
  BarChart3,
  PiggyBank
} from "lucide-react";
import type { ROASSummary } from "@/hooks/useAttributionROAS";

interface ROASSummaryBarProps {
  summary: ROASSummary | null;
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toLocaleString()}`;
}

function formatNumber(value: number | null, suffix?: string): string {
  if (value === null || !isFinite(value)) return '—';
  const formatted = value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toFixed(2);
  return suffix ? `${formatted}${suffix}` : formatted;
}

export function ROASSummaryBar({ summary, isLoading = false }: ROASSummaryBarProps) {
  const cards = [
    {
      title: "Total Spend",
      value: summary ? formatCurrency(summary.total_spend) : '—',
      icon: DollarSign,
      color: "text-muted-foreground",
    },
    {
      title: "Total Revenue",
      value: summary ? formatCurrency(summary.total_revenue) : '—',
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      title: "Total Profit",
      value: summary ? formatCurrency(summary.total_profit) : '—',
      icon: PiggyBank,
      color: summary && summary.total_profit >= 0 ? "text-primary" : "text-destructive",
    },
    {
      title: "ROAS",
      value: summary ? formatNumber(summary.roas, 'x') : '—',
      icon: Target,
      color: summary?.roas && summary.roas >= 1 ? "text-primary" : "text-destructive",
    },
    {
      title: "CPA",
      value: summary?.cpa !== null ? formatCurrency(summary?.cpa || 0) : '—',
      icon: BarChart3,
      color: "text-muted-foreground",
    },
    {
      title: "Deals Won",
      value: summary?.deals_won?.toLocaleString() || '0',
      icon: CheckCircle2,
      color: "text-primary",
    },
    {
      title: "Leads",
      value: summary?.leads_total?.toLocaleString() || '0',
      icon: Users,
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((card) => (
        <Card key={card.title} className="overflow-hidden">
          <CardContent className="p-3">
            {isLoading ? (
              <>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-6 w-12" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <card.icon className="h-3.5 w-3.5" />
                  <span>{card.title}</span>
                </div>
                <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
