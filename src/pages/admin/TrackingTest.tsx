/**
 * Tracking Verification Test Page
 * 
 * Developer-only page for testing Meta Pixel deduplication pipeline.
 * Access via /admin/tracking-test (requires admin auth)
 */

import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Code,
  Network,
  Database,
  Fingerprint,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  runTrackingVerificationTest, 
  quickDataLayerCheck,
  generateSyntheticLead,
  findWmLeadEvent,
  validateDataLayerEvent,
  type TrackingVerificationReport 
} from '@/lib/trackingVerificationTest';

interface QuickCheckResult {
  eventCount: number;
  latestEvent: Record<string, unknown> | null;
  hasLeadId: boolean;
  hasEventId: boolean;
  validationScore: number | null;
}

export default function TrackingTestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<TrackingVerificationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quickCheckResult, setQuickCheckResult] = useState<QuickCheckResult | null>(null);
  const { toast } = useToast();

  const handleRunTest = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      const result = await runTrackingVerificationTest();
      setReport(result);
    } catch (err) {
      console.error('[TrackingTest] Error:', err);
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setIsRunning(false);
    }
  }, []);

  const handleQuickCheck = useCallback(() => {
    const dataLayer = typeof window !== 'undefined' ? (window as any).dataLayer : undefined;
    const eventCount = Array.isArray(dataLayer) ? dataLayer.length : 0;

    const wmLeadEvent = findWmLeadEvent();
    let validationScore: number | null = null;
    let hasLeadId = false;
    let hasEventId = false;

    if (wmLeadEvent) {
      const validation = validateDataLayerEvent(wmLeadEvent);
      validationScore = validation.score;
      hasLeadId = !!wmLeadEvent.lead_id;
      hasEventId = !!wmLeadEvent.event_id;
    }

    setQuickCheckResult({
      eventCount,
      latestEvent: wmLeadEvent as Record<string, unknown> | null,
      hasLeadId,
      hasEventId,
      validationScore,
    });

    if (eventCount > 0) {
      toast({
        title: 'DataLayer Active',
        description: `Found ${eventCount} events.`,
      });
    } else {
      toast({
        title: 'Warning: DataLayer Empty',
        description: 'Check for ad-blockers or GTM configuration.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const getStatusIcon = (status: 'PASS' | 'PARTIAL' | 'FAIL') => {
    switch (status) {
      case 'PASS':
        return <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />;
      case 'PARTIAL':
        return <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />;
      case 'FAIL':
        return <XCircle className="h-6 w-6 text-destructive" />;
    }
  };

  const getStatusColor = (status: 'PASS' | 'PARTIAL' | 'FAIL') => {
    switch (status) {
      case 'PASS':
        return 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-600/20';
      case 'PARTIAL':
        return 'bg-amber-600/10 text-amber-600 dark:text-amber-400 border-amber-600/20';
      case 'FAIL':
        return 'bg-destructive/10 text-destructive border-destructive/20';
    }
  };

  return (
    <>
      <Helmet>
        <title>Tracking Test | Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="container max-w-5xl py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">E2E Tracking Verification</h1>
            <p className="text-muted-foreground">
              Meta Pixel Deduplication Pipeline Test
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            Developer Tool
          </Badge>
        </div>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="h-5 w-5" />
              Run Verification Test
            </CardTitle>
            <CardDescription>
              Generates a synthetic lead, fires tracking events, and verifies the pipeline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button 
                onClick={handleRunTest} 
                disabled={isRunning}
                className="gap-2"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running Test...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Full Test
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleQuickCheck}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Quick DataLayer Check
              </Button>
              {quickCheckResult && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setQuickCheckResult(null)}
                  className="gap-1 text-muted-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Results
                </Button>
              )}
            </div>

            {/* Quick Check Results Panel */}
            {quickCheckResult && (
              <div className="space-y-4 pt-2">
                <Separator />
                <div className="grid sm:grid-cols-3 gap-3">
                  {/* Event Counter */}
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold">{quickCheckResult.eventCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">DataLayer Events</p>
                  </div>

                  {/* Deduplication Badge */}
                  <div className="bg-muted rounded-lg p-4 flex flex-col items-center justify-center gap-2">
                    <Badge 
                      variant={quickCheckResult.hasLeadId && quickCheckResult.hasEventId ? 'default' : 'secondary'}
                      className={cn(
                        quickCheckResult.hasLeadId && quickCheckResult.hasEventId
                          ? 'bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border border-emerald-600/20'
                          : 'bg-amber-600/15 text-amber-600 dark:text-amber-400 border border-amber-600/20'
                      )}
                    >
                      {quickCheckResult.hasLeadId && quickCheckResult.hasEventId
                        ? 'Deduplication Ready'
                        : 'Incomplete'}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {quickCheckResult.hasLeadId ? '✓ lead_id' : '✗ lead_id'}
                      {' · '}
                      {quickCheckResult.hasEventId ? '✓ event_id' : '✗ event_id'}
                    </p>
                  </div>

                  {/* Validation Score */}
                  <div className="bg-muted rounded-lg p-4 text-center">
                    {quickCheckResult.validationScore !== null ? (
                      <>
                        <p className="text-3xl font-bold">
                          {quickCheckResult.validationScore.toFixed(1)}
                          <span className="text-lg text-muted-foreground">/10</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">EMQ Score</p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-medium text-muted-foreground">—</p>
                        <p className="text-xs text-muted-foreground mt-1">No wm_lead event</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Live JSON Preview */}
                {quickCheckResult.latestEvent && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Latest wm_lead Event</p>
                    <ScrollArea className="h-48 w-full rounded-md border bg-muted/50">
                      <pre className="p-4 text-xs font-mono">
                        {JSON.stringify(quickCheckResult.latestEvent, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
            
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        {report && (
          <>
            {/* Overall Status */}
            <Card className={cn('border-2', getStatusColor(report.overallStatus))}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(report.overallStatus)}
                    <div>
                      <h3 className="text-lg font-semibold">
                        {report.overallStatus === 'PASS' ? 'All Checks Passed' : 
                         report.overallStatus === 'PARTIAL' ? 'Partial Success' : 
                         'Issues Detected'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Tested at {new Date(report.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">
                      {report.emqProjectedScore.toFixed(1)}
                      <span className="text-lg text-muted-foreground">/10</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Projected EMQ</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Results Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* DataLayer Check */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    DataLayer Event
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Event Found</span>
                    <Badge variant={report.dataLayerCheck.found ? 'default' : 'destructive'}>
                      {report.dataLayerCheck.found ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  
                  {report.dataLayerCheck.validation && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Validation Score</span>
                        <span className="font-mono text-sm">
                          {report.dataLayerCheck.validation.score.toFixed(1)}/10
                        </span>
                      </div>
                      
                      {report.dataLayerCheck.validation.issues.length > 0 && (
                        <div className="space-y-1 pt-2 border-t">
                          <p className="text-xs font-medium text-muted-foreground">Issues:</p>
                          {report.dataLayerCheck.validation.issues.map((issue, i) => (
                            <p key={i} className="text-xs">{issue}</p>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Event ID Parity */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Fingerprint className="h-4 w-4" />
                    Event ID Parity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Browser event_id</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {report.eventIdParity.browserEventId.slice(0, 12)}...
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Format Match</span>
                    <Badge variant={report.eventIdParity.match ? 'default' : 'destructive'}>
                      {report.eventIdParity.match ? 'UUID v4' : 'Mismatch'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Dedup Ready</span>
                    <Badge variant={report.eventIdParity.deduplicationReady ? 'default' : 'secondary'}>
                      {report.eventIdParity.deduplicationReady ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Network Capture */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    Network Capture
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pixel Requests</span>
                    <Badge variant="outline">
                      {report.networkCapture.requestsCaptured}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">eventID in Pixel</span>
                    <Badge variant={report.networkCapture.hasEventIdInPixel ? 'default' : 'secondary'}>
                      {report.networkCapture.hasEventIdInPixel ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Advanced Matching</span>
                    <Badge variant={report.networkCapture.hasAdvancedMatching ? 'default' : 'secondary'}>
                      {report.networkCapture.hasAdvancedMatching ? 'Enabled' : 'Not Detected'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* GTM Tag Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    GTM Tag Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">event_id Parity</span>
                    <Badge variant={report.eventIdParity.deduplicationReady ? 'default' : 'destructive'}>
                      {report.eventIdParity.deduplicationReady ? 'Ready' : 'Not Ready'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">event_id Format</span>
                    <Badge variant={report.eventIdParity.match ? 'default' : 'destructive'}>
                      {report.eventIdParity.expectedFormat}
                    </Badge>
                  </div>
                  <Separator />
                  <p className="text-xs text-muted-foreground">
                    Events use deterministic IDs (e.g. lead:{'<'}leadId{'>'}) for CAPI deduplication.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Action Items */}
            {report.actionItems.length > 0 && (
              <Card className="border-amber-600/30 bg-amber-600/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    Action Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-2">
                    {report.actionItems.map((item, i) => (
                      <li key={i} className="text-sm">{item}</li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            {/* Raw Event Data */}
            {report.dataLayerCheck.event && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Raw DataLayer Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 w-full rounded border bg-muted/50">
                    <pre className="p-4 text-xs font-mono">
                      {JSON.stringify(report.dataLayerCheck.event, null, 2)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Instructions */}
        {!report && !isRunning && (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No test results yet</p>
              <p className="text-sm mt-1">
                Click "Run Full Test" to generate a synthetic lead and verify the tracking pipeline
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
