import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Wand2, Ghost, ShieldAlert, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HealthStats } from '@/hooks/useAnalyticsDashboard';

interface DataHealthActionCardsProps {
  healthStats: HealthStats;
  isLoading: boolean;
  onHealAttribution: () => Promise<{ healed: number }>;
  onReprocessOrphans: () => Promise<{ recovered: number }>;
  onReviewSpam: () => void;
}

export function DataHealthActionCards({
  healthStats,
  isLoading,
  onHealAttribution,
  onReprocessOrphans,
  onReviewSpam,
}: DataHealthActionCardsProps) {
  const [healingInProgress, setHealingInProgress] = useState(false);
  const [reprocessingInProgress, setReprocessingInProgress] = useState(false);

  const hasIssues = 
    healthStats.attributionGapsCount > 0 ||
    healthStats.orphanedEventsCount > 0 ||
    healthStats.spamSignalsCount > 0;

  const handleHeal = async () => {
    setHealingInProgress(true);
    try {
      await onHealAttribution();
    } finally {
      setHealingInProgress(false);
    }
  };

  const handleReprocess = async () => {
    setReprocessingInProgress(true);
    try {
      await onReprocessOrphans();
    } finally {
      setReprocessingInProgress(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading Health Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!hasIssues) {
    return (
      <Card className="border-2 border-green-500/20 bg-green-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Data Health: All Systems Operational
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No attribution gaps, orphaned events, or spam signals detected.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-amber-600">
          <AlertTriangle className="h-5 w-5" />
          Data Health & Action Center
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Attribution Time Machine */}
          <div className={cn(
            "p-4 rounded-lg border",
            healthStats.attributionGapsCount > 0 
              ? "border-amber-500/30 bg-amber-500/10" 
              : "border-border bg-muted/20"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Wand2 className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-sm">Attribution Time Machine</span>
            </div>
            {healthStats.attributionGapsCount > 0 ? (
              <>
                <p className="text-2xl font-bold text-amber-600">
                  {healthStats.attributionGapsCount}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  leads missing UTMs with recoverable history
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-amber-500/50 hover:bg-amber-500/10"
                  onClick={handleHeal}
                  disabled={healingInProgress}
                >
                  {healingInProgress ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Healing...
                    </>
                  ) : (
                    <>
                      🔧 Heal {healthStats.attributionGapsCount} Leads
                    </>
                  )}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                ✓ No attribution gaps
              </p>
            )}
          </div>

          {/* Ghost Lead Resurrector */}
          <div className={cn(
            "p-4 rounded-lg border",
            healthStats.orphanedEventsCount > 0 
              ? "border-amber-500/30 bg-amber-500/10" 
              : "border-border bg-muted/20"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Ghost className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-sm">Ghost Lead Resurrector</span>
            </div>
            {healthStats.orphanedEventsCount > 0 ? (
              <>
                <p className="text-2xl font-bold text-amber-600">
                  {healthStats.orphanedEventsCount}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  orphaned lead events without matching records
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-amber-500/50 hover:bg-amber-500/10"
                  onClick={handleReprocess}
                  disabled={reprocessingInProgress}
                >
                  {reprocessingInProgress ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Reprocessing...
                    </>
                  ) : (
                    <>
                      🔧 Reprocess {healthStats.orphanedEventsCount} Events
                    </>
                  )}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                ✓ No orphaned events
              </p>
            )}
          </div>

          {/* Spam Kill Switch */}
          <div className={cn(
            "p-4 rounded-lg border",
            healthStats.spamSignalsCount > 0 
              ? "border-red-500/30 bg-red-500/10" 
              : "border-border bg-muted/20"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <span className="font-medium text-sm">Spam Signals</span>
            </div>
            {healthStats.spamSignalsCount > 0 ? (
              <>
                <p className="text-2xl font-bold text-red-600">
                  {healthStats.spamSignalsCount}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  suspicious leads detected (0 score, test emails)
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-red-500/50 hover:bg-red-500/10"
                  onClick={onReviewSpam}
                >
                  🔍 Review
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                ✓ No spam signals
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
