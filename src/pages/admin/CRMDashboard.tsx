import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useCRMLeads } from '@/hooks/useCRMLeads';
import { KanbanBoard } from '@/components/crm/KanbanBoard';
import { CRMSummaryCards } from '@/components/crm/CRMSummaryCards';
import { DateRangePicker, DateRange } from '@/components/admin/DateRangePicker';
import { subDays, format } from 'date-fns';
import { Loader2 } from 'lucide-react';

// Admin email whitelist
const ADMIN_EMAILS = [
  'admin@windowtruth.com',
  'tim@impactwindowexperts.com',
  'tim@itswindowman.com',
];

export default function CRMDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });

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

  const handleRefresh = () => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchLeads(
        format(dateRange.startDate, 'yyyy-MM-dd'),
        format(dateRange.endDate, 'yyyy-MM-dd')
      );
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
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { 
    leads, 
    isLoading, 
    error, 
    fetchLeads, 
    updateLeadStatus 
  } = useCRMLeads();

  const handleRefresh = () => {
    fetchLeads(
      format(dateRange.from, 'yyyy-MM-dd'),
      format(dateRange.to, 'yyyy-MM-dd')
    );
  };

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
                  CRM Kanban Board • {leads.length} leads
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
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

              <Link to="/admin/attribution">
                <Button variant="outline" size="sm">
                  Attribution
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array(6).fill(0).map((_, i) => (
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
        ) : (
          <KanbanBoard 
            leads={leads} 
            onStatusChange={updateLeadStatus}
          />
        )}
      </main>
    </div>
  );
}
