import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, MousePointerClick, Mail, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface AnalyticsStats {
  totalSessions: number;
  totalEvents: number;
  totalLeadsCaptured: number;
  conversionRate: number;
  modalOpens: number;
  modalConversionRate: number;
  pageViews: number;
  toolCompletions: number;
  modalAbandons: number;
  modalAbandonRate: number;
}

interface ToolPerformance {
  tool_name: string;
  modal_opens: number;
  leads_captured: number;
  conversion_rate: number;
}

interface FunnelStep {
  step: string;
  count: number;
  percentage: number;
}

interface RecentEvent {
  id: string;
  event_name: string;
  tool_name: string;
  created_at: string;
  params: Record<string, unknown>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AnalyticsStats>({
    totalSessions: 0,
    totalEvents: 0,
    totalLeadsCaptured: 0,
    conversionRate: 0,
    modalOpens: 0,
    modalConversionRate: 0,
    pageViews: 0,
    toolCompletions: 0,
    modalAbandons: 0,
    modalAbandonRate: 0,
  });
  const [toolPerformance, setToolPerformance] = useState<ToolPerformance[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [pageViewData, setPageViewData] = useState<Array<{ page: string; views: number }>>([]);
  const [toolCompletionData, setToolCompletionData] = useState<Array<{ tool: string; completions: number }>>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const getTimeFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    const timeFilter = getTimeFilter();

    try {
      // Fetch total sessions
      const { count: sessionCount } = await supabase
        .from('wm_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', timeFilter);

      // Fetch all events in time range
      const { data: events } = await supabase
        .from('wm_events')
        .select('*')
        .gte('created_at', timeFilter)
        .order('created_at', { ascending: false });

      if (!events) return;

      // Calculate stats
      const modalOpens = events.filter((e) => e.event_name === 'modal_open').length;
      const leadsCaptured = events.filter((e) => e.event_name === 'lead_captured').length;
      const consultationsBooked = events.filter((e) => e.event_name === 'consultation_booked').length;
      const pageViews = events.filter((e) => e.event_name === 'page_view').length;
      const toolCompletions = events.filter((e) => e.event_name === 'tool_completed').length;
      const modalAbandons = events.filter((e) => e.event_name === 'modal_abandon').length;

      setStats({
        totalSessions: sessionCount || 0,
        totalEvents: events.length,
        totalLeadsCaptured: leadsCaptured + consultationsBooked,
        conversionRate: sessionCount ? ((leadsCaptured + consultationsBooked) / sessionCount) * 100 : 0,
        modalOpens,
        modalConversionRate: modalOpens ? (leadsCaptured / modalOpens) * 100 : 0,
        pageViews,
        toolCompletions,
        modalAbandons,
        modalAbandonRate: modalOpens ? (modalAbandons / (modalOpens + modalAbandons)) * 100 : 0,
      });

      // Calculate tool performance
      const toolStats = new Map<string, { opens: number; captures: number }>();

      events.forEach((event) => {
        if (!event.tool_name) return;

        if (!toolStats.has(event.tool_name)) {
          toolStats.set(event.tool_name, { opens: 0, captures: 0 });
        }

        const stats = toolStats.get(event.tool_name)!;
        if (event.event_name === 'modal_open') stats.opens++;
        if (event.event_name === 'lead_captured') stats.captures++;
      });

      const performanceData: ToolPerformance[] = Array.from(toolStats.entries())
        .map(([tool_name, { opens, captures }]) => ({
          tool_name,
          modal_opens: opens,
          leads_captured: captures,
          conversion_rate: opens ? (captures / opens) * 100 : 0,
        }))
        .sort((a, b) => b.leads_captured - a.leads_captured);

      setToolPerformance(performanceData);

      // Calculate page view data
      const pageViewMap = new Map<string, number>();
      events.filter((e) => e.event_name === 'page_view').forEach((event) => {
        const toolName = event.tool_name || 'unknown';
        pageViewMap.set(toolName, (pageViewMap.get(toolName) || 0) + 1);
      });

      const pageViewStats = Array.from(pageViewMap.entries())
        .map(([page, views]) => ({ page, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10); // Top 10 pages

      setPageViewData(pageViewStats);

      // Calculate tool completion data
      const completionMap = new Map<string, number>();
      events.filter((e) => e.event_name === 'tool_completed').forEach((event) => {
        const toolName = event.tool_name || 'unknown';
        completionMap.set(toolName, (completionMap.get(toolName) || 0) + 1);
      });

      const completionStats = Array.from(completionMap.entries())
        .map(([tool, completions]) => ({ tool, completions }))
        .sort((a, b) => b.completions - a.completions);

      setToolCompletionData(completionStats);

      // Build funnel data
      const uniqueSessions = new Set(events.map((e) => e.session_id).filter(Boolean));
      const sessionsWithModalOpen = new Set(
        events.filter((e) => e.event_name === 'modal_open').map((e) => e.session_id).filter(Boolean)
      );
      const sessionsWithLeadCapture = new Set(
        events.filter((e) => e.event_name === 'lead_captured').map((e) => e.session_id).filter(Boolean)
      );

      const totalSessions = uniqueSessions.size;
      const modalOpenCount = sessionsWithModalOpen.size;
      const leadCaptureCount = sessionsWithLeadCapture.size;

      setFunnelData([
        { step: 'Sessions', count: totalSessions, percentage: 100 },
        { step: 'Modal Opens', count: modalOpenCount, percentage: totalSessions ? (modalOpenCount / totalSessions) * 100 : 0 },
        { step: 'Leads Captured', count: leadCaptureCount, percentage: totalSessions ? (leadCaptureCount / totalSessions) * 100 : 0 },
      ]);

      // Recent events (limit to 10)
      setRecentEvents(
        events.slice(0, 10).map((e) => ({
          id: e.id,
          event_name: e.event_name,
          tool_name: e.tool_name || 'unknown',
          created_at: e.created_at,
          params: (e.params as Record<string, unknown>) || {},
        }))
      );
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Tools</span>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
              <p className="text-slate-600 mt-1">Track conversion funnels and tool performance</p>
            </div>

            <div className="flex gap-2">
              {(['24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {range === '24h' ? 'Last 24h' : range === '7d' ? 'Last 7 days' : 'Last 30 days'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* KPI Cards - Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions.toLocaleString()}</div>
              <p className="text-xs text-slate-600 mt-1">Unique visitors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Modal Opens</CardTitle>
              <MousePointerClick className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.modalOpens.toLocaleString()}</div>
              <p className="text-xs text-slate-600 mt-1">Lead capture attempts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Captured</CardTitle>
              <Mail className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeadsCaptured.toLocaleString()}</div>
              <p className="text-xs text-slate-600 mt-1">Email submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.modalConversionRate.toFixed(1)}%</div>
              <p className="text-xs text-slate-600 mt-1">Modal → Lead</p>
            </CardContent>
          </Card>
        </div>

        {/* KPI Cards - Row 2: New Events */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Page Views</CardTitle>
              <MousePointerClick className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pageViews.toLocaleString()}</div>
              <p className="text-xs text-slate-600 mt-1">Total page visits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tool Completions</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.toolCompletions.toLocaleString()}</div>
              <p className="text-xs text-slate-600 mt-1">Tools finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Modal Abandons</CardTitle>
              <MousePointerClick className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.modalAbandons.toLocaleString()}</div>
              <p className="text-xs text-slate-600 mt-1">Closed without submit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abandon Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.modalAbandonRate.toFixed(1)}%</div>
              <p className="text-xs text-slate-600 mt-1">Of total modal interactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Session journey from entry to lead capture</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="step" type="category" width={120} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'count') return [value.toLocaleString(), 'Count'];
                    return [`${value.toFixed(1)}%`, 'Percentage'];
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Count" />
                <Bar dataKey="percentage" fill="#10b981" name="Percentage" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tool Performance Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tool Performance</CardTitle>
              <CardDescription>Modal opens and conversions by tool</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={toolPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tool_name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="modal_opens" fill="#f59e0b" name="Modal Opens" />
                  <Bar dataKey="leads_captured" fill="#10b981" name="Leads Captured" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversion Rates by Tool</CardTitle>
              <CardDescription>Which tools convert best</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={toolPerformance.filter((t) => t.leads_captured > 0)}
                    dataKey="leads_captured"
                    nameKey="tool_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.tool_name}: ${entry.leads_captured}`}
                  >
                    {toolPerformance.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Page Views & Tool Completions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>Most visited pages in selected timeframe</CardDescription>
            </CardHeader>
            <CardContent>
              {pageViewData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pageViewData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="page" angle={-45} textAnchor="end" height={100} fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  No page view data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tool Completions</CardTitle>
              <CardDescription>Tools finished by users</CardDescription>
            </CardHeader>
            <CardContent>
              {toolCompletionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={toolCompletionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="tool" angle={-45} textAnchor="end" height={100} fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completions" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  No tool completion data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Latest 10 analytics events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Event</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Tool</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Details</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((event) => (
                    <tr key={event.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            event.event_name === 'modal_open'
                              ? 'bg-blue-100 text-blue-700'
                              : event.event_name === 'lead_captured'
                              ? 'bg-green-100 text-green-700'
                              : event.event_name === 'consultation_booked'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {event.event_name.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{event.tool_name}</td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {event.params.modal_type && `Type: ${event.params.modal_type}`}
                        {event.params.resource_title && `Resource: ${event.params.resource_title}`}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{formatDate(event.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Tool Performance Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Tool Metrics</CardTitle>
            <CardDescription>Comprehensive performance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Tool Name</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Modal Opens</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Leads Captured</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {toolPerformance.map((tool) => (
                    <tr key={tool.tool_name} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-700">{tool.tool_name}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{tool.modal_opens.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-green-600 font-medium">{tool.leads_captured.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            tool.conversion_rate >= 50
                              ? 'bg-green-100 text-green-700'
                              : tool.conversion_rate >= 25
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {tool.conversion_rate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
