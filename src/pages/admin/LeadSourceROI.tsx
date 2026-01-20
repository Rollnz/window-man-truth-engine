import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { subDays, format, startOfDay, endOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  RefreshCw, ArrowLeft, ShieldAlert, TrendingUp, TrendingDown, 
  DollarSign, Users, Target, Calculator, PieChart 
} from "lucide-react";
import { DateRangePicker, DateRange } from "@/components/admin/DateRangePicker";

interface SourceMetrics {
  source: string;
  leads: number;
  closedWon: number;
  closedLost: number;
  conversionRate: number;
  totalRevenue: number;
  avgDealValue: number;
  adSpend: number;
  roi: number;
  costPerLead: number;
  costPerAcquisition: number;
}

const ADMIN_EMAILS = [
  'admin@windowman.com', 
  'support@windowman.com', 
  'vansiclenp@gmail.com', 
  'mongoloyd@protonmail.com', 
  'tim@itswindowman.com'
].map(e => e.toLowerCase());

const SOURCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Google: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' },
  Meta: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/30' },
  Organic: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30' },
};

export default function LeadSourceROI() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [metrics, setMetrics] = useState<SourceMetrics[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });
  
  // Ad spend inputs (stored in localStorage for persistence)
  const [adSpend, setAdSpend] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('roi_ad_spend');
    return saved ? JSON.parse(saved) : { Google: 0, Meta: 0, Organic: 0 };
  });

  // Save ad spend to localStorage
  useEffect(() => {
    localStorage.setItem('roi_ad_spend', JSON.stringify(adSpend));
  }, [adSpend]);

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

      // Fetch leads via edge function
      const { data: leadsResponse, error: leadsError } = await supabase.functions.invoke('crm-leads', {
        body: { 
          action: 'list',
          startDate,
          endDate,
        }
      });

      if (leadsError) throw leadsError;

      const leadsData = leadsResponse?.leads || [];
      
      // Group by source and calculate metrics
      const sourceMap = new Map<string, {
        leads: number;
        closedWon: number;
        closedLost: number;
        totalRevenue: number;
      }>();
      
      // Initialize sources
      ['Google', 'Meta', 'Organic'].forEach(source => {
        sourceMap.set(source, { leads: 0, closedWon: 0, closedLost: 0, totalRevenue: 0 });
      });
      
      leadsData.forEach((lead: any) => {
        let source = 'Organic';
        if (lead.gclid) source = 'Google';
        else if (lead.fbclid) source = 'Meta';
        
        const current = sourceMap.get(source)!;
        current.leads++;
        
        if (lead.status === 'closed_won') {
          current.closedWon++;
          current.totalRevenue += lead.actual_deal_value || 0;
        } else if (lead.status === 'closed_lost') {
          current.closedLost++;
        }
      });

      // Convert to metrics array with ROI calculations
      const calculatedMetrics: SourceMetrics[] = Array.from(sourceMap.entries()).map(([source, data]) => {
        const spend = adSpend[source] || 0;
        const roi = spend > 0 ? ((data.totalRevenue - spend) / spend) * 100 : 0;
        const costPerLead = data.leads > 0 ? spend / data.leads : 0;
        const costPerAcquisition = data.closedWon > 0 ? spend / data.closedWon : 0;
        const conversionRate = data.leads > 0 ? (data.closedWon / data.leads) * 100 : 0;
        const avgDealValue = data.closedWon > 0 ? data.totalRevenue / data.closedWon : 0;
        
        return {
          source,
          leads: data.leads,
          closedWon: data.closedWon,
          closedLost: data.closedLost,
          conversionRate,
          totalRevenue: data.totalRevenue,
          avgDealValue,
          adSpend: spend,
          roi,
          costPerLead,
          costPerAcquisition,
        };
      });

      setMetrics(calculatedMetrics);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      toast({ title: 'Error', description: 'Failed to load metrics', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, adSpend, toast]);

  useEffect(() => {
    if (isAuthorized) {
      fetchMetrics();
    }
  }, [isAuthorized, fetchMetrics]);

  // Calculate totals
  const totals = useMemo(() => {
    return metrics.reduce((acc, m) => ({
      leads: acc.leads + m.leads,
      closedWon: acc.closedWon + m.closedWon,
      totalRevenue: acc.totalRevenue + m.totalRevenue,
      adSpend: acc.adSpend + m.adSpend,
    }), { leads: 0, closedWon: 0, totalRevenue: 0, adSpend: 0 });
  }, [metrics]);

  const overallROI = totals.adSpend > 0 
    ? ((totals.totalRevenue - totals.adSpend) / totals.adSpend) * 100 
    : 0;

  const handleSpendChange = (source: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setAdSpend(prev => ({ ...prev, [source]: numValue }));
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
                  <Calculator className="h-6 w-6 text-primary" />
                  Lead Source ROI
                </h1>
                <p className="text-sm text-muted-foreground">
                  Compare acquisition cost vs revenue by channel
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
        {/* Overall Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Leads</p>
                  {isLoading ? <Skeleton className="h-6 w-16" /> : (
                    <p className="text-xl font-bold">{totals.leads}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Target className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Closed Won</p>
                  {isLoading ? <Skeleton className="h-6 w-16" /> : (
                    <p className="text-xl font-bold">{totals.closedWon}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  {isLoading ? <Skeleton className="h-6 w-20" /> : (
                    <p className="text-xl font-bold">${totals.totalRevenue.toLocaleString()}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${overallROI >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {overallROI >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Overall ROI</p>
                  {isLoading ? <Skeleton className="h-6 w-20" /> : (
                    <p className={`text-xl font-bold ${overallROI >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {overallROI >= 0 ? '+' : ''}{overallROI.toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ad Spend Inputs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Monthly Ad Spend
            </CardTitle>
            <CardDescription>
              Enter your ad spend to calculate ROI for each channel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Google', 'Meta', 'Organic'].map((source) => {
                const colors = SOURCE_COLORS[source];
                return (
                  <div key={source} className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}>
                    <Label htmlFor={`spend-${source}`} className={`text-sm font-medium ${colors.text}`}>
                      {source} {source === 'Organic' ? '(Attribution cost)' : 'Ads Spend'}
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        id={`spend-${source}`}
                        type="number"
                        min="0"
                        step="100"
                        value={adSpend[source] || ''}
                        onChange={(e) => handleSpendChange(source, e.target.value)}
                        placeholder="0"
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Source Comparison Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-[400px]" />)
          ) : (
            metrics.map((m) => {
              const colors = SOURCE_COLORS[m.source] || SOURCE_COLORS.Organic;
              return (
                <Card key={m.source} className={`border-2 ${colors.border}`}>
                  <CardHeader className={`${colors.bg}`}>
                    <CardTitle className="flex items-center justify-between">
                      <Badge variant="outline" className={`${colors.text} ${colors.border} text-base px-3 py-1`}>
                        {m.source}
                      </Badge>
                      <div className={`text-2xl font-bold ${m.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {m.roi >= 0 ? '+' : ''}{m.roi.toFixed(0)}% ROI
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {/* Funnel */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Leads</span>
                        <span className="font-semibold">{m.leads}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Closed Won</span>
                        <span className="font-semibold text-green-500">{m.closedWon}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Closed Lost</span>
                        <span className="font-semibold text-red-500">{m.closedLost}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Conversion Rate</span>
                        <span className="font-semibold">{m.conversionRate.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="border-t border-border/50 pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ad Spend</span>
                        <span className="font-semibold">${m.adSpend.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Revenue</span>
                        <span className="font-semibold text-green-500">${m.totalRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avg Deal Value</span>
                        <span className="font-semibold">${m.avgDealValue.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="border-t border-border/50 pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cost per Lead</span>
                        <span className="font-semibold">
                          {m.costPerLead > 0 ? `$${m.costPerLead.toFixed(2)}` : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cost per Acquisition</span>
                        <span className="font-semibold">
                          {m.costPerAcquisition > 0 ? `$${m.costPerAcquisition.toFixed(2)}` : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Profit/Loss */}
                    <div className={`p-3 rounded-lg ${m.totalRevenue - m.adSpend >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Net Profit/Loss</span>
                        <span className={`text-lg font-bold ${m.totalRevenue - m.adSpend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {m.totalRevenue - m.adSpend >= 0 ? '+' : ''}
                          ${(m.totalRevenue - m.adSpend).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px]" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Source</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Leads</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Closed</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Conv %</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Spend</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Revenue</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">CPL</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">CPA</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m) => {
                      const colors = SOURCE_COLORS[m.source];
                      return (
                        <tr key={m.source} className="border-b border-border/30 hover:bg-muted/30">
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={`${colors.text} ${colors.border}`}>
                              {m.source}
                            </Badge>
                          </td>
                          <td className="text-right py-3 px-4 font-medium">{m.leads}</td>
                          <td className="text-right py-3 px-4 font-medium">{m.closedWon}</td>
                          <td className="text-right py-3 px-4">{m.conversionRate.toFixed(1)}%</td>
                          <td className="text-right py-3 px-4">${m.adSpend.toLocaleString()}</td>
                          <td className="text-right py-3 px-4 text-green-500 font-medium">
                            ${m.totalRevenue.toLocaleString()}
                          </td>
                          <td className="text-right py-3 px-4">
                            {m.costPerLead > 0 ? `$${m.costPerLead.toFixed(0)}` : '-'}
                          </td>
                          <td className="text-right py-3 px-4">
                            {m.costPerAcquisition > 0 ? `$${m.costPerAcquisition.toFixed(0)}` : '-'}
                          </td>
                          <td className={`text-right py-3 px-4 font-bold ${m.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {m.roi >= 0 ? '+' : ''}{m.roi.toFixed(0)}%
                          </td>
                        </tr>
                      );
                    })}
                    {/* Totals Row */}
                    <tr className="bg-muted/30 font-semibold">
                      <td className="py-3 px-4">Total</td>
                      <td className="text-right py-3 px-4">{totals.leads}</td>
                      <td className="text-right py-3 px-4">{totals.closedWon}</td>
                      <td className="text-right py-3 px-4">
                        {totals.leads > 0 ? ((totals.closedWon / totals.leads) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="text-right py-3 px-4">${totals.adSpend.toLocaleString()}</td>
                      <td className="text-right py-3 px-4 text-green-500">
                        ${totals.totalRevenue.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4">
                        {totals.leads > 0 ? `$${(totals.adSpend / totals.leads).toFixed(0)}` : '-'}
                      </td>
                      <td className="text-right py-3 px-4">
                        {totals.closedWon > 0 ? `$${(totals.adSpend / totals.closedWon).toFixed(0)}` : '-'}
                      </td>
                      <td className={`text-right py-3 px-4 ${overallROI >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {overallROI >= 0 ? '+' : ''}{overallROI.toFixed(0)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
