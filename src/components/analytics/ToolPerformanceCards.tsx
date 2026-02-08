import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScanLine, Calculator, Stethoscope, MessageSquare, Phone, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolPerformanceRow } from '@/hooks/useAnalyticsDashboard';

interface ToolPerformanceCardsProps {
  toolPerformance: ToolPerformanceRow[];
  isLoading: boolean;
}

const toolIcons: Record<string, typeof ScanLine> = {
  'quote-scanner': ScanLine,
  'beat-your-quote': ScanLine,
  'cost-calculator': Calculator,
  'risk-diagnostic': Stethoscope,
  'expert-chat': MessageSquare,
  'roleplay': MessageSquare,
  'voice-estimate': Phone,
  'consultation': Phone,
};

const toolLabels: Record<string, string> = {
  'quote-scanner': 'Quote Scanner',
  'beat-your-quote': 'Beat Your Quote',
  'cost-calculator': 'Cost Calculator',
  'risk-diagnostic': 'Risk Diagnostic',
  'expert-chat': 'Expert Chat',
  'roleplay': 'Roleplay Game',
  'voice-estimate': 'Voice Estimate',
  'consultation': 'Consultation',
};

export function ToolPerformanceCards({ toolPerformance, isLoading }: ToolPerformanceCardsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tool Performance (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (toolPerformance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tool Performance</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          No tool performance data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tool Performance (30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {toolPerformance.map((tool) => {
            const Icon = toolIcons[tool.source_tool] || FileText;
            const label = toolLabels[tool.source_tool] || tool.source_tool;
            
            const qualRateBadge = tool.qualification_rate >= 20
              ? 'bg-green-500/10 text-green-600 border-green-500/30'
              : tool.qualification_rate >= 10
              ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
              : 'bg-red-500/10 text-red-600 border-red-500/30';

            return (
              <div
                key={tool.source_tool}
                className="p-4 rounded-lg border bg-muted/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{label}</span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold">{tool.total_leads}</span>
                  <span className="text-sm text-muted-foreground">leads</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('text-xs', qualRateBadge)}>
                    {tool.qualification_rate}% qualified
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ({tool.qualified_leads})
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Avg Score: {tool.avg_engagement_score}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
