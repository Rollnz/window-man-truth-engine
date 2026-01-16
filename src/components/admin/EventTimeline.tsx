import { useMemo } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertCircle, MapPin, Flag, Clock } from "lucide-react";

export interface TimelineEvent {
  id: string;
  event_name: string;
  event_category: string | null;
  event_data: Record<string, unknown> | null;
  page_path: string | null;
  created_at: string;
  session_id: string;
}

interface EventTimelineProps {
  events: TimelineEvent[];
  isLoading: boolean;
  emptyMessage?: string;
  showTouchBadges?: boolean;
  maxHeight?: string;
}

// Extract metadata summary from event_data
function getEventMetadata(event: TimelineEvent): string[] {
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

export function EventTimeline({
  events,
  isLoading,
  emptyMessage = "No events found",
  showTouchBadges = true,
  maxHeight = "100%",
}: EventTimelineProps) {
  // Identify first and last touch
  const { firstTouch, lastTouch } = useMemo(() => {
    if (!events.length) return { firstTouch: null, lastTouch: null };

    const sorted = [...events].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return {
      firstTouch: sorted[0],
      lastTouch: sorted[sorted.length - 1],
    };
  }, [events]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Sort events in reverse chronological order for display
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <ScrollArea className="flex-1 -mr-4 pr-4" style={{ maxHeight }}>
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />

        {/* Events */}
        {sortedEvents.map((event) => {
          const isFirst = showTouchBadges && event.id === firstTouch?.id;
          const isLast = showTouchBadges && event.id === lastTouch?.id;
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
                <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                  <Badge
                    variant={isFirst ? 'default' : isLast ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {event.event_name.replace(/_/g, ' ')}
                  </Badge>
                  <div className="flex items-center gap-1 flex-wrap">
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
    </ScrollArea>
  );
}
