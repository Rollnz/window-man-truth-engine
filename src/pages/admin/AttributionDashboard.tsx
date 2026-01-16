import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { subDays, format, startOfDay, endOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, ArrowLeft, ShieldAlert, FileText } from "lucide-react";
import { AttributionSummaryCards } from "@/components/admin/AttributionSummaryCards";
import { AttributionEventsTable } from "@/components/admin/AttributionEventsTable";
import { AttributionEventFilter } from "@/components/admin/AttributionEventFilter";
import { LeadJourneyPanel } from "@/components/admin/LeadJourneyPanel";
import { SessionAnalysisPanel } from "@/components/admin/SessionAnalysisPanel";
import { ConversionFunnel } from "@/components/admin/ConversionFunnel";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { DateRange } from "@/components/admin/DateRangePicker";
import { generateAttributionPDF } from "@/lib/pdfExport";

interface AttributionEvent {
  id: string;
  event_name: string;
  event_category: string | null;
  event_data: Record<string, unknown> | null;
  page_path: string | null;
  created_at: string;
  session_id: string;
}

interface FunnelData {
  traffic: number;
  engagement: number;
  leadGen: number;
  conversion: number;
}

interface AttributionData {
  summary: { totalLeads: number; totalEmails: number; totalAiInteractions: number };
  events: AttributionEvent[];
  eventTypes: string[];
  totalCount: number;
  hasMore: boolean;
  funnel: FunnelData;
}

const ADMIN_EMAILS = ['admin@windowman.com', 'support@windowman.com', 'vansiclenp@gmail.com', 'mongoloyd@protonmail.com'].map(e => e.toLowerCase());
const getDefaultDateRange = (): DateRange => ({ startDate: subDays(new Date(), 30), endDate: new Date() });

export default function AttributionDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [data, setData] = useState<AttributionData | null>(null);
  const [events, setEvents] = useState<AttributionEvent[]>([]);
  const [offset, setOffset] = useState(0);
  
  const [eventFilter, setEventFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isJourneyOpen, setIsJourneyOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isSessionOpen, setIsSessionOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }
      const userEmail = session.user.email?.toLowerCase();
      if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) { setIsAuthorized(false); setIsLoading(false); return; }
      setIsAuthorized(true);
    };
    checkAuth();
  }, [navigate]);

  const fetchData = useCallback(async (loadMore = false) => {
    loadMore ? setIsLoadingMore(true) : setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const currentOffset = loadMore ? offset : 0;
      const params = new URLSearchParams({ page_size: '50', offset: String(currentOffset) });
      if (eventFilter !== 'all') params.set('event_name', eventFilter);
      if (dateRange.startDate) params.set('start_date', format(startOfDay(dateRange.startDate), "yyyy-MM-dd'T'HH:mm:ss"));
      if (dateRange.endDate) params.set('end_date', format(endOfDay(dateRange.endDate), "yyyy-MM-dd'T'HH:mm:ss"));
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-attribution?${params}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) { if (response.status === 403) setIsAuthorized(false); throw new Error('Failed to fetch'); }
      const result = await response.json();
      setData(result);
      setEvents(loadMore ? [...events, ...result.events] : result.events);
      if (!loadMore) setOffset(50); else setOffset(currentOffset + 50);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      loadMore ? setIsLoadingMore(false) : setIsLoading(false);
    }
  }, [eventFilter, dateRange, toast, offset, events]);

  useEffect(() => { if (isAuthorized) { setOffset(0); fetchData(); } }, [isAuthorized, eventFilter, dateRange]);

  const handleClearFilters = useCallback(() => { setEventFilter('all'); setDateRange(getDefaultDateRange()); }, []);
  const handleLeadClick = useCallback((leadId: string) => { setSelectedLeadId(leadId); setIsJourneyOpen(true); }, []);
  const handleSessionClick = useCallback((sessionId: string) => { setSelectedSessionId(sessionId); setIsSessionOpen(true); }, []);
  const handleExportPDF = useCallback(() => {
    if (!data) return;
    generateAttributionPDF({ summary: data.summary, funnel: data.funnel, events, dateRange });
    toast({ title: 'PDF Exported', description: 'Report downloaded successfully' });
  }, [data, events, dateRange, toast]);

  const dateRangeLabel = useMemo(() => {
    if (!dateRange.startDate && !dateRange.endDate) return 'All time';
    if (dateRange.startDate && dateRange.endDate) return `${format(dateRange.startDate, 'MMM d')} - ${format(dateRange.endDate, 'MMM d, yyyy')}`;
    return 'Custom range';
  }, [dateRange]);

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
      <div className="w-full py-8 px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Attribution Dashboard</h1>
            <p className="text-muted-foreground mt-1">Golden Thread analytics • {dateRangeLabel}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => navigate('/admin/analytics')}><ArrowLeft className="h-4 w-4 mr-2" />Analytics</Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={isLoading || !data}><FileText className="h-4 w-4 mr-2" />Export PDF</Button>
            <Button onClick={() => fetchData()} disabled={isLoading}><RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />Refresh</Button>
          </div>
        </div>

        <div className="mb-8"><AttributionSummaryCards totalLeads={data?.summary.totalLeads || 0} totalEmails={data?.summary.totalEmails || 0} totalAiInteractions={data?.summary.totalAiInteractions || 0} isLoading={isLoading} /></div>
        
        <ConversionFunnel data={data?.funnel || { traffic: 0, engagement: 0, leadGen: 0, conversion: 0 }} isLoading={isLoading} />

        <div className="mb-6"><AttributionEventFilter eventFilter={eventFilter} onEventFilterChange={setEventFilter} dateRange={dateRange} onDateRangeChange={setDateRange} onClearFilters={handleClearFilters} options={data?.eventTypes || []} disabled={isLoading} /></div>

        <AttributionEventsTable events={events} isLoading={isLoading} onLeadClick={handleLeadClick} onSessionClick={handleSessionClick} />
        
        <PaginationControls currentCount={events.length} totalCount={data?.totalCount || 0} hasMore={data?.hasMore || false} isLoading={isLoadingMore} onLoadMore={() => fetchData(true)} />
      </div>

      <LeadJourneyPanel leadId={selectedLeadId} isOpen={isJourneyOpen} onClose={() => { setIsJourneyOpen(false); setSelectedLeadId(null); }} />
      <SessionAnalysisPanel sessionId={selectedSessionId} isOpen={isSessionOpen} onClose={() => { setIsSessionOpen(false); setSelectedSessionId(null); }} />
    </div>
  );
}
