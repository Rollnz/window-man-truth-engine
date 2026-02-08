import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, TrendingUp, ScanLine, Calculator, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { AnalyticsSummary } from '@/hooks/useAnalyticsDashboard';

interface AnalyticsSummaryCardsProps {
  summary: AnalyticsSummary;
  isLoading: boolean;
}

export function AnalyticsSummaryCards({ summary, isLoading }: AnalyticsSummaryCardsProps) {
  const cards = [
    {
      title: 'Visitors',
      value: summary.totalVisitors.toLocaleString(),
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Leads',
      value: summary.totalLeads.toLocaleString(),
      icon: UserCheck,
      color: 'text-green-500',
    },
    {
      title: 'Conversion Rate',
      value: `${summary.overallConversionRate}%`,
      icon: TrendingUp,
      color: 'text-purple-500',
    },
    {
      title: 'Quote Scans',
      value: summary.totalScans.toLocaleString(),
      icon: ScanLine,
      color: 'text-amber-500',
    },
    {
      title: 'Calculators',
      value: summary.totalCalculators.toLocaleString(),
      icon: Calculator,
      color: 'text-cyan-500',
    },
    {
      title: 'Consultations',
      value: summary.totalConsultations.toLocaleString(),
      icon: Calendar,
      color: 'text-pink-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{card.value}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
