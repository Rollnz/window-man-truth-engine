import { Card, CardContent } from '@/components/ui/card';
import { SessionData } from '@/hooks/useSessionData';
import { formatCurrency } from '@/lib/calculations';
import { TrendingDown, Gauge, Home, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContextBannerProps {
  sessionData: SessionData;
}

export function ContextBanner({ sessionData }: ContextBannerProps) {
  const hasCostData = sessionData.costOfInactionTotal !== undefined;
  const hasRealityScore = sessionData.realityCheckScore !== undefined;
  
  if (!hasCostData && !hasRealityScore) {
    return null;
  }

  const severity = sessionData.realityCheckScore 
    ? sessionData.realityCheckScore >= 76 ? 'high' : sessionData.realityCheckScore >= 51 ? 'medium' : 'low'
    : 'medium';

  return (
    <Card className={cn(
      'border-2',
      severity === 'high' ? 'border-destructive/50 bg-destructive/5' :
      severity === 'medium' ? 'border-orange-500/50 bg-orange-500/5' :
      'border-primary/50 bg-primary/5'
    )}>
      <CardContent className="py-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className={cn(
            'h-4 w-4',
            severity === 'high' ? 'text-destructive' :
            severity === 'medium' ? 'text-orange-500' :
            'text-primary'
          )} />
          <span className="text-sm font-medium">Your Situation Summary</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {hasCostData && (
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">5-Year Loss</p>
                <p className="font-semibold text-destructive">
                  {formatCurrency(sessionData.costOfInactionTotal!)}
                </p>
              </div>
            </div>
          )}
          
          {hasRealityScore && (
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Reality Score</p>
                <p className="font-semibold">{sessionData.realityCheckScore}/100</p>
              </div>
            </div>
          )}
          
          {sessionData.windowCount && (
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Windows</p>
                <p className="font-semibold">{sessionData.windowCount}</p>
              </div>
            </div>
          )}
          
          {sessionData.windowAge && (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4" />
              <div>
                <p className="text-xs text-muted-foreground">Window Age</p>
                <p className="font-semibold">{sessionData.windowAge}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
