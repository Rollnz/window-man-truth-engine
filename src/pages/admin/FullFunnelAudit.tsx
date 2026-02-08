/**
 * Full-Funnel Meta Tracking Audit Page
 * 
 * Comprehensive dashboard for testing all 6 Meta conversion events.
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
  FileCheck,
  Phone,
  TrendingUp,
  Send,
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
  lead_form_opened: <FileCheck className="h-4 w-4" />,
  scanner_upload: <Zap className="h-4 w-4" />,
  quote_upload_success: <Target className="h-4 w-4" />,
  call_initiated: <Phone className="h-4 w-4" />,
  engagement_score: <TrendingUp className="h-4 w-4" />,
  lead_submission_success: <Send className="h-4 w-4" />,
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
      case 'PASS':
        return <CheckCircle2 className="h-6 w-6 text-primary" />;
      case 'PARTIAL':
        return <AlertCircle className="h-6 w-6 text-secondary-foreground" />;
      case 'FAIL':
        return <XCircle className="h-6 w-6 text-destructive" />;
    }
  };

  const getStatusColor = (status: 'PASS' | 'PARTIAL' | 'FAIL') => {
    switch (status) {
      case 'PASS':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'PARTIAL':
        return 'bg-secondary text-secondary-foreground border-border';
      case 'FAIL':
        return 'bg-destructive/10 text-destructive border-destructive/20';
    }
  };

  const getEventStatus = (result: EventAuditResult): 'PASS' | 'PARTIAL' | 'FAIL' => {
    if (result.score >= result.maxScore * 0.8) return 'PASS';
    if (result.score >= result.maxScore * 0.5) return 'PARTIAL';
    return 'FAIL';
  };

  return (
    <>
      <Helmet>
        <title>Full-Funnel Audit | Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="container max-w-6xl py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Full-Funnel Meta Tracking Audit</h1>
            <p className="text-muted-foreground">
              Test all 6 Meta conversion events with a Golden Lead profile
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            GTM v63 Compatible
          </Badge>
        </div>

        {/* Event Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Meta Conversion Events (6 Tags)</CardTitle>
            <CardDescription>
              Events tested against GTM container GTM-NHVFR5QZ
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
              Generates a Golden Lead, fires all 6 events, and validates the tracking pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleRunAudit} 
              disabled={isRunning}
              size="lg"
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running 6-Event Sequence...
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
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lead ID:</span>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">{report.goldenLead.leadId.slice(0, 12)}...</code>
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
                    <div className="space-y-1 text-sm font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">em:</span>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded truncate max-w-[180px]">{report.goldenLeadHashes.email.slice(0, 16)}...</code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">ph:</span>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded truncate max-w-[180px]">{report.goldenLeadHashes.phone?.slice(0, 16) || 'N/A'}...</code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">fn:</span>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded truncate max-w-[180px]">{report.goldenLeadHashes.firstName?.slice(0, 16) || 'N/A'}...</code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">ln:</span>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded truncate max-w-[180px]">{report.goldenLeadHashes.lastName?.slice(0, 16) || 'N/A'}...</code>
                      </div>
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
                  {report.eventResults.map((result, index) => {
                    const status = getEventStatus(result);
                    return (
                      <AccordionItem key={result.eventName} value={result.eventName}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 w-full pr-4">
                            <span className="flex items-center gap-2">
                              {EVENT_ICONS[result.eventName]}
                              <span className="font-medium">{result.eventName}</span>
                            </span>
                            <Badge 
                              variant="outline" 
                              className={cn('ml-auto', getStatusColor(status))}
                            >
                              {result.score.toFixed(1)}/{result.maxScore}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                {result.validation.hasEventId ? 
                                  <CheckCircle2 className="h-4 w-4 text-primary" /> : 
                                  <XCircle className="h-4 w-4 text-destructive" />}
                                <span>event_id</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {result.validation.hasEmail ? 
                                  <CheckCircle2 className="h-4 w-4 text-primary" /> : 
                                  <XCircle className="h-4 w-4 text-destructive" />}
                                <span>em (email)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {result.validation.hasPhone ? 
                                  <CheckCircle2 className="h-4 w-4 text-primary" /> : 
                                  <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                                <span>ph (phone)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {result.validation.hasFirstName ? 
                                  <CheckCircle2 className="h-4 w-4 text-primary" /> : 
                                  <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                                <span>fn (firstName)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {result.validation.hasLastName ? 
                                  <CheckCircle2 className="h-4 w-4 text-primary" /> : 
                                  <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                                <span>ln (lastName)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {result.validation.hasCity ? 
                                  <CheckCircle2 className="h-4 w-4 text-primary" /> : 
                                  <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                                <span>ct (city)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {result.validation.hasState ? 
                                  <CheckCircle2 className="h-4 w-4 text-primary" /> : 
                                  <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                                <span>st (state)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {result.validation.hasZip ? 
                                  <CheckCircle2 className="h-4 w-4 text-primary" /> : 
                                  <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                                <span>zp (zip)</span>
                              </div>
                            </div>
                            
                            <div className="text-sm">
                              <span className="text-muted-foreground">Event ID: </span>
                              <code className="text-xs bg-muted px-2 py-0.5 rounded">{result.eventId}</code>
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
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{report.networkCapture.totalRequests}</div>
                    <div className="text-xs text-muted-foreground">Pixel Requests</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{report.networkCapture.eventsWithEventId}</div>
                    <div className="text-xs text-muted-foreground">With eventID</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{report.networkCapture.eventsWithAdvancedMatching}</div>
                    <div className="text-xs text-muted-foreground">Advanced Matching</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{report.serverSideParity.eventIdFormat}</div>
                    <div className="text-xs text-muted-foreground">Event ID Format</div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="text-sm">
                  <span className="font-medium">Server-Side Parity: </span>
                  <span className={report.serverSideParity.formatConsistent ? 'text-primary' : 'text-secondary-foreground'}>
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
                Click "Start Audit" to generate a Golden Lead and test all 6 Meta conversion events
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
