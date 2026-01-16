import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  Check,
  Loader2,
  MapPin,
  Flag,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JourneyEvent {
  id: string;
  event_name: string;
  event_category: string | null;
  event_data: Record<string, unknown> | null;
  page_path: string | null;
  created_at: string;
  session_id: string;
}

interface LeadJourneyPanelProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// Extract metadata summary from event_data
function getEventMetadata(event: JourneyEvent): string[] {
  const metadata: string[] = [];
  const data = event.event_data;
  
  if (!data) return metadata;

  // Common fields to display
  if (data.quote_total) metadata.push(`Quote: $${data.quote_total}`);
  if (data.window_count) metadata.push(`Windows: ${data.window_count}`);
  if (data.email) metadata.push(`Email: ${data.email}`);
  if (data.source_tool) metadata.push(`Tool: ${data.source_tool}`);
  if (data.risk_score) metadata.push(`Risk: ${data.risk_score}%`);
  if (data.session_duration) metadata.push(`Duration: ${data.session_duration}s`);
  if (data.messages_count) metadata.push(`Messages: ${data.messages_count}`);
  
  return metadata;
}

export function LeadJourneyPanel({
  leadId,
  isOpen,
  onClose,
}: LeadJourneyPanelProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<JourneyEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch events for this lead
  useEffect(() => {
    if (!leadId || !isOpen) return;

    const fetchJourneyEvents = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-attribution?lead_id=${leadId}&limit=100`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch journey');

        const result = await response.json();
        setEvents(result.events || []);
      } catch (error) {
        console.error('Journey fetch error:', error);
        toast({
          title: 'Error',
          description: 'Failed to load lead journey',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchJourneyEvents();
  }, [leadId, isOpen, toast]);

  // Identify first and last touch
  const { firstTouch, lastTouch, journeyDuration } = useMemo(() => {
    if (!events.length) return { firstTouch: null, lastTouch: null, journeyDuration: null };

    const sorted = [...events].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const durationMs = new Date(last.created_at).getTime() - new Date(first.created_at).getTime();
    const durationMins = Math.round(durationMs / 60000);

    return {
      firstTouch: first,
      lastTouch: last,
      journeyDuration: durationMins,
    };
  }, [events]);

  const handleCopyId = () => {
    if (!leadId) return;
    navigator.clipboard.writeText(leadId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <span>Lead Journey</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyId}
              className="h-7 px-2"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </SheetTitle>
          <SheetDescription className="font-mono text-xs break-all">
            {leadId}
          </SheetDescription>
          {/* View Full Profile Button */}
          <Button
            variant="outline"
            className="w-full gap-2 mt-2"
            onClick={() => {
              onClose();
              navigate(`/admin/leads/${leadId}`);
            }}
          >
            <ExternalLink className="h-4 w-4" />
            View Full Profile
          </Button>
        </SheetHeader>

        {/* Journey Summary */}
        {!isLoading && events.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{events.length}</p>
              <p className="text-xs text-muted-foreground">Events</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{journeyDuration || 0}</p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">
                {new Set(events.map(e => e.event_name)).size}
              </p>
              <p className="text-xs text-muted-foreground">Unique Actions</p>
            </div>
          </div>
        )}

        <Separator className="mb-4" />

        {/* Timeline */}
        <ScrollArea className="flex-1 -mr-4 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No events found for this lead</p>
            </div>
          ) : (
            <div className="relative pl-6">
              {/* Vertical line */}
              <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />

              {/* Events (reverse chronological) */}
              {events.map((event, index) => {
                const isFirst = event.id === firstTouch?.id;
                const isLast = event.id === lastTouch?.id;
                const metadata = getEventMetadata(event);

                return (
                  <div key={event.id} className="relative pb-6 last:pb-0">
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 ${
                        isFirst
                          ? 'bg-green-500 border-green-600'
                          : isLast
                          ? 'bg-primary border-primary'
                          : 'bg-background border-muted-foreground'
                      }`}
                    />

                    {/* Event card */}
                    <div className="ml-4 bg-card border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Badge
                          variant={isFirst ? 'default' : isLast ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {event.event_name.replace(/_/g, ' ')}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {isFirst && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                              <MapPin className="h-3 w-3 mr-1" />
                              First Touch
                            </Badge>
                          )}
                          {isLast && !isFirst && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                              <Flag className="h-3 w-3 mr-1" />
                              Last Touch
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                        <Clock className="h-3 w-3" />
                        {format(new Date(event.created_at), 'MMM d, yyyy HH:mm:ss')}
                      </p>

                      {event.page_path && (
                        <p className="text-xs text-muted-foreground truncate mb-2">
                          Page: {event.page_path}
                        </p>
                      )}

                      {/* Metadata chips */}
                      {metadata.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {metadata.map((item, i) => (
                            <span
                              key={i}
                              className="text-xs bg-muted px-2 py-0.5 rounded"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
