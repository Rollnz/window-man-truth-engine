import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EventTimeline, TimelineEvent } from "./EventTimeline";

interface SessionAnalysisPanelProps {
  sessionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SessionAnalysisPanel({
  sessionId,
  isOpen,
  onClose,
}: SessionAnalysisPanelProps) {
  const { toast } = useToast();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch events for this session
  useEffect(() => {
    if (!sessionId || !isOpen) return;

    const fetchSessionEvents = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-attribution?session_id=${sessionId}&page_size=100`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch session');

        const result = await response.json();
        setEvents(result.events || []);
      } catch (error) {
        console.error('Session fetch error:', error);
        toast({
          title: 'Error',
          description: 'Failed to load session journey',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionEvents();
  }, [sessionId, isOpen, toast]);

  // Calculate session stats
  const sessionStats = useMemo(() => {
    if (!events.length) return { totalEvents: 0, duration: 0, uniquePages: 0, hasLead: false };

    const sorted = [...events].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const durationMs = new Date(last.created_at).getTime() - new Date(first.created_at).getTime();
    const durationMins = Math.round(durationMs / 60000);

    const uniquePages = new Set(events.map(e => e.page_path).filter(Boolean)).size;
    const hasLead = events.some(e => e.event_data?.lead_id);

    return {
      totalEvents: events.length,
      duration: durationMins,
      uniquePages,
      hasLead,
    };
  }, [events]);

  const handleCopyId = () => {
    if (!sessionId) return;
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <span>Session Analysis</span>
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
            {sessionId}
          </SheetDescription>
        </SheetHeader>

        {/* Session Summary */}
        {!isLoading && events.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold">{sessionStats.totalEvents}</p>
              <p className="text-xs text-muted-foreground">Events</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold">{sessionStats.duration}</p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold">{sessionStats.uniquePages}</p>
              <p className="text-xs text-muted-foreground">Pages</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold">{sessionStats.hasLead ? '✓' : '—'}</p>
              <p className="text-xs text-muted-foreground">Lead</p>
            </div>
          </div>
        )}

        <Separator className="mb-4" />

        {/* Timeline */}
        <EventTimeline
          events={events}
          isLoading={isLoading}
          emptyMessage="No events found for this session"
          showTouchBadges={true}
        />
      </SheetContent>
    </Sheet>
  );
}
