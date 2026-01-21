import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { User, FileText, MessageSquare, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getLeadRoute } from '@/lib/leadRouting';
import { ActivityEvent } from '@/hooks/useAdminDashboard';

interface ActivityFeedProps {
  events: ActivityEvent[];
  isLoading?: boolean;
}

const EVENT_ICONS = {
  lead: User,
  quote: FileText,
  status_change: ArrowRight,
  note: MessageSquare,
};

export function ActivityFeed({ events, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[320px] px-6">
          <div className="space-y-4 pb-4">
            {events.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No recent activity</p>
            ) : (
              events.map((event) => {
                const Icon = EVENT_ICONS[event.type] || User;
                const timeAgo = formatDistanceToNow(new Date(event.timestamp), { addSuffix: true });

                return (
                  <Link
                    key={event.id}
                    to={event.leadId ? (getLeadRoute({ wm_lead_id: event.leadId }) || '#') : '#'}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{event.subtitle}</p>
                      <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
