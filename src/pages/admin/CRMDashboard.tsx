import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Loader2, Calculator, FileText, Activity, Zap, ScanSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useCRMLeads } from '@/hooks/useCRMLeads';
import { useGlobalSearchOpen } from '@/contexts/GlobalSearchContext';
import { KanbanBoard } from '@/components/crm/KanbanBoard';
import { CRMSummaryCards } from '@/components/crm/CRMSummaryCards';
import { DateRangePicker, DateRange } from '@/components/admin/DateRangePicker';
import { SearchKeyboardHint } from '@/components/admin/GlobalLeadSearch';
import { subDays, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Admin email whitelist - must be lowercase for comparison
const ADMIN_EMAILS = [
  'admin@windowtruth.com',
  'tim@impactwindowexperts.com',
  'tim@itswindowman.com',
  'vansiclenp@gmail.com',
  'mongoloyd@protonmail.com',
];

export default function CRMDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { setIsOpen } = useGlobalSearchOpen();
  
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showHighTouchOnly, setShowHighTouchOnly] = useState(false);
  const [v2SegmentFilter, setV2SegmentFilter] = useState<string>('all');
  const [quoteTab, setQuoteTab] = useState<'all' | 'with_quote' | 'analyzed'>('all');

  const hasQuoteFilter = quoteTab === 'with_quote' || quoteTab === 'analyzed';
  const analyzedFilter = quoteTab === 'analyzed';

  const { 
    leads, 
    isLoading, 
    error, 
    fetchLeads, 
    updateLeadStatus 
  } = useCRMLeads();

  // Check admin access
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth?redirect=/admin/crm');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  // Filter for high-touch leads (both gclid AND fbclid) and V2 segment
  const filteredLeads = useMemo(() => {
    let result = leads;
    if (showHighTouchOnly) {
      result = result.filter(lead => {
        const hasGoogle = !!(lead as any).gclid;
        const hasMeta = !!(lead as any).fbclid;
        return hasGoogle && hasMeta;
      });
    }
    if (v2SegmentFilter !== 'all') {
      result = result.filter(lead => lead.lead_segment === v2SegmentFilter);
    }
    return result;
  }, [leads, showHighTouchOnly, v2SegmentFilter]);

  const highTouchCount = useMemo(() => {
    return leads.filter(lead => {
      const hasGoogle = !!(lead as any).gclid;
      const hasMeta = !!(lead as any).fbclid;
      return hasGoogle && hasMeta;
    }).length;
  }, [leads]);

  const handleRefresh = () => {
    const options = {
      ...(hasQuoteFilter && { hasQuote: true }),
      ...(analyzedFilter && { analyzed: true }),
    };
    if (dateRange.startDate && dateRange.endDate) {
      fetchLeads(
        format(dateRange.startDate, 'yyyy-MM-dd'),
        format(dateRange.endDate, 'yyyy-MM-dd'),
        Object.keys(options).length > 0 ? options : undefined
      );
    } else {
      fetchLeads(undefined, undefined, Object.keys(options).length > 0 ? options : undefined);
    }
  };

  // Re-fetch when quote filters change
  useEffect(() => {
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteTab]);

  const handleRecalculateScores = async () => {
    setIsRecalculating(true);
    try {
      const { data, error } = await supabase.rpc('backfill_all_lead_scores');
      
      if (error) {
        toast.error('Recalculation Failed', {
          description: error.message,
        });
        return;
      }

      const result = data as {
        status: string;
        leads_processed: number;
        leads_updated: number;
        execution_time_ms: number;
        error_message?: string;
      };

      if (result.status === 'success') {
        toast.success('Scores Recalculated', {
          description: `Processed ${result.leads_processed} leads, updated ${result.leads_updated} in ${result.execution_time_ms}ms`,
        });
        // Refresh the leads to show updated scores
        handleRefresh();
      } else {
        toast.error('Recalculation Failed', {
          description: result.error_message || 'Unknown error occurred',
        });
      }
    } catch (err) {
      toast.error('Recalculation Failed', {
        description: err instanceof Error ? err.message : 'Network error',
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Lead Warehouse</h1>
                <p className="text-sm text-muted-foreground">
                  CRM Kanban Board • {filteredLeads.length} leads
                  {(showHighTouchOnly || v2SegmentFilter !== 'all' || quoteTab !== 'all') && ` (filtered from ${leads.length})`}
                  {v2SegmentFilter !== 'all' && ` • Segment: ${v2SegmentFilter}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Search Trigger */}
              <SearchKeyboardHint onClick={() => setIsOpen(true)} />

              {/* High-Touch Lead Filter */}
              <div className="flex items-center gap-2 px-3 py-1.5 border border-border/50 rounded-lg bg-card/50">
                <Switch
                  id="high-touch-filter"
                  checked={showHighTouchOnly}
                  onCheckedChange={setShowHighTouchOnly}
                />
                <Label htmlFor="high-touch-filter" className="flex items-center gap-2 cursor-pointer text-sm">
                  <Zap className="h-4 w-4 text-purple-500" />
                  High-Touch Only
                  {highTouchCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {highTouchCount}
                    </Badge>
                  )}
                </Label>
              </div>

              {/* Quote Tab Filter */}
              <Tabs value={quoteTab} onValueChange={(v) => setQuoteTab(v as typeof quoteTab)}>
                <TabsList className="h-9">
                  <TabsTrigger value="all" className="text-xs px-3 h-7">
                    All Leads
                  </TabsTrigger>
                  <TabsTrigger value="with_quote" className="text-xs px-3 h-7 gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    With Quote
                  </TabsTrigger>
                  <TabsTrigger value="analyzed" className="text-xs px-3 h-7 gap-1.5">
                    <ScanSearch className="h-3.5 w-3.5" />
                    Analyzed
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* V2 Segment Filter */}
              <div className="flex items-center gap-2 px-3 py-1.5 border border-border/50 rounded-lg bg-card/50">
                <Label htmlFor="v2-segment-filter" className="text-sm text-muted-foreground whitespace-nowrap">
                  V2 Segment
                </Label>
                <select
                  id="v2-segment-filter"
                  value={v2SegmentFilter}
                  onChange={(e) => setV2SegmentFilter(e.target.value)}
                  className="text-sm bg-background border-none outline-none cursor-pointer text-foreground [&>option]:bg-background [&>option]:text-foreground"
                >
                  <option value="all">All</option>
                  <option value="HOT">HOT</option>
                  <option value="WARM">WARM</option>
                  <option value="NURTURE">NURTURE</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculateScores}
                disabled={isRecalculating}
              >
                {isRecalculating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Calculator className="h-4 w-4 mr-2" />
                )}
                Recalculate Scores
              </Button>

              <Link to="/admin/quotes">
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Quotes
                </Button>
              </Link>

              <Link to="/admin/attribution">
                <Button variant="outline" size="sm">
                  Attribution
                </Button>
              </Link>

              <Link to="/admin/attribution-health">
                <Button variant="outline" size="sm">
                  <Activity className="h-4 w-4 mr-2" />
                  Health
                </Button>
              </Link>

              <Link to="/admin/roi">
                <Button variant="outline" size="sm">
                  <Calculator className="h-4 w-4 mr-2" />
                  ROI
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-6">
        {/* Summary Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Array(7).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-[80px]" />
            ))}
          </div>
        ) : (
          <CRMSummaryCards leads={leads} />
        )}

        {/* Kanban Board */}
        {error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={handleRefresh}>Try Again</Button>
          </div>
        ) : isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="min-w-[280px]">
                <Skeleton className="h-[50px] mb-2" />
                <Skeleton className="h-[400px]" />
              </div>
            ))}
          </div>
        ) : filteredLeads.length === 0 && showHighTouchOnly ? (
          <div className="text-center py-12 border rounded-lg border-dashed border-border/50">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No high-touch leads found</p>
            <p className="text-sm text-muted-foreground">
              High-touch leads have both Google (gclid) and Meta (fbclid) attribution
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setShowHighTouchOnly(false)}>
              Show All Leads
            </Button>
          </div>
        ) : filteredLeads.length === 0 && quoteTab !== 'all' ? (
          <div className="text-center py-12 border rounded-lg border-dashed border-border/50">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              {quoteTab === 'analyzed' ? 'No leads with analyzed quotes found' : 'No leads with uploaded quotes found'}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setQuoteTab('all')}>
              Show All Leads
            </Button>
          </div>
        ) : (
          <KanbanBoard 
            leads={filteredLeads} 
            onStatusChange={updateLeadStatus}
          />
        )}
      </main>
    </div>
  );
}
