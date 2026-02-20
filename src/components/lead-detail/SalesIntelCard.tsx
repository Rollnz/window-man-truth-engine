import { useState } from 'react';
import { Crosshair, Loader2, AlertTriangle, CheckCircle, Sparkles, RefreshCw, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AiPreAnalysis } from '@/hooks/useLeadDetail';

interface SalesIntelCardProps {
  aiPreAnalysis: AiPreAnalysis | null;
  onTriggerAnalysis?: () => Promise<boolean>;
}

export function SalesIntelCard({ aiPreAnalysis, onTriggerAnalysis }: SalesIntelCardProps) {
  const [isTriggering, setIsTriggering] = useState(false);

  const handleTrigger = async () => {
    if (!onTriggerAnalysis || isTriggering) return;
    setIsTriggering(true);
    try {
      await onTriggerAnalysis();
    } finally {
      setIsTriggering(false);
    }
  };

  // No quote file at all — nothing to show
  if (!aiPreAnalysis) {
    return null;
  }

  // Status: none — quote uploaded but never analyzed
  if (aiPreAnalysis.status === 'none') {
    return (
      <Card className="mb-6 border-muted">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Quote uploaded but not yet analyzed
            </span>
          </div>
          {onTriggerAnalysis && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleTrigger}
              disabled={isTriggering}
              className="gap-2"
            >
              {isTriggering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Run AI Analysis
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Pending: fixed-height skeleton to prevent layout shift
  if (aiPreAnalysis.status === 'pending') {
    return (
      <Card className="mb-6 border-primary/30 animate-pulse">
        <CardContent className="flex items-center gap-3 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Analyzing competitor quote...
          </span>
        </CardContent>
        <div className="px-6 pb-4">
          <Skeleton className="h-24 w-full" />
        </div>
      </Card>
    );
  }

  // Failed: muted card with retry button — stale error is hidden when triggering
  if (aiPreAnalysis.status === 'failed') {
    return (
      <Card className="mb-6 border-destructive/30">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {isTriggering ? (
              <span className="text-sm text-muted-foreground">Retrying analysis...</span>
            ) : (
              <span className="text-sm text-muted-foreground">
                Quote analysis failed{aiPreAnalysis.reason ? `: ${aiPreAnalysis.reason}` : ''}
              </span>
            )}
          </div>
          {onTriggerAnalysis && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleTrigger}
              disabled={isTriggering}
              className="gap-2"
            >
              {isTriggering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Retry Analysis
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Completed: full tactical HUD
  const result = aiPreAnalysis.result;
  if (!result) return null;

  const price = result.estimated_total_price;
  const priceText = Number.isFinite(price)
    ? `$${Math.round(price!).toLocaleString()}`
    : 'Not detected';

  const markupBadge = () => {
    switch (result.detected_markup_level) {
      case 'High':
        return <Badge variant="destructive">High Markup</Badge>;
      case 'Average':
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
            Average Markup
          </Badge>
        );
      case 'Low':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
            Low Markup
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown Markup</Badge>;
    }
  };

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Crosshair className="h-5 w-5 text-primary" />
          Competitor Quote Intel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
              Estimated Price
            </p>
            <p className="text-lg font-bold">{priceText}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
              Brand / Material
            </p>
            <p className="text-sm font-medium">{result.window_brand_or_material}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
              Markup Level
            </p>
            {markupBadge()}
          </div>
        </div>

        {/* Red Flags */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">
            Red Flags
          </p>
          <div className="flex flex-wrap gap-2">
            {result.red_flags.length > 0 ? (
              result.red_flags.map((flag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-destructive/10 text-destructive border border-destructive/20"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {flag}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="h-3 w-3" />
                No red flags detected
              </span>
            )}
          </div>
        </div>

        {/* Sales Angle callout */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide font-semibold mb-1">
            What to say on the call
          </p>
          <p className="text-sm text-blue-900 dark:text-blue-100">
            {result.sales_angle}
          </p>
        </div>

        {/* Footer metadata */}
        {(aiPreAnalysis.model || aiPreAnalysis.completed_at) && (
          <p className="text-xs text-muted-foreground">
            {aiPreAnalysis.model && <span>Model: {aiPreAnalysis.model}</span>}
            {aiPreAnalysis.model && aiPreAnalysis.completed_at && <span> · </span>}
            {aiPreAnalysis.completed_at && (
              <span>Completed {new Date(aiPreAnalysis.completed_at).toLocaleString()}</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
