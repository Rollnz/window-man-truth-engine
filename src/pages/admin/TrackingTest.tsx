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
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
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
  ShieldCheck,
  AlertTriangle,
  XOctagon,
  Activity,
  Mail,
  Phone,
  Copy,
  RotateCcw,
  Link2,
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
import { useDataLayerMonitor, type SystemHealth, type HandshakeResult } from '@/hooks/useDataLayerMonitor';
import { formatRelativeTime } from '@/utils/relativeTime';
import { copyToClipboard } from '@/utils/clipboard';

// ─── Sub-components ──────────────────────────────────────────────────────────

function SystemHealthGauge({
  health,
  reason,
  isMonitoring,
  onStart,
  onStop,
}: {
  health: SystemHealth;
  reason: string;
  isMonitoring: boolean;
  onStart: () => void;
  onStop: () => void;
}) {
  const config: Record<SystemHealth, { bg: string; icon: React.ReactNode; defaultMsg: string }> = {
    idle: {
      bg: 'bg-muted/50 border-border',
      icon: <ShieldCheck className="h-6 w-6 text-muted-foreground" />,
      defaultMsg: 'Guardian inactive. Click Start Monitoring to begin.',
    },
    healthy: {
      bg: 'bg-emerald-600/10 border-emerald-600/20',
      icon: <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
      defaultMsg: 'All signals nominal. Deduplication pipeline active.',
    },
    warning: {
      bg: 'bg-amber-600/10 border-amber-600/20',
      icon: <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
      defaultMsg: '',
    },
    conflict: {
      bg: 'bg-destructive/10 border-destructive/20',
      icon: <XOctagon className="h-6 w-6 text-destructive" />,
      defaultMsg: '',
    },
  };

  const c = config[health];

  return (
    <Card className={cn('border-2', c.bg)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {c.icon}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">
                {health === 'idle' && 'Guardian Inactive'}
                {health === 'healthy' && 'System Healthy'}
                {health === 'warning' && 'Warning'}
                {health === 'conflict' && 'Conflict Detected'}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {reason || c.defaultMsg}
              </p>
            </div>
          </div>
          <Button
            variant={isMonitoring ? 'outline' : 'default'}
            size="sm"
            onClick={isMonitoring ? onStop : onStart}
            className="shrink-0"
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmqDot({ score }: { score: number | null }) {
  if (score === null) return <span className="inline-block h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />;
  const color =
    score >= 8
      ? 'bg-emerald-500'
      : score >= 5
        ? 'bg-amber-500'
        : 'bg-destructive';
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-block h-2.5 w-2.5 rounded-full', color)} />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          EMQ {score.toFixed(1)}/10
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function LiveActivityLog({
  events,
  isMonitoring,
}: {
  events: import('@/hooks/useDataLayerMonitor').MonitorEvent[];
  isMonitoring: boolean;
}) {
  const display = events.slice(0, 10);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Live Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {display.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isMonitoring
              ? 'Monitoring active. Waiting for dataLayer events…'
              : 'Start monitoring to see live events.'}
          </p>
        ) : (
          <div className="space-y-1.5">
            {display.map((ev, i) => (
              <div
                key={`${ev.timestamp}-${i}`}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs',
                  ev.collision && 'ring-1 ring-destructive/40 bg-destructive/5',
                )}
              >
                <span className="text-muted-foreground w-16 shrink-0 text-right tabular-nums">
                  {formatRelativeTime(new Date(ev.timestamp).toISOString())}
                </span>
                <Badge variant="secondary" className="font-mono text-[10px] px-1.5 shrink-0">
                  {ev.event}
                </Badge>
                <EmqDot score={ev.emqScore} />
                <Mail
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    ev.hasEmail ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/30',
                  )}
                />
                <Phone
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    ev.hasPhone ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/30',
                  )}
                />
                {ev.collision && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="destructive" className="text-[10px] px-1.5 shrink-0">
                          COLLISION
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs font-mono break-all">
                        {ev.collisionSource ?? 'Source unknown'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LeadVerificationCard({
  results,
  onForceRecheck,
  onCopyPayload,
}: {
  results: HandshakeResult[];
  onForceRecheck: (leadId: string) => void;
  onCopyPayload: (payload: Record<string, unknown>) => void;
}) {
  if (results.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Lead Verification (Handshake)
        </CardTitle>
        <CardDescription className="text-xs">
          Confirms browser-captured leads reach the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {results.map((h) => (
          <div key={h.leadId}>
            {h.status === 'pending' && (
              <div className="flex items-center gap-3 rounded-lg border border-amber-600/20 bg-amber-600/5 p-3">
                <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    Verifying lead <code className="text-xs bg-muted px-1 rounded">{h.leadId.slice(0, 12)}…</code>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Attempt {h.attempts + 1}/3 · Checking server…
                  </p>
                </div>
              </div>
            )}

            {h.status === 'confirmed' && (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-600/20 bg-emerald-600/5 p-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    Server confirmed lead <code className="text-xs bg-muted px-1 rounded">{h.leadId.slice(0, 12)}…</code>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {h.confirmedAt
                      ? `Confirmed in ${((h.confirmedAt - h.capturedAt) / 1000).toFixed(1)}s`
                      : 'Confirmed'}
                    {h.leadCreatedAt && ` · Created ${formatRelativeTime(h.leadCreatedAt)}`}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'shrink-0 text-[10px]',
                    h.capiEventCount > 0
                      ? 'border-emerald-600/30 text-emerald-600 dark:text-emerald-400'
                      : 'border-amber-600/30 text-amber-600 dark:text-amber-400',
                  )}
                >
                  CAPI: {h.capiEventCount}
                </Badge>
              </div>
            )}

            {h.status === 'lost' && (
              <div className="rounded-lg border-2 border-destructive/30 bg-destructive/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <XOctagon className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-destructive">
                      LOST LEAD
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Lead <code className="bg-muted px-1 rounded">{h.leadId.slice(0, 16)}…</code> was
                      captured in browser but NOT found in database after 60s.
                    </p>
                    {h.capiEventCount === 0 && (
                      <p className="text-xs text-destructive mt-1">
                        ⚠ No CAPI events found — Meta will not receive this conversion.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => onForceRecheck(h.leadId)}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Force Re-check
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => onCopyPayload(h.eventPayload)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Payload
                  </Button>
                </div>

                <ScrollArea className="h-32 w-full rounded-md border bg-muted/50">
                  <pre className="p-3 text-[10px] font-mono">
                    {JSON.stringify(h.eventPayload, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CROInsightCard({
  events,
}: {
  events: import('@/hooks/useDataLayerMonitor').MonitorEvent[];
}) {
  const latestConversion = events.find(
    (e) => e.event.startsWith('wm_') && e.scrollDepth > 0,
  );
  if (!latestConversion) return null;

  const depth = latestConversion.scrollDepth;
  let recommendation: string;
  if (depth > 75) {
    recommendation =
      'Users scroll deep before converting. Consider moving your primary CTA higher to capture low-intent browsers.';
  } else if (depth > 50) {
    recommendation =
      'Mid-page conversion. Your content flow is balanced — users read enough to trust before acting.';
  } else if (depth > 25) {
    recommendation =
      'Above-fold influence is strong. Your hero section is doing heavy lifting.';
  } else {
    recommendation =
      'Lightning-fast conversion. Your above-fold value proposition is your strongest asset. Protect it.';
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          CRO Insight
        </CardTitle>
        <CardDescription className="text-xs">
          Based on scroll depth at <span className="font-mono">{latestConversion.event}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Scroll depth at conversion</span>
            <span className="font-mono">{depth}%</span>
          </div>
          <Progress value={depth} className="h-2" />
        </div>
        <p className="text-sm">{recommendation}</p>
      </CardContent>
    </Card>
  );
}

// ─── Quick-Check Types ───────────────────────────────────────────────────────

interface QuickCheckResult {
  eventCount: number;
  latestEvent: Record<string, unknown> | null;
  hasLeadId: boolean;
  hasEventId: boolean;
  validationScore: number | null;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TrackingTestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<TrackingVerificationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quickCheckResult, setQuickCheckResult] = useState<QuickCheckResult | null>(null);
  const { toast } = useToast();

  // Phase 2: Active Guardian + Step 5: Handshake
  const { state: monitorState, startMonitoring, stopMonitoring, forceRecheck } = useDataLayerMonitor();

  // ── Handlers ─────────────────────────────────────────────────────────────

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
      toast({ title: 'DataLayer Active', description: `Found ${eventCount} events.` });
    } else {
      toast({
        title: 'Warning: DataLayer Empty',
        description: 'Check for ad-blockers or GTM configuration.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleCopyPayload = useCallback(async (payload: Record<string, unknown>) => {
    await copyToClipboard(JSON.stringify(payload, null, 2));
    toast({ title: 'Copied', description: 'Lead payload copied to clipboard.' });
  }, [toast]);

  const handleForceRecheck = useCallback(async (leadId: string) => {
    toast({ title: 'Re-checking…', description: `Querying server for lead ${leadId.slice(0, 12)}…` });
    await forceRecheck(leadId);
  }, [forceRecheck, toast]);

  // ── Status helpers (for full-test report section) ────────────────────────

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

  // ── Render ───────────────────────────────────────────────────────────────

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

        {/* ═══ Phase 2: Active Guardian ═══ */}
        <SystemHealthGauge
          health={monitorState.systemHealth}
          reason={monitorState.healthReason}
          isMonitoring={monitorState.isMonitoring}
          onStart={startMonitoring}
          onStop={stopMonitoring}
        />

        {monitorState.isMonitoring && (
          <>
            <LiveActivityLog
              events={monitorState.liveEvents}
              isMonitoring={monitorState.isMonitoring}
            />

            {/* ═══ Step 5: Lead Verification ═══ */}
            <LeadVerificationCard
              results={monitorState.handshakeResults}
              onForceRecheck={handleForceRecheck}
              onCopyPayload={handleCopyPayload}
            />

            <CROInsightCard events={monitorState.liveEvents} />
          </>
        )}

        {/* Show handshake results even when not monitoring (persisted from session) */}
        {!monitorState.isMonitoring && monitorState.handshakeResults.length > 0 && (
          <LeadVerificationCard
            results={monitorState.handshakeResults}
            onForceRecheck={handleForceRecheck}
            onCopyPayload={handleCopyPayload}
          />
        )}

        {/* ═══ Phase 1: Test Controls ═══ */}
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
              <Button onClick={handleRunTest} disabled={isRunning} className="gap-2">
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
              <Button variant="outline" onClick={handleQuickCheck} className="gap-2">
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
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold">{quickCheckResult.eventCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">DataLayer Events</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4 flex flex-col items-center justify-center gap-2">
                    <Badge
                      variant={quickCheckResult.hasLeadId && quickCheckResult.hasEventId ? 'default' : 'secondary'}
                      className={cn(
                        quickCheckResult.hasLeadId && quickCheckResult.hasEventId
                          ? 'bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border border-emerald-600/20'
                          : 'bg-amber-600/15 text-amber-600 dark:text-amber-400 border border-amber-600/20',
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

        {/* ═══ Full Test Results ═══ */}
        {report && (
          <>
            <Card className={cn('border-2', getStatusColor(report.overallStatus))}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(report.overallStatus)}
                    <div>
                      <h3 className="text-lg font-semibold">
                        {report.overallStatus === 'PASS'
                          ? 'All Checks Passed'
                          : report.overallStatus === 'PARTIAL'
                            ? 'Partial Success'
                            : 'Issues Detected'}
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

            <div className="grid md:grid-cols-2 gap-4">
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
                    <Badge variant="outline">{report.networkCapture.requestsCaptured}</Badge>
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

        {/* Instructions placeholder */}
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
