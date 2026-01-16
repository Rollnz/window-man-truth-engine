import { useMemo } from 'react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TimelineEventCard } from './TimelineEventCard';
import { LeadEvent, LeadNote } from '@/hooks/useLeadDetail';
import { StickyNote } from 'lucide-react';

interface LeadTimelineProps {
  events: LeadEvent[];
  notes: LeadNote[];
  isFacebookSource?: boolean;
}

type TimelineItem = 
  | { type: 'event'; data: LeadEvent; timestamp: Date }
  | { type: 'note'; data: LeadNote; timestamp: Date };

export function LeadTimeline({ events, notes, isFacebookSource }: LeadTimelineProps) {
  // Combine events and notes into a unified timeline
  const groupedItems = useMemo(() => {
    const allItems: TimelineItem[] = [
      ...events.map(e => ({ type: 'event' as const, data: e, timestamp: parseISO(e.created_at) })),
      ...notes.map(n => ({ type: 'note' as const, data: n, timestamp: parseISO(n.created_at) })),
    ];

    // Sort by timestamp descending (newest first)
    allItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Group by day
    const groups: Record<string, TimelineItem[]> = {};
    for (const item of allItems) {
      let dayLabel: string;
      if (isToday(item.timestamp)) {
        dayLabel = 'Today';
      } else if (isYesterday(item.timestamp)) {
        dayLabel = 'Yesterday';
      } else {
        dayLabel = format(item.timestamp, 'MMMM d, yyyy');
      }

      if (!groups[dayLabel]) {
        groups[dayLabel] = [];
      }
      groups[dayLabel].push(item);
    }

    return groups;
  }, [events, notes]);

  const dayLabels = Object.keys(groupedItems);

  if (events.length === 0 && notes.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm">The Golden Thread</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground text-sm">No activity yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm flex items-center gap-2">
          The Golden Thread
          <span className="text-xs font-normal text-muted-foreground">
            ({events.length} events, {notes.length} notes)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="p-4 space-y-6">
            {dayLabels.map((dayLabel) => (
              <div key={dayLabel}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 sticky top-0 bg-card py-1">
                  {dayLabel}
                </h3>
                <div className="space-y-0">
                  {groupedItems[dayLabel].map((item, index) => {
                    const isFirst = index === 0;
                    const isLast = index === groupedItems[dayLabel].length - 1;

                    if (item.type === 'note') {
                      return (
                        <div key={item.data.id} className="flex gap-3 pb-4">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                              <StickyNote className="h-4 w-4 text-white" />
                            </div>
                            {!isLast && <div className="w-0.5 bg-border flex-1 mt-2" />}
                          </div>
                          <div className="flex-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                            <p className="text-sm">{item.data.content}</p>
                            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                              <span>{item.data.admin_email || 'Team'}</span>
                              <time>{format(item.timestamp, 'h:mm a')}</time>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <TimelineEventCard
                        key={item.data.id}
                        event={item.data}
                        isFirst={isFirst && dayLabel === dayLabels[0]}
                        isLast={isLast && dayLabel === dayLabels[dayLabels.length - 1]}
                        isFacebookSource={isFacebookSource}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
