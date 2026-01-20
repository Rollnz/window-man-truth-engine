import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { subDays, format, startOfDay, endOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, ArrowLeft, ShieldAlert, Activity, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { DateRangePicker, DateRange } from "@/components/admin/DateRangePicker";

interface SourceMetrics {
  source: string;
  leads: number;
  conversions: number;
  totalValue: number;
  avgValue: number;
  conversionRate: number;
}

interface HealthMetrics {
  sourceBreakdown: SourceMetrics[];
  fallbackEvents: {
    total: number;
    byType: Record<string, number>;
    percentage: number;
  };
  consentRates: {
    granted: number;
    denied: number;
    rate: number;
  };
  highTouchLeads: number;
  totalLeads: number;
}

const ADMIN_EMAILS = ['admin@windowman.com', 'support@windowman.com', 'vansiclenp@gmail.com', 'mongoloyd@protonmail.com', 'tim@itswindowman.com'].map(e => e.toLowerCase());

export default function AttributionHealthDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }
      const userEmail = session.user.email?.toLowerCase();
      if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) { 
        setIsAuthorized(false); 
        setIsLoading(false); 
        return; 
      }
      setIsAuthorized(true);
    };
    checkAuth();
  }, [navigate]);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const startDate = dateRange.startDate ? format(startOfDay(dateRange.startDate), "yyyy-MM-dd") : null;
      const endDate = dateRange.endDate ? format(endOfDay(dateRange.endDate), "yyyy-MM-dd") : null;

      // Fetch leads with source attribution
      const { data: leads, error: leadsError } = await supabase.functions.invoke('crm-leads', {
        body: { 
          action: 'list',
          startDate,
          endDate,
        }
      });

      if (leadsError) throw leadsError;

      const leadsData = leads?.leads || [];
      
      // Calculate source breakdown
      const sourceMap = new Map<string, { leads: number; conversions: number; totalValue: number }>();
      
      leadsData.forEach((lead: any) => {
        let source = 'Organic';
        if (lead.gclid) source = 'Google';
        else if (lead.fbclid) source = 'Meta';
        else if (lead.utm_source) source = lead.utm_source.charAt(0).toUpperCase() + lead.utm_source.slice(1);
        
        const current = sourceMap.get(source) || { leads: 0, conversions: 0, totalValue: 0 };
        current.leads++;
        if (lead.status === 'closed_won') {
          current.conversions++;
          current.totalValue += lead.actual_deal_value || 0;
        }
        sourceMap.set(source, current);
      });

      const sourceBreakdown: SourceMetrics[] = Array.from(sourceMap.entries()).map(([source, data]) => ({
        source,
        leads: data.leads,
        conversions: data.conversions,
        totalValue: data.totalValue,
        avgValue: data.conversions > 0 ? data.totalValue / data.conversions : 0,
        conversionRate: data.leads > 0 ? (data.conversions / data.leads) * 100 : 0,
      })).sort((a, b) => b.totalValue - a.totalValue);

      // Fetch events for fallback analysis
      const params = new URLSearchParams({ page_size: '500' });
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const eventsResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-attribution?${params}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      });

      let fallbackEvents = { total: 0, byType: {} as Record<string, number>, percentage: 0 };
      let consentRates = { granted: 0, denied: 0, rate: 0 };

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        const events = eventsData.events || [];
        
        // Count fallback events (cv_fallback)
        const fallbacks = events.filter((e: any) => e.event_name === 'cv_fallback');
        const cvEvents = events.filter((e: any) => e.event_name?.startsWith('cv_'));
        
        fallbackEvents = {
          total: fallbacks.length,
          byType: fallbacks.reduce((acc: Record<string, number>, e: any) => {
            const type = e.event_data?.original_event || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {}),
          percentage: cvEvents.length > 0 ? (fallbacks.length / cvEvents.length) * 100 : 0,
        };

        // Analyze consent (check for pii_status in events)
        const withPII = events.filter((e: any) => e.event_data?.pii_status === 'included').length;
        const withoutPII = events.filter((e: any) => e.event_data?.pii_status === 'excluded').length;
        const totalConsent = withPII + withoutPII;
        
        consentRates = {
          granted: withPII,
          denied: withoutPII,
          rate: totalConsent > 0 ? (withPII / totalConsent) * 100 : 0,
        };
      }

      // Count high-touch leads (both gclid AND fbclid)
      const highTouchLeads = leadsData.filter((lead: any) => lead.gclid && lead.fbclid).length;

      setMetrics({
        sourceBreakdown,
        fallbackEvents,
        consentRates,
        highTouchLeads,
        totalLeads: leadsData.length,
      });

    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      toast({ title: 'Error', description: 'Failed to load metrics', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, toast]);

  useEffect(() => {
    if (isAuthorized) {
      fetchMetrics();
    }
  }, [isAuthorized, fetchMetrics]);

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'google': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'meta': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  if (!isLoading && !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">This dashboard is restricted to authorized administrators.</p>
          <Button onClick={() => navigate('/')}><ArrowLeft className="h-4 w-4 mr-2" />Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/admin/crm">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  CRM
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Activity className="h-6 w-6 text-primary" />
                  Attribution Health
                </h1>
                <p className="text-sm text-muted-foreground">
                  Conversion tracking diagnostics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <Button onClick={fetchMetrics} disabled={isLoading} size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-8 space-y-6">
        {/* Health Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Consent Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                PII Consent Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-12 w-24" />
              ) : (
                <div>
                  <p className="text-3xl font-bold">
                    {metrics?.consentRates.rate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics?.consentRates.granted} granted / {metrics?.consentRates.denied} excluded
                  </p>
                  <Badge 
                    variant="outline" 
                    className={`mt-2 ${(metrics?.consentRates.rate || 0) >= 70 ? 'border-green-500 text-green-500' : 'border-amber-500 text-amber-500'}`}
                  >
                    {(metrics?.consentRates.rate || 0) >= 70 ? 'Healthy' : 'Needs Attention'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fallback Events */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Fallback Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-12 w-24" />
              ) : (
                <div>
                  <p className="text-3xl font-bold">{metrics?.fallbackEvents.total || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics?.fallbackEvents.percentage.toFixed(1)}% of cv_ events
                  </p>
                  <Badge 
                    variant="outline" 
                    className={`mt-2 ${(metrics?.fallbackEvents.percentage || 0) <= 5 ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}
                  >
                    {(metrics?.fallbackEvents.percentage || 0) <= 5 ? 'Low Error Rate' : 'High Error Rate'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* High-Touch Leads */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                High-Touch Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-12 w-24" />
              ) : (
                <div>
                  <p className="text-3xl font-bold">{metrics?.highTouchLeads || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Multi-platform attribution (Google + Meta)
                  </p>
                  <Badge variant="outline" className="mt-2 border-purple-500 text-purple-500">
                    {((metrics?.highTouchLeads || 0) / (metrics?.totalLeads || 1) * 100).toFixed(1)}% of leads
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Conversion Value by Source */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Conversion Value by Source
              <Badge variant="secondary" className="ml-auto">
                {metrics?.sourceBreakdown.length || 0} sources
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {metrics?.sourceBreakdown.map((source) => (
                  <div key={source.source} className="flex items-center gap-4 p-4 border rounded-lg border-border/50">
                    <Badge variant="outline" className={`min-w-[80px] justify-center ${getSourceColor(source.source)}`}>
                      {source.source}
                    </Badge>
                    <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Leads</p>
                        <p className="font-semibold">{source.leads}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conversions</p>
                        <p className="font-semibold">{source.conversions}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Value</p>
                        <p className="font-semibold text-green-500">${source.totalValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conv. Rate</p>
                        <p className="font-semibold">{source.conversionRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!metrics?.sourceBreakdown || metrics.sourceBreakdown.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No data for selected period</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fallback Event Details */}
        {metrics?.fallbackEvents.total ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Fallback Event Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(metrics.fallbackEvents.byType).map(([type, count]) => (
                  <div key={type} className="p-3 border rounded-lg border-border/50 text-center">
                    <p className="text-sm text-muted-foreground truncate">{type}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
