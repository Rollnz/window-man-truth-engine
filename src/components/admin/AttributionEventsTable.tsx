import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface AttributionEvent {
  id: string;
  event_name: string;
  event_category: string | null;
  event_data: Record<string, unknown> | null;
  page_path: string | null;
  created_at: string;
  session_id: string;
}

interface AttributionEventsTableProps {
  events: AttributionEvent[];
  isLoading?: boolean;
}

// Helper to get badge variant based on event category
function getEventBadgeVariant(eventName: string): "default" | "secondary" | "outline" {
  if (eventName.includes('lead') || eventName.includes('captured')) return 'default';
  if (eventName.includes('email') || eventName.includes('sent')) return 'secondary';
  return 'outline';
}

// Display full ID (no truncation)
function displayId(id: string | undefined | null): string {
  if (!id) return '—';
  return id;
}

export function AttributionEventsTable({
  events,
  isLoading = false,
}: AttributionEventsTableProps) {
  // Generate CSV data
  const csvData = useMemo(() => {
    if (!events.length) return '';
    
    const headers = ['Timestamp', 'Event Name', 'Category', 'Lead ID', 'Session ID', 'Page Path'];
    const rows = events.map(e => [
      e.created_at,
      e.event_name,
      e.event_category || '',
      (e.event_data?.lead_id as string) || '',
      e.session_id,
      e.page_path || '',
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
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

  if (isLoading) {
    return (
      <div className="border rounded-lg p-8">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!events.length) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No events found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          No attribution events match your current filter. Events will appear here as users interact with tools.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Showing {events.length} most recent events
        </p>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px] whitespace-nowrap">Timestamp</TableHead>
              <TableHead className="w-[160px]">Event Name</TableHead>
              <TableHead className="w-[280px]">Lead ID</TableHead>
              <TableHead className="w-[320px]">Session ID</TableHead>
              <TableHead className="min-w-[120px]">Page</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-mono text-sm whitespace-nowrap">
                  {format(new Date(event.created_at), 'MMM d, HH:mm:ss')}
                </TableCell>
                <TableCell>
                  <Badge variant={getEventBadgeVariant(event.event_name)}>
                    {event.event_name.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground break-all">
                  {displayId(event.event_data?.lead_id as string)}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground break-all">
                  {displayId(event.session_id)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {event.page_path || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
