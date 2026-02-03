import { Card, CardContent } from '@/components/ui/card';
import { AgentSummary } from '@/hooks/useCallAgents';

interface StatsCardsProps {
  summary: AgentSummary;
  totalAgents: number;
}

export function StatsCards({ summary, totalAgents }: StatsCardsProps) {
  // Determine error border/text colors
  const errorBorderColor = summary.errors_24h === 0 ? 'border-green-500' : 'border-red-500';
  const errorTextColor = summary.errors_24h === 0 ? 'text-green-600' : 'text-red-600';
  const errorSubText = summary.errors_24h === 0 ? 'All clear' : 'Check agent cards';

  // Determine success rate border/text colors
  const getSuccessRateStyles = () => {
    if (summary.success_rate === null) {
      return { border: 'border-gray-300', text: 'text-muted-foreground' };
    }
    if (summary.success_rate >= 80) {
      return { border: 'border-green-500', text: 'text-green-600' };
    }
    if (summary.success_rate >= 50) {
      return { border: 'border-yellow-500', text: 'text-yellow-600' };
    }
    return { border: 'border-red-500', text: 'text-red-600' };
  };

  const successStyles = getSuccessRateStyles();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Active Agents */}
      <Card className="border-l-4 border-blue-500">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-muted-foreground">Active Agents</p>
          <p className="text-2xl font-bold">
            {summary.active_agents}
            <span className="text-base font-normal text-muted-foreground"> / {totalAgents}</span>
          </p>
        </CardContent>
      </Card>

      {/* Card 2: Calls Today */}
      <Card className="border-l-4 border-purple-500">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-muted-foreground">Calls Today</p>
          <p className="text-2xl font-bold">{summary.total_calls_24h}</p>
          <p className="text-xs text-muted-foreground">in the last 24 hours</p>
        </CardContent>
      </Card>

      {/* Card 3: Errors Today */}
      <Card className={`border-l-4 ${errorBorderColor}`}>
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-muted-foreground">Errors Today</p>
          <p className={`text-2xl font-bold ${errorTextColor}`}>{summary.errors_24h}</p>
          <p className={`text-xs ${errorTextColor}`}>{errorSubText}</p>
        </CardContent>
      </Card>

      {/* Card 4: Success Rate */}
      <Card className={`border-l-4 ${successStyles.border}`}>
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-muted-foreground">Success Rate</p>
          <p className={`text-2xl font-bold ${successStyles.text}`}>
            {summary.success_rate === null ? '—' : `${summary.success_rate}%`}
          </p>
          <p className="text-xs text-muted-foreground">
            {summary.success_rate === null ? 'No calls yet today' : 'calls completed successfully'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
