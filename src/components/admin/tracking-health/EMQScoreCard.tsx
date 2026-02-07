import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, ChevronDown, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EMQScoreCardProps {
  overall: number;
  breakdown: {
    email: number;
    phone: number;
    firstName: number;
    lastName: number;
    fbp: number;
    fbc: number;
  };
  trend: 'up' | 'down' | 'stable';
  previousScore: number;
  totalEvents: number;
  isLoading?: boolean;
}

const trendConfig = {
  up: { icon: TrendingUp, color: 'text-green-500', label: 'up' },
  down: { icon: TrendingDown, color: 'text-red-500', label: 'down' },
  stable: { icon: Minus, color: 'text-muted-foreground', label: 'stable' },
};

const breakdownLabels: Record<string, string> = {
  email: 'Email (hashed)',
  phone: 'Phone (hashed)',
  firstName: 'First Name',
  lastName: 'Last Name',
  fbp: 'Facebook Browser ID',
  fbc: 'Facebook Click ID',
};

export function EMQScoreCard({
  overall,
  breakdown,
  trend,
  previousScore,
  totalEvents,
  isLoading,
}: EMQScoreCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const TrendIcon = trendConfig[trend].icon;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            <span>EMQ Score</span>
            <BarChart3 className="h-4 w-4 animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-10 w-20 bg-muted animate-pulse rounded" />
          <div className="h-4 w-28 bg-muted animate-pulse rounded mt-2" />
        </CardContent>
      </Card>
    );
  }

  const scoreColor = overall >= 8.5 ? 'text-green-500' : overall >= 7 ? 'text-amber-500' : 'text-red-500';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          <span>EMQ Score</span>
          <BarChart3 className="h-4 w-4" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className={cn('text-4xl font-bold tabular-nums', scoreColor)}>
            {overall.toFixed(1)}
          </span>
          <span className="text-lg text-muted-foreground">/10</span>
        </div>
        
        <div className="flex items-center gap-2 mt-1 text-sm">
          <TrendIcon className={cn('h-4 w-4', trendConfig[trend].color)} />
          <span className={trendConfig[trend].color}>
            {trend === 'stable' ? 'No change' : `${trendConfig[trend].label} from ${previousScore.toFixed(1)}`}
          </span>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Based on {totalEvents.toLocaleString()} events
        </p>

        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
            Field breakdown
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
            {Object.entries(breakdown).map(([field, value]) => (
              <div key={field} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{breakdownLabels[field]}</span>
                  <span className="font-medium">{value.toFixed(1)}%</span>
                </div>
                <Progress value={value} className="h-1.5" />
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
