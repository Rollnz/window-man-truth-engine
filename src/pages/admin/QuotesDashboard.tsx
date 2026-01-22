import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Download, FileText, User, Phone, Mail, Calendar, ExternalLink, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { DateRangePicker, DateRange } from '@/components/admin/DateRangePicker';
import { subDays, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Admin email whitelist
const ADMIN_EMAILS = [
  'admin@windowtruth.com',
  'tim@impactwindowexperts.com',
  'tim@itswindowman.com',
  'vansiclenp@gmail.com',
  'mongoloyd@protonmail.com',
];

interface QuoteFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  session_id: string;
  lead_id: string | null;
  /** Canonical admin lead ID (wm_leads.id) - use for routing */
  wm_lead_id: string | null;
  source_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  signed_url: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function QuotesDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });
  const [leadFilter, setLeadFilter] = useState<string>('all');
  const [quotes, setQuotes] = useState<QuoteFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Check admin access
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth?redirect=/admin/quotes');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  const fetchQuotes = useCallback(async (page: number = 1) => {
    if (!isAdmin) return;
    
    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error('Session expired');
        return;
      }

      const offset = (page - 1) * ITEMS_PER_PAGE;
      const params = new URLSearchParams();
      if (dateRange.startDate) {
        params.set('startDate', format(dateRange.startDate, 'yyyy-MM-dd'));
      }
      if (dateRange.endDate) {
        params.set('endDate', format(dateRange.endDate, 'yyyy-MM-dd'));
      }
      if (leadFilter !== 'all') {
        params.set('hasLead', leadFilter === 'linked' ? 'true' : 'false');
      }
      params.set('limit', ITEMS_PER_PAGE.toString());
      params.set('offset', offset.toString());

      // Use fetch directly to pass query params
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-quotes?${params.toString()}`;
      const fetchResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!fetchResponse.ok) {
        const error = await fetchResponse.json();
        throw new Error(error.error || 'Failed to fetch quotes');
      }

      const data = await fetchResponse.json();
      setQuotes(data.quotes || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
      toast.error('Failed to load quotes');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, dateRange, leadFilter, ITEMS_PER_PAGE]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, leadFilter]);

  useEffect(() => {
    if (isAdmin) {
      fetchQuotes(currentPage);
    }
  }, [isAdmin, currentPage, fetchQuotes]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const handleRefresh = () => {
    fetchQuotes(currentPage);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to view this page.
            </p>
            <Link to="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const linkedCount = quotes.filter(q => q.lead_id).length;
  const unlinkedCount = quotes.filter(q => !q.lead_id).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/crm">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Quote Uploads</h1>
                <p className="text-sm text-muted-foreground">
                  {total} total uploads • {linkedCount} linked to leads
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
              <Select value={leadFilter} onValueChange={setLeadFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quotes</SelectItem>
                  <SelectItem value="linked">Linked to Lead</SelectItem>
                  <SelectItem value="unlinked">No Lead</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleRefresh} variant="outline" size="icon">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Linked to Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{linkedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Orphaned Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">{unlinkedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quotes Table */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : quotes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">No quote uploads found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your date range or filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <Card key={quote.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* File Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">{quote.file_name}</h3>
                          {quote.lead_id ? (
                            <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
                              Linked
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                              Orphaned
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{formatFileSize(quote.file_size)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(quote.created_at)}
                          </span>
                          {quote.utm_source && (
                            <>
                              <span>•</span>
                              <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                {quote.utm_source}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lead Info - Only show if we have a canonical wm_lead_id for routing */}
                    {quote.wm_lead_id && (
                      <div className="flex-shrink-0 text-right border-l border-border pl-4">
                        <Link 
                          to={`/admin/leads/${quote.wm_lead_id}`}
                          className="flex items-center gap-2 text-sm text-primary hover:underline mb-1"
                        >
                          <User className="h-3 w-3" />
                          <span className="font-medium">{quote.lead_name || 'Unknown'}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        {quote.lead_phone && (
                          <a 
                            href={`tel:${quote.lead_phone}`}
                            className="flex items-center gap-2 text-sm text-primary hover:underline mb-1"
                          >
                            <Phone className="h-3 w-3" />
                            {quote.lead_phone}
                          </a>
                        )}
                        {quote.lead_email && (
                          <a 
                            href={`mailto:${quote.lead_email}`}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                          >
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[180px]">{quote.lead_email}</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex-shrink-0">
                      {quote.signed_url ? (
                        <a href={quote.signed_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            Download
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </a>
                      ) : (
                        <Button size="sm" disabled variant="outline">
                          No URL
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} quotes
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNum)}
                      disabled={isLoading}
                      className="w-9"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
