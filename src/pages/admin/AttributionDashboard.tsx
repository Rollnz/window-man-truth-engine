import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, ArrowLeft, ShieldAlert } from "lucide-react";
import { AttributionSummaryCards } from "@/components/admin/AttributionSummaryCards";
import { AttributionEventsTable } from "@/components/admin/AttributionEventsTable";
import { AttributionEventFilter } from "@/components/admin/AttributionEventFilter";

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

// Admin email whitelist (must match edge function)
const ADMIN_EMAILS = [
  'admin@windowman.com',
  'support@windowman.com',
];

export default function AttributionDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [data, setData] = useState<AttributionData | null>(null);
  const [eventFilter, setEventFilter] = useState("all");

  // Check authorization
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

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

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const filterParam = eventFilter !== 'all' ? `&event_name=${eventFilter}` : '';
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-attribution?limit=50${filterParam}`,
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
  }, [eventFilter, toast]);

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
  }, [isAuthorized, fetchData]);

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
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Attribution Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Golden Thread analytics and event tracking
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

        {/* Filter */}
        <div className="mb-4">
          <AttributionEventFilter
            value={eventFilter}
            onChange={setEventFilter}
            options={data?.eventTypes || []}
            disabled={isLoading}
          />
        </div>

        {/* Events Table */}
        <AttributionEventsTable
          events={data?.events || []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
