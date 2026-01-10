import { SessionData } from '@/hooks/useSessionData';
import { formatCurrency } from '@/lib/calculations';
import { TrendingDown, Gauge, Home, Clock } from 'lucide-react';
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

  // Compact horizontal banner style
  return (
    <div className={cn(
      'flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 rounded-lg border text-sm',
      severity === 'high' ? 'border-destructive/40 bg-destructive/5' :
      severity === 'medium' ? 'border-warning/40 bg-warning/5' :
      'border-primary/40 bg-primary/5'
    )}>
      {hasCostData && (
        <div className="flex items-center gap-1.5">
          <TrendingDown className="h-3.5 w-3.5 text-destructive shrink-0" />
          <span className="text-muted-foreground">5-Yr Loss:</span>
          <span className="font-semibold text-destructive">
            {formatCurrency(sessionData.costOfInactionTotal!)}
          </span>
        </div>
      )}
      
      {hasRealityScore && (
        <div className="flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground">Score:</span>
          <span className="font-semibold">{sessionData.realityCheckScore}/100</span>
        </div>
      )}
      
      {sessionData.windowCount && (
        <div className="flex items-center gap-1.5">
          <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium">{sessionData.windowCount} windows</span>
        </div>
      )}
      
      {sessionData.windowAge && (
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium">{sessionData.windowAge} yrs old</span>
        </div>
      )}
    </div>
  );
}
