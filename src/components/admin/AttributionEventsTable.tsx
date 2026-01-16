import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, AlertCircle, ExternalLink, Mail, Eye, DollarSign, User, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export interface EnrichedAttributionEvent {
  id: string;
  event_name: string;
  event_category: string | null;
  event_data: Record<string, unknown> | null;
  page_path: string | null;
  created_at: string;
  session_id: string;
  // Enriched lead data
  lead_first_name: string | null;
  lead_last_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  engagement_score: number | null;
  lead_quality: string | null;
  // Session UTM data
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

interface AttributionEventsTableProps {
  events: EnrichedAttributionEvent[];
  isLoading?: boolean;
  onLeadClick?: (leadId: string) => void;
  onSessionClick?: (sessionId: string) => void;
  sessionFilter?: string | null;
  onClearSessionFilter?: () => void;
}

function getEventBadgeVariant(eventName: string): "default" | "secondary" | "outline" {
  if (eventName.includes('lead') || eventName.includes('captured')) return 'default';
  if (eventName.includes('email') || eventName.includes('sent')) return 'secondary';
  return 'outline';
}

function getSourceBadgeStyle(utmSource: string | null, utmMedium: string | null): { variant: "default" | "secondary" | "outline"; className: string; isPaid: boolean } {
  const medium = utmMedium?.toLowerCase() || '';
  const source = utmSource?.toLowerCase() || '';
  
  // Check for paid traffic
  if (medium === 'cpc' || medium === 'paid' || medium === 'ppc' || source.includes('ads')) {
    return { variant: 'default', className: 'bg-blue-500 hover:bg-blue-600', isPaid: true };
  }
  
  // Check for organic traffic
  if (medium === 'organic' || source === 'google' || source === 'bing' || !utmSource) {
    if (source === 'google' || source === 'bing') {
      return { variant: 'secondary', className: 'bg-green-500 hover:bg-green-600 text-white', isPaid: false };
    }
  }
  
  // Direct or unknown
  return { variant: 'outline', className: '', isPaid: false };
}

function getScoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  if (score >= 150) return 'text-red-500 font-bold'; // Hot
  if (score >= 50) return 'text-orange-500 font-semibold'; // Warm
  return 'text-blue-500'; // Cold
}

function getScoreLabel(score: number | null): string {
  if (score === null) return '—';
  if (score >= 150) return 'Hot';
  if (score >= 50) return 'Warm';
  return 'Cold';
}

export function AttributionEventsTable({ 
  events, 
  isLoading = false, 
  onLeadClick, 
  onSessionClick,
  sessionFilter,
  onClearSessionFilter 
}: AttributionEventsTableProps) {
  const { toast } = useToast();

  const csvData = useMemo(() => {
    if (!events.length) return '';
    const headers = ['Timestamp', 'Event Name', 'Contact', 'Email', 'Phone', 'Score', 'Source', 'Session ID', 'Page Path'];
    const rows = events.map(e => [
      e.created_at, 
      e.event_name, 
      `${e.lead_first_name || ''} ${e.lead_last_name || ''}`.trim() || 'Anonymous',
      e.lead_email || '',
      e.lead_phone || '',
      e.engagement_score?.toString() || '',
      e.utm_source || 'Direct',
      e.session_id, 
      e.page_path || ''
    ]);
    return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
  }, [events]);

  const handleExport = () => {
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attribution-events-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEmailClick = (email: string | null) => {
    if (!email) {
      toast({ title: 'No email available', description: 'This visitor has not provided an email address.', variant: 'destructive' });
      return;
    }
    window.location.href = `mailto:${email}`;
  };

  const handleViewProfile = (event: EnrichedAttributionEvent) => {
    const leadId = event.event_data?.lead_id as string | undefined;
    if (leadId && onLeadClick) {
      onLeadClick(leadId);
    } else {
      toast({ title: 'Opening Lead Profile...', description: event.lead_email || 'Anonymous visitor profile' });
    }
  };

  if (isLoading) {
    return <div className="border rounded-lg p-8"><div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div></div>;
  }

  if (!events.length) {
    return <div className="border rounded-lg p-12 text-center"><AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">No events found</h3><p className="text-muted-foreground">No attribution events match your current filter.</p></div>;
  }

  return (
    <div className="space-y-4">
      {/* Session Filter Banner */}
      {sessionFilter && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span className="font-medium">Viewing Session Story:</span>
            <code className="text-sm bg-background px-2 py-1 rounded">{sessionFilter.slice(0, 8)}...</code>
            <span className="text-muted-foreground text-sm">({events.length} events)</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClearSessionFilter} className="h-8">
            <X className="h-4 w-4 mr-1" /> Clear Filter
          </Button>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />Export CSV
        </Button>
      </div>
      
      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-[1100px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Timestamp</TableHead>
              <TableHead className="w-[150px]">Event</TableHead>
              <TableHead className="w-[200px]">Contact</TableHead>
              <TableHead className="w-[120px]">Source</TableHead>
              <TableHead className="w-[80px]">Score</TableHead>
              <TableHead className="w-[200px]">Session</TableHead>
              <TableHead className="w-[150px]">Page</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
              const leadId = event.event_data?.lead_id as string | undefined;
              const wmLeadId = event.event_data?.wm_lead_id as string | undefined;
              const linkableLeadId = wmLeadId || leadId;
              const hasLead = !!(event.lead_first_name || event.lead_last_name || event.lead_email);
              const contactName = hasLead 
                ? `${event.lead_first_name || ''} ${event.lead_last_name || ''}`.trim() || event.lead_email?.split('@')[0]
                : null;
              const sourceStyle = getSourceBadgeStyle(event.utm_source, event.utm_medium);
              const sourceLabel = event.utm_source || 'Direct';
              
              return (
                <TableRow key={event.id}>
                  {/* Timestamp */}
                  <TableCell className="font-mono text-sm">
                    {format(new Date(event.created_at), 'MMM d, HH:mm:ss')}
                  </TableCell>
                  
                  {/* Event Name */}
                  <TableCell>
                    <Badge variant={getEventBadgeVariant(event.event_name)}>
                      {event.event_name.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  
                  {/* Contact Column */}
                  <TableCell>
                    {hasLead ? (
                      <div className="space-y-0.5">
                        {linkableLeadId ? (
                          <Link 
                            to={`/admin/leads/${linkableLeadId}`}
                            className="font-medium text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            {contactName}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          <div className="font-medium text-sm">{contactName}</div>
                        )}
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {event.lead_phone && <div>{event.lead_phone}</div>}
                          {event.lead_email && <div className="truncate max-w-[180px]">{event.lead_email}</div>}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="text-sm italic">Anonymous Visitor</span>
                      </div>
                    )}
                  </TableCell>
                  
                  {/* Source Column */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge variant={sourceStyle.variant} className={sourceStyle.className}>
                        {sourceLabel}
                      </Badge>
                      {sourceStyle.isPaid && (
                        <span title="Paid Lead (CPL)">
                          <DollarSign className="h-3.5 w-3.5 text-blue-500" />
                        </span>
                      )}
                    </div>
                    {event.utm_medium && (
                      <div className="text-xs text-muted-foreground mt-0.5">{event.utm_medium}</div>
                    )}
                  </TableCell>
                  
                  {/* Score Column */}
                  <TableCell>
                    <div className={`text-sm ${getScoreColor(event.engagement_score)}`}>
                      {event.engagement_score !== null ? (
                        <div className="flex flex-col">
                          <span>{event.engagement_score}</span>
                          <span className="text-xs opacity-75">{getScoreLabel(event.engagement_score)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* Session ID */}
                  <TableCell className="font-mono text-xs">
                    <button 
                      onClick={() => onSessionClick?.(event.session_id)} 
                      className="text-primary hover:underline flex items-center gap-1 group"
                      title="Click to view session story"
                    >
                      {event.session_id.slice(0, 8)}...
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                    </button>
                  </TableCell>
                  
                  {/* Page */}
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[150px]">
                    {event.page_path || '—'}
                  </TableCell>
                  
                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEmailClick(event.lead_email)}
                        aria-label={event.lead_email ? `Email ${event.lead_email}` : 'No email available'}
                      >
                        <Mail className={`h-4 w-4 ${event.lead_email ? 'text-primary' : 'text-muted-foreground'}`} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleViewProfile(event)}
                        aria-label="View lead profile"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
