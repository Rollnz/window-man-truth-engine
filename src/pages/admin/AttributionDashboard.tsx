import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { subDays, format, startOfDay, endOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, ArrowLeft, ShieldAlert } from "lucide-react";
import { AttributionSummaryCards } from "@/components/admin/AttributionSummaryCards";
import { AttributionEventsTable } from "@/components/admin/AttributionEventsTable";
import { AttributionEventFilter } from "@/components/admin/AttributionEventFilter";
import { LeadJourneyPanel } from "@/components/admin/LeadJourneyPanel";
import { DateRange } from "@/components/admin/DateRangePicker";

interface AttributionEvent {
  id: string;
  event_name: string;
  event_category: string | null;
  event_data: Record<string, unknown> | null;
  page_path: string | null;
  created_at: string;
  session_id: string;
}

interface AttributionData {
  summary: {
    totalLeads: number;
    totalEmails: number;
    totalAiInteractions: number;
  };
  events: AttributionEvent[];
  eventTypes: string[];
}

// Admin email whitelist (must match edge function) - all lowercase
const ADMIN_EMAILS = [
  'admin@windowman.com',
  'support@windowman.com',
  'vansiclenp@gmail.com',
  'mongoloyd@protonmail.com',
].map(e => e.toLowerCase());

// Default date range: last 30 days
const getDefaultDateRange = (): DateRange => ({
  startDate: subDays(new Date(), 30),
  endDate: new Date(),
});

export default function AttributionDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [data, setData] = useState<AttributionData | null>(null);
  
  // Filters
  const [eventFilter, setEventFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  
  // Lead Journey Panel
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isJourneyOpen, setIsJourneyOpen] = useState(false);

  // Check authorization
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('[Attribution] No session, redirecting to auth');
        navigate('/auth');
        return;
      }

      const userEmail = session.user.email?.toLowerCase();
      console.log('[Attribution] Checking email:', userEmail, 'against whitelist:', ADMIN_EMAILS);
      
      if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
        console.warn('[Attribution] Email not in whitelist:', userEmail);
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      console.log('[Attribution] Access granted for:', userEmail);
      setIsAuthorized(true);
    };

    checkAuth();
  }, [navigate]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Build query params
      const params = new URLSearchParams();
      params.set('limit', '100');
      
      if (eventFilter !== 'all') {
        params.set('event_name', eventFilter);
      }
      
      if (dateRange.startDate) {
        params.set('start_date', format(startOfDay(dateRange.startDate), "yyyy-MM-dd'T'HH:mm:ss"));
      }
      
      if (dateRange.endDate) {
        params.set('end_date', format(endOfDay(dateRange.endDate), "yyyy-MM-dd'T'HH:mm:ss"));
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-attribution?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          setIsAuthorized(false);
          return;
        }
        throw new Error('Failed to fetch attribution data');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attribution data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [eventFilter, dateRange, toast]);

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
  }, [isAuthorized, fetchData]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setEventFilter('all');
    setDateRange(getDefaultDateRange());
  }, []);

  // Handle lead click - open journey panel
  const handleLeadClick = useCallback((leadId: string) => {
    setSelectedLeadId(leadId);
    setIsJourneyOpen(true);
  }, []);

  // Close journey panel
  const handleJourneyClose = useCallback(() => {
    setIsJourneyOpen(false);
    setSelectedLeadId(null);
  }, []);

  // Format date range for display
  const dateRangeLabel = useMemo(() => {
    if (!dateRange.startDate && !dateRange.endDate) return 'All time';
    if (dateRange.startDate && dateRange.endDate) {
      return `${format(dateRange.startDate, 'MMM d')} - ${format(dateRange.endDate, 'MMM d, yyyy')}`;
    }
    return 'Custom range';
  }, [dateRange]);

  // Unauthorized state
  if (!isLoading && !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            This dashboard is restricted to authorized administrators only.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full py-8 px-4 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Attribution Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Golden Thread analytics • {dateRangeLabel}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/analytics')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analytics
            </Button>
            <Button onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8">
          <AttributionSummaryCards
            totalLeads={data?.summary.totalLeads || 0}
            totalEmails={data?.summary.totalEmails || 0}
            totalAiInteractions={data?.summary.totalAiInteractions || 0}
            isLoading={isLoading}
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <AttributionEventFilter
            eventFilter={eventFilter}
            onEventFilterChange={setEventFilter}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onClearFilters={handleClearFilters}
            options={data?.eventTypes || []}
            disabled={isLoading}
          />
        </div>

        {/* Events Table */}
        <AttributionEventsTable
          events={data?.events || []}
          isLoading={isLoading}
          onLeadClick={handleLeadClick}
        />
      </div>

      {/* Lead Journey Panel */}
      <LeadJourneyPanel
        leadId={selectedLeadId}
        isOpen={isJourneyOpen}
        onClose={handleJourneyClose}
      />
    </div>
  );
}
