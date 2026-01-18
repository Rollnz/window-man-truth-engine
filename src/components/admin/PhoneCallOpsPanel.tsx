import { useState, useEffect, useMemo } from 'react';
import { Phone, Clock, AlertTriangle, CheckCircle2, RefreshCw, Play, Mic, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CallReviewModal, PhoneCallLogRow } from './CallReviewModal';
import { Json } from '@/integrations/supabase/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface QueueStats {
  dueNow: number;
  processing: number;
  deadLetters24h: number;
  connectionRate: number;
}

interface PendingCall {
  id: string;
  call_request_id: string;
  source_tool: string;
  status: string;
  scheduled_for: string;
  attempt_count: number;
  phone_e164: string;
  last_error: string | null;
}

interface CallLog {
  id: string;
  call_request_id: string;
  source_tool: string;
  call_status: string;
  call_duration_sec: number | null;
  call_sentiment: string | null;
  recording_url: string | null;
  ai_notes: string | null;
  raw_outcome_payload: Json | null;
  triggered_at: string;
  ended_at: string | null;
  created_at: string;
}

interface ChartData {
  source_tool: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

/**
 * Obscures a phone number by replacing all leading characters with asterisks while preserving the last four digits.
 *
 * @param phone - The phone number string to mask.
 * @returns `****` followed by the last four characters of `phone`, or `'****'` if `phone` is empty or has fewer than four characters.
 */
function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return '****';
  return `****${phone.slice(-4)}`;
}

/**
 * Render a status Badge component for a phone call status.
 *
 * @param status - The status key (e.g., "pending", "completed", "dead_letter") used to determine the badge label and visual variant
 * @returns A React element (`Badge`) whose label and variant correspond to the provided `status`; if the status is unknown the raw status string is shown with the `outline` variant
 */
function getStatusBadge(status: string) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    pending: { variant: 'outline', label: 'Pending' },
    processing: { variant: 'secondary', label: 'Processing' },
    called: { variant: 'default', label: 'Called' },
    completed: { variant: 'default', label: 'Completed' },
    no_answer: { variant: 'secondary', label: 'No Answer' },
    failed: { variant: 'destructive', label: 'Failed' },
    dead_letter: { variant: 'destructive', label: 'Dead Letter' },
    in_progress: { variant: 'secondary', label: 'In Progress' },
  };
  const config = variants[status] || { variant: 'outline' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/**
 * Render a Badge for a given sentiment value.
 *
 * @param sentiment - The sentiment key (`'positive'`, `'neutral'`, `'negative'`) or `null`.
 * @returns A Badge element with an appropriate label for the sentiment, or `null` if `sentiment` is `null` or empty.
 */
function getSentimentBadge(sentiment: string | null) {
  if (!sentiment) return null;
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
    positive: { variant: 'default', label: '😊 Positive' },
    neutral: { variant: 'secondary', label: '😐 Neutral' },
    negative: { variant: 'destructive', label: '😞 Negative' },
  };
  const config = variants[sentiment] || { variant: 'secondary' as const, label: sentiment };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/**
 * Render the phone call operations dashboard for monitoring and managing call queues and recent outcomes.
 *
 * Displays KPI cards, a seven-day sentiment stacked bar chart by source, a filterable call queue with retry actions,
 * a table of recent call outcomes with review and playback links, and a call review modal.
 *
 * The component fetches and derives live stats and logs, and exposes UI controls for filtering, refreshing, retrying dead-letter calls, and opening a review modal.
 *
 * @returns A React element containing the operations dashboard UI (KPIs, chart, queue table, outcomes table, and review modal).
 */
export function PhoneCallOpsPanel() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [pendingCalls, setPendingCalls] = useState<PendingCall[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<PhoneCallLogRow | null>(null);
  const [chartLogs, setChartLogs] = useState<CallLog[]>([]);

  const handleOpenReview = (log: CallLog) => {
    setSelectedLog(log as PhoneCallLogRow);
    setReviewModalOpen(true);
  };

  const handleCloseReview = () => {
    setReviewModalOpen(false);
    setSelectedLog(null);
  };

  // Compute chart data from 7-day logs
  const chartData = useMemo((): ChartData[] => {
    const finishedStatuses = ['completed', 'no_answer', 'failed'];
    const finished = chartLogs.filter((l) => finishedStatuses.includes(l.call_status));

    const grouped = new Map<string, { positive: number; neutral: number; negative: number }>();

    for (const log of finished) {
      const source = log.source_tool || 'unknown';
      if (!grouped.has(source)) {
        grouped.set(source, { positive: 0, neutral: 0, negative: 0 });
      }
      const entry = grouped.get(source)!;
      const sentiment = log.call_sentiment || 'neutral'; // treat null as neutral
      if (sentiment === 'positive') entry.positive++;
      else if (sentiment === 'negative') entry.negative++;
      else entry.neutral++;
    }

    return Array.from(grouped.entries()).map(([source_tool, counts]) => ({
      source_tool,
      ...counts,
      total: counts.positive + counts.neutral + counts.negative,
    }));
  }, [chartLogs]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      // Calculate 7 days ago for chart query
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoIso = sevenDaysAgo.toISOString();

      // Fetch pending calls
      const { data: pendingData, error: pendingError } = await supabase
        .from('pending_calls')
        .select('*')
        .order('scheduled_for', { ascending: true })
        .limit(100);

      if (pendingError) throw pendingError;

      // Fetch call logs (last 25) with all fields needed for review modal
      const { data: logsData, error: logsError } = await supabase
        .from('phone_call_logs')
        .select('id, call_request_id, source_tool, call_status, call_duration_sec, call_sentiment, recording_url, ai_notes, raw_outcome_payload, triggered_at, ended_at, created_at')
        .order('created_at', { ascending: false })
        .limit(25);

      if (logsError) throw logsError;

      // Fetch last 7 days of logs for chart (only needed fields)
      const { data: chartData, error: chartError } = await supabase
        .from('phone_call_logs')
        .select('source_tool, call_status, call_sentiment, triggered_at')
        .gte('triggered_at', sevenDaysAgoIso)
        .order('triggered_at', { ascending: false });

      if (chartError) throw chartError;

      const calls = pendingData || [];
      const logs = logsData || [];

      // Calculate stats
      const dueNow = calls.filter(
        (c) => c.status === 'pending' && new Date(c.scheduled_for) <= new Date()
      ).length;
      const processing = calls.filter((c) => c.status === 'processing').length;
      const deadLetters24h = calls.filter((c) => {
        if (c.status !== 'dead_letter') return false;
        const updatedAt = new Date(c.updated_at);
        return updatedAt >= today;
      }).length;

      // Calculate connection rate from today's logs
      const todayLogs = logs.filter((l) => new Date(l.created_at) >= today);
      const completed = todayLogs.filter((l) => l.call_status === 'completed').length;
      const totalAttempted = todayLogs.filter((l) =>
        ['completed', 'no_answer', 'failed'].includes(l.call_status)
      ).length;
      const connectionRate = totalAttempted > 0 ? Math.round((completed / totalAttempted) * 100) : 0;

      setStats({ dueNow, processing, deadLetters24h, connectionRate });
      setPendingCalls(calls);
      setCallLogs(logs);
      setChartLogs(chartData as CallLog[] || []);
    } catch (error) {
      console.error('Error fetching phone call data:', error);
      toast.error('Failed to load phone call data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetry = async (callRequestId: string) => {
    setRetryingId(callRequestId);
    try {
      const { data, error } = await supabase.rpc('rpc_retry_dead_letter', {
        p_call_request_id: callRequestId,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };
      if (result.success) {
        toast.success('Call reset for retry');
        await fetchData();
      } else {
        toast.error(result.error || 'Failed to retry call');
      }
    } catch (error) {
      console.error('Error retrying call:', error);
      toast.error('Failed to retry call');
    } finally {
      setRetryingId(null);
    }
  };

  // Filter pending calls
  const filteredCalls = pendingCalls.filter((call) => {
    if (statusFilter !== 'all' && call.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && call.source_tool !== sourceFilter) return false;
    return true;
  });

  // Get unique source tools for filter
  const sourcesSet = new Set(pendingCalls.map((c) => c.source_tool));
  const sources = Array.from(sourcesSet);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Now</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.dueNow || 0}</div>
            <p className="text-xs text-muted-foreground">Calls ready to dispatch</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Processing</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.processing || 0}</div>
            <p className="text-xs text-muted-foreground">Currently being dispatched</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dead Letters (24h)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.deadLetters24h || 0}</div>
            <p className="text-xs text-muted-foreground">Failed after max retries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.connectionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Completed / Attempted today</p>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Call Outcomes by Source (Last 7 Days)</CardTitle>
            <CardDescription>Volume breakdown by source tool with sentiment distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="source_tool"
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Bar
                    dataKey="positive"
                    name="Positive"
                    stackId="a"
                    fill="hsl(142, 76%, 36%)"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="neutral"
                    name="Neutral"
                    stackId="a"
                    fill="hsl(220, 9%, 46%)"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="negative"
                    name="Negative"
                    stackId="a"
                    fill="hsl(0, 84%, 60%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Call Queue</CardTitle>
              <CardDescription>Pending and processing calls</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="called">Called</SelectItem>
                  <SelectItem value="dead_letter">Dead Letter</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {sources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchData}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No calls in queue
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCalls.slice(0, 20).map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(call.scheduled_for).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{call.source_tool}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(call.status)}</TableCell>
                      <TableCell>{call.attempt_count}</TableCell>
                      <TableCell className="font-mono">{maskPhone(call.phone_e164)}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={call.last_error || ''}>
                        {call.last_error ? (
                          <span className="text-destructive text-sm">{call.last_error.slice(0, 50)}...</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {call.status === 'dead_letter' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetry(call.call_request_id)}
                            disabled={retryingId === call.call_request_id}
                          >
                            {retryingId === call.call_request_id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            <span className="ml-1">Retry</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Outcomes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Outcomes</CardTitle>
          <CardDescription>Last 25 call results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead>Recording</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No call outcomes yet
                    </TableCell>
                  </TableRow>
                ) : (
                  callLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.source_tool}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.call_status)}</TableCell>
                      <TableCell>
                        {log.call_duration_sec ? `${Math.floor(log.call_duration_sec / 60)}m ${log.call_duration_sec % 60}s` : '-'}
                      </TableCell>
                      <TableCell>{getSentimentBadge(log.call_sentiment)}</TableCell>
                      <TableCell>
                        {log.recording_url ? (
                          <a
                            href={log.recording_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <Mic className="h-4 w-4" />
                            Listen
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={log.ai_notes || ''}>
                        {log.ai_notes ? log.ai_notes.slice(0, 50) + '...' : '-'}
                      </TableCell>
                      <TableCell>
                        {['completed', 'no_answer', 'failed'].includes(log.call_status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReview(log)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Call Review Modal */}
      <CallReviewModal
        isOpen={reviewModalOpen}
        onClose={handleCloseReview}
        log={selectedLog}
      />
    </div>
  );
}