/**
 * Full-Funnel OPT Tracking Audit Page
 *
 * Tests the 5 canonical wmTracking OPT conversion events.
 * Access via /admin/full-funnel-audit (requires admin auth)
 */

import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  User,
  Hash,
  Network,
  Zap,
  Target,
  Send,
  CalendarCheck,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  runFullFunnelAudit,
  generateGoldenLead,
  META_EVENTS,
  type FullFunnelAuditReport,
  type EventAuditResult,
} from '@/lib/fullFunnelTrackingAudit';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  wm_lead: <Send className="h-4 w-4" />,
  wm_qualified_lead: <ShieldCheck className="h-4 w-4" />,
  wm_scanner_upload: <Zap className="h-4 w-4" />,
  wm_appointment_booked: <CalendarCheck className="h-4 w-4" />,
  wm_sold: <DollarSign className="h-4 w-4" />,
};

export default function FullFunnelAuditPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<FullFunnelAuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunAudit = useCallback(async () => {
    setIsRunning(true);
    setError(null);

    try {
      const result = await runFullFunnelAudit();
      setReport(result);
    } catch (err) {
      console.error('[FullFunnelAudit] Error:', err);
      setError(err instanceof Error ? err.message : 'Audit failed');
    } finally {
      setIsRunning(false);
    }
  }, []);

  const getStatusIcon = (status: 'PASS' | 'PARTIAL' | 'FAIL') => {
    switch (status) {
      case 'PASS': return <CheckCircle2 className="h-6 w-6 text-primary" />;
      case 'PARTIAL': return <AlertCircle className="h-6 w-6 text-secondary-foreground" />;
      case 'FAIL': return <XCircle className="h-6 w-6 text-destructive" />;
    }
  };

  const getStatusColor = (status: 'PASS' | 'PARTIAL' | 'FAIL') => {
    switch (status) {
      case 'PASS': return 'bg-primary text-primary-foreground border-primary';
      case 'PARTIAL': return 'bg-amber-500 text-white border-amber-500';
      case 'FAIL': return 'bg-destructive text-destructive-foreground border-destructive';
    }
  };

  const getEventStatus = (result: EventAuditResult): 'PASS' | 'PARTIAL' | 'FAIL' => {
    if (result.score >= result.maxScore * 0.8) return 'PASS';
    if (result.score >= result.maxScore * 0.5) return 'PARTIAL';
    return 'FAIL';
  };

  const CheckRow = ({ passed, label }: { passed: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      {passed
        ? <CheckCircle2 className="h-4 w-4 text-primary" />
        : <XCircle className="h-4 w-4 text-destructive" />}
      <span>{label}</span>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Full-Funnel Audit | Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="container max-w-6xl py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Full-Funnel OPT Tracking Audit</h1>
            <p className="text-muted-foreground">
              Test all 5 canonical OPT conversion events via wmTracking
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            wmTracking v1.0
          </Badge>
        </div>

        {/* Event Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">OPT Conversion Events (5 Events)</CardTitle>
            <CardDescription>
              Canonical value ladder fired through wmTracking.ts firewall
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {META_EVENTS.map((event) => (
                <div
                  key={event.eventName}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm"
                >
                  {EVENT_ICONS[event.eventName] || <Zap className="h-4 w-4" />}
                  <span className="truncate">{event.metaTagName}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Run Audit */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="h-5 w-5" />
              Run Full-Funnel Audit
            </CardTitle>
            <CardDescription>
              Generates a Golden Lead, fires all 5 OPT events, and validates the tracking pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRunAudit} disabled={isRunning} size="lg" className="gap-2">
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running 5-Event OPT Sequence...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Audit
                </>
              )}
            </Button>
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
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
                        {report.overallStatus === 'PASS' ? 'Full-Funnel Verified' :
                         report.overallStatus === 'PARTIAL' ? 'Partial Coverage' :
                         'Issues Detected'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {report.eventResults.length} events tested at {new Date(report.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">
                      {report.projectedEMQ.toFixed(1)}
                      <span className="text-lg text-muted-foreground">/10</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Projected EMQ</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Overall Score</span>
                    <span>{report.overallScore.toFixed(1)} / {report.maxScore}</span>
                  </div>
                  <Progress value={(report.overallScore / report.maxScore) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Golden Lead Profile */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Golden Lead Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Raw Data</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-foreground">
                        <span className="text-muted-foreground">Lead ID:</span>
                        <code className="text-xs bg-background border border-border px-2 py-0.5 rounded text-foreground">{report.goldenLead.leadId.slice(0, 12)}...</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{report.goldenLead.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{report.goldenLead.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span>{report.goldenLead.firstName} {report.goldenLead.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{report.goldenLead.city}, {report.goldenLead.state} {report.goldenLead.zipCode}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      SHA-256 Hashes (for Parity Check)
                    </h4>
                    <div className="space-y-1 text-sm font-mono text-foreground">
                      {(['email', 'phone', 'firstName', 'lastName'] as const).map((field) => (
                        <div key={field} className="flex justify-between items-center">
                          <span className="text-muted-foreground">{field === 'email' ? 'em' : field === 'phone' ? 'ph' : field === 'firstName' ? 'fn' : 'ln'}:</span>
                          <code className="text-xs bg-background border border-border px-2 py-0.5 rounded truncate max-w-[180px] text-foreground">
                            {report.goldenLeadHashes[field]?.slice(0, 16) || 'N/A'}...
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Per-Event Results */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Event-by-Event Results</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {report.eventResults.map((result) => {
                    const status = getEventStatus(result);
                    return (
                      <AccordionItem
                        key={result.eventName}
                        value={result.eventName}
                        className="[background:transparent] bg-card border border-border rounded-lg mb-2 text-foreground"
                      >
                        <AccordionTrigger className="hover:no-underline text-foreground">
                          <div className="flex items-center gap-3 w-full pr-4">
                            <span className="flex items-center gap-2 text-foreground">
                              {EVENT_ICONS[result.eventName]}
                              <span className="font-medium">{result.eventName}</span>
                            </span>
                            <Badge variant="outline" className={cn('ml-auto', getStatusColor(status))}>
                              {result.score.toFixed(1)}/{result.maxScore}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-2">
                            {/* Identity & Firewall */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-foreground">
                              <CheckRow passed={result.validation.hasEventId} label="event_id" />
                              <CheckRow passed={result.validation.hasClientId} label="client_id" />
                              <CheckRow passed={result.validation.hasSessionId} label="session_id" />
                              <CheckRow passed={result.validation.hasMetaCategory} label='meta.category="opt"' />
                              <CheckRow passed={result.validation.hasMetaSend} label="meta.send=true" />
                              <CheckRow passed={result.validation.hasValue} label="value/currency" />
                              <CheckRow passed={result.validation.hasExternalId} label="external_id" />
                              <CheckRow passed={result.validation.hasUserData} label="user_data" />
                            </div>

                            {/* PII Hashes */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-foreground">
                              <CheckRow passed={result.validation.hasEmail} label="em (email)" />
                              <CheckRow passed={result.validation.hasPhone} label="ph (phone)" />
                              <CheckRow passed={result.validation.hasFirstName} label="fn (firstName)" />
                              <CheckRow passed={result.validation.hasLastName} label="ln (lastName)" />
                              <CheckRow passed={result.validation.hasCity} label="ct (city)" />
                              <CheckRow passed={result.validation.hasState} label="st (state)" />
                              <CheckRow passed={result.validation.hasZip} label="zp (zip)" />
                            </div>

                            <div className="text-sm text-foreground">
                              <span className="text-muted-foreground">Event ID: </span>
                              <code className="text-xs bg-background border border-border px-2 py-0.5 rounded text-foreground">{result.eventId}</code>
                            </div>

                            {result.issues.length > 0 && (
                              <div className="space-y-1 text-sm">
                                {result.issues.map((issue, i) => (
                                  <p key={i}>{issue}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>

            {/* Network Capture */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Network Capture Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-card border border-border rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{report.networkCapture.totalRequests}</div>
                    <div className="text-xs text-muted-foreground">Pixel Requests</div>
                  </div>
                  <div className="text-center p-4 bg-card border border-border rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{report.networkCapture.eventsWithEventId}</div>
                    <div className="text-xs text-muted-foreground">With eventID</div>
                  </div>
                  <div className="text-center p-4 bg-card border border-border rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{report.networkCapture.eventsWithAdvancedMatching}</div>
                    <div className="text-xs text-muted-foreground">Advanced Matching</div>
                  </div>
                  <div className="text-center p-4 bg-card border border-border rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{report.serverSideParity.eventIdFormat}</div>
                    <div className="text-xs text-muted-foreground">Event ID Format</div>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="text-sm text-foreground">
                  <span className="font-medium">Server-Side Parity: </span>
                  <span className={report.serverSideParity.formatConsistent ? 'text-primary' : 'text-foreground'}>
                    {report.serverSideParity.recommendation}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Action Items */}
            {report.actionItems.length > 0 && (
              <Card className="border-secondary bg-secondary/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-secondary-foreground">
                    <AlertCircle className="h-4 w-4" />
                    Action Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    {report.actionItems.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            {/* Raw DataLayer Events */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Raw DataLayer Events</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80 w-full rounded border bg-muted/50">
                  <pre className="p-4 text-xs font-mono">
                    {JSON.stringify(
                      report.eventResults.map(r => ({
                        event: r.eventName,
                        event_id: r.eventId,
                        score: r.score,
                        dataLayer: r.dataLayerEvent,
                      })),
                      null,
                      2
                    )}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!report && !isRunning && (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Ready to audit your tracking pipeline</p>
              <p className="text-sm mt-1">
                Click "Start Audit" to generate a Golden Lead and test all 5 OPT conversion events
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
